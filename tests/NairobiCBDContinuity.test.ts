import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AssetManager } from '../src/engine/AssetManager';
import { CBDShowcaseBlock } from '../src/world/CBDShowcaseBlock';
import { CBDAdjacentCommercialBlock } from '../src/world/CBDAdjacentCommercialBlock';
import { verifyBlockSeamContinuity } from '../src/world/UrbanLayout';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { NairobiDistrictScene } from '../src/world/NairobiDistrictScene';

describe('Phase 11.5 — Nairobi CBD District Continuity Tests', () => {
  let assetManager: AssetManager;
  let scene: THREE.Scene;

  beforeEach(() => {
    assetManager = new AssetManager();
    scene = new THREE.Scene();
  });

  describe('1. Block Seam Boundary Alignment & Spatial Continuity', () => {
    it('verifies exact seam continuity at Z = 55 between showcase block and adjacent block', () => {
      const showcaseBlock = new CBDShowcaseBlock(scene, assetManager);
      const adjacentBlock = new CBDAdjacentCommercialBlock(scene, assetManager);

      const northBoundary = showcaseBlock.getBoundary();
      const southBoundary = adjacentBlock.getBoundary();

      expect(northBoundary.zMax).toBe(55);
      expect(southBoundary.zMin).toBe(55);

      const result = verifyBlockSeamContinuity(northBoundary, southBoundary);
      expect(result.continuous).toBe(true);
      expect(result.issues).toEqual([]);
    });

    it('ensures Cabro promenade elevations and widths match across the seam', () => {
      const showcaseBlock = new CBDShowcaseBlock(scene, assetManager);
      const adjacentBlock = new CBDAdjacentCommercialBlock(scene, assetManager);

      const north = showcaseBlock.getBoundary();
      const south = adjacentBlock.getBoundary();

      // Carriageway width
      expect(north.carriagewayWidth).toBe(14.6);
      expect(south.carriagewayWidth).toBe(14.6);

      // West Promenade
      expect(north.westPromenade.elevation).toBe(0.20);
      expect(south.westPromenade.elevation).toBe(0.20);
      expect(north.westPromenade.xMin).toBe(-26);
      expect(south.westPromenade.xMin).toBe(-26);
      expect(north.westPromenade.xMax).toBe(-7.3);
      expect(south.westPromenade.xMax).toBe(-7.3);

      // East Promenade
      expect(north.eastPromenade.elevation).toBe(0.20);
      expect(south.eastPromenade.elevation).toBe(0.20);
      expect(north.eastPromenade.xMin).toBe(7.3);
      expect(south.eastPromenade.xMin).toBe(7.3);
      expect(north.eastPromenade.xMax).toBe(26);
      expect(south.eastPromenade.xMax).toBe(26);
    });
  });

  describe('2. Adjacent Commercial Block Generation & Architecture', () => {
    it('generates 8 varied multistory commercial buildings with authentic shopfronts', () => {
      const adjacentBlock = new CBDAdjacentCommercialBlock(scene, assetManager);
      const { buildings, group } = adjacentBlock.generate();

      expect(buildings.length).toBe(8);
      expect(group.children.length).toBeGreaterThan(15);

      const westBuildings = buildings.filter((b) => b.center.x < 0);
      const eastBuildings = buildings.filter((b) => b.center.x > 0);
      expect(westBuildings.length).toBe(4);
      expect(eastBuildings.length).toBe(4);

      // Check height variation
      const heights = buildings.map((b) => b.height);
      const minHeight = Math.min(...heights);
      const maxHeight = Math.max(...heights);
      expect(minHeight).toBe(18); // 5-story City Market suites
      expect(maxHeight).toBe(54); // 16-story Kenya Re Plaza

      // Check ground floor shops and authentic signage
      buildings.forEach((bld) => {
        expect(bld.hasGroundFloorShops).toBe(true);
        expect(bld.shopNames && bld.shopNames.length).toBeGreaterThanOrEqual(2);
        expect(bld.entrances.length).toBeGreaterThan(0);
        expect(bld.rooftopEquipment && bld.rooftopEquipment.length).toBeGreaterThan(0);
      });

      // Verify specific iconic Nairobi institutions
      const jubilee = buildings.find((b) => b.id === 'cbd_bld_w4');
      expect(jubilee?.name).toContain('Jubilee Insurance');
      expect(jubilee?.shopNames).toContain('Artcaffe Coffee & Bakery');

      const kenyaRe = buildings.find((b) => b.id === 'cbd_bld_w5');
      expect(kenyaRe?.name).toContain('Kenya Re Plaza');
      expect(kenyaRe?.shopNames).toContain('KCB Bank Premium Branch');

      const kencom = buildings.find((b) => b.id === 'cbd_bld_e4');
      expect(kencom?.name).toContain('Kencom Commercial Chambers');
      expect(kencom?.shopNames).toContain('Naivas Foodmarket Express');
    });

    it('generates continuous Cabro promenades, asphalt road, and curbs in the scene group', () => {
      const adjacentBlock = new CBDAdjacentCommercialBlock(scene, assetManager);
      const { group } = adjacentBlock.generate();

      const westPromenade = group.getObjectByName('CBD_Adjacent_Promenade_West');
      const eastPromenade = group.getObjectByName('CBD_Adjacent_Promenade_East');
      const road = group.getObjectByName('CBD_Adjacent_Carriageway');
      const westCurb = group.getObjectByName('CBD_Adjacent_Curb_West');
      const eastCurb = group.getObjectByName('CBD_Adjacent_Curb_East');

      expect(westPromenade).toBeDefined();
      expect(eastPromenade).toBeDefined();
      expect(road).toBeDefined();
      expect(westCurb).toBeDefined();
      expect(eastCurb).toBeDefined();
    });
  });

  describe('3. Traffic Infrastructure & Street Furniture', () => {
    it('creates boundary and mid-block zebra crosswalks, traffic signals, and street signs', () => {
      const adjacentBlock = new CBDAdjacentCommercialBlock(scene, assetManager);
      const { group } = adjacentBlock.generate();

      // Street Trees in iron grates (10 trees total)
      const trees = group.children.filter((c) => c.name.includes('TreeInPaving'));
      expect(trees.length).toBe(10);

      // Traffic light signals (4 signals total: 2 at Z=57, 2 at Z=95)
      const trafficLights = group.children.filter((c) => c.name.includes('TrafficLight'));
      expect(trafficLights.length).toBe(4);

      // Nairobi street signposts (4 signposts total)
      const streetSigns = group.children.filter((c) => c.name.includes('StreetSign'));
      expect(streetSigns.length).toBe(4);

      // Commercial kiosks
      const mpesa = group.getObjectByName('CBD_Adjacent_MPesaKiosk');
      const mamaMboga = group.getObjectByName('CBD_Adjacent_MamaMbogaStall');
      expect(mpesa).toBeDefined();
      expect(mamaMboga).toBeDefined();
    });
  });

  describe('4. Full District Scene Integration & Streaming', () => {
    it('registers all 14 CBD buildings (6 showcase + 8 adjacent) into WorldChunkManager', () => {
      const districtScene = new NairobiDistrictScene(scene, assetManager);
      districtScene.generate();

      const chunkMgr = districtScene.chunkManager;
      expect(chunkMgr).toBeDefined();

      // Verify that chunk 0:0 and chunk 0:1 exist
      const chunk00 = chunkMgr.chunks.get('0:0');
      const chunk01 = chunkMgr.chunks.get('0:1');
      expect(chunk00).toBeDefined();
      expect(chunk01).toBeDefined();

      // Check that adjacent buildings are tracked
      const queryResults = chunkMgr.spatialIndex.queryRadius(new THREE.Vector3(0, 0, 95), 60);
      const bldResults = queryResults.filter((item) => item.type === 'building');
      expect(bldResults.length).toBeGreaterThanOrEqual(4);
    });
  });
});
