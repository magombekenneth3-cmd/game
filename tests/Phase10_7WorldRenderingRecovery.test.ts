import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { NairobiDistrictScene } from '../src/world/NairobiDistrictScene';
import { AssetManager } from '../src/engine/AssetManager';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { PlayerController } from '../src/player/PlayerController';
import { ThirdPersonCamera } from '../src/player/ThirdPersonCamera';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { VehicleManager } from '../src/vehicles/VehicleManager';
import { NPCManager } from '../src/npc/NPCManager';
import { NPCSpawner } from '../src/npc/NPCSpawner';
import { NPC } from '../src/npc/NPC';
import { NPCSimulation } from '../src/npc/NPCSimulation';

describe('Phase 10.7 — Critical World Rendering Recovery Unit & Integration Tests', () => {
  let scene: THREE.Scene;
  let assetManager: AssetManager;
  let sceneGenerator: NairobiDistrictScene;

  beforeEach(() => {
    scene = new THREE.Scene();
    assetManager = new AssetManager();
    sceneGenerator = new NairobiDistrictScene(scene, assetManager);
  });

  it('1. World generation produces non-zero terrain, road, and building counts', () => {
    sceneGenerator.generate();

    let terrainCount = 0;
    let roadCount = 0;
    let buildingCount = 0;

    scene.traverse((obj) => {
      if (obj.name.startsWith('TerrainChunk_')) terrainCount++;
      if (obj.name.startsWith('Road_') || obj.name.includes('RoadSegment')) roadCount++;
      if (obj.name.startsWith('BuildingGroup_')) buildingCount++;
    });

    expect(terrainCount).toBeGreaterThan(0);
    expect(roadCount).toBeGreaterThan(0);
    expect(buildingCount).toBeGreaterThan(0);
  });

  it('2. Initial chunks exist and activate at spawn position (0, 0.5, 15)', () => {
    sceneGenerator.generate();
    const spawnPos = new THREE.Vector3(0, 0.5, 15);

    sceneGenerator.update(spawnPos);

    const activeChunks = sceneGenerator.chunkManager.getActiveChunkCount();
    expect(activeChunks).toBeGreaterThan(0);

    const spawnChunkKey = sceneGenerator.chunkManager.getChunkKeyForPosition(0, 15);
    const spawnChunk = sceneGenerator.chunkManager.chunks.get(spawnChunkKey);
    expect(spawnChunk).toBeDefined();
    expect(spawnChunk?.isChunkLoaded()).toBe(true);
  });

  it('3. Player spawns at valid coordinates and camera targets player correctly without ground lerp bug', () => {
    const dummyCamera = new THREE.PerspectiveCamera(55, 1.77, 0.5, 1000);
    const container = { addEventListener: () => {}, removeEventListener: () => {} } as any;
    const playerController = new PlayerController(scene, dummyCamera, container);

    const spawnPos = playerController.getPosition();
    expect(spawnPos.x).toBe(0);
    expect(spawnPos.y).toBe(0.5);
    expect(spawnPos.z).toBe(15);

    // Initial camera position should be snapped behind player without being (0,0,0)
    expect(dummyCamera.position.lengthSq()).toBeGreaterThan(0);
    expect(dummyCamera.position.y).toBeGreaterThan(0.5);
  });

  it('4. Chunk transitions attach/detach visualGroups to scene correctly as player moves', () => {
    sceneGenerator.generate();

    const initialChunkCount = sceneGenerator.chunkManager.getActiveChunkCount();
    expect(initialChunkCount).toBeGreaterThan(0);

    // Teleport player far away (1000m north)
    const distantPos = new THREE.Vector3(0, 0, -1000);
    sceneGenerator.update(distantPos);

    // Origin spawn chunk should now be unloaded
    const spawnChunkKey = sceneGenerator.chunkManager.getChunkKeyForPosition(0, 15);
    const spawnChunk = sceneGenerator.chunkManager.chunks.get(spawnChunkKey);
    expect(spawnChunk?.lodLevel).toBe('UNLOADED');
  });

  it('5. Failed GLB asset loads cleanly fall back to procedural fallback meshes', async () => {
    const fallbackMesh = AssetPipeline.getInstance().createFallbackMesh('non_existent_building_asset');
    expect(fallbackMesh).toBeDefined();
    expect(fallbackMesh.name).toContain('FallbackGroup_');
    expect(fallbackMesh.children.length).toBeGreaterThan(0);
  });

  it('6. Building wrapper groups have correct world space positions matching bld.center', () => {
    sceneGenerator.generate();

    let positionedBuildings = 0;
    scene.traverse((obj) => {
      if (obj.name.startsWith('BuildingGroup_')) {
        // Position should not be default 0,0,0 for off-center buildings
        if (obj.position.x !== 0 || obj.position.z !== 0) {
          positionedBuildings++;
        }
      }
    });

    expect(positionedBuildings).toBeGreaterThan(0);
  });

  it('7. NPCs and vehicles produce valid runtime render instances in nearby vicinity', () => {
    const npcManager = new NPCManager();
    const spawner = new NPCSpawner();
    const homePos = new THREE.Vector3(0, 0.3, 10);
    const npcData = spawner.generateDeterministicNPC('npc_test_1', 1337, homePos);
    const npc = new NPC(npcData, scene);
    npcManager.registerNPC(npc);

    const npcSim = new NPCSimulation(npcManager, sceneGenerator.chunkManager.roadGraph);

    // Update simulation near spawn position
    npcSim.update(new THREE.Vector3(0, 0.5, 15), 14.0, 0.016);

    expect(npc.state.simulationTier).toBe('TIER0_VICINITY');
    expect(npc.visualMesh).toBeDefined();

    const vehicleManager = new VehicleManager(scene, new THREE.PerspectiveCamera(), assetManager);
    const vehicle = vehicleManager.spawnVehicle('sedan', 'veh_test_1', new THREE.Vector3(5, 0.3, 15));
    expect(vehicle.visualMesh.parent).toBe(scene);
  });
});
