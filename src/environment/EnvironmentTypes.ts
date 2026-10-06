import * as THREE from 'three';

export type EnvironmentActivityTag =
  | 'FOOD'
  | 'SHOPPING'
  | 'TRANSIT'
  | 'SOCIAL'
  | 'SERVICES'
  | 'CONSTRUCTION'
  | 'RESIDENTIAL';

export type LandUseType =
  | 'CBD'
  | 'COMMERCIAL'
  | 'RESIDENTIAL'
  | 'PARK'
  | 'INFORMAL';

export type WeatherStateMode =
  | 'CLEAR'
  | 'CLOUDY'
  | 'OVERCAST'
  | 'RAIN';

export type SignCategory =
  | 'ROAD'
  | 'DIRECTION'
  | 'BUSINESS'
  | 'ADVERTISING'
  | 'CONSTRUCTION';

export interface WorldSign {
  id: string;
  position: THREE.Vector3;
  rotationY: number;
  text: string;
  category: SignCategory;
}

export interface EnvironmentObject {
  id: string;
  category: string;
  position: THREE.Vector3;
  rotationY: number;
  scale: THREE.Vector3;
  tags: EnvironmentActivityTag[];
}

export interface WeatherStateConfig {
  mode: WeatherStateMode;
  skyColor: THREE.Color;
  fogColor: THREE.Color;
  ambientIntensity: number;
  sunIntensity: number;
  rainIntensity: number;       // 0.0 (none) to 1.0 (heavy)
  visibilityMultiplier: number; // 0.2 (foggy/rain) to 1.0 (clear)
  groundWetness: number;        // 0.0 (dry) to 1.0 (puddles)
}
