import * as THREE from 'three';
import { WeatherStateConfig } from './EnvironmentTypes';
import { TimeOfDayConfig } from '../types';

export class LightingSystem {
  private sunLight?: THREE.DirectionalLight;
  private ambientLight?: THREE.HemisphereLight;

  constructor(scene: THREE.Scene) {
    // Locate authoritative single sun and ambient light from scene
    scene.traverse((child) => {
      if ((child as THREE.DirectionalLight).isDirectionalLight && !this.sunLight) {
        this.sunLight = child as THREE.DirectionalLight;
      } else if ((child as THREE.HemisphereLight).isHemisphereLight && !this.ambientLight) {
        this.ambientLight = child as THREE.HemisphereLight;
      }
    });
  }

  public update(timeConfig: TimeOfDayConfig, weatherConfig: WeatherStateConfig): void {
    if (this.sunLight) {
      this.sunLight.position.copy(timeConfig.sunPosition);
      this.sunLight.color.copy(timeConfig.sunLightColor);
      this.sunLight.intensity = timeConfig.sunIntensity * weatherConfig.sunIntensity * weatherConfig.visibilityMultiplier;
    }

    if (this.ambientLight) {
      this.ambientLight.color.copy(timeConfig.skyColor);
      this.ambientLight.groundColor.copy(timeConfig.groundColor);
      this.ambientLight.intensity = timeConfig.ambientIntensity * weatherConfig.ambientIntensity;
    }
  }
}
