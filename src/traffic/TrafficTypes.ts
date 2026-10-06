import * as THREE from 'three';

export type TrafficVehicleState =
  | 'CRUISING'
  | 'FOLLOWING'
  | 'APPROACHING_INTERSECTION'
  | 'WAITING_SIGNAL'
  | 'YIELDING'
  | 'CHANGING_LANE'
  | 'STOPPED'
  | 'PARKING'
  | 'PARKED'
  | 'AVOIDING'
  | 'BLOCKED';

export interface TrafficDriver {
  id: string;
  vehicleId: string;

  aggression: number;       // 0.0 (calm) to 1.0 (aggressive)
  patience: number;         // 0.0 (impatient) to 1.0 (patient)
  awareness: number;        // 0.0 (distracted) to 1.0 (highly alert)

  preferredSpeedMultiplier: number; // e.g. 0.85 to 1.20

  currentRoadId?: string;
  currentLaneId?: string;

  destination?: THREE.Vector3;
}

export interface TransitStop {
  id: string;
  name: string;
  position: THREE.Vector3;
  routeIds: string[];
}

export interface TransitRoute {
  id: string;
  name: string;
  roadSequence: string[];
  stops: TransitStop[];
}
