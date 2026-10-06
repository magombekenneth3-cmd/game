import * as THREE from 'three';
import { TimeOfDayConfig } from '../types';

export class TimeOfDay {
  private currentHours: number;
  private timeScale: number;

  constructor(initialHours: number = 14.0, timeScale: number = 60.0) {
    // 14.0 = 2:00 PM default, timeScale 60 = 1 real sec = 1 game minute
    this.currentHours = initialHours;
    this.timeScale = timeScale;
  }

  public update(deltaTimeSeconds: number): void {
    const hoursDelta = (deltaTimeSeconds * this.timeScale) / 3600;
    this.currentHours = (this.currentHours + hoursDelta) % 24;
    if (this.currentHours < 0) this.currentHours += 24;
  }

  public setTime(hours: number): void {
    this.currentHours = ((hours % 24) + 24) % 24;
  }

  public getTime(): number {
    return this.currentHours;
  }

  public setTimeScale(scale: number): void {
    this.timeScale = Math.max(0, scale);
  }

  public getTimeScale(): number {
    return this.timeScale;
  }

  public getConfig(): TimeOfDayConfig {
    const hours = this.currentHours;
    // Angle in radians: 0h = midnight (-PI/2), 6h = sunrise (0), 12h = noon (PI/2), 18h = sunset (PI)
    const sunAngle = ((hours - 6) / 24) * Math.PI * 2;
    
    // Sun position calculation
    const radius = 300;
    const sunX = Math.cos(sunAngle) * radius;
    const sunY = Math.sin(sunAngle) * radius;
    const sunZ = Math.sin(sunAngle * 0.5) * 50; // slight arc inclination

    const sunPosition = new THREE.Vector3(sunX, Math.max(-50, sunY), sunZ);
    const isDay = sunY > 0;
    const altitudeNormalized = Math.max(0, sunY / radius); // 0 at horizon, 1 at peak noon

    // Golden hour detection (near horizon: 0 < altitudeNormalized < 0.25)
    const isGoldenHour = sunY > -20 && sunY < 60;

    // Color interpolations
    const sunLightColor = new THREE.Color();
    const ambientLightColor = new THREE.Color();
    const skyColor = new THREE.Color();
    const groundColor = new THREE.Color();
    const fogColor = new THREE.Color();

    if (isDay) {
      if (isGoldenHour) {
        // Warm African sunset/sunrise tones
        sunLightColor.setHSL(0.08, 0.9, 0.65); // Warm amber gold
        ambientLightColor.setHSL(0.06, 0.7, 0.45);
        skyColor.setHSL(0.06, 0.8, 0.55); // Sunset orange-gold
        groundColor.setHSL(0.05, 0.5, 0.25);
        fogColor.setHSL(0.06, 0.7, 0.5);
      } else {
        // High bright equatorial midday sun
        sunLightColor.setHSL(0.13, 0.3, 0.95); // Crisp sunlight
        ambientLightColor.setHSL(0.58, 0.4, 0.75); // Soft blue sky dome
        skyColor.setHSL(0.58, 0.6, 0.65); // Rich equatorial blue
        groundColor.setHSL(0.08, 0.4, 0.4); // Warm earth ground bounce
        fogColor.setHSL(0.55, 0.35, 0.75);
      }
    } else {
      // African starlit night
      sunLightColor.setHSL(0.6, 0.5, 0.45); // Deep cool moonlight
      ambientLightColor.setHSL(0.62, 0.4, 0.45);
      skyColor.setHSL(0.62, 0.5, 0.25); // Deep navy night sky
      groundColor.setHSL(0.6, 0.3, 0.25);
      fogColor.setHSL(0.62, 0.4, 0.3);
    }

    const sunIntensity = isDay ? Math.min(2.5, altitudeNormalized * 3.0 + 0.5) : 0.6;
    const ambientIntensity = isDay ? 0.7 + altitudeNormalized * 0.4 : 0.55;
    const streetlightsOn = hours >= 17.5 || hours <= 6.0;

    return {
      hours,
      timeScale: this.timeScale,
      sunLightColor,
      ambientLightColor,
      sunPosition,
      sunIntensity,
      ambientIntensity,
      skyColor,
      groundColor,
      fogColor,
      streetlightsOn
    };
  }
}
