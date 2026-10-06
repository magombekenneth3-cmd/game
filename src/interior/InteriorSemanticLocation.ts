import * as THREE from 'three';
import { InteriorSemanticLocation, SemanticLocationType } from './InteriorTypes';

export class InteriorSemanticRegistry {
  private locations: Map<string, InteriorSemanticLocation> = new Map();

  public register(location: InteriorSemanticLocation): void {
    this.locations.set(location.id, location);
  }

  public unregisterByBuilding(buildingId: string): void {
    this.locations.forEach((loc, id) => {
      if (loc.buildingId === buildingId) {
        this.locations.delete(id);
      }
    });
  }

  public queryByType(type: SemanticLocationType): InteriorSemanticLocation[] {
    const results: InteriorSemanticLocation[] = [];
    this.locations.forEach((loc) => {
      if (loc.type === type) {
        results.push(loc);
      }
    });
    return results;
  }

  public findNearest(type: SemanticLocationType, currentPos: THREE.Vector3): InteriorSemanticLocation | undefined {
    let nearest: InteriorSemanticLocation | undefined;
    let minDistSq = Infinity;

    this.locations.forEach((loc) => {
      if (loc.type === type) {
        const distSq = currentPos.distanceToSquared(loc.position);
        if (distSq < minDistSq) {
          minDistSq = distSq;
          nearest = loc;
        }
      }
    });

    return nearest;
  }

  public getAll(): InteriorSemanticLocation[] {
    return Array.from(this.locations.values());
  }

  public clear(): void {
    this.locations.clear();
  }
}
