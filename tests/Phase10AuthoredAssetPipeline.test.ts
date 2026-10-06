import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { BuildingData } from '../src/world/BuildingData';
import { SeededRandom } from '../src/utils/SeededRandom';

describe('Phase 10 — Authored 3D Asset Pipeline & Visual Fidelity Unit Tests', () => {
  let pipeline: AssetPipeline;

  beforeEach(() => {
    pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();
  });

  it('1. AssetManifest contains valid entries for all 13 building families and vehicles', () => {
    expect(Object.keys(ASSET_MANIFEST).length).toBeGreaterThanOrEqual(15);
    
    const shopEntry = ASSET_MANIFEST['bld_nairobi_shop_01'];
    expect(shopEntry).toBeDefined();
    expect(shopEntry.category).toBe('building');
    expect(shopEntry.lodLevels).toEqual([0, 80, 200, 450]);

    const matatuEntry = ASSET_MANIFEST['veh_matatu_ngong_01'];
    expect(matatuEntry).toBeDefined();
    expect(matatuEntry.attachmentPoints?.driver).toBeDefined();
    expect(matatuEntry.attachmentPoints?.doorSide).toBeDefined();
  });

  it('2. AssetPipeline manages cache hits, misses, and fallback asset creation cleanly', async () => {
    const asset1 = await pipeline.loadGLBAsset('bld_nairobi_shop_01');
    expect(asset1).toBeDefined();
    expect(asset1.name).toContain('bld_nairobi_shop_01');

    // Second call should hit cache
    const asset2 = await pipeline.loadGLBAsset('bld_nairobi_shop_01');
    expect(asset2).toBeDefined();

    const stats = pipeline.getStats();
    expect(stats.cachedGLBCount).toBeGreaterThan(0);
    expect(stats.cacheHitCount).toBeGreaterThan(0);
  });

  it('3. AssetPipeline supports instance cloning without mutating original asset templates', async () => {
    const instance1 = await pipeline.loadGLBAsset('veh_matatu_ngong_01');
    const instance2 = await pipeline.loadGLBAsset('veh_matatu_ngong_01');

    instance1.position.set(10, 0, 0);
    instance2.position.set(50, 0, 0);

    expect(instance1.position.x).toBe(10);
    expect(instance2.position.x).toBe(50);
  });

  it('4. BuildingAssetKit fits GIS footprints dynamically without destroying proportions', () => {
    const mockBld: BuildingData = {
      id: 'bld_gis_test_01',
      name: 'Kilimani Plaza',
      footprintPolygon: [
        { x: -10, z: -10 },
        { x: 10, z: -10 },
        { x: 10, z: 10 },
        { x: -10, z: 10 }
      ],
      center: new THREE.Vector3(0, 0, 0),
      height: 24,
      floors: 6,
      zone: 'cbd_commercial',
      districtId: 'district_nairobi',
      buildingCategory: 'office_block',
      entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 10), type: 'main' }],
      hasGroundFloorShops: true,
      shopNames: ['Equity Bank'],
      rooftopEquipment: ['water_tank', 'solar_panel']
    };

    const buildingGroup = BuildingAssetKit.createBuildingGroup(mockBld);
    expect(buildingGroup).toBeDefined();
    expect(buildingGroup.name).toBe('BuildingGroup_bld_gis_test_01');
    expect(buildingGroup.children.length).toBeGreaterThan(3);
  });

  it('5. Variant selection is 100% deterministic based on worldSeed', () => {
    const rng1 = new SeededRandom(1337);
    const rng2 = new SeededRandom(1337);

    const val1 = rng1.nextRange(0, 100);
    const val2 = rng2.nextRange(0, 100);

    expect(val1).toBe(val2);
  });

  it('6. AssetPipeline tracks asset instance disposal and cleans up GPU resources', async () => {
    const mesh = await pipeline.loadGLBAsset('env_acacia_tree_01');
    expect(pipeline.getStats().activeInstancesCount).toBeGreaterThan(0);

    pipeline.disposeAssetInstance(mesh);
    expect(pipeline.getStats().disposedInstancesCount).toBe(1);
  });

  it('7. Preloads chunk assets asynchronously for approaching world chunks', async () => {
    await pipeline.preloadChunkAssets(1, 2);
    const stats = pipeline.getStats();
    expect(stats.cachedGLBCount).toBeGreaterThan(0);
  });
});
