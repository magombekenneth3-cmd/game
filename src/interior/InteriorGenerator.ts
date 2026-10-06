import * as THREE from 'three';
import { BuildingData } from '../world/BuildingData';
import {
  BuildingClassification,
  BuildingInteractionTier,
  SemanticLocationType
} from './InteriorTypes';
import { InteriorTemplateRegistry } from './InteriorTemplate';
import { InteriorInstance } from './InteriorInstance';
import { InteriorDoorHelper } from './InteriorDoor';
import { InteriorRoomManager } from './InteriorRoom';
import { SeededRandom } from '../utils/SeededRandom';

export class InteriorGenerator {
  /**
   * Deterministically classifies a building into category & interaction tier.
   */
  public static classifyBuilding(
    building: BuildingData,
    seed: number = 1337
  ): { classification: BuildingClassification; interactionTier: BuildingInteractionTier } {
    const rng = new SeededRandom(seed + this.hashString(building.id));
    const nameLower = (building.name || '').toLowerCase();

    // Explicit name override check
    if (nameLower.includes('nightclub') || nameLower.includes('lounge') || nameLower.includes('club')) {
      return { classification: 'NIGHTCLUB', interactionTier: 'FUNCTIONAL' };
    }
    if (nameLower.includes('mall') || nameLower.includes('retail') || nameLower.includes('kiosk')) {
      return { classification: 'RETAIL', interactionTier: 'FUNCTIONAL' };
    }
    if (nameLower.includes('apartment') || nameLower.includes('flat') || nameLower.includes('sunrise')) {
      return { classification: 'APARTMENT', interactionTier: 'ENTERABLE' };
    }
    if (nameLower.includes('plaza') || nameLower.includes('tower') || nameLower.includes('financial')) {
      return { classification: 'OFFICE', interactionTier: 'FUNCTIONAL' };
    }

    // Land-use zone based classification
    let classification: BuildingClassification = 'RETAIL';
    if (building.zone === 'cbd_commercial') {
      classification = building.floors > 10 ? 'OFFICE' : 'RETAIL';
    } else if (building.zone === 'residential_estate') {
      classification = building.floors > 3 ? 'APARTMENT' : 'RESIDENTIAL';
    } else if (building.zone === 'industrial_zone') {
      classification = building.floors > 2 ? 'WAREHOUSE' : 'GARAGE';
    } else if (building.zone === 'informal_market') {
      classification = 'MARKET';
    }

    // Interaction Tier assignment
    let interactionTier: BuildingInteractionTier = 'EXTERIOR_ONLY';
    const roll = rng.nextFloat();
    if (roll < 0.25 || building.hasGroundFloorShops || building.floors > 4) {
      interactionTier = roll < 0.15 ? 'FUNCTIONAL' : 'ENTERABLE';
    }

    return { classification, interactionTier };
  }

