import * as THREE from 'three';

export type EnvironmentLODTier =
  | 'TIER0_FULL'
  | 'TIER1_REDUCED'
  | 'TIER2_SILHOUETTE'
  | 'TIER3_INACTIVE';

export class EnvironmentLODManager {
  public static evaluateTier(
    chunkCenter: THREE.Vector3,
    playerPos: THREE.Vector3
  ): EnvironmentLODTier {
    const dist = chunkCenter.distanceTo(playerPos);
    if (dist <= 80.0) return 'TIER0_FULL';
    if (dist <= 200.0) return 'TIER1_REDUCED';
    if (dist <= 450.0) return 'TIER2_SILHOUETTE';
    return 'TIER3_INACTIVE';
  }
}
