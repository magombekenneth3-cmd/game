import * as THREE from 'three';

export type VehicleLODTier = 'TIER0_PLAYER_VICINITY' | 'TIER1_NEARBY' | 'TIER2_DISTANT' | 'TIER3_ABSTRACT';

export class VehicleLODManager {
  public static evaluateTier(vehiclePos: THREE.Vector3, playerPos: THREE.Vector3, isPlayerVehicle: boolean): VehicleLODTier {
    if (isPlayerVehicle) return 'TIER0_PLAYER_VICINITY';

    const dist = vehiclePos.distanceTo(playerPos);
    if (dist <= 80.0) return 'TIER0_PLAYER_VICINITY';
    if (dist <= 200.0) return 'TIER1_NEARBY';
    if (dist <= 500.0) return 'TIER2_DISTANT';
    return 'TIER3_ABSTRACT';
  }
}
