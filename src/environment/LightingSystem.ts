import * as THREE from 'three';
import { WeatherStateConfig } from './EnvironmentTypes';
import { TimeOfDayConfig } from '../types';

export class LightingSystem {
  private sunLight: THREE.DirectionalLight;
  private ambientLight: THREE.HemisphereLight;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 2.5);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 600;
    const d = 150;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;

    this.ambientLight = new THREE.HemisphereLight(0x76a0d0, 0x443322, 1.0);

    this.scene.add(this.sunLight);
    this.scene.add(this.ambientLight);
  }

  public update(timeConfig: TimeOfDayConfig, weatherConfig: WeatherStateConfig): void {
    this.sunLight.position.copy(timeConfig.sunPosition);
    this.sunLight.color.copy(timeConfig.sunLightColor);

    // Weather modulates light intensity
    this.sunLight.intensity = timeConfig.sunIntensity * weatherConfig.sunIntensity * weatherConfig.visibilityMultiplier;

    this.ambientLight.color.copy(timeConfig.skyColor);
    this.ambientLight.groundColor.copy(timeConfig.groundColor);
    this.ambientLight.intensity = timeConfig.ambientIntensity * weatherConfig.ambientIntensity;
  }
}
