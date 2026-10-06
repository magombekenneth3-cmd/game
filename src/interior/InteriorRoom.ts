import * as THREE from 'three';
import { InteriorRoom, InteriorRoomType } from './InteriorTypes';
import { EnvironmentActivityTag } from '../environment/EnvironmentTypes';

export class InteriorRoomManager {
  public static createRoom(
    id: string,
    type: InteriorRoomType,
    displayName: string,
    bounds: THREE.Box3,
    activityTags: EnvironmentActivityTag[] = []
  ): InteriorRoom {
    return {
      id,
      type,
      displayName,
      bounds,
      entrances: [],
      activityTags
    };
  }

  public static isPointInRoom(room: InteriorRoom, point: THREE.Vector3): boolean {
    return room.bounds.containsPoint(point);
  }

  public static getCenter(room: InteriorRoom): THREE.Vector3 {
    const center = new THREE.Vector3();
    room.bounds.getCenter(center);
    return center;
  }
}
