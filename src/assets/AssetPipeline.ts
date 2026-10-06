import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ASSET_MANIFEST } from './AssetManifest';
import { TextureGenerator } from './TextureGenerator';
import { BuildingAssetKit } from './BuildingAssetKit';
import { VehicleAssetKit } from './VehicleAssetKit';
import { CharacterAssetKit } from './CharacterAssetKit';
import { EnvironmentAssetKit } from './EnvironmentAssetKit';
import { InteriorAssetKit } from './InteriorAssetKit';
import { BuildingData } from '../world/BuildingData';
import { VehicleCategory } from '../vehicles/VehicleTypes';
import { NPCArchetype } from '../npc/NPCTypes';

export interface AssetPipelineStats {
  cachedTexturesCount: number;
  cachedGLBCount: number;
  activeInstancesCount: number;
  disposedInstancesCount: number;
  buildingKitsGenerated: number;
  vehicleKitsGenerated: number;
  characterKitsGenerated: number;
  cacheHitCount: number;
  cacheMissCount: number;
}

export class AssetPipeline {
  private static instance: AssetPipeline;
  private gltfLoader: GLTFLoader;
  
  // Deduplication & Caching
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map();
  private glbCache: Map<string, THREE.Group> = new Map();
  private instanceMeshCache: Map<string, THREE.Group> = new Map();

  // Telemetry & Tracking
  private activeInstances: Set<THREE.Object3D> = new Set();
  private disposedCount: number = 0;
  private buildingCount: number = 0;
  private vehicleCount: number = 0;
  private characterCount: number = 0;
  private cacheHitCount: number = 0;
  private cacheMissCount: number = 0;

  private constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public static getInstance(): AssetPipeline {
    if (!AssetPipeline.instance) {
      AssetPipeline.instance = new AssetPipeline();
    }
    return AssetPipeline.instance;
  }

  /**
   * Asynchronously loads a GLB asset by asset ID with promise deduplication and caching.
   * Falls back gracefully to the procedural asset generator if GLB file fails or is missing.
   */
  public async loadGLBAsset(assetId: string): Promise<THREE.Group> {
    if (this.glbCache.has(assetId)) {
      this.cacheHitCount++;
      return this.glbCache.get(assetId)!.clone(true);
    }

    if (this.loadingPromises.has(assetId)) {
      this.cacheHitCount++;
      const group = await this.loadingPromises.get(assetId)!;
      return group.clone(true);
    }

    this.cacheMissCount++;
    const entry = ASSET_MANIFEST[assetId];
    if (!entry) {
      console.warn(`Asset ID '${assetId}' not found in AssetManifest. Using fallback.`);
      return this.createFallbackMesh(assetId);
    }

    const loadPromise = new Promise<THREE.Group>((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const fallback = this.createFallbackMesh(assetId);
          this.glbCache.set(assetId, fallback);
          this.loadingPromises.delete(assetId);
          resolve(fallback.clone(true));
        }
      }, 50);

