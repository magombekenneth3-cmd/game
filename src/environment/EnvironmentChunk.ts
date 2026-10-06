import * as THREE from 'three';
import { EnvironmentLODTier } from './EnvironmentLOD';
import { EnvironmentObject, WorldSign } from './EnvironmentTypes';

export class EnvironmentChunk {
  public chunkX: number;
  public chunkZ: number;
  public key: string;

  public envGroup: THREE.Group;
  public envObjects: EnvironmentObject[] = [];
  public signs: WorldSign[] = [];
  public currentTier: EnvironmentLODTier = 'TIER3_INACTIVE';

  private scene: THREE.Scene;
  private isLoaded: boolean = false;

  constructor(chunkX: number, chunkZ: number, scene: THREE.Scene) {
    this.chunkX = chunkX;
    this.chunkZ = chunkZ;
    this.key = `${chunkX}:${chunkZ}`;
    this.scene = scene;

    this.envGroup = new THREE.Group();
    this.envGroup.name = `EnvChunk_${this.key}`;
  }

  public setLOD(tier: EnvironmentLODTier): void {
    if (this.currentTier === tier) return;
    this.currentTier = tier;

    if (tier === 'TIER3_INACTIVE') {
      if (this.isLoaded) {
        this.scene.remove(this.envGroup);
        this.isLoaded = false;
      }
    } else {
      if (!this.isLoaded) {
        this.scene.add(this.envGroup);
        this.isLoaded = true;
      }
      this.updateVisualDetail(tier);
    }
  }

  private updateVisualDetail(tier: EnvironmentLODTier): void {
    this.envGroup.children.forEach((child) => {
      if (tier === 'TIER0_FULL') {
        child.visible = true;
      } else if (tier === 'TIER1_REDUCED') {
        child.visible = !child.name.startsWith('Detail_');
      } else if (tier === 'TIER2_SILHOUETTE') {
        child.visible = child.name.includes('Vegetation') || child.name.includes('Building');
      }
    });
  }

  public isLoadedInScene(): boolean {
    return this.isLoaded;
  }

  public dispose(): void {
    if (this.isLoaded) {
      this.scene.remove(this.envGroup);
      this.isLoaded = false;
    }
    this.envGroup.clear();
    this.envObjects = [];
    this.signs = [];
  }
}
