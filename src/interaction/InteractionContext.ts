import * as THREE from 'three';
import {
  InteractionContext,
  InteractionTarget,
  RelationshipState,
  ReputationSnapshot
} from './InteractionTypes';

export class InteractionContextBuilder {
  public static buildContext(
    playerId: string,
    playerPos: THREE.Vector3,
    target: InteractionTarget,
    timeOfDay: number = 12.0,
    locationId?: string,
    relationship?: RelationshipState,
    reputation?: ReputationSnapshot
  ): InteractionContext {
    const distance = playerPos.distanceTo(target.position);

    return {
      playerId,
      targetId: target.id,
      targetType: target.type,
      distance,
      timeOfDay,
      locationId,
      relationship,
      reputation,
      targetData: target.data
    };
  }
}