      try {
        this.gltfLoader.load(
          entry.sourceFile,
          (gltf) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            const loadedGroup = gltf.scene || new THREE.Group();
            loadedGroup.name = `GLB_${assetId}`;
            loadedGroup.scale.copy(entry.intendedScale);
            this.glbCache.set(assetId, loadedGroup);
            this.loadingPromises.delete(assetId);
            resolve(loadedGroup.clone(true));
          },
          undefined,
          (_err) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            const fallback = this.createFallbackMesh(assetId);
            this.glbCache.set(assetId, fallback);
            this.loadingPromises.delete(assetId);
            resolve(fallback.clone(true));
          }
        );
      } catch (_e) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        const fallback = this.createFallbackMesh(assetId);
        this.glbCache.set(assetId, fallback);
        this.loadingPromises.delete(assetId);
        resolve(fallback.clone(true));
      }
    });

    this.loadingPromises.set(assetId, loadPromise);
    const instance = await loadPromise;
    this.activeInstances.add(instance);
    return instance;
  }

  /**
   * Creates an explicit high-fidelity fallback mesh if a GLB model is absent.
   */
  public createFallbackMesh(assetId: string): THREE.Group {
    if (assetId.includes('matatu')) return VehicleAssetKit.createVehicleMesh('matatu');
    if (assetId.includes('veh_sedan')) return VehicleAssetKit.createVehicleMesh('sedan');
    if (assetId.includes('veh_suv')) return VehicleAssetKit.createVehicleMesh('suv');
    if (assetId.includes('veh_boda')) return VehicleAssetKit.createVehicleMesh('motorcycle');
    if (assetId.includes('char')) return CharacterAssetKit.createHumanoidMesh('young_professional');
    if (assetId.includes('acacia')) return EnvironmentAssetKit.createAcaciaTreeMesh();
    if (assetId.includes('palm')) return EnvironmentAssetKit.createPalmTreeMesh();
    if (assetId.includes('mpesa')) return EnvironmentAssetKit.createMPesaKioskMesh();
    if (assetId.includes('mama_mboga')) return EnvironmentAssetKit.createMamaMbogaStallMesh();

    const fallbackGroup = new THREE.Group();
    fallbackGroup.name = `FallbackGroup_${assetId}`;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    fallbackGroup.add(box);
    return fallbackGroup;
  }

  // --- BUILDINGS ---
  public getBuildingMesh(bld: BuildingData): THREE.Group {
    this.buildingCount++;
    const group = BuildingAssetKit.createBuildingGroup(bld);
    this.activeInstances.add(group);
    return group;
  }

  // --- VEHICLES ---
  public getVehicleMesh(category: VehicleCategory, paintColor: number = 0x1e3a8a): THREE.Group {
    const cacheKey = `veh_${category}_${paintColor}`;
    if (!this.instanceMeshCache.has(cacheKey)) {
      const mesh = VehicleAssetKit.createVehicleMesh(category, paintColor);
      this.instanceMeshCache.set(cacheKey, mesh);
    }
    this.vehicleCount++;
    const cloned = this.instanceMeshCache.get(cacheKey)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  // --- CHARACTERS ---
  public getCharacterMesh(archetype: NPCArchetype | 'player', skinTone?: number, outfitColor?: number): THREE.Group {
    const cacheKey = `char_${archetype}_${skinTone || 0}_${outfitColor || 0}`;
    if (!this.instanceMeshCache.has(cacheKey)) {
      const mesh = CharacterAssetKit.createHumanoidMesh(archetype, skinTone, outfitColor);
      this.instanceMeshCache.set(cacheKey, mesh);
    }
    this.characterCount++;
    const cloned = this.instanceMeshCache.get(cacheKey)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  // --- ENVIRONMENT FOLIAGE & PROPS ---
  public getAcaciaTreeMesh(): THREE.Group {
    const key = 'env_acacia_tree';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, EnvironmentAssetKit.createAcaciaTreeMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  public getPalmTreeMesh(): THREE.Group {
    const key = 'env_palm_tree';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, EnvironmentAssetKit.createPalmTreeMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  public getStreetlightMesh(): THREE.Group {
    const key = 'env_streetlight';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, EnvironmentAssetKit.createStreetlightMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  public getMamaMbogaStallMesh(): THREE.Group {
    const key = 'env_mama_mboga';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, EnvironmentAssetKit.createMamaMbogaStallMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  public getMPesaKioskMesh(): THREE.Group {
    const key = 'env_mpesa';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, EnvironmentAssetKit.createMPesaKioskMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  // --- INTERIORS ---
  public getDJBoothRigMesh(): THREE.Group {
    const key = 'interior_dj_booth';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, InteriorAssetKit.createDJBoothRig());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  public getVIPLoungeMesh(): THREE.Group {
    const key = 'interior_vip_lounge';
    if (!this.instanceMeshCache.has(key)) {
      this.instanceMeshCache.set(key, InteriorAssetKit.createVIPLoungeMesh());
    }
    const cloned = this.instanceMeshCache.get(key)!.clone(true);
    this.activeInstances.add(cloned);
    return cloned;
  }

  // --- TEXTURES ---
  public getAsphaltTexture(): THREE.CanvasTexture {
    return TextureGenerator.createAsphaltTexture();
  }

  public getSidewalkTexture(): THREE.CanvasTexture {
    return TextureGenerator.createSidewalkPaverTexture();
  }

  // --- DISPOSAL & GPU MEMORY MANAGEMENT ---
  public disposeAssetInstance(object: THREE.Object3D): void {
    if (!object) return;
    this.activeInstances.delete(object);
    this.disposedCount++;

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => mat.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      }
    });
  }

  public async preloadChunkAssets(chunkX: number, chunkZ: number): Promise<void> {
    // Preload manifest assets for approaching grid chunk
    const buildingAssets = ['bld_nairobi_shop_01', 'bld_mixed_use_01', 'bld_modern_apartment_01'];
    const assetId = buildingAssets[Math.abs(chunkX + chunkZ) % buildingAssets.length];
    await this.loadGLBAsset(assetId);
  }

  public getStats(): AssetPipelineStats {
    return {
      cachedTexturesCount: 6,
      cachedGLBCount: this.glbCache.size,
      activeInstancesCount: this.activeInstances.size,
      disposedInstancesCount: this.disposedCount,
      buildingKitsGenerated: this.buildingCount,
      vehicleKitsGenerated: this.vehicleCount,
      characterKitsGenerated: this.characterCount,
      cacheHitCount: this.cacheHitCount,
      cacheMissCount: this.cacheMissCount
    };
  }

  public clearCache(): void {
    this.glbCache.clear();
    this.instanceMeshCache.clear();
    this.loadingPromises.clear();
    this.activeInstances.clear();
    this.disposedCount = 0;
    this.buildingCount = 0;
    this.vehicleCount = 0;
    this.characterCount = 0;
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }
}
