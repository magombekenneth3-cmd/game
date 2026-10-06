import * as THREE from 'three';
import { InteriorDoor } from './InteriorTypes';
import { BuildingData } from '../world/BuildingData';

export class InteriorDoorHelper {
  /**
   * Validates that an exterior door position lies near the boundary of the building footprint polygon.
   */
  public static validateDoorOnFootprint(doorPos: THREE.Vector3, building: BuildingData, tolerance: number = 8.0): boolean {
    if (!building.footprintPolygon || building.footprintPolygon.length < 3) {
      // Fallback distance check to center
      return doorPos.distanceTo(building.center) <= tolerance + 15.0;
    }

    // Check distance to any edge of the footprint polygon
    let minDistanceSq = Infinity;
    const poly = building.footprintPolygon;

    for (let i = 0; i < poly.length; i++) {
      const p1 = new THREE.Vector3(poly[i].x, 0, poly[i].z);
      const p2 = new THREE.Vector3(poly[(i + 1) % poly.length].x, 0, poly[(i + 1) % poly.length].z);

      const distSq = this.pointToSegmentDistanceSq(doorPos, p1, p2);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
      }
    }

    return Math.sqrt(minDistanceSq) <= tolerance;
  }

  private static pointToSegmentDistanceSq(p: THREE.Vector3, v: THREE.Vector3, w: THREE.Vector3): number {
    const l2 = v.distanceToSquared(w);
    if (l2 === 0) return p.distanceToSquared(v);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.z - v.z) * (w.z - v.z)) / l2;
    t = Math.max(0, Math.min(1, t));
    const proj = new THREE.Vector3(v.x + t * (w.x - v.x), 0, v.z + t * (w.z - v.z));
    return p.distanceToSquared(proj);
  }

  public static createExteriorDoor(
    id: string,
    buildingId: string,
    exteriorPos: THREE.Vector3,
    facing: THREE.Vector3,
    destinationInteriorId: string,
    destinationRoomId: string,
    interiorSpawnPos: THREE.Vector3,
    name?: string
  ): InteriorDoor {
    return {
      id,
      buildingId,
      position: exteriorPos.clone(),
      facing: facing.clone().normalize(),
      destinationInteriorId,
      destinationRoomId,
      interiorSpawnPosition: interiorSpawnPos.clone(),
      locked: false,
      isExteriorDoor: true,
      name
    };
  }

  public static createInteriorDoor(
    id: string,
    buildingId: string,
    position: THREE.Vector3,
    destinationRoomId: string,
    interiorSpawnPos: THREE.Vector3,
    name?: string
  ): InteriorDoor {
    return {
      id,
      buildingId,
      position: position.clone(),
      facing: new THREE.Vector3(0, 0, 1),
      destinationInteriorId: buildingId,
      destinationRoomId,
      interiorSpawnPosition: interiorSpawnPos.clone(),
      locked: false,
      isExteriorDoor: false,
      name
    };
  }
}
