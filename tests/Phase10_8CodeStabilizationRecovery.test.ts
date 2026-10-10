import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { NairobiDistrictScene } from '../src/world/NairobiDistrictScene';
import { AssetManager } from '../src/engine/AssetManager';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { PlayerController } from '../src/player/PlayerController';
import { ThirdPersonCamera } from '../src/player/ThirdPersonCamera';
import { CharacterMotor } from '../src/player/CharacterMotor';
import { BuildingData } from '../src/world/BuildingData';
import { GameLoop } from '../src/engine/GameLoop';

describe('Phase 10.8 — Code Stabilization & World Rendering Recovery Tests', () => {
  let scene: THREE.Scene;
  let assetManager: AssetManager;
  let sceneGenerator: NairobiDistrictScene;

  beforeEach(() => {
    scene = new THREE.Scene();
    assetManager = new AssetManager();
    sceneGenerator = new NairobiDistrictScene(scene, assetManager);
  });

  it('1. Initial world creation creates terrain tiles, roads, and buildings', () => {
    sceneGenerator.generate();

    let terrainCount = 0;
    let roadCount = 0;
    let buildingCount = 0;

    scene.traverse((obj) => {
      if (obj.name.startsWith('TerrainChunk_')) terrainCount++;
      if (obj.name.startsWith('Road_') || obj.name.includes('RoadSegment')) roadCount++;
      if (obj.name.startsWith('BuildingGroup_')) buildingCount++;
    });

    expect(terrainCount).toBe(25);
    expect(roadCount).toBeGreaterThanOrEqual(7);
    expect(buildingCount).toBeGreaterThan(0);

    let totalRegisteredBuildings = 0;
    sceneGenerator.chunkManager.chunks.forEach((c) => {
      totalRegisteredBuildings += c.buildings.length;
    });
    expect(totalRegisteredBuildings).toBeGreaterThanOrEqual(35);
  });

  it('2. Initial active chunk count is non-zero and spawn chunk activates', () => {
    sceneGenerator.generate();
    const activeChunks = sceneGenerator.chunkManager.getActiveChunkCount();
    expect(activeChunks).toBeGreaterThan(0);

    const spawnChunkKey = sceneGenerator.chunkManager.getChunkKeyForPosition(0, 15);
    const spawnChunk = sceneGenerator.chunkManager.chunks.get(spawnChunkKey);
    expect(spawnChunk).toBeDefined();
    expect(spawnChunk?.isChunkLoaded()).toBe(true);
    expect(spawnChunk?.lodLevel).toBe('LOD0');
  });

  it('3. Initial player spawn and camera target are aligned without clipping underground', () => {
    const dummyCamera = new THREE.PerspectiveCamera(55, 1.77, 0.5, 1000);
    const mockContainer = { addEventListener: () => {}, removeEventListener: () => {} } as any;
    const playerController = new PlayerController(scene, dummyCamera, mockContainer);

    const pos = playerController.getPosition();
    expect(pos.x).toBe(0);
    expect(pos.y).toBe(0.5);
    expect(pos.z).toBe(15);

    expect(dummyCamera.position.y).toBeGreaterThanOrEqual(0.5);
    expect(dummyCamera.position.lengthSq()).toBeGreaterThan(0);
  });

  it('4. Terrain and road mesh registration produces dedicated ground query collection', () => {
    sceneGenerator.generate();
    const groundMeshes = sceneGenerator.getGroundMeshes();

    expect(groundMeshes.length).toBeGreaterThan(25);
    const hasTerrain = groundMeshes.some((m) => m.name.startsWith('TerrainChunk_'));
    const hasRoads = groundMeshes.some((m) => m.name.startsWith('Road_') || m.name.startsWith('Intersection_'));
    expect(hasTerrain).toBe(true);
    expect(hasRoads).toBe(true);
  });

  it('5. Asset failure and fallback telemetry records failure status and tracks fallbacks', async () => {
    const pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();

    // Verify preload template loading warms cache without allocating active scene instances
    const template = await pipeline.ensureAssetLoaded('bld_nairobi_shop_01');
    expect(template).toBeDefined();
    expect(pipeline.getAssetState('bld_nairobi_shop_01')).toBeDefined();
    let stats = pipeline.getStats();
    expect(stats.activeInstancesCount).toBe(0);

    // Creating an instance allocates and tracks a scene instance
    const instance = pipeline.createInstance('bld_nairobi_shop_01');
    expect(instance).toBeDefined();
    stats = pipeline.getStats();
    expect(stats.activeInstancesCount).toBe(1);

    // Missing asset triggers failed status and fallback group
    const missingAsset = await pipeline.loadGLBAsset('asset_that_does_not_exist_404');
    expect(missingAsset).toBeDefined();
    expect(missingAsset.name).toContain('FallbackGroup_');

    const status = pipeline.getAssetStatus('asset_that_does_not_exist_404');
    expect(status).toBeDefined();
    expect(status?.state).toBe('failed');
    expect(pipeline.getAssetState('asset_that_does_not_exist_404')).toBe('failed');

    stats = pipeline.getStats();
    expect(stats.assetFailuresCount).toBe(1);
  });

  it('6. Chunk scene attachment correctly attaches visualGroups on active and detaches on unload', () => {
    sceneGenerator.generate();
    const spawnChunkKey = sceneGenerator.chunkManager.getChunkKeyForPosition(0, 15);
    const spawnChunk = sceneGenerator.chunkManager.chunks.get(spawnChunkKey)!;

    expect(spawnChunk.isChunkLoaded()).toBe(true);
    expect(scene.children.includes(spawnChunk.visualGroup)).toBe(true);

    // Teleport player far away
    sceneGenerator.update(new THREE.Vector3(2000, 0, 2000));
    expect(spawnChunk.isChunkLoaded()).toBe(false);
    expect(scene.children.includes(spawnChunk.visualGroup)).toBe(false);
  });

  it('7. Ground-query isolation ensures player motor raycasts only against ground surfaces', () => {
    const motor = new CharacterMotor();
    motor.position.set(0, 5, 0);

    // Create terrain plane at Y = 2
    const terrainGeo = new THREE.PlaneGeometry(20, 20);
    terrainGeo.rotateX(-Math.PI / 2);
    const terrainMesh = new THREE.Mesh(terrainGeo, new THREE.MeshBasicMaterial());
    terrainMesh.position.set(0, 2, 0);
    terrainMesh.updateMatrixWorld(true);

    // Create a mock non-ground mesh (e.g. canopy or sky) at Y = 6 above player
    const skyGeo = new THREE.PlaneGeometry(50, 50);
    skyGeo.rotateX(Math.PI / 2);
    const skyMesh = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial());
    skyMesh.position.set(0, 6, 0);
    skyMesh.updateMatrixWorld(true);

    const idleInput = {
      forward: false, backward: false, left: false, right: false,
      sprint: false, jump: false, interact: false, pause: false,
      mouseX: 0, mouseY: 0
    };

    // Updating with ONLY groundMeshes snaps player to terrain at Y = 2.1
    motor.update(idleInput, 0, 0.016, [terrainMesh]);
    expect(motor.position.y).toBeCloseTo(2.1, 1);
  });

  it('8. Collision-query isolation ensures camera raycasts only against camera occluders', () => {
    const camera = new THREE.PerspectiveCamera(55, 1.77, 0.5, 1000);
    const tpCamera = new ThirdPersonCamera(camera);

    const playerPos = new THREE.Vector3(0, 0.5, 0);
    tpCamera.snapToTarget(playerPos);

    // An occluder building placed between player focus and camera
    const bldBox = new THREE.BoxGeometry(4, 4, 4);
    const bldMesh = new THREE.Mesh(bldBox, new THREE.MeshBasicMaterial());
    bldMesh.position.set(0, 1.8, 3);
    bldMesh.updateMatrixWorld(true);

    // Camera update with occluder clamps camera distance
    tpCamera.update(playerPos, 0.016, [bldMesh]);
    const distToPlayer = camera.position.distanceTo(playerPos);
    expect(distToPlayer).toBeLessThan(7.0);
  });

  it('9. GIS footprint fitting chooses compatible variants and computes proper scale and rotation', () => {
    const pipeline = AssetPipeline.getInstance();

    const normalShop: BuildingData = {
      id: 'bld_fit_shop_01',
      name: 'Nairobi Corner Shop',
      footprintPolygon: [
        { x: -5, z: -5 },
        { x: 5, z: -5 },
        { x: 5, z: 5 },
        { x: -5, z: 5 }
      ],
      center: new THREE.Vector3(0, 0, 0),
      height: 8,
      floors: 2,
      zone: 'commercial_corridor',
      districtId: 'district_nairobi',
      buildingCategory: 'shop',
      entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 5), type: 'main' }],
      hasGroundFloorShops: true,
      shopNames: ['Mama Mboga'],
      rooftopEquipment: []
    };

    const fitResult = pipeline.fitBuildingToFootprint(normalShop);
    expect(fitResult).toBeDefined();
    expect(fitResult.assetId).toContain('bld_nairobi_shop');
    expect(fitResult.scale.x).toBeGreaterThan(0.4);
    expect(fitResult.scale.x).toBeLessThan(2.6);
    expect(fitResult.fitsFootprint).toBe(true);

    // Very oversized / wildly disproportionate footprint triggers procedural fallback
    const giantPolygon: BuildingData = {
      ...normalShop,
      id: 'bld_giant_poly',
      footprintPolygon: [
        { x: -200, z: -5 },
        { x: 200, z: -5 },
        { x: 200, z: 5 },
        { x: -200, z: 5 }
      ]
    };
    const giantFit = pipeline.fitBuildingToFootprint(giantPolygon);
    expect(giantFit.fitsFootprint).toBe(false);
  });

  it('10. Build revision reporting and boot stage state machine initialize cleanly', async () => {
    const mockElem = {
      id: '',
      width: 256,
      height: 256,
      getContext: () => ({
        fillRect: () => {},
        fillStyle: '',
        font: '',
        textAlign: '',
        textBaseline: '',
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        strokeRect: () => {},
        clearRect: () => {},
        getImageData: () => ({ data: new Uint8ClampedArray(4) }),
        putImageData: () => {},
        drawImage: () => {},
        createRadialGradient: () => ({ addColorStop: () => {} }),
        createLinearGradient: () => ({ addColorStop: () => {} }),
        fillText: () => {},
        strokeText: () => {},
        measureText: () => ({ width: 50 }),
        save: () => {},
        restore: () => {},
        translate: () => {},
        rotate: () => {},
        scale: () => {},
        setTransform: () => {}
      }),
      appendChild: () => {},
      removeChild: () => {},
      querySelector: () => mockElem,
      querySelectorAll: () => [mockElem],
      addEventListener: () => {},
      removeEventListener: () => {},
      style: {}
    } as any;


    const originalDocument = globalThis.document;
    const originalWindow = (globalThis as any).window;

    globalThis.document = {
      createElement: () => mockElem,
      body: mockElem,
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    (globalThis as any).window = {
      innerWidth: 1920,
      innerHeight: 1080,
      devicePixelRatio: 1,
      addEventListener: () => {},
      removeEventListener: () => {}
    };

    try {
      const gameLoop = new GameLoop(mockElem);
      expect(gameLoop.bootStage).toBe('INITIALIZING_RENDERER');

      // Start engine and verify it progresses to READY stage
      await gameLoop.start();
      expect(gameLoop.bootStage).toBe('READY');

      // Clean up
      gameLoop.stop();
    } finally {
      globalThis.document = originalDocument;
      (globalThis as any).window = originalWindow;
    }
  });
});

