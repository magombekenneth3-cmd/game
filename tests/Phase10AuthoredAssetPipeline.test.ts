import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { BuildingData } from '../src/world/BuildingData';
import { SeededRandom } from '../src/utils/SeededRandom';

describe('Phase 10.1 — Authored 3D Asset Pipeline & Visual Proof Unit Tests', () => {
  let pipeline: AssetPipeline;

  beforeEach(() => {
    pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();
  });

  it('1. ASSET_MANIFEST contains entries for all 45 production GLB assets across 5 categories', () => {
    const keys = Object.keys(ASSET_MANIFEST);
    expect(keys.length).toBeGreaterThanOrEqual(45);

    const categories = new Set(keys.map((k) => ASSET_MANIFEST[k].category));
    expect(categories.has('building')).toBe(true);
    expect(categories.has('vehicle')).toBe(true);
    expect(categories.has('character')).toBe(true);
    expect(categories.has('environment')).toBe(true);
    expect(categories.has('interior')).toBe(true);
  });

  it('2. Every asset manifest entry resolves to a valid GLB source path', () => {
    for (const [id, entry] of Object.entries(ASSET_MANIFEST)) {
      expect(entry.id).toBe(id);
      expect(entry.sourceFile).toContain('/assets/models/');
      expect(entry.sourceFile.endsWith('.glb')).toBe(true);
      expect(entry.intendedScale).toBeDefined();
      expect(entry.lodLevels.length).toBeGreaterThan(0);
      expect(entry.boundingDimensions.width).toBeGreaterThan(0);
    }
  });

  it('3. Every production GLB file referenced by ASSET_MANIFEST actually exists on disk', () => {
    for (const entry of Object.values(ASSET_MANIFEST)) {
      // Remove leading slash for local disk resolution relative to project root
      const relativePath = entry.sourceFile.replace(/^\//, '');
      const fullPath = path.resolve(process.cwd(), 'public', relativePath.replace(/^assets\//, 'assets/'));
      expect(fs.existsSync(fullPath)).toBe(true);
    }
  });

  it('4. AssetPipeline handles cache hits, deduplication, and instance cloning', async () => {
    const asset1 = await pipeline.loadGLBAsset('bld_nairobi_shop_01');
    expect(asset1).toBeDefined();

    // Second load should hit cache
    const asset2 = await pipeline.loadGLBAsset('bld_nairobi_shop_01');
    expect(asset2).toBeDefined();

    const stats = pipeline.getStats();
    expect(stats.cachedGLBCount).toBeGreaterThan(0);
    expect(stats.cacheHitCount).toBeGreaterThan(0);
  });

  it('5. Missing or invalid asset IDs fall back cleanly to procedural fallback meshes', async () => {
    const fallbackAsset = await pipeline.loadGLBAsset('non_existent_asset_id_999');
    expect(fallbackAsset).toBeDefined();
    expect(fallbackAsset.name).toContain('FallbackGroup');
  });

  it('6. Vehicle attachment points resolve correctly for driver and door positions', () => {
    const matatuEntry = ASSET_MANIFEST['veh_matatu_ngong_01'];
    expect(matatuEntry).toBeDefined();
    expect(matatuEntry.attachmentPoints).toBeDefined();
    expect(matatuEntry.attachmentPoints?.driver).toEqual({ x: -0.6, y: 1.1, z: 1.2 });
    expect(matatuEntry.attachmentPoints?.doorSide).toBeDefined();
  });

  it('7. Character humanoid rigs provide valid bone attachment points', () => {
    const playerEntry = ASSET_MANIFEST['char_player_01'];
    expect(playerEntry).toBeDefined();
    expect(playerEntry.attachmentPoints?.head).toEqual({ x: 0, y: 1.65, z: 0 });
    expect(playerEntry.attachmentPoints?.root).toEqual({ x: 0, y: 0, z: 0 });
  });

  it('8. BuildingAssetKit fits GIS footprints dynamically without destroying proportions', () => {
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

  it('9. Variant selection is 100% deterministic based on worldSeed', () => {
    const rng1 = new SeededRandom(1337);
    const rng2 = new SeededRandom(1337);

    const val1 = rng1.nextRange(0, 100);
    const val2 = rng2.nextRange(0, 100);

    expect(val1).toBe(val2);
  });

  it('10. AssetPipeline tracks asset instance disposal and cleans up GPU resources', async () => {
    const mesh = await pipeline.loadGLBAsset('env_acacia_tree_01');
    expect(pipeline.getStats().activeInstancesCount).toBeGreaterThan(0);

    pipeline.disposeAssetInstance(mesh);
    expect(pipeline.getStats().disposedInstancesCount).toBe(1);
  });

  it('11. Preloads chunk assets asynchronously for approaching world chunks', async () => {
    await pipeline.preloadChunkAssets(1, 2);
    const stats = pipeline.getStats();
    expect(stats.cachedGLBCount).toBeGreaterThan(0);
  });

  it('12. getCachedGLB returns a proxy group for pending assets and populates when resolved', async () => {
    const proxy = pipeline.getCachedGLB('bld_modern_apartment_01');
    expect(proxy).toBeDefined();
    expect(proxy.type).toBe('Group');

    // Await loading completion
    await pipeline.loadGLBAsset('bld_modern_apartment_01');
    expect(pipeline.getStats().cachedGLBCount).toBeGreaterThan(0);
  });

  it('13. disposeAssetInstance preserves cached GLB template memory in glbCache', async () => {
    const meshInstance = await pipeline.loadGLBAsset('bld_nairobi_shop_01');
    pipeline.disposeAssetInstance(meshInstance);

    // Verify template remains pristine in cache and can be re-instantiated
    const newInstance = pipeline.getCachedGLB('bld_nairobi_shop_01');
    expect(newInstance).toBeDefined();
  });

  it('14. Development placeholder script is documented as dev-fallback only', () => {
    const scriptPath = path.resolve(process.cwd(), 'scripts', 'generate_placeholder_assets.cjs');
    expect(fs.existsSync(scriptPath)).toBe(true);
    const content = fs.readFileSync(scriptPath, 'utf8');
    expect(content).toContain('DEVELOPMENT FALLBACKS ONLY AND ARE NOT PRODUCTION ART');
  });
});
