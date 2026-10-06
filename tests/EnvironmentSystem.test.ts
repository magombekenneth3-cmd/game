import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { VegetationSystem } from '../src/environment/VegetationSystem';
import { BuildingDetailSystem } from '../src/environment/BuildingDetailSystem';
import { RoadsideSystem } from '../src/environment/RoadsideSystem';
import { SignageSystem } from '../src/environment/SignageSystem';
import { WeatherSystem } from '../src/environment/WeatherSystem';
import { EnvironmentLODManager } from '../src/environment/EnvironmentLOD';
import { EnvironmentManager } from '../src/environment/EnvironmentManager';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { AssetManager } from '../src/engine/AssetManager';

describe('Phase 7 — Dense Nairobi World & Environmental Realism Unit Tests', () => {
  let scene: THREE.Scene;
  let assetManager: AssetManager;
  let chunkManager: WorldChunkManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    assetManager = new AssetManager();
    chunkManager = new WorldChunkManager(scene);
  });

  describe('1. Vegetation System & Land-Use Scaling', () => {
    it('varies vegetation density based on land-use classification', () => {
      const vegSystem = new VegetationSystem(assetManager);
      expect(vegSystem.getVegetationDensity('CBD')).toBeLessThan(vegSystem.getVegetationDensity('PARK'));
      expect(vegSystem.getVegetationDensity('RESIDENTIAL')).toBeGreaterThan(vegSystem.getVegetationDensity('CBD'));
    });

    it('generates chunk vegetation deterministically from seed', () => {
      const vegSystem = new VegetationSystem(assetManager);
      const chunk1 = vegSystem.generateChunkVegetation(0, 0, 'RESIDENTIAL', [], 100.0, 1337);
      const chunk2 = vegSystem.generateChunkVegetation(0, 0, 'RESIDENTIAL', [], 100.0, 1337);

      expect(chunk1.length).toBe(chunk2.length);
      for (let i = 0; i < chunk1.length; i++) {
        expect(chunk1[i].position.x).toBeCloseTo(chunk2[i].position.x);
        expect(chunk1[i].category).toBe(chunk2[i].category);
      }
    });

    it('respects road exclusion zones for vegetation placement', () => {
      const vegSystem = new VegetationSystem(assetManager);
      const exclusionZone = new THREE.Box3(
        new THREE.Vector3(10, -10, 10),
        new THREE.Vector3(90, 10, 90)
      );

      const instances = vegSystem.generateChunkVegetation(0, 0, 'PARK', [exclusionZone], 100.0, 1337);
      instances.forEach((inst) => {
        expect(exclusionZone.containsPoint(inst.position)).toBe(false);
      });
    });
  });

  describe('2. Building Detail & Roadside Commerce Systems', () => {
    it('decorates building data entities with rooftop water tanks, solar panels, and security booths', () => {
      const buildingDetail = new BuildingDetailSystem(assetManager);
      const bldData = {
        id: 'bld_test_1',
        name: 'Test Apartment',
        footprintPolygon: [{ x: 2.5, z: 2.5 }, { x: 17.5, z: 2.5 }, { x: 17.5, z: 17.5 }, { x: 2.5, z: 17.5 }],
        center: new THREE.Vector3(10, 0, 10),
        height: 18.0,
        floors: 6,
        zone: 'residential_estate' as const,
        districtId: 'district_nairobi',
        buildingCategory: 'apartment_block' as const,
        entrances: [],
        hasGroundFloorShops: true,
        rooftopEquipment: ['water_tank' as const, 'solar_panel' as const]
      };

      const group = buildingDetail.decorateBuilding(bldData, 1337);
      expect(group.children.length).toBeGreaterThan(0);
      const hasWaterTank = group.children.some((c) => c.name.startsWith('Detail_WaterTank'));
      expect(hasWaterTank).toBe(true);
    });

    it('generates roadside commerce props with semantic activity tags (FOOD, SHOPPING, SERVICES)', () => {
      const roadside = new RoadsideSystem(assetManager);
      const { envObjects } = roadside.generateRoadsideProps(0, 0, [new THREE.Vector3(20, 0, 20)]);

      expect(envObjects.length).toBeGreaterThan(0);
      expect(envObjects[0].tags.length).toBeGreaterThan(0);

      const queriedFood = roadside.queryActivityLocations(new THREE.Vector3(20, 0, 20), 100.0, 'FOOD');
      expect(queriedFood).toBeDefined();
    });
  });

  describe('3. Signage & Environmental Queries', () => {
    it('generates structured signs for road directions, business, and construction', () => {
      const signage = new SignageSystem(assetManager);
      const { signs } = signage.generateSignsForChunk(0, 0);

      expect(signs.length).toBeGreaterThan(0);
      expect(signs[0].text.length).toBeGreaterThan(0);
      expect(signs[0].category).toBeDefined();
    });
  });

  describe('4. Weather & Lighting System Transitions', () => {
    it('handles weather state transitions (CLEAR, CLOUDY, OVERCAST, RAIN)', () => {
      const weather = new WeatherSystem('CLEAR');
      expect(weather.getMode()).toBe('CLEAR');
      expect(weather.getConfig().rainIntensity).toBe(0.0);

      weather.setWeatherMode('RAIN');
      expect(weather.getMode()).toBe('RAIN');

      weather.update(1.0);
      expect(weather.getConfig().rainIntensity).toBeGreaterThan(0.0);
      expect(weather.getConfig().groundWetness).toBeGreaterThan(0.0);
    });
  });

  describe('5. Environment Distance LOD & Telemetry', () => {
    it('evaluates environment distance LOD tiers correctly', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      expect(EnvironmentLODManager.evaluateTier(new THREE.Vector3(10, 0, 0), playerPos)).toBe('TIER0_FULL');
      expect(EnvironmentLODManager.evaluateTier(new THREE.Vector3(120, 0, 0), playerPos)).toBe('TIER1_REDUCED');
      expect(EnvironmentLODManager.evaluateTier(new THREE.Vector3(300, 0, 0), playerPos)).toBe('TIER2_SILHOUETTE');
      expect(EnvironmentLODManager.evaluateTier(new THREE.Vector3(500, 0, 0), playerPos)).toBe('TIER3_INACTIVE');
    });

    it('collects environment telemetry stats cleanly', () => {
      const envManager = new EnvironmentManager(scene, assetManager, chunkManager);
      envManager.update(new THREE.Vector3(0, 0, 0), {
        hours: 14.0,
        timeScale: 1.0,
        sunLightColor: new THREE.Color(),
        ambientLightColor: new THREE.Color(),
        sunPosition: new THREE.Vector3(0, 100, 0),
        sunIntensity: 1.0,
        ambientIntensity: 1.0,
        skyColor: new THREE.Color(),
        groundColor: new THREE.Color(),
        fogColor: new THREE.Color(),
        streetlightsOn: false
      }, 0.016);

      const stats = envManager.getTelemetryStats();
      expect(stats.instantiatedVegetationCount).toBeGreaterThan(0);
      expect(stats.activeChunks).toBeGreaterThan(0);
    });
  });
});
