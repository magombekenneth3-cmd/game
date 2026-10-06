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

    // Directional Sunlight with Shadows
    this.sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 600;
    
    // Shadow camera frustum for urban district slice
    const d = 120;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0005;

    this.scene.add(this.sunLight);

    // Ambient Hemisphere Light (Sky + Earth)
    this.ambientLight = new THREE.HemisphereLight(0x87ceeb, 0x3d2817, 0.8);
    this.scene.add(this.ambientLight);

    // Sky Dome Geometry
    const skyGeo = new THREE.SphereGeometry(450, 32, 16);
    this.skyMaterial = new THREE.MeshBasicMaterial({
      side: THREE.BackSide,
      color: 0x87ceeb
    });
    this.skyMesh = new THREE.Mesh(skyGeo, this.skyMaterial);
    this.scene.add(this.skyMesh);

    // Distance Fog for African Atmospheric Haze
    this.scene.fog = new THREE.FogExp2(0x87ceeb, 0.001);
  }

  public update(config: TimeOfDayConfig, camera?: THREE.Camera): void {
    // Update Sunlight position & color
    this.sunLight.position.copy(config.sunPosition);
    this.sunLight.color.copy(config.sunLightColor);
    this.sunLight.intensity = config.sunIntensity;

    // Update Ambient Light
    this.ambientLight.color.copy(config.ambientLightColor);
    this.ambientLight.groundColor.copy(config.groundColor);
    this.ambientLight.intensity = config.ambientIntensity;

    // Center Sky Mesh on Camera
    if (camera) {
      this.skyMesh.position.copy(camera.position);
    }

    // Update Sky & Fog
    this.skyMaterial.color.copy(config.skyColor);
    if (this.scene.fog) {
      (this.scene.fog as THREE.FogExp2).color.copy(config.fogColor);
    }
  }
}
