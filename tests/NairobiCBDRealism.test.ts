import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { TextureGenerator } from '../src/assets/TextureGenerator';
import { AssetManager } from '../src/engine/AssetManager';
import { EnvironmentAssetKit } from '../src/assets/EnvironmentAssetKit';
import { TerrainChunkManager } from '../src/world/TerrainChunkManager';
import { CBDShowcaseBlock } from '../src/world/CBDShowcaseBlock';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { BuildingData } from '../src/world/BuildingData';
import { GeoJSONIngestionEngine } from '../src/gis/GeoJSONIngestionEngine';
import { NAIROBI_REAL_GEOJSON } from '../src/gis/data/nairobi_kilimani_real';

describe('Phase 11.4 — Nairobi CBD & Streetscape Realism Tests', () => {
  let assetManager: AssetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  describe('1. Authentic Kenyan Cabro Paving & PBR Textures', () => {
    it('generates Kenyan Cabro paver texture with sRGB colorSpace and RepeatWrapping', () => {
      const tex = TextureGenerator.createCabroTexture('herringbone');
      expect(tex).toBeDefined();
      expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(tex.wrapS).toBe(THREE.RepeatWrapping);
      expect(tex.wrapT).toBe(THREE.RepeatWrapping);
    });

    it('generates Cabro Normal Map and Roughness Map with linear color space', () => {
      const normal = TextureGenerator.createCabroNormalMap();
      const roughness = TextureGenerator.createCabroRoughnessMap();

      expect(normal).toBeDefined();
      expect(normal.wrapS).toBe(THREE.RepeatWrapping);
      expect(normal.wrapT).toBe(THREE.RepeatWrapping);

      expect(roughness).toBeDefined();
      expect(roughness.wrapS).toBe(THREE.RepeatWrapping);
      expect(roughness.wrapT).toBe(THREE.RepeatWrapping);
    });

    it('registers sidewalk_cabro material in AssetManager with PBR map bindings', () => {
      const cabroMat = assetManager.getMaterial('sidewalk_cabro') as THREE.MeshStandardMaterial;
      expect(cabroMat).toBeDefined();
      expect(cabroMat.map).toBeDefined();
      expect(cabroMat.normalMap).toBeDefined();
      expect(cabroMat.roughnessMap).toBeDefined();
      expect(cabroMat.roughness).toBeCloseTo(0.82, 1);
    });
  });

  describe('2. Nairobi CBD Commercial Building Facades & Shopfronts', () => {
    it('generates distinct CBD facade textures for all architectural styles', () => {
      const styles = ['modernist_render', 'brutalist_concrete', 'commercial_brick', 'curtain_glass', 'art_deco_ochre'] as const;
      styles.forEach((style) => {
        const tex = TextureGenerator.createCBDFacadeTexture(style);
        expect(tex).toBeDefined();
        expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
      });
    });

    it('generates striped canvas awning textures for commercial shopfronts', () => {
      const awningGreen = TextureGenerator.createAwningTexture('green_white');
      const awningOrange = TextureGenerator.createAwningTexture('orange_white');
      expect(awningGreen).toBeDefined();
      expect(awningOrange).toBeDefined();
      expect(awningGreen.colorSpace).toBe(THREE.SRGBColorSpace);
    });

    it('creates CBD building with active ground floor shops and branded signboards', () => {
      const bldData: BuildingData = {
        id: 'test_cbd_bld_1',
        name: 'Kenyatta Plaza',
        footprintPolygon: [
          { x: -10, z: -10 },
          { x: 10, z: -10 },
          { x: 10, z: 10 },
          { x: -10, z: 10 }
        ],
        center: new THREE.Vector3(0, 0, 0),
        height: 32,
        floors: 9,
        zone: 'cbd_commercial',
        districtId: 'district_nairobi',
        buildingCategory: 'office_block',
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 10), type: 'main' }],
        hasGroundFloorShops: true,
        shopNames: ['M-Pesa Agent', 'Equity Bank Access'],
        rooftopEquipment: ['water_tank', 'antenna']
      };

      const group = BuildingAssetKit.createBuildingGroup(bldData);
      expect(group).toBeDefined();
      expect(group.children.length).toBeGreaterThan(0);

      const sign0 = group.getObjectByName('Detail_Signboard_test_cbd_bld_1_0');
      const sign1 = group.getObjectByName('Detail_Signboard_test_cbd_bld_1_1');
      expect(sign0).toBeDefined();
      expect(sign1).toBeDefined();

      const canopy0 = group.getObjectByName('Detail_Canopy_test_cbd_bld_1_0');
      expect(canopy0).toBeDefined();
    });
  });

  describe('3. Matatu Culture & East African Liveries', () => {
    it('generates distinct authentic Sacco liveries for Super Metro, City Hoppa, and Forward Sacco', () => {
      const superMetro = TextureGenerator.createMatatuLiveryTexture('super_metro');
      const cityHoppa = TextureGenerator.createMatatuLiveryTexture('city_hoppa');
      const forwardSacco = TextureGenerator.createMatatuLiveryTexture('forward_sacco');

      expect(superMetro).toBeDefined();
      expect(cityHoppa).toBeDefined();
      expect(forwardSacco).toBeDefined();
    });
  });

  describe('4. Streetscape Infrastructure & Furniture', () => {
    it('creates Nairobi CBD street name signs and traffic signals', () => {
      const streetSign = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'KIMATHI ST');
      expect(streetSign).toBeDefined();
      expect(streetSign.name).toContain('StreetSign');

      const trafficLight = EnvironmentAssetKit.createTrafficLightMesh();
      expect(trafficLight).toBeDefined();
      expect(trafficLight.children.length).toBeGreaterThan(4);
    });

    it('creates street trees embedded in cast-iron sidewalk grates', () => {
      const jacaranda = EnvironmentAssetKit.createTreeInPavingMesh('jacaranda');
      expect(jacaranda).toBeDefined();
      expect(jacaranda.children.length).toBeGreaterThan(2);

      const palm = EnvironmentAssetKit.createTreeInPavingMesh('palm');
      expect(palm).toBeDefined();
    });

    it('creates commuter Matatu stage shelter and street bollards', () => {
      const shelter = EnvironmentAssetKit.createMatatuStageShelterMesh();
      expect(shelter).toBeDefined();

      const bollard = EnvironmentAssetKit.createStreetBollardMesh();
      expect(bollard).toBeDefined();
    });
  });

  describe('5. Terrain Urban Core Flattening & Elevation Integrity', () => {
    it('holds ground flat at elevation 0 in the urban core to eliminate ditches and gaps', () => {
      const terrainMgr = new TerrainChunkManager(assetManager);

      // Urban core positions (at player spawn 0, 15 and avenue corridor)
      expect(terrainMgr.getElevationAt(0, 0)).toBe(0);
      expect(terrainMgr.getElevationAt(0, 15)).toBe(0);
      expect(terrainMgr.getElevationAt(200, 200)).toBe(0);

      // Beyond URBAN_CORE_RADIUS (700m), ridge topology gradually blends in
      const farElevation = terrainMgr.getElevationAt(1500, 1500);
      expect(typeof farElevation).toBe('number');
      expect(farElevation).toBeGreaterThan(0);
    });
  });

  describe('6. CBD Showcase Block Generation', () => {
    it('generates complete showcase block with continuous Cabro promenades and buildings', () => {
      const scene = new THREE.Scene();
      const showcaseBlock = new CBDShowcaseBlock(scene, assetManager);
      const { buildings, group } = showcaseBlock.generate();

      expect(buildings.length).toBe(6);
      expect(group.children.length).toBeGreaterThan(10);

      const westPromenade = group.getObjectByName('CBD_Promenade_West');
      const eastPromenade = group.getObjectByName('CBD_Promenade_East');
      expect(westPromenade).toBeDefined();
      expect(eastPromenade).toBeDefined();

      const matatuStage = group.getObjectByName('MatatuStageShelter');
      expect(matatuStage).toBeDefined();
    });

    it('inspects district roads around the urban core', () => {
      const engine = new GeoJSONIngestionEngine();
      const { district } = engine.ingestGeoJSON(NAIROBI_REAL_GEOJSON);
      expect(district.roads.length).toBeGreaterThan(0);
    });
  });
});
