import * as THREE from 'three';
import { NAIROBI_REAL_GEOJSON } from '../gis/data/nairobi_kilimani_real';
import { GeoJSONIngestionEngine } from '../gis/GeoJSONIngestionEngine';
import { ProceduralBuildingGenerator } from '../gis/ProceduralBuildingGenerator';
import { ProceduralRoadGenerator } from '../gis/ProceduralRoadGenerator';
import { WorldChunkManager } from './WorldChunkManager';
import { TerrainChunkManager } from './TerrainChunkManager';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { BuildingData } from './BuildingData';

export class NairobiDistrictScene {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private buildingGen: ProceduralBuildingGenerator;
  private roadGen: ProceduralRoadGenerator;
  public chunkManager: WorldChunkManager;
  public terrainChunkManager: TerrainChunkManager;
  private ingestionEngine: GeoJSONIngestionEngine;

  private streetPointLights: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.buildingGen = new ProceduralBuildingGenerator(assetManager);
    this.roadGen = new ProceduralRoadGenerator(assetManager);
    this.chunkManager = new WorldChunkManager(scene);
    this.terrainChunkManager = new TerrainChunkManager(assetManager);
    this.ingestionEngine = new GeoJSONIngestionEngine();
  }

  public generate(): void {
    // 1. Ingest Real OpenStreetMap Vector GIS Dataset
    const { district, normalizedBuildings, roadGraph, report } = this.ingestionEngine.ingestGeoJSON(NAIROBI_REAL_GEOJSON);
    console.log(`🌐 GIS Ingestion Report: ${report.validBuildingCount} Real GIS Buildings, ${report.validRoadCount} Roads imported (Valid: ${report.isValid})`);
    console.log(`🗺️ RoadGraph: ${roadGraph.nodes.size} Nodes, ${roadGraph.edges.size} Edges created.`);

    // Pre-initialize grid chunks across city bounds (-3 to +3)
    for (let cx = -3; cx <= 3; cx++) {
      for (let cz = -3; cz <= 3; cz++) {
        this.chunkManager.getOrCreateChunk(cx, cz);
      }
    }

    // 2. Generate Chunked Terrain Tiles (-2 to +2 grid chunks)
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        const terrainChunk = this.terrainChunkManager.createTerrainChunkMesh(cx, cz);
        this.scene.add(terrainChunk);
      }
    }

    // 3. Generate Real Ingested Vector Road Network
    district.roads.forEach((road) => {
      const roadMeshGroup = this.roadGen.generateRoadMesh(road);
      this.scene.add(roadMeshGroup);
    });

    district.intersections.forEach((intNode) => {
      const roundaboutGroup = this.roadGen.generateRoundaboutMesh(intNode);
      this.scene.add(roundaboutGroup);
    });

    // 4. Register Building Data Entities into WorldChunkManager
    normalizedBuildings.forEach((bldData) => {
      const meshGroup = this.buildingGen.generateBuildingFromData(bldData);
      this.chunkManager.registerBuildingToChunk(bldData, meshGroup);
    });

    // 5. Generate Procedural Secondary Building Infill for Dense Nairobi Experience
    this.generateProceduralInfillBuildings();

    // 6. Add Streetlights & Dense Vegetation / Street Clutter
    this.createCorridorStreetlights();
    this.createVegetation();

    // 7. Initial Chunk Activation around Player Spawn Position (0, 0.5, 15)
    this.chunkManager.updatePlayerPosition(new THREE.Vector3(0, 0.5, 15));
  }

  private generateProceduralInfillBuildings(): void {
    // Generate extra buildings along urban grid blocks to ensure visual density
    const infillConfigs: Array<{
      id: string;
      name: string;
      x: number;
      z: number;
      width: number;
      depth: number;
      floors: number;
      height: number;
      category: 'commercial_tower' | 'office_block' | 'apartment_block' | 'residential_house' | 'shop';
    }> = [
      // Block A: Ngong Corridor North Infill
      { id: 'bld_infill_1', name: 'Valley Arcade Shopping Suites', x: -110, z: -80, width: 22, depth: 18, floors: 5, height: 18, category: 'shop' },
      { id: 'bld_infill_2', name: 'Woodley Estate Apartments', x: -85, z: -105, width: 26, depth: 22, floors: 7, height: 24, category: 'apartment_block' },
      { id: 'bld_infill_3', name: 'Ngong Road Business Hub', x: -45, z: -65, width: 28, depth: 24, floors: 12, height: 42, category: 'office_block' },

      // Block B: Upper Hill South Infill
      { id: 'bld_infill_4', name: 'Finlay Plaza Upper Hill', x: 60, z: -110, width: 30, depth: 25, floors: 16, height: 56, category: 'commercial_tower' },
      { id: 'bld_infill_5', name: 'Mara Road Suites', x: 105, z: -85, width: 24, depth: 20, floors: 9, height: 32, category: 'apartment_block' },
      { id: 'bld_infill_6', name: 'Upper Hill Residency B', x: 125, z: -40, width: 22, depth: 22, floors: 8, height: 28, category: 'apartment_block' },

      // Block C: Kilimani West Infill
      { id: 'bld_infill_7', name: 'Chaka Road Arcade Shops', x: -130, z: 45, width: 20, depth: 16, floors: 3, height: 11, category: 'shop' },
      { id: 'bld_infill_8', name: 'Lenana Residency Block C', x: -95, z: 75, width: 25, depth: 20, floors: 6, height: 21, category: 'apartment_block' },
      { id: 'bld_infill_9', name: 'Dennis Pritt Townhouses', x: -65, z: 110, width: 30, depth: 24, floors: 4, height: 14, category: 'residential_house' },

      // Block D: Hurlingham & Yaya South Infill
      { id: 'bld_infill_10', name: 'Adlife Commercial Annex', x: 25, z: 85, width: 24, depth: 24, floors: 10, height: 35, category: 'office_block' },
      { id: 'bld_infill_11', name: 'Rose Avenue Suites Phase II', x: 65, z: 65, width: 28, depth: 22, floors: 8, height: 27, category: 'apartment_block' },
      { id: 'bld_infill_12', name: 'Upper Hill View Office Park', x: 95, z: 105, width: 32, depth: 26, floors: 14, height: 48, category: 'commercial_tower' }
    ];

    infillConfigs.forEach((cfg) => {
      const halfW = cfg.width / 2;
      const halfD = cfg.depth / 2;

      const polygon = [
        { x: cfg.x - halfW, z: cfg.z - halfD },
        { x: cfg.x + halfW, z: cfg.z - halfD },
        { x: cfg.x + halfW, z: cfg.z + halfD },
        { x: cfg.x - halfW, z: cfg.z + halfD }
      ];

      const bldData: BuildingData = {
        id: cfg.id,
        name: cfg.name,
        footprintPolygon: polygon,
        center: new THREE.Vector3(cfg.x, 0, cfg.z),
        height: cfg.height,
        floors: cfg.floors,
        zone: cfg.floors > 10 ? 'cbd_commercial' : 'residential_estate',
        districtId: 'district_nairobi',
        buildingCategory: cfg.category,
        entrances: [{ id: `${cfg.id}_ent`, position: new THREE.Vector3(cfg.x, 0, cfg.z + halfD), type: 'main' }],
        hasGroundFloorShops: cfg.floors > 3,
        shopNames: ['M-Pesa Store', 'Equity Express'],
        rooftopEquipment: cfg.floors > 8 ? ['antenna', 'water_tank', 'ac_unit'] : ['water_tank', 'solar_panel']
      };

      const meshGroup = this.buildingGen.generateBuildingFromData(bldData);
      this.chunkManager.registerBuildingToChunk(bldData, meshGroup);
    });
  }

  public update(playerPos: THREE.Vector3): void {
    // Update chunk streaming LODs & active status around player position
    this.chunkManager.updatePlayerPosition(playerPos);
  }

  private createCorridorStreetlights(): void {
    const lightPositions = [
      { x: -140, z: -110 }, { x: -100, z: -85 }, { x: -60, z: -60 }, { x: -20, z: -25 },
      { x: 0, z: 0 },       { x: 25, z: 25 },    { x: 60, z: 55 },   { x: 100, z: 85 },
      { x: 140, z: 120 },   { x: -50, z: 45 },   { x: -90, z: 80 },  { x: 30, z: -40 },
      { x: 70, z: -70 },    { x: 110, z: -100 }
    ];

    lightPositions.forEach((pos) => {
      const lightGroup = AssetPipeline.getInstance().getStreetlightMesh();

      const pLight = new THREE.PointLight(0xffaa44, 0, 24);
      pLight.position.set(1.1, 6.0, 0);
      lightGroup.add(pLight);
      this.streetPointLights.push(pLight);

      lightGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(lightGroup);
    });
  }

  private createVegetation(): void {
    const treePositions = [
      { x: 15, z: 10 },   { x: -15, z: -10 }, { x: -60, z: -10 }, { x: -40, z: 70 },
      { x: 50, z: -80 },  { x: 110, z: 10 },  { x: -120, z: -40 }, { x: -90, z: 110 },
      { x: 80, z: -120 }, { x: 130, z: -60 }, { x: 45, z: -30 },  { x: -30, z: -85 }
    ];

    treePositions.forEach((pos, idx) => {
      const treeGroup = idx % 2 === 0
        ? AssetPipeline.getInstance().getAcaciaTreeMesh()
        : AssetPipeline.getInstance().getPalmTreeMesh();

      treeGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(treeGroup);
    });

    // Add Roadside Stalls & Kiosks across major junctions
    const stallLocations = [
      { x: 10, z: -20, type: 'mama_mboga' },
      { x: -15, z: 15, type: 'mpesa' },
      { x: 40, z: 15, type: 'mama_mboga' },
      { x: -50, z: -35, type: 'mpesa' },
      { x: 75, z: 40, type: 'mama_mboga' }
    ];

    stallLocations.forEach((loc) => {
      const stallMesh = loc.type === 'mama_mboga'
        ? AssetPipeline.getInstance().getMamaMbogaStallMesh()
        : AssetPipeline.getInstance().getMPesaKioskMesh();

      stallMesh.position.set(loc.x, 0.3, loc.z);
      this.scene.add(stallMesh);
    });
  }

  public updateStreetlights(on: boolean): void {
    this.assetManager.updateStreetlightsEmissive(on);
    this.streetPointLights.forEach((pl) => {
      pl.intensity = on ? 4.5 : 0.0;
    });
  }
}
