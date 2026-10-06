import * as THREE from 'three';
import { EnvironmentChunk } from './EnvironmentChunk';
import { EnvironmentLODManager } from './EnvironmentLOD';
import { EnvironmentActivityTag, EnvironmentObject, WorldSign } from './EnvironmentTypes';
import { VegetationSystem } from './VegetationSystem';
import { BuildingDetailSystem } from './BuildingDetailSystem';
import { RoadsideSystem } from './RoadsideSystem';
import { StreetFurnitureSystem } from './StreetFurnitureSystem';
import { SignageSystem } from './SignageSystem';
import { LightingSystem } from './LightingSystem';
import { WeatherSystem } from './WeatherSystem';
import { AssetManager } from '../engine/AssetManager';
import { WorldChunkManager } from '../world/WorldChunkManager';
import { TimeOfDayConfig } from '../types';

export class EnvironmentManager {
  public vegetationSystem: VegetationSystem;
  public buildingDetailSystem: BuildingDetailSystem;
  public roadsideSystem: RoadsideSystem;
  public furnitureSystem: StreetFurnitureSystem;
  public signageSystem: SignageSystem;
  public lightingSystem: LightingSystem;
  public weatherSystem: WeatherSystem;

  private envChunks: Map<string, EnvironmentChunk> = new Map();
  private scene: THREE.Scene;
  private chunkManager: WorldChunkManager;

  private totalVegetationCount: number = 0;
  private totalEnvObjectsCount: number = 0;

  constructor(scene: THREE.Scene, assetManager: AssetManager, chunkManager: WorldChunkManager) {
    this.scene = scene;
    this.chunkManager = chunkManager;

    this.vegetationSystem = new VegetationSystem(assetManager);
    this.buildingDetailSystem = new BuildingDetailSystem(assetManager);
    this.roadsideSystem = new RoadsideSystem(assetManager);
    this.furnitureSystem = new StreetFurnitureSystem(assetManager);
    this.signageSystem = new SignageSystem(assetManager);
    this.lightingSystem = new LightingSystem(scene);
    this.weatherSystem = new WeatherSystem('CLEAR');
  }

  public getOrCreateEnvironmentChunk(chunkX: number, chunkZ: number): EnvironmentChunk {
    const key = `${chunkX}:${chunkZ}`;
    if (!this.envChunks.has(key)) {
      const envChunk = new EnvironmentChunk(chunkX, chunkZ, this.scene);
      this.populateEnvironmentChunk(envChunk);
      this.envChunks.set(key, envChunk);
    }
    return this.envChunks.get(key)!;
  }

  private populateEnvironmentChunk(envChunk: EnvironmentChunk): void {
    const cx = envChunk.chunkX;
    const cz = envChunk.chunkZ;

    // 1. Instanced African Vegetation
    const vegInstances = this.vegetationSystem.generateChunkVegetation(cx, cz, 'COMMERCIAL');
    const vegGroup = this.vegetationSystem.buildInstancedMeshGroup(vegInstances);
    envChunk.envGroup.add(vegGroup);
    this.totalVegetationCount += vegInstances.length;

    // 2. Roadside Props & Kiosks
    const { group: roadsideGroup, envObjects } = this.roadsideSystem.generateRoadsideProps(cx, cz);
    envChunk.envGroup.add(roadsideGroup);
    envChunk.envObjects.push(...envObjects);
    this.totalEnvObjectsCount += envObjects.length;

    // 3. Street Furniture & Utility Poles
    const furnitureGroup = this.furnitureSystem.generateFurnitureForChunk(cx, cz);
    envChunk.envGroup.add(furnitureGroup);

    // 4. Signage System
    const { group: signGroup, signs } = this.signageSystem.generateSignsForChunk(cx, cz);
    envChunk.envGroup.add(signGroup);
    envChunk.signs.push(...signs);

    // 5. Building Details for Chunks with Buildings
    const worldChunkKey = `${cx}:${cz}`;
    const worldChunk = this.chunkManager.chunks.get(worldChunkKey);
    if (worldChunk && worldChunk.buildings.length > 0) {
      worldChunk.buildings.forEach((bld) => {
        const detailGroup = this.buildingDetailSystem.decorateBuilding(bld);
        envChunk.envGroup.add(detailGroup);
      });
    }
  }

  public update(playerPos: THREE.Vector3, timeConfig: TimeOfDayConfig, deltaSeconds: number): void {
    // 1. Update Weather & Lighting Systems
    this.weatherSystem.update(deltaSeconds);
    const weatherConfig = this.weatherSystem.getConfig();
    this.lightingSystem.update(timeConfig, weatherConfig);

    // 2. Evaluate Environment Chunk LODs around Player
    for (let cx = -2; cx <= 2; cx++) {
      for (let cz = -2; cz <= 2; cz++) {
        const playerChunkKey = this.chunkManager.getChunkKeyForPosition(playerPos.x, playerPos.z);
        const [pcx, pcz] = playerChunkKey.split(':').map(Number);
        const chunkX = pcx + cx;
        const chunkZ = pcz + cz;

        const envChunk = this.getOrCreateEnvironmentChunk(chunkX, chunkZ);
        const chunkCenter = new THREE.Vector3(chunkX * 100 + 50, 0, chunkZ * 100 + 50);
        const lodTier = EnvironmentLODManager.evaluateTier(chunkCenter, playerPos);

        envChunk.setLOD(lodTier);
      }
    }
  }

  public queryNearestActivityLocation(
    center: THREE.Vector3,
    tag: EnvironmentActivityTag,
    maxRadius: number = 100.0
  ): EnvironmentObject | undefined {
    let nearest: EnvironmentObject | undefined;
    let minDistanceSq = maxRadius * maxRadius;

    this.envChunks.forEach((chunk) => {
      chunk.envObjects.forEach((obj) => {
        if (obj.tags.includes(tag)) {
          const distSq = center.distanceToSquared(obj.position);
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            nearest = obj;
          }
        }
      });
    });

    return nearest;
  }

  public querySignsNear(center: THREE.Vector3, radius: number): WorldSign[] {
    return this.signageSystem.querySignsNear(center, radius);
  }

  public getTelemetryStats(): {
    totalEnvObjects: number;
    activeChunks: number;
    instantiatedVegetationCount: number;
    nearbyPropsCount: number;
    currentWeatherMode: string;
  } {
    let activeChunks = 0;
    let nearbyProps = 0;

    this.envChunks.forEach((chunk) => {
      if (chunk.isLoadedInScene()) {
        activeChunks++;
        nearbyProps += chunk.envObjects.length;
      }
    });

    return {
      totalEnvObjects: this.totalEnvObjectsCount,
      activeChunks,
      instantiatedVegetationCount: this.totalVegetationCount,
      nearbyPropsCount: nearbyProps,
      currentWeatherMode: this.weatherSystem.getMode()
    };
  }

  public clear(): void {
    this.envChunks.forEach((chunk) => chunk.dispose());
    this.envChunks.clear();
    this.roadsideSystem.clear();
    this.signageSystem.clear();
  }
}
