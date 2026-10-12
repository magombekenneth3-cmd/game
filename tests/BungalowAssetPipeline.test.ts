import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import fs from 'fs';
import path from 'path';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { BuildingData } from '../src/world/BuildingData';

describe('Phase 12.1 — Production-Ready Kenyan Bungalow & Blender Asset Pipeline Tests', () => {
  let pipeline: AssetPipeline;

  beforeEach(() => {
    pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();
  });

  describe('1. Asset Registration & Canonical Identification', () => {
    it('registers bld_bungalow_01 canonically in ASSET_MANIFEST with correct properties', () => {
      const entry = ASSET_MANIFEST['bld_bungalow_01'];
      expect(entry).toBeDefined();
      expect(entry.id).toBe('bld_bungalow_01');
      expect(entry.category).toBe('building');
      expect(entry.variantFamily).toBe('kenyan_bungalow');
      expect(entry.sourceFile).toBe('/assets/models/buildings/bld_bungalow_01.glb');
      expect(entry.intendedScale).toEqual(new THREE.Vector3(1.0, 1.0, 1.0));
      expect(entry.boundingDimensions).toEqual({ width: 12.0, height: 6.2, depth: 14.0 });
      expect(entry.license).toContain('CC-BY 4.0');
      expect(entry.fallbackAssetId).toBe('fallback_bld_bungalow');
    });

    it('defines attachment sockets for entrance and veranda porch', () => {
      const entry = ASSET_MANIFEST['bld_bungalow_01'];
      expect(entry.attachmentPoints).toBeDefined();
      expect(entry.attachmentPoints?.entrance).toEqual({ x: 0, y: 0.25, z: 5.0 });
      expect(entry.attachmentPoints?.porch).toEqual({ x: 0, y: 0.0, z: 7.35 });
    });
  });

  describe('2. Model Existence and Disk Integrity', () => {
    it('verifies that bld_bungalow_01.glb exists on disk and is non-empty', () => {
      const glbPath = path.resolve(process.cwd(), 'public/assets/models/buildings/bld_bungalow_01.glb');
      expect(fs.existsSync(glbPath)).toBe(true);
      const stat = fs.statSync(glbPath);
      expect(stat.size).toBeGreaterThan(50 * 1024); // Model is rich with meshes (> 50KB)
    });
  });

  describe('3. Model Hierarchy, Collision Support, and LOD Switching', () => {
    it('loads bld_bungalow_01 and validates semantic node hierarchy', async () => {
      const bungalowGroup = await pipeline.loadGLBAsset('bld_bungalow_01');
      expect(bungalowGroup).toBeDefined();

      // Check LOD nodes
      const lod0 = bungalowGroup.getObjectByName('Geo_LOD0');
      const lod1 = bungalowGroup.getObjectByName('Geo_LOD1');
      expect(lod0).toBeDefined();
      expect(lod1).toBeDefined();

      // Check physics collision node
      const colMesh = bungalowGroup.getObjectByName('Col_Building');
      expect(colMesh).toBeDefined();

      // Check sockets
      const socketEntrance = bungalowGroup.getObjectByName('Socket_Entrance');
      const socketPorch = bungalowGroup.getObjectByName('Socket_Porch');
      expect(socketEntrance).toBeDefined();
      expect(socketPorch).toBeDefined();
    });

    it('ensures Col_Building collision mesh is strictly invisible during visual rendering', async () => {
      const bungalowGroup = await pipeline.loadGLBAsset('bld_bungalow_01');
      const colMesh = bungalowGroup.getObjectByName('Col_Building') as THREE.Mesh;
      expect(colMesh).toBeDefined();
      expect(colMesh.visible).toBe(false);
      expect(colMesh.castShadow).toBe(false);
      expect(colMesh.receiveShadow).toBe(false);
    });

    it('extracts collision proxy from Col_Building instead of visual adornments in WorldChunkManager', () => {
      const scene = new THREE.Scene();
      const chunkManager = new WorldChunkManager(scene);

      // Create a mock bungalow group with explicit Col_Building
      const mockBldGroup = new THREE.Group();
      const colBox = new THREE.Mesh(
        new THREE.BoxGeometry(12.0, 6.2, 14.0),
        new THREE.MeshBasicMaterial()
      );
      colBox.name = 'Col_Building';
      colBox.position.set(0, 3.1, 0);
      mockBldGroup.add(colBox);

      // Add visual mesh that extends farther (e.g. an antenna up to Y = 15)
      const visualAntenna = new THREE.Mesh(new THREE.BoxGeometry(0.2, 10, 0.2), new THREE.MeshBasicMaterial());
      visualAntenna.position.set(0, 10, 0);
      mockBldGroup.add(visualAntenna);

      const bldData: BuildingData = {
        id: 'test_bungalow_col',
        name: 'Test Bungalow',
        footprintPolygon: [{ x: -6, z: -7 }, { x: 6, z: -7 }, { x: 6, z: 7 }, { x: -6, z: 7 }],
        center: new THREE.Vector3(20, 0, 20),
        height: 6.2,
        floors: 1,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(20, 0, 27), type: 'main' }],
        hasGroundFloorShops: false
      };

      chunkManager.registerBuildingToChunk(bldData, mockBldGroup);

      const chunk = chunkManager.getOrCreateChunk(0, 0);
      expect(chunk.collisionProxies.length).toBeGreaterThan(0);
      const proxy = chunk.collisionProxies[0];
      // Collision height should reflect Col_Building (6.2m), not the visual antenna (15m)
      expect(proxy.max.y - proxy.min.y).toBeCloseTo(6.2, 1);
    });

    it('switches between Geo_LOD0 and Geo_LOD1 across distance tiers while keeping Col_* hidden', async () => {
      await pipeline.ensureAssetLoaded('bld_bungalow_01');
      const bungalowInstance = pipeline.createInstance('bld_bungalow_01');

      // Test close view (LOD0)
      pipeline.setInstanceLOD(bungalowInstance, 'LOD0');
      const lod0 = bungalowInstance.getObjectByName('Geo_LOD0');
      const lod1 = bungalowInstance.getObjectByName('Geo_LOD1');
      const col = bungalowInstance.getObjectByName('Col_Building');

      expect(lod0).toBeDefined();
      expect(lod1).toBeDefined();
      expect(lod0?.visible).toBe(true);
      expect(lod1?.visible).toBe(false);
      expect(col?.visible).toBe(false);

      // Test distance view (LOD1)
      pipeline.setInstanceLOD(bungalowInstance, 'LOD1');
      expect(lod0?.visible).toBe(false);
      expect(lod1?.visible).toBe(true);
      expect(col?.visible).toBe(false);

      // Test far view (LOD2)
      pipeline.setInstanceLOD(bungalowInstance, 'LOD2');
      expect(lod0?.visible).toBe(false);
      expect(lod1?.visible).toBe(true);
      expect(col?.visible).toBe(false);
    });
  });

  describe('4. Footprint Fitting & Proportion Preservation (No Non-Uniform Stretching)', () => {
    it('selects bld_bungalow_01 for residential parcels and preserves strictly uniform 1:1 scale', () => {
      const residentialPlot: BuildingData = {
        id: 'residential_plot_kilimani_01',
        name: 'Kilimani Green Compound',
        footprintPolygon: [
          { x: -9, z: -10 },
          { x: 9, z: -10 },
          { x: 9, z: 10 },
          { x: -9, z: 10 }
        ],
        center: new THREE.Vector3(-45, 0, 85),
        height: 6.2,
        floors: 1,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(-45, 0, 95), type: 'main' }],
        hasGroundFloorShops: false
      };

      const fit = pipeline.fitBuildingToFootprint(residentialPlot);
      expect(fit.assetId).toBe('bld_bungalow_01');
      expect(fit.fitsFootprint).toBe(true);

      // CRITICAL: Scale must be strictly uniform to preserve building proportions (no stretching)
      expect(fit.scale.x).toBe(fit.scale.y);
      expect(fit.scale.y).toBe(fit.scale.z);
      expect(fit.scale.x).toBeCloseTo(1.0, 2);
    });

    it('attaches compound perimeter wall for large residential parcels without stretching the house', () => {
      const largeResidentialPlot: BuildingData = {
        id: 'residential_plot_large',
        name: 'Gated Bungalow Compound',
        footprintPolygon: [
          { x: -12, z: -14 },
          { x: 12, z: -14 },
          { x: 12, z: 14 },
          { x: -12, z: 14 }
        ],
        center: new THREE.Vector3(0, 0, 0),
        height: 6.2,
        floors: 1,
        zone: 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: 'residential_house',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 14), type: 'main' }],
        hasGroundFloorShops: false
      };

      const buildingMesh = pipeline.getBuildingMesh(largeResidentialPlot);
      expect(buildingMesh).toBeDefined();

      // Compound wall and gate should be attached as modular child
      const compound = buildingMesh.getObjectByName('Compound_Perimeter_residential_plot_large');
      expect(compound).toBeDefined();

      const gate = compound?.getObjectByName('Detail_CompoundSecurityGate_residential_plot_large');
      expect(gate).toBeDefined();
    });
  });

  describe('5. Fallback Mesh Compatibility', () => {
    it('creates authentic procedural bungalow fallback if GLB asset fails to load', () => {
      const fallback = pipeline.createFallbackMesh('bld_bungalow_01');
      expect(fallback).toBeDefined();
      expect(fallback.name).toContain('fallback_bld_bungalow');

      // Fallback includes pitched roof, porch, and burglar grilles
      const roof = fallback.getObjectByName('Detail_ResidentialPitchedRoof_fallback_bld_bungalow_01');
      expect(roof).toBeDefined();

      const gate = fallback.getObjectByName('Detail_CompoundSecurityGate_fallback_bld_bungalow_01');
      expect(gate).toBeDefined();
    });
  });
});
