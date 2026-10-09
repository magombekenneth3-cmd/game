import * as THREE from 'three';
import { BuildingData } from './BuildingData';
import { RoadGraphEdge } from './RoadGraph';

export type ChunkLODLevel = 'LOD0' | 'LOD1' | 'LOD2' | 'UNLOADED';

export class WorldChunk {
  public chunkX: number;
  public chunkZ: number;
  public key: string;
  public bounds: THREE.Box3;
  public center: THREE.Vector3;
  public lodLevel: ChunkLODLevel = 'UNLOADED';

  public buildings: BuildingData[] = [];
  public buildingMeshes: THREE.Object3D[] = [];
  public roads: RoadGraphEdge[] = [];
  public collisionProxies: THREE.Box3[] = [];

  public visualGroup: THREE.Group;
  private isLoaded: boolean = false;


  constructor(chunkX: number, chunkZ: number, chunkSize: number = 100.0) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.key = `${chunkX}:${chunkZ}`;

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;
    const maxX = minX + chunkSize;
    const maxZ = minZ + chunkSize;

    this.bounds = new THREE.Box3(
      new THREE.Vector3(minX, -50, minZ),
      new THREE.Vector3(maxX, 300, maxZ)
    );

    this.center = new THREE.Vector3((minX + maxX) / 2, 0, (minZ + maxZ) / 2);
    this.visualGroup = new THREE.Group();
    this.visualGroup.name = `Chunk_${this.key}`;
  }

  public setLOD(newLOD: ChunkLODLevel, scene: THREE.Scene): void {
    if (this.lodLevel === newLOD) return;

    this.lodLevel = newLOD;

    if (newLOD === 'UNLOADED') {
      if (this.isLoaded) {
        scene.remove(this.visualGroup);
        this.isLoaded = false;
      }
    } else {
      if (!this.isLoaded) {
        scene.add(this.visualGroup);
        this.isLoaded = true;
      }
      this.updateVisualDetail(newLOD);
    }
  }

  private updateVisualDetail(lod: ChunkLODLevel): void {
    // Control visual mesh visibility based on LOD distance tier
    this.visualGroup.children.forEach((child) => {
      if (lod === 'LOD0') {
        child.visible = true;
      } else if (lod === 'LOD1') {
        // Hide fine detail children (e.g. antennae, rooftop clutter)
        child.visible = !child.name.startsWith('Detail_');
      } else if (lod === 'LOD2') {
        // Show all building structures and roads, hide fine details
        child.visible = !child.name.startsWith('Detail_');
      }
    });
  }

  public isChunkLoaded(): boolean {
    return this.isLoaded;
  }
}
