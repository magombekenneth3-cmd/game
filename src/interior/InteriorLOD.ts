import * as THREE from 'three';
import { InteriorInstance } from './InteriorInstance';
import { InteriorLODState } from './InteriorTypes';
import { AssetManager } from '../engine/AssetManager';

export class InteriorLODManager {
  private activeRadius: number = 12.0;    // Meters to trigger close background/prep
  private backgroundRadius: number = 120.0; // Meters to keep metadata active

  public updateLODs(
    interiors: Map<string, InteriorInstance>,
    playerPos: THREE.Vector3,
    activeInteriorId: string | null,
    scene: THREE.Scene,
    assetManager?: AssetManager
  ): { activeCount: number; backgroundCount: number; inactiveCount: number } {
    let activeCount = 0;
    let backgroundCount = 0;
    let inactiveCount = 0;

    interiors.forEach((interior) => {
      let targetLOD: InteriorLODState = 'INTERIOR_INACTIVE';

      if (interior.interiorId === activeInteriorId) {
        targetLOD = 'INTERIOR_ACTIVE';
        activeCount++;
      } else if (interior.interactionTier !== 'EXTERIOR_ONLY') {
        const center = new THREE.Vector3();
        interior.bounds.getCenter(center);
        const dist = playerPos.distanceTo(center);

        if (dist <= this.activeRadius) {
          targetLOD = 'INTERIOR_BACKGROUND';
          backgroundCount++;
        } else if (dist <= this.backgroundRadius) {
          targetLOD = 'INTERIOR_BACKGROUND';
          backgroundCount++;
        } else {
          targetLOD = 'INTERIOR_INACTIVE';
          inactiveCount++;
        }
      } else {
        inactiveCount++;
      }

      interior.setLOD(targetLOD, scene, assetManager);
    });

    return { activeCount, backgroundCount, inactiveCount };
  }
}
