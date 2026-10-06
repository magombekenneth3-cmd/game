import * as THREE from 'three';
import { InteractionTarget, InteractionTargetType } from './InteractionTypes';

export class InteractionTargetHelper {
  public static createTarget(
    id: string,
    type: InteractionTargetType,
    displayName: string,
    position: THREE.Vector3,
    interactionRadius: number = 3.5,
    enabled: boolean = true,
    data?: unknown
  ): InteractionTarget {
    return {
      id,
      type,
      displayName,
      position: position.clone(),
      interactionRadius,
      enabled,
      data
    };
  }

  public static isTargetInRange(target: InteractionTarget, playerPos: THREE.Vector3): boolean {
    if (!target.enabled) return false;
    return playerPos.distanceTo(target.position) <= target.interactionRadius;
  }
}
