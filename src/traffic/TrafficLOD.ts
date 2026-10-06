import * as THREE from 'three';

export type TrafficLODTier =
  | 'TIER0_FULL'
  | 'TIER1_REDUCED'
  | 'TIER2_ABSTRACT'
  | 'TIER3_STATISTICAL';

export class TrafficLODManager {
  public static evaluateTier(
    vehiclePos: THREE.Vector3,
    playerPos: THREE.Vector3,
    isPlayerVehicle: boolean = false
  ): TrafficLODTier {
    if (isPlayerVehicle) return 'TIER0_FULL';

    const dist = vehiclePos.distanceTo(playerPos);
    if (dist <= 100.0) return 'TIER0_FULL';
    if (dist <= 250.0) return 'TIER1_REDUCED';
    if (dist <= 600.0) return 'TIER2_ABSTRACT';
    return 'TIER3_STATISTICAL';
  }
}
