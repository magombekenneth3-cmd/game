import * as THREE from 'three';
import { WorldChunkManager } from '../world/WorldChunkManager';
import { AssetManager } from '../engine/AssetManager';
import { PlayerController } from '../player/PlayerController';
import { NPCActivityType, ActivityDestination } from '../npc/NPCTypes';
import {
  InteriorSemanticLocation,
  SemanticLocationType
} from './InteriorTypes';
import { InteriorStreamingSystem } from './InteriorStreaming';
import { InteriorLODManager } from './InteriorLOD';
import { InteriorSemanticRegistry } from './InteriorSemanticLocation';
import { InteriorGenerator } from './InteriorGenerator';
import { BuildingData } from '../world/BuildingData';

export interface InteriorTelemetryStats {
  enterableBuildingsCount: number;
  functionalBuildingsCount: number;
  activeInteriorCount: number;
  backgroundInteriorCount: number;
  activeInteriorId: string | null;
  totalFurnitureCount: number;
}

export class InteriorManager {
  public scene: THREE.Scene;
  public chunkManager: WorldChunkManager;
  public assetManager: AssetManager;

  public semanticRegistry: InteriorSemanticRegistry;
  public streamingSystem: InteriorStreamingSystem;
  public lodManager: InteriorLODManager;

  private activeInteriorId: string | null = null;
  private currentExteriorDoorPos: THREE.Vector3 | null = null;
  private worldSeed: number;

  constructor(
    scene: THREE.Scene,
    chunkManager: WorldChunkManager,
    assetManager: AssetManager,
    worldSeed: number = 1337
  ) {
    this.scene = scene;
    this.chunkManager = chunkManager;
    this.assetManager = assetManager;
    this.worldSeed = worldSeed;

    this.semanticRegistry = new InteriorSemanticRegistry();
    this.streamingSystem = new InteriorStreamingSystem(this.semanticRegistry, this.worldSeed);
    this.lodManager = new InteriorLODManager();

    // Register bespoke Nairobi Nightclub for NPC/Player Nightlife
    this.registerBespokeNairobiNightclub();
  }

  /**
   * Registers a guaranteed functional Nairobi Nightclub ("Club Velvet Kilimani")
   */
  private registerBespokeNairobiNightclub(): void {
    const nightclubBuilding: BuildingData = {
      id: 'bld_bespoke_nightclub_kilimani',
      name: 'Club Velvet Kilimani',
      footprintPolygon: [
        { x: 30, z: 10 },
        { x: 60, z: 10 },
        { x: 60, z: 35 },
        { x: 30, z: 35 }
      ],
      center: new THREE.Vector3(45, 0, 22.5),
      height: 12.0,
      floors: 2,
      zone: 'cbd_commercial',
      districtId: 'district_nairobi',
      buildingCategory: 'mixed_use',
      entrances: [{ id: 'ent_club_main', position: new THREE.Vector3(45, 0, 35), type: 'main' }],
      hasGroundFloorShops: true,
      shopNames: ['Club Velvet Lounge & Dance Floor'],
      rooftopEquipment: ['water_tank', 'ac_unit']
    };

    const nightclubInstance = InteriorGenerator.generateInterior(nightclubBuilding, this.worldSeed);
    this.streamingSystem.interiors.set(nightclubInstance.interiorId, nightclubInstance);

    nightclubInstance.semanticLocations.forEach((loc) => {
      this.semanticRegistry.register(loc);
    });
  }

  public update(playerPos: THREE.Vector3, playerController?: PlayerController): void {
    // 1. Stream interiors from loaded chunks
    this.streamingSystem.updateStreaming(this.chunkManager);

    // 2. Update Interior LODs
    this.lodManager.updateLODs(
      this.streamingSystem.interiors,
      playerPos,
      this.activeInteriorId,
      this.scene,
      this.assetManager
    );

    // 3. Register Door Interaction Prompts with Player Controller
    if (playerController) {
      this.updateDoorInteractions(playerController);
    }
  }

  private updateDoorInteractions(playerController: PlayerController): void {
    const playerPos = playerController.getPosition();

    // If currently inside an interior, register the Exit Door
    if (this.activeInteriorId) {
      const activeInterior = this.streamingSystem.getInteriorById(this.activeInteriorId);
      if (activeInterior && activeInterior.doors.length > 0) {
        const exitDoor = activeInterior.doors[0]; // Main door

        playerController.interactionSystem.registerInteractable({
          id: `interact_exit_${activeInterior.interiorId}`,
          displayName: `Exit ${activeInterior.buildingName}`,
          interactionType: 'door',
          position: exitDoor.interiorSpawnPosition.clone(),
          interactionRadius: 4.0,
          canInteract: () => true,
          interact: () => this.exitBuilding(playerController)
        });
      }
      return;
    }

    // Otherwise, check for nearby exterior entrance doors
    this.streamingSystem.interiors.forEach((interior) => {
      interior.doors.forEach((door) => {
        if (door.isExteriorDoor) {
          const dist = playerPos.distanceTo(door.position);
          if (dist <= 6.0) {
            playerController.interactionSystem.registerInteractable({
              id: `interact_enter_${interior.interiorId}`,
              displayName: `Enter ${interior.buildingName}`,
              interactionType: 'door',
              position: door.position,
              interactionRadius: 4.0,
              canInteract: () => true,
              interact: () => this.enterBuilding(interior.buildingId, playerController)
            });
          }
        }
      });
    });
  }

