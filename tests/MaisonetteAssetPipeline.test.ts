import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { BuildingData } from '../src/world/BuildingData';

describe('Phase 12.2 — Production-Ready Kenyan Maisonette & Architecture Pipeline Tests', () => {
  let pipeline: AssetPipeline;

  beforeEach(() => {
    pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();
  });

  describe('1. Asset Registration & Canonical Identification', () => {
    it('registers bld_maisonette_01 canonically in ASSET_MANIFEST with correct properties', () => {
      const entry = ASSET_MANIFEST['bld_maisonette_01'];
      expect(entry).toBeDefined();
      expect(entry.id).toBe('bld_maisonette_01');
      expect(entry.category).toBe('building');
      expect(entry.variantFamily).toBe('kenyan_maisonette');
      expect(entry.sourceFile).toBe('/assets/models/buildings/bld_maisonette_01.glb');
      expect(entry.intendedScale).toEqual(new THREE.Vector3(1.0, 1.0, 1.0));
      expect(entry.boundingDimensions).toEqual({ width: 10.0, height: 9.5, depth: 12.0 });
      expect(entry.license).toContain('CC-BY 4.0');
      expect(entry.fallbackAssetId).toBe('fallback_bld_maisonette');
    });

    it('defines attachment sockets for entrance, porch, and upper-floor balcony', () => {
      const entry = ASSET_MANIFEST['bld_maisonette_01'];
      expect(entry.attachmentPoints).toBeDefined();
      expect(entry.attachmentPoints?.entrance).toEqual({ x: 0, y: 0.25, z: 4.8 });
      expect(entry.attachmentPoints?.porch).toEqual({ x: 0, y: 0.0, z: 6.2 });
      expect(entry.attachmentPoints?.balcony).toEqual({ x: 0, y: 3.65, z: 5.8 });
    });
  });

  describe('2. Model Existence and Disk Integrity', () => {
    it('verifies that bld_maisonette_01.glb exists on disk and is non-empty', () => {
      const glbPath = path.resolve(process.cwd(), 'public/assets/models/buildings/bld_maisonette_01.glb');
      expect(fs.existsSync(glbPath)).toBe(true);
      const stat = fs.statSync(glbPath);
      expect(stat.size).toBeGreaterThan(50 * 1024); // Rich model (> 50KB)
    });
  });

  describe('3. Model Hierarchy, Balcony Features, Collision, and LOD Switching', () => {
    it('loads bld_maisonette_01 and validates two-storey hierarchy with balcony and sockets', async () => {
      const maisonetteGroup = await pipeline.loadGLBAsset('bld_maisonette_01');
      expect(maisonetteGroup).toBeDefined();

      // Check LOD nodes
      const lod0 = maisonetteGroup.getObjectByName('Geo_LOD0');
      const lod1 = maisonetteGroup.getObjectByName('Geo_LOD1');
      expect(lod0).toBeDefined();
      expect(lod1).toBeDefined();

      // Check 2-storey balcony and doors
      const balcony = maisonetteGroup.getObjectByName('Maisonette_BalconySlab');
      const balconyDoors = maisonetteGroup.getObjectByName('Maisonette_BalconyDoors');
      expect(balcony).toBeDefined();
      expect(balconyDoors).toBeDefined();

      // Check physics collision node
      const colMesh = maisonetteGroup.getObjectByName('Col_Building');
      expect(colMesh).toBeDefined();

      // Check attachment sockets
      const socketEntrance = maisonetteGroup.getObjectByName('Socket_Entrance');
      const socketPorch = maisonetteGroup.getObjectByName('Socket_Porch');
      const socketBalcony = maisonetteGroup.getObjectByName('Socket_Balcony');
      expect(socketEntrance).toBeDefined();
      expect(socketPorch).toBeDefined();
      expect(socketBalcony).toBeDefined();
    });

    it('ensures Col_Building collision mesh is strictly invisible during visual rendering', async () => {
      const maisonetteGroup = await pipeline.loadGLBAsset('bld_maisonette_01');
      const colMesh = maisonetteGroup.getObjectByName('Col_Building') as THREE.Mesh;
      expect(colMesh).toBeDefined();
      expect(colMesh.visible).toBe(false);
      expect(colMesh.castShadow).toBe(false);
      expect(colMesh.receiveShadow).toBe(false);
    });

    it('extracts collision proxy from Col_Building reflecting 2-storey height in WorldChunkManager', () => {
      const scene = new THREE.Scene();
      const chunkManager = new WorldChunkManager(scene);

      const mockGroup = new THREE.Group();
      const colBox = new THREE.Mesh(
        new THREE.BoxGeometry(10.0, 9.5, 12.0),
        new THREE.MeshBasicMaterial()
      );
      colBox.name = 'Col_Building';
      colBox.position.set(0, 4.75, 0);
      mockGroup.add(colBox);

      const bldData: BuildingData = {
        id: 'test_maisonette_col',
        name: 'Test Maisonette',
        footprintPolygon: [{ x: -5, z: -6 }, { x: 5, z: -6 }, { x: 5, z: 6 }, { x: -5, z: 6 }],
        center: new THREE.Vector3(30, 0, 30),
        height: 9.5,
        floors: 2,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(30, 0, 36), type: 'main' }],
        hasGroundFloorShops: false
      };

      chunkManager.registerBuildingToChunk(bldData, mockGroup);

      const chunk = chunkManager.getOrCreateChunk(0, 0);
      expect(chunk.collisionProxies.length).toBeGreaterThan(0);
      const proxy = chunk.collisionProxies[0];
      expect(proxy.max.y - proxy.min.y).toBeCloseTo(9.5, 1);
    });

    it('switches between Geo_LOD0 and Geo_LOD1 across distance tiers while keeping Col_* hidden', async () => {
      await pipeline.ensureAssetLoaded('bld_maisonette_01');
      const maisonetteInstance = pipeline.createInstance('bld_maisonette_01');

      // Test close view (LOD0)
      pipeline.setInstanceLOD(maisonetteInstance, 'LOD0');
      const lod0 = maisonetteInstance.getObjectByName('Geo_LOD0');
      const lod1 = maisonetteInstance.getObjectByName('Geo_LOD1');
      const col = maisonetteInstance.getObjectByName('Col_Building');

      expect(lod0).toBeDefined();
      expect(lod1).toBeDefined();
      expect(lod0?.visible).toBe(true);
      expect(lod1?.visible).toBe(false);
      expect(col?.visible).toBe(false);

      // Test distance view (LOD1)
      pipeline.setInstanceLOD(maisonetteInstance, 'LOD1');
      expect(lod0?.visible).toBe(false);
      expect(lod1?.visible).toBe(true);
      expect(col?.visible).toBe(false);

      // Test far view (LOD2)
      pipeline.setInstanceLOD(maisonetteInstance, 'LOD2');
      expect(lod0?.visible).toBe(false);
      expect(lod1?.visible).toBe(true);
      expect(col?.visible).toBe(false);
    });
  });

  describe('4. Residential Selection & Proportion Preservation (No Non-Uniform Stretching)', () => {
    it('selects bld_maisonette_01 for 2-storey residential parcels and preserves strictly uniform scale', () => {
      const maisonettePlot: BuildingData = {
        id: 'residential_plot_maisonette_01',
        name: 'Kilimani Dennis Pritt Maisonette',
        footprintPolygon: [
          { x: -8, z: -9 },
          { x: 8, z: -9 },
          { x: 8, z: 9 },
          { x: -8, z: 9 }
        ],
        center: new THREE.Vector3(-78, 0, 85),
        height: 9.5,
        floors: 2,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(-78, 0, 94), type: 'main' }],
        hasGroundFloorShops: false
      };

      const fit = pipeline.fitBuildingToFootprint(maisonettePlot);
      expect(fit.assetId).toBe('bld_maisonette_01');
      expect(fit.fitsFootprint).toBe(true);

      // CRITICAL: Scale must be strictly uniform to preserve building proportions (no stretching)
      expect(fit.scale.x).toBe(fit.scale.y);
      expect(fit.scale.y).toBe(fit.scale.z);
      expect(fit.scale.x).toBeCloseTo(1.0, 2);
    });

    it('correctly discriminates between 1-storey bungalow and 2-storey maisonette residential parcels', () => {
      const singleStoreyPlot: BuildingData = {
        id: 'plot_single_storey',
        name: 'Single Storey Home',
        footprintPolygon: [{ x: -7, z: -8 }, { x: 7, z: -8 }, { x: 7, z: 8 }, { x: -7, z: 8 }],
        center: new THREE.Vector3(0, 0, 0),
        height: 6.2,
        floors: 1,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 8), type: 'main' }],
        hasGroundFloorShops: false
      };

      const twoStoreyPlot: BuildingData = {
        id: 'plot_two_storey',
        name: 'Two Storey Home',
        footprintPolygon: [{ x: -7, z: -8 }, { x: 7, z: -8 }, { x: 7, z: 8 }, { x: -7, z: 8 }],
        center: new THREE.Vector3(0, 0, 0),
        height: 9.5,
        floors: 2,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 8), type: 'main' }],
        hasGroundFloorShops: false
      };

      const fit1 = pipeline.fitBuildingToFootprint(singleStoreyPlot);
      const fit2 = pipeline.fitBuildingToFootprint(twoStoreyPlot);

      expect(fit1.assetId).toBe('bld_bungalow_01');
      expect(fit2.assetId).toBe('bld_maisonette_01');
    });

    it('does not select residential assets for commercial shops or offices', () => {
      const shopPlot: BuildingData = {
        id: 'commercial_shop_plot',
        name: 'Kenyatta Ave Retail Shop',
        footprintPolygon: [{ x: -5, z: -5 }, { x: 5, z: -5 }, { x: 5, z: 5 }, { x: -5, z: 5 }],
        center: new THREE.Vector3(10, 0, 10),
        height: 8.0,
        floors: 2,
        zone: 'commercial_corridor',
        districtId: 'district_nairobi',
        buildingCategory: 'shop',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(10, 0, 15), type: 'main' }],
        hasGroundFloorShops: true
      };

      const officePlot: BuildingData = {
        id: 'commercial_office_plot',
        name: 'Upper Hill Office Building',
        footprintPolygon: [{ x: -10, z: -10 }, { x: 10, z: -10 }, { x: 10, z: 10 }, { x: -10, z: 10 }],
        center: new THREE.Vector3(50, 0, 50),
        height: 25.0,
        floors: 7,
        zone: 'commercial_corridor',
        districtId: 'district_nairobi',
        buildingCategory: 'office_block',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(50, 0, 60), type: 'main' }],
        hasGroundFloorShops: false
      };

      const shopFit = pipeline.fitBuildingToFootprint(shopPlot);
      const officeFit = pipeline.fitBuildingToFootprint(officePlot);

      expect(shopFit.assetId).not.toBe('bld_maisonette_01');
      expect(shopFit.assetId).not.toBe('bld_bungalow_01');
      expect(officeFit.assetId).not.toBe('bld_maisonette_01');
      expect(officeFit.assetId).not.toBe('bld_bungalow_01');
    });

    it('attaches compound perimeter wall for large residential parcels without stretching the maisonette', () => {
      const largeMaisonettePlot: BuildingData = {
        id: 'residential_plot_large_maisonette',
        name: 'Gated Maisonette Compound',
        footprintPolygon: [
          { x: -12, z: -14 },
          { x: 12, z: -14 },
          { x: 12, z: 14 },
          { x: -12, z: 14 }
        ],
        center: new THREE.Vector3(0, 0, 0),
        height: 9.5,
        floors: 2,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 14), type: 'main' }],
        hasGroundFloorShops: false
      };

      const buildingMesh = pipeline.getBuildingMesh(largeMaisonettePlot);
      expect(buildingMesh).toBeDefined();

      const compound = buildingMesh.getObjectByName('Compound_Perimeter_residential_plot_large_maisonette');
      expect(compound).toBeDefined();

      const gate = compound?.getObjectByName('Detail_CompoundSecurityGate_residential_plot_large_maisonette');
      expect(gate).toBeDefined();
    });
  });

  describe('5. Fallback Mesh Compatibility', () => {
    it('creates authentic procedural 2-storey maisonette fallback with balcony if GLB fails', () => {
      const fallback = pipeline.createFallbackMesh('bld_maisonette_01');
      expect(fallback).toBeDefined();
      expect(fallback.name).toContain('fallback_bld_maisonette');

      const roof = fallback.getObjectByName('Detail_ResidentialPitchedRoof_fallback_bld_maisonette_01');
      expect(roof).toBeDefined();

      const balcony = fallback.getObjectByName('Detail_MaisonetteBalcony_fallback_bld_maisonette_01');
      expect(balcony).toBeDefined();

      const balustrade = fallback.getObjectByName('Detail_MaisonetteBalustrade_fallback_bld_maisonette_01');
      expect(balustrade).toBeDefined();

      const gate = fallback.getObjectByName('Detail_CompoundSecurityGate_fallback_bld_maisonette_01');
      expect(gate).toBeDefined();
    });
  });
});