  /**
   * Deterministically generates an InteriorInstance for a building.
   */
  public static generateInterior(
    building: BuildingData,
    worldSeed: number = 1337
  ): InteriorInstance {
    const { classification, interactionTier } = this.classifyBuilding(building, worldSeed);
    const templateConfig = InteriorTemplateRegistry.getTemplate(classification);

    // Compute bounding box dimensions from building center & footprint
    let width = templateConfig.defaultWidth;
    let depth = templateConfig.defaultDepth;

    if (building.footprintPolygon && building.footprintPolygon.length > 2) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      building.footprintPolygon.forEach((pt) => {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.z < minZ) minZ = pt.z;
        if (pt.z > maxZ) maxZ = pt.z;
      });
      width = Math.max(10.0, maxX - minX);
      depth = Math.max(10.0, maxZ - minZ);
    }

    const floorHeight = 3.2;
    const interiorBounds = new THREE.Box3(
      new THREE.Vector3(building.center.x - width / 2, building.center.y, building.center.z - depth / 2),
      new THREE.Vector3(building.center.x + width / 2, building.center.y + floorHeight, building.center.z + depth / 2)
    );

    const interiorId = `interior_${building.id}`;
    const instance = new InteriorInstance(
      interiorId,
      building.id,
      building.name || `${classification} Building ${building.id.slice(-4)}`,
      classification,
      interactionTier,
      interiorBounds
    );

    // Generate Rooms from Template Specs scaled to building footprint
    const minX = interiorBounds.min.x;
    const minZ = interiorBounds.min.z;

    templateConfig.roomSpecs.forEach((spec, idx) => {
      const roomMinX = minX + spec.relativeMinX * width;
      const roomMinZ = minZ + spec.relativeMinZ * depth;
      const roomMaxX = minX + spec.relativeMaxX * width;
      const roomMaxZ = minZ + spec.relativeMaxZ * depth;

      const roomBounds = new THREE.Box3(
        new THREE.Vector3(roomMinX, building.center.y, roomMinZ),
        new THREE.Vector3(roomMaxX, building.center.y + floorHeight, roomMaxZ)
      );

      const roomId = `${interiorId}_room_${idx}_${spec.roomType}`;
      const room = InteriorRoomManager.createRoom(
        roomId,
        spec.roomType,
        spec.name,
        roomBounds,
        spec.activityTags
      );
      instance.rooms.push(room);
    });

    // Determine Main Entry Room
    const entryRoom = instance.rooms.find((r) => r.type === 'ENTRY' || r.type === 'RECEPTION') || instance.rooms[0];
    const entryCenter = new THREE.Vector3();
    entryRoom.bounds.getCenter(entryCenter);

    // Exterior Entrance Door Position (placed at south edge of footprint)
    const doorPos = new THREE.Vector3(building.center.x, building.center.y + 0.1, building.center.z + depth / 2);
    const facing = new THREE.Vector3(0, 0, 1);
    const interiorSpawnPos = new THREE.Vector3(entryCenter.x, building.center.y + 0.3, entryCenter.z);

    // Validate Door Position against Footprint Boundary
    InteriorDoorHelper.validateDoorOnFootprint(doorPos, building, 10.0);

    const exteriorDoor = InteriorDoorHelper.createExteriorDoor(
      `door_${building.id}_main`,
      building.id,
      doorPos,
      facing,
      interiorId,
      entryRoom.id,
      interiorSpawnPos,
      `Enter ${instance.buildingName}`
    );

    instance.doors.push(exteriorDoor);
    entryRoom.entrances.push(exteriorDoor.id);

    // Generate Semantic Locations
    this.generateSemanticLocations(instance);

    // Build Navigation Graph
    instance.navGraph.buildFromRoomsAndDoors(instance.rooms, instance.doors);

    return instance;
  }

  private static generateSemanticLocations(instance: InteriorInstance): void {
    instance.rooms.forEach((room, idx) => {
      const center = new THREE.Vector3();
      room.bounds.getCenter(center);

      let semanticType: SemanticLocationType | undefined;
      switch (room.type) {
        case 'SHOP_FLOOR':
        case 'RECEPTION':
          semanticType = 'SHOP';
          break;
        case 'DINING':
        case 'KITCHEN':
          semanticType = 'RESTAURANT';
          break;
        case 'BAR':
        case 'MAIN_FLOOR':
        case 'DANCE_FLOOR':
        case 'VIP':
        case 'DJ_BOOTH':
          semanticType = 'CLUB';
          break;
        case 'BEDROOM':
        case 'LIVING_ROOM':
          semanticType = 'HOME';
          break;
        case 'OFFICE':
          semanticType = 'OFFICE';
          break;
        case 'GYM_FLOOR':
          semanticType = 'GYM';
          break;
        case 'GARAGE':
        case 'WORKSHOP':
          semanticType = 'GARAGE';
          break;
        case 'WAREHOUSE':
          semanticType = 'WAREHOUSE';
          break;
      }

      if (semanticType) {
        const semLoc = {
          id: `sem_${instance.buildingId}_${idx}_${semanticType}`,
          buildingId: instance.buildingId,
          roomId: room.id,
          type: semanticType,
          position: center.clone(),
          capacity: semanticType === 'CLUB' ? 200 : 30,
          displayName: `${room.displayName} (${instance.buildingName})`,
          activityTags: room.activityTags
        };
        instance.semanticLocations.push(semLoc);
      }
    });
  }

  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
