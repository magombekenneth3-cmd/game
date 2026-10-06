import * as THREE from 'three';
import { WorldChunk, ChunkLODLevel } from './WorldChunk';
import { SpatialIndex } from './SpatialIndex';
import { RoadGraph } from './RoadGraph';
import { BuildingData } from './BuildingData';

export interface ChunkManagerConfig {
  chunkSize: number;        // meters (default 100.0)
  lod0Radius: number;       // meters (default 120.0)
  lod1Radius: number;       // meters (default 260.0)
  lod2Radius: number;       // meters (default 420.0)
  unloadRadius: number;     // meters (default 500.0)
}

export class WorldChunkManager {
  public chunks: Map<string, WorldChunk> = new Map();
  public spatialIndex: SpatialIndex;
  public roadGraph: RoadGraph;

  private scene: THREE.Scene;
  private config: ChunkManagerConfig;
  private activeChunksCount: number = 0;

  constructor(scene: THREE.Scene, config?: Partial<ChunkManagerConfig>) {
    this.scene = scene;
    this.config = {
      chunkSize: 100.0,
      lod0Radius: 120.0,
      lod1Radius: 260.0,
      lod2Radius: 420.0,
      unloadRadius: 500.0,
      ...config
    };

    this.spatialIndex = new SpatialIndex(this.config.chunkSize / 2);
    this.roadGraph = new RoadGraph();
  }

  public getChunkKeyForPosition(x: number, z: number): string {
    const cx = Math.floor(x / this.config.chunkSize);
    const cz = Math.floor(z / this.config.chunkSize);
    return `${cx}:${cz}`;
  }

  public getOrCreateChunk(chunkX: number, chunkZ: number): WorldChunk {
    const key = `${chunkX}:${chunkZ}`;
    if (!this.chunks.has(key)) {
      const chunk = new WorldChunk(chunkX, chunkZ, this.config.chunkSize);
      this.chunks.set(key, chunk);

      // Register chunk spatial item
      this.spatialIndex.insert({
        id: `chunk_${key}`,
        position: chunk.center,
        bounds: chunk.bounds,
        type: 'chunk',
        data: chunk
      });
    }
    return this.chunks.get(key)!;
  }

  public updatePlayerPosition(playerPos: THREE.Vector3): void {
    let activeCount = 0;

    this.chunks.forEach((chunk) => {
      const dist = playerPos.distanceTo(chunk.center);
      let targetLOD: ChunkLODLevel = 'UNLOADED';

      if (dist <= this.config.lod0Radius) {
        targetLOD = 'LOD0';
        activeCount++;
      } else if (dist <= this.config.lod1Radius) {
        targetLOD = 'LOD1';
        activeCount++;
      } else if (dist <= this.config.lod2Radius) {
        targetLOD = 'LOD2';
        activeCount++;
      } else {
        targetLOD = 'UNLOADED';
      }

      chunk.setLOD(targetLOD, this.scene);
    });

    this.activeChunksCount = activeCount;
  }

  public registerBuildingToChunk(bldData: BuildingData, meshGroup: THREE.Group): void {
    const chunkX = Math.floor(bldData.center.x / this.config.chunkSize);
    const chunkZ = Math.floor(bldData.center.z / this.config.chunkSize);
    const chunk = this.getOrCreateChunk(chunkX, chunkZ);

    chunk.buildings.push(bldData);
    chunk.visualGroup.add(meshGroup);

    // Create Collision Proxy Box
    const box = new THREE.Box3().setFromObject(meshGroup);
    chunk.collisionProxies.push(box);

    // Insert into SpatialIndex
    this.spatialIndex.insert({
      id: `bld_${bldData.id}`,
      position: bldData.center,
      bounds: box,
      type: 'building',
      data: bldData
    });

    this.spatialIndex.insert({
      id: `proxy_${bldData.id}`,
      position: bldData.center,
      bounds: box,
      type: 'collision_proxy',
      data: box
    });
  }

  public getNearbyCollisionProxies(playerPos: THREE.Vector3, radius: number = 80.0): THREE.Box3[] {
    const items = this.spatialIndex.queryRadius<THREE.Box3>(playerPos, radius, 'collision_proxy');
    return items.map((item) => item.data);
  }

  public getActiveChunkCount(): number {
    return this.activeChunksCount;
  }
}
