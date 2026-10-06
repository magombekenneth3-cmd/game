import * as THREE from 'three';

export type VehicleType =
  | 'compact_car'
  | 'sedan'
  | 'suv'
  | 'pickup'
  | 'van'
  | 'matatu'
  | 'motorcycle'
  | 'truck';

export type VehicleCategory = VehicleType;

export type VehicleStateMode =
  | 'PARKED'
  | 'UNOCCUPIED'
  | 'ENTERING'
  | 'OCCUPIED'
  | 'DRIVING'
  | 'BRAKING'
  | 'REVERSING'
  | 'EXITING'
  | 'DISABLED';

export interface VehicleDefinition {
  id: string;
  type: VehicleType;
  displayName: string;
  mass: number;          // kg
  length: number;        // meters
  width: number;         // meters
  height: number;        // meters
  maxSpeed: number;      // km/h
  acceleration: number;  // m/s²
  braking: number;       // m/s²
  steeringRate: number;  // rad/s
  traction: number;      // 0.0 to 1.0
  seats: number;
}

export interface VehicleRuntimeState {
  position: THREE.Vector3;
  rotationY: number;
  velocity: THREE.Vector3;
  currentSpeedKph: number;
  modeState: VehicleStateMode;
  throttle: number;      // -1.0 (reverse) to 1.0 (forward)
  steering: number;      // -1.0 (left) to 1.0 (right)
  brake: number;         // 0.0 to 1.0
  handbrake: boolean;
  driverId?: string;
  occupiedSeats: number;
  damage: number;        // 0 to 100
}

export interface VehicleRoadContext {
  roadId?: string;
  laneIndex?: number;
  heading?: number;
  speedLimit?: number;
}

export interface DrivingRules {
  trafficSide: 'LEFT' | 'RIGHT';
  defaultSpeedUnit: 'KPH' | 'MPH';
}

export const NAIROBI_DRIVING_RULES: DrivingRules = {
  trafficSide: 'LEFT',
  defaultSpeedUnit: 'KPH'
};
