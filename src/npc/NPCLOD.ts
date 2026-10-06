import * as THREE from 'three';
import { NPCSimulationTier } from './NPCTypes';

export class NPCLODManager {
  public static evaluateTier(npcPos: THREE.Vector3, playerPos: THREE.Vector3): NPCSimulationTier {
    const dist = npcPos.distanceTo(playerPos);

    if (dist <= 80.0) {
      return 'TIER0_VICINITY';
    } else if (dist <= 200.0) {
      return 'TIER1_NEARBY';
    } else if (dist <= 500.0) {
      return 'TIER2_DISTANT';
    } else {
      return 'TIER3_ABSTRACT';
    }
  }

  public static shouldUpdateThisFrame(tier: NPCSimulationTier, frameCounter: number): boolean {
    switch (tier) {
      case 'TIER0_VICINITY':
        return true; // Update every frame
      case 'TIER1_NEARBY':
        return frameCounter % 6 === 0; // ~10 FPS update rate
      case 'TIER2_DISTANT':
        return frameCounter % 30 === 0; // ~2 FPS update rate
      case 'TIER3_ABSTRACT':
      default:
        return frameCounter % 60 === 0; // ~1 FPS abstract state update rate
    }
  }
}
