import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { BuildingData } from '../src/world/BuildingData';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { InteriorGenerator } from '../src/interior/InteriorGenerator';
import { InteriorDoorHelper } from '../src/interior/InteriorDoor';
import { InteriorNavigationGraph } from '../src/interior/InteriorNavigation';
import { InteriorSemanticRegistry } from '../src/interior/InteriorSemanticLocation';
import { InteriorManager } from '../src/interior/InteriorManager';

describe('Phase 8 — Interactive Buildings & Interior World Tests', () => {
  let mockScene: THREE.Scene;
  let chunkManager: WorldChunkManager;
  let sampleBuilding: BuildingData;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    chunkManager = new WorldChunkManager(mockScene);

    sampleBuilding = {
      id: 'bld_kilimani_test_101',
      name: 'Kilimani Heights Apartment',
      footprintPolygon: [
        { x: -10, z: -10 },
        { x: 10, z: -10 },
        { x: 10, z: 10 },
        { x: -10, z: 10 }
      ],
      center: new THREE.Vector3(0, 0, 0),
      height: 15.0,
      floors: 5,
      zone: 'residential_estate',
      districtId: 'district_nairobi',
      buildingCategory: 'apartment_block',
      entrances: [{ id: 'ent_1', position: new THREE.Vector3(0, 0, 10), type: 'main' }],
      hasGroundFloorShops: false,
      rooftopEquipment: ['water_tank']
    };
  });

  it('1. classifies building category and interaction tier deterministically', () => {
    const res1 = InteriorGenerator.classifyBuilding(sampleBuilding, 1337);
    const res2 = InteriorGenerator.classifyBuilding(sampleBuilding, 1337);

    expect(res1.classification).toBe('APARTMENT');
    expect(res1.interactionTier).toBe(res2.interactionTier);
  });

  it('2. generates deterministic interior instance from world seed', () => {
    const interior1 = InteriorGenerator.generateInterior(sampleBuilding, 1337);
    const interior2 = InteriorGenerator.generateInterior(sampleBuilding, 1337);

    expect(interior1.interiorId).toBe(`interior_${sampleBuilding.id}`);
    expect(interior1.rooms.length).toBe(interior2.rooms.length);
    expect(interior1.doors.length).toBe(interior2.doors.length);
    expect(interior1.semanticLocations.length).toBe(interior2.semanticLocations.length);
  });

  it('3. scales interior template rooms to building footprint polygon dimensions', () => {
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);
    const bounds = interior.bounds;

    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;

    expect(width).toBeGreaterThanOrEqual(20.0);
    expect(depth).toBeGreaterThanOrEqual(20.0);
  });

  it('4. generates valid rooms with bounds, types, and activity tags', () => {
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);

    expect(interior.rooms.length).toBeGreaterThan(0);
    const foyerRoom = interior.rooms.find((r) => r.type === 'ENTRY' || r.type === 'LIVING_ROOM');
    expect(foyerRoom).toBeDefined();
    expect(foyerRoom?.activityTags.length).toBeGreaterThan(0);
  });

  it('5. validates exterior door position against building footprint boundary', () => {
    const doorPos = new THREE.Vector3(0, 0, 10);
    const isValid = InteriorDoorHelper.validateDoorOnFootprint(doorPos, sampleBuilding, 2.0);
    expect(isValid).toBe(true);
  });

  it('6. builds interior navigation graph and performs indoor pathfinding', () => {
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);
    const navGraph = interior.navGraph;

    expect(navGraph.nodes.size).toBe(interior.rooms.length);
    const roomIds = Array.from(navGraph.nodes.keys());
    if (roomIds.length >= 2) {
      const path = navGraph.findIndoorPath(roomIds[0], roomIds[1]);
      expect(path.length).toBeGreaterThan(0);
    }
  });

  it('7. registers and queries interior semantic locations by type', () => {
    const registry = new InteriorSemanticRegistry();
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);

    interior.semanticLocations.forEach((loc) => registry.register(loc));
    const homeLocs = registry.queryByType('HOME');

    expect(homeLocs.length).toBeGreaterThan(0);
    expect(homeLocs[0].buildingId).toBe(sampleBuilding.id);
  });

  it('8. verifies nightclub bespoke interior room layout (ENTRY, MAIN_FLOOR, BAR, DJ_BOOTH, VIP, etc.)', () => {
    const clubBuilding: BuildingData = {
      ...sampleBuilding,
      id: 'bld_carnivore_club',
      name: 'Carnivore Nightclub & Lounge',
      zone: 'cbd_commercial'
    };

    const clubInterior = InteriorGenerator.generateInterior(clubBuilding, 1337);
    const roomTypes = clubInterior.rooms.map((r) => r.type);

    expect(roomTypes).toContain('ENTRY');
    expect(roomTypes).toContain('MAIN_FLOOR');
    expect(roomTypes).toContain('BAR');
    expect(roomTypes).toContain('DJ_BOOTH');
    expect(roomTypes).toContain('VIP');
  });

  it('9. resolves NPC activity targets to interior entrance and semantic location', () => {
    const manager = new InteriorManager(mockScene, chunkManager, {} as any, 1337);
    const dest = manager.resolveNPCDestination('CLUB', new THREE.Vector3(0, 0, 0));

    expect(dest).toBeDefined();
    expect(dest?.tags).toContain('interior');
    expect(dest?.activities).toContain('CLUB');
  });

  it('10. manages interior enter and exit player transitions cleanly', () => {
    const manager = new InteriorManager(mockScene, chunkManager, {} as any, 1337);
    manager.streamingSystem.interiors.set(
      `interior_${sampleBuilding.id}`,
      InteriorGenerator.generateInterior(sampleBuilding, 1337)
    );

    const mockPlayerController: any = {
      getPosition: () => new THREE.Vector3(0, 0, 10),
      motor: { position: new THREE.Vector3(0, 0, 10) },
      interactionSystem: { registerInteractable: () => {} }
    };

    const enterSuccess = manager.enterBuilding(sampleBuilding.id, mockPlayerController);
    expect(enterSuccess).toBe(true);

    const stats = manager.getTelemetryStats();
    expect(stats.activeInteriorId).toBe(`interior_${sampleBuilding.id}`);

    const exitSuccess = manager.exitBuilding(mockPlayerController);
    expect(exitSuccess).toBe(true);
    expect(manager.getTelemetryStats().activeInteriorId).toBeNull();
  });

  it('11. manages interior LOD state transitions (ACTIVE, BACKGROUND, INACTIVE)', () => {
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);
    expect(interior.lodState).toBe('INTERIOR_INACTIVE');

    interior.setLOD('INTERIOR_BACKGROUND', mockScene);
    expect(interior.lodState).toBe('INTERIOR_BACKGROUND');

    interior.setLOD('INTERIOR_ACTIVE', mockScene);
    expect(interior.lodState).toBe('INTERIOR_ACTIVE');
    expect(interior.getFurnitureCount()).toBeGreaterThan(0);

    interior.setLOD('INTERIOR_INACTIVE', mockScene);
    expect(interior.lodState).toBe('INTERIOR_INACTIVE');
  });

  it('12. exposes persistent state hooks for interior objects', () => {
    const interior = InteriorGenerator.generateInterior(sampleBuilding, 1337);
    expect(interior.persistentState.interiorId).toBe(interior.interiorId);
    expect(interior.persistentState.lastVisitTime).toBeGreaterThan(0);

    interior.persistentState.objectStates['safe_locked'] = false;
    expect(interior.persistentState.objectStates['safe_locked']).toBe(false);
  });
});