  public enterBuilding(buildingId: string, playerController: PlayerController): boolean {
    const interior = this.streamingSystem.getInteriorForBuilding(buildingId);
    if (!interior || interior.doors.length === 0) {
      console.warn(`⚠️ Building ${buildingId} is not enterable.`);
      return false;
    }

    const door = interior.doors[0];

    // Store player exterior position for return
    this.currentExteriorDoorPos = playerController.getPosition().clone();
    this.activeInteriorId = interior.interiorId;

    // Set Interior LOD to ACTIVE
    interior.setLOD('INTERIOR_ACTIVE', this.scene, this.assetManager);

    // Teleport player to interior spawn position
    playerController.motor.position.copy(door.interiorSpawnPosition);
    console.log(`🚪 Player entered ${interior.buildingName} at position:`, door.interiorSpawnPosition);
    return true;
  }

  public exitBuilding(playerController: PlayerController): boolean {
    if (!this.activeInteriorId) return false;

    const interior = this.streamingSystem.getInteriorById(this.activeInteriorId);
    const exitPos = this.currentExteriorDoorPos
      ? this.currentExteriorDoorPos.clone().add(new THREE.Vector3(0, 0, 1.5))
      : new THREE.Vector3(0, 0.5, 0);

    if (interior) {
      interior.setLOD('INTERIOR_BACKGROUND', this.scene, this.assetManager);
    }

    this.activeInteriorId = null;
    this.currentExteriorDoorPos = null;

    // Teleport player to exterior exit position
    playerController.motor.position.copy(exitPos);
    console.log(`🚪 Player exited interior to exterior position:`, exitPos);
    return true;
  }

  /**
   * Resolves NPC activity targets to interior semantic locations
   */
  public resolveNPCDestination(
    activity: NPCActivityType,
    currentPos: THREE.Vector3
  ): ActivityDestination | undefined {
    let semanticType: SemanticLocationType | undefined;

    switch (activity) {
      case 'CLUB':
      case 'CONCERT':
      case 'EVENT':
        semanticType = 'CLUB';
        break;
      case 'SHOP':
        semanticType = 'SHOP';
        break;
      case 'EAT':
        semanticType = 'RESTAURANT';
        break;
      case 'WORK':
        semanticType = 'OFFICE';
        break;
      case 'GYM':
        semanticType = 'GYM';
        break;
      case 'HOME':
      case 'SLEEP':
        semanticType = 'HOME';
        break;
    }

    if (!semanticType) return undefined;

    const semLoc = this.semanticRegistry.findNearest(semanticType, currentPos);
    if (!semLoc) return undefined;

    const interior = this.streamingSystem.getInteriorById(`interior_${semLoc.buildingId}`);
    const doorPos = interior && interior.doors.length > 0 ? interior.doors[0].position : semLoc.position;

    return {
      id: semLoc.id,
      displayName: semLoc.displayName || `Interior Destination ${semLoc.type}`,
      position: doorPos.clone(),
      activities: [activity],
      tags: ['interior', semLoc.type.toLowerCase()],
      capacity: semLoc.capacity,
      currentOccupancy: 0
    };
  }

  public querySemanticLocations(type?: SemanticLocationType): InteriorSemanticLocation[] {
    if (type) {
      return this.semanticRegistry.queryByType(type);
    }
    return this.semanticRegistry.getAll();
  }

  public getTelemetryStats(): InteriorTelemetryStats {
    let enterableCount = 0;
    let functionalCount = 0;
    let activeCount = 0;
    let backgroundCount = 0;
    let totalFurniture = 0;

    this.streamingSystem.interiors.forEach((interior) => {
      if (interior.interactionTier === 'ENTERABLE') enterableCount++;
      if (interior.interactionTier === 'FUNCTIONAL') functionalCount++;

      if (interior.lodState === 'INTERIOR_ACTIVE') {
        activeCount++;
        totalFurniture += interior.getFurnitureCount();
      } else if (interior.lodState === 'INTERIOR_BACKGROUND') {
        backgroundCount++;
      }
    });

    return {
      enterableBuildingsCount: enterableCount,
      functionalBuildingsCount: functionalCount,
      activeInteriorCount: activeCount,
      backgroundInteriorCount: backgroundCount,
      activeInteriorId: this.activeInteriorId,
      totalFurnitureCount: totalFurniture
    };
  }
}
