import * as THREE from 'three';
import { ISkyAtmosphere, TimeOfDayConfig } from '../types';

export class SkyAtmosphere implements ISkyAtmosphere {
  public sunLight: THREE.DirectionalLight;
  public ambientLight: THREE.HemisphereLight;
  private scene: THREE.Scene;
  private skyMesh: THREE.Mesh;
  private skyMaterial: THREE.MeshBasicMaterial;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    // Directional Sunlight with High-Resolution Shadows
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 4096;
    this.sunLight.shadow.mapSize.height = 4096;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 300;
    
    // Tight frustum for high texel-density shadows around camera
    const d = 80;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0001;
    this.sunLight.shadow.normalBias = 0.04;
    this.sunLight.shadow.radius = 2.0;

    this.scene.add(this.sunLight);
    this.scene.add(this.sunLight.target);

    // Ambient Hemisphere Light (Sky + Earth)
    this.ambientLight = new THREE.HemisphereLight(0x87ceeb, 0x3d2817, 0.9);
    this.scene.add(this.ambientLight);

    // Sky Dome Geometry
    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    this.skyMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x87ceeb
    });
    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.scene.add(this.skyMesh);

    // Distance Fog for Atmospheric Haze
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.0012);
  }

  private pmremGenerator?: THREE.PMREMGenerator;
  private envRenderTarget?: THREE.WebGLRenderTarget;
  private lastEnvProbeHours: number = -999;
  private probeCanvas?: HTMLCanvasElement;
  private probeTexture?: THREE.CanvasTexture;

  /**
   * Generates a high-quality, lightweight procedural sky IBL environment probe
   * using THREE.PMREMGenerator for authentic PBR indirect specular reflections.
   */
  public updateEnvironmentProbe(renderer: any, config: TimeOfDayConfig): void {
    if (!renderer || typeof document === 'undefined') return;

    // Only regenerate when time of day changes significantly (> 0.2h / 12 min game time)
    if (Math.abs(config.hours - this.lastEnvProbeHours) < 0.2 && this.envRenderTarget) {
      return;
    }
    this.lastEnvProbeHours = config.hours;

    try {
      if (!this.pmremGenerator && typeof THREE.PMREMGenerator === 'function') {
        this.pmremGenerator = new THREE.PMREMGenerator(renderer);
        this.pmremGenerator.compileEquirectangularShader();
      }

      if (!this.pmremGenerator) return;

      if (!this.probeCanvas) {
        this.probeCanvas = document.createElement('canvas');
        this.probeCanvas.width = 256;
        this.probeCanvas.height = 128;
      }

      const ctx = this.probeCanvas.getContext('2d');
      if (!ctx) return;

      // Draw dynamic equirectangular sky gradient
      const skyHex = '#' + config.skyColor.getHexString();
      const groundHex = '#' + config.groundColor.getHexString();
      const sunHex = '#' + config.sunLightColor.getHexString();

      // Top to bottom gradient (Zenith -> Horizon -> Ground)
      const grad = ctx.createLinearGradient(0, 0, 0, 128);
      grad.addColorStop(0.0, skyHex);
      grad.addColorStop(0.48, skyHex);
      grad.addColorStop(0.50, sunHex);
      grad.addColorStop(0.54, groundHex);
      grad.addColorStop(1.0, groundHex);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 256, 128);

      // Sun spot glow
      if (config.sunIntensity > 0.5) {
        const sunNorm = config.sunPosition.clone().normalize();
        const u = 0.5 + Math.atan2(sunNorm.z, sunNorm.x) / (Math.PI * 2);
        const v = 0.5 - Math.asin(THREE.MathUtils.clamp(sunNorm.y, -1, 1)) / Math.PI;
        const sx = u * 256;
        const sy = v * 128;

        const sunGrad = ctx.createRadialGradient(sx, sy, 2, sx, sy, 24);
        sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
        sunGrad.addColorStop(0.3, sunHex);
        sunGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, 24, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!this.probeTexture) {
        this.probeTexture = new THREE.CanvasTexture(this.probeCanvas);
        this.probeTexture.colorSpace = THREE.SRGBColorSpace;
      } else {
        this.probeTexture.needsUpdate = true;
      }

      const prevTarget = this.envRenderTarget;
      this.envRenderTarget = this.pmremGenerator.fromEquirectangular(this.probeTexture);
      this.scene.environment = this.envRenderTarget.texture;
      (this.scene as any).environmentIntensity = 0.85;

      if (prevTarget) {
        prevTarget.dispose();
      }
    } catch (_err) {
      // In test or non-webgl environments, fail silently
    }
  }

  public update(config: TimeOfDayConfig, camera?: THREE.Camera, renderer?: any): void {
    // Dynamically center shadow camera target on active player camera
    if (camera) {
      this.sunLight.target.position.copy(camera.position);
      this.sunLight.target.updateMatrixWorld();

      const sunDir = config.sunPosition.clone().normalize();
      this.sunLight.position.copy(camera.position).add(sunDir.multiplyScalar(120));

      this.skyMesh.position.copy(camera.position);
    } else {
      this.sunLight.position.copy(config.sunPosition);
    }

    this.sunLight.color.copy(config.sunLightColor);
    this.sunLight.intensity = config.sunIntensity;

    // Update Ambient Light
    this.ambientLight.color.copy(config.ambientLightColor);
    this.ambientLight.groundColor.copy(config.groundColor);
    this.ambientLight.intensity = config.ambientIntensity;

    // Update Sky & Fog
    this.skyMaterial.color.copy(config.skyColor);
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.copy(config.fogColor);
    }

    // Update Environment Reflection Probe
    if (renderer) {
      this.updateEnvironmentProbe(renderer, config);
    }
  }

  public dispose(): void {
    if (this.envRenderTarget) {
      this.envRenderTarget.dispose();
    }
    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
    }
    if (this.probeTexture) {
      this.probeTexture.dispose();
    }
  }
}
