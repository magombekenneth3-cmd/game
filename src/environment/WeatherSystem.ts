import * as THREE from 'three';
import { WeatherStateMode, WeatherStateConfig } from './EnvironmentTypes';

export class WeatherSystem {
  private currentMode: WeatherStateMode = 'CLEAR';
  private config: WeatherStateConfig;
  private targetGroundWetness: number = 0.0;
  private targetRainIntensity: number = 0.0;

  constructor(initialMode: WeatherStateMode = 'CLEAR') {
    this.config = {
      mode: initialMode,
      skyColor: new THREE.Color(0x76a0d0),
      fogColor: new THREE.Color(0xb0c4de),
      ambientIntensity: 1.0,
      sunIntensity: 1.0,
      rainIntensity: 0.0,
      visibilityMultiplier: 1.0,
      groundWetness: 0.0
    };
    this.setWeatherMode(initialMode);
  }

  public setWeatherMode(mode: WeatherStateMode): void {
    this.currentMode = mode;
    this.config.mode = mode;

    switch (mode) {
      case 'CLEAR':
        this.config.skyColor.setHex(0x76a0d0);
        this.config.fogColor.setHex(0xb0c4de);
        this.config.ambientIntensity = 1.0;
        this.config.sunIntensity = 1.0;
        this.config.visibilityMultiplier = 1.0;
        this.targetRainIntensity = 0.0;
        this.targetGroundWetness = 0.0;
        break;
      case 'CLOUDY':
        this.config.skyColor.setHex(0x8c9ea6);
        this.config.fogColor.setHex(0x9faeb5);
        this.config.ambientIntensity = 0.85;
        this.config.sunIntensity = 0.7;
        this.config.visibilityMultiplier = 0.9;
        this.targetRainIntensity = 0.0;
        this.targetGroundWetness = 0.1;
        break;
      case 'OVERCAST':
        this.config.skyColor.setHex(0x606f7b);
        this.config.fogColor.setHex(0x6c7a89);
        this.config.ambientIntensity = 0.65;
        this.config.sunIntensity = 0.4;
        this.config.visibilityMultiplier = 0.75;
        this.targetRainIntensity = 0.2;
        this.targetGroundWetness = 0.3;
        break;
      case 'RAIN':
        this.config.skyColor.setHex(0x3d4852);
        this.config.fogColor.setHex(0x48525c);
        this.config.ambientIntensity = 0.5;
        this.config.sunIntensity = 0.2;
        this.config.visibilityMultiplier = 0.5;
        this.targetRainIntensity = 1.0;
        this.targetGroundWetness = 1.0;
        break;
    }
  }

  public update(dt: number): void {
    // Smooth transition for ground wetness & rain intensity
    const lerpFactor = Math.min(1.0, dt * 0.5);
    this.config.rainIntensity += (this.targetRainIntensity - this.config.rainIntensity) * lerpFactor;
    this.config.groundWetness += (this.targetGroundWetness - this.config.groundWetness) * lerpFactor;
  }

  public getConfig(): WeatherStateConfig {
    return { ...this.config };
  }

  public getMode(): WeatherStateMode {
    return this.currentMode;
  }
}
