import * as THREE from 'three';
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
  cachedMeshesCount: number;
  buildingKitsGenerated: number;
  vehicleKitsGenerated: number;
  characterKitsGenerated: number;
}

export class AssetPipeline {
  private static instance: AssetPipeline;
  private cachedMeshes: Map<string, THREE.Group> = new Map();
  private buildingCount: number = 0;
  private vehicleCount: number = 0;
  private characterCount: number = 0;

  public static getInstance(): AssetPipeline {
    if (!AssetPipeline.instance) {
      AssetPipeline.instance = new AssetPipeline();
    }
    return AssetPipeline.instance;
  }

  // --- BUILDINGS ---
  public getBuildingMesh(bld: BuildingData): THREE.Group {
    this.buildingCount++;
    return BuildingAssetKit.createBuildingGroup(bld);
  }

  // --- VEHICLES ---
  public getVehicleMesh(category: VehicleCategory, paintColor: number = 0x1e3a8a): THREE.Group {
    const cacheKey = `veh_${category}_${paintColor}`;
    if (!this.cachedMeshes.has(cacheKey)) {
      const mesh = VehicleAssetKit.createVehicleMesh(category, paintColor);
      this.cachedMeshes.set(cacheKey, mesh);
    }
    this.vehicleCount++;
    return this.cachedMeshes.get(cacheKey)!.clone();
  }

  // --- CHARACTERS ---
  public getCharacterMesh(archetype: NPCArchetype | 'player', skinTone?: number, outfitColor?: number): THREE.Group {
    const cacheKey = `char_${archetype}_${skinTone || 0}_${outfitColor || 0}`;
    if (!this.cachedMeshes.has(cacheKey)) {
      const mesh = CharacterAssetKit.createHumanoidMesh(archetype, skinTone, outfitColor);
      this.cachedMeshes.set(cacheKey, mesh);
    }
    this.characterCount++;
    return this.cachedMeshes.get(cacheKey)!.clone();
  }

  // --- ENVIRONMENT FOLIAGE & FURNITURE ---
  public getAcaciaTreeMesh(): THREE.Group {
    const key = 'env_acacia_tree';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, EnvironmentAssetKit.createAcaciaTreeMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  public getPalmTreeMesh(): THREE.Group {
    const key = 'env_palm_tree';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, EnvironmentAssetKit.createPalmTreeMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  public getStreetlightMesh(): THREE.Group {
    const key = 'env_streetlight';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, EnvironmentAssetKit.createStreetlightMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  public getMamaMbogaStallMesh(): THREE.Group {
    const key = 'env_mama_mboga';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, EnvironmentAssetKit.createMamaMbogaStallMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  public getMPesaKioskMesh(): THREE.Group {
    const key = 'env_mpesa';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, EnvironmentAssetKit.createMPesaKioskMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  // --- INTERIORS ---
  public getDJBoothRigMesh(): THREE.Group {
    const key = 'interior_dj_booth';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, InteriorAssetKit.createDJBoothRig());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  public getVIPLoungeMesh(): THREE.Group {
    const key = 'interior_vip_lounge';
    if (!this.cachedMeshes.has(key)) {
      this.cachedMeshes.set(key, InteriorAssetKit.createVIPLoungeMesh());
    }
    return this.cachedMeshes.get(key)!.clone();
  }

  // --- TEXTURES ---
  public getAsphaltTexture(): THREE.CanvasTexture {
    return TextureGenerator.createAsphaltTexture();
  }

  public getSidewalkTexture(): THREE.CanvasTexture {
    return TextureGenerator.createSidewalkPaverTexture();
  }

  public getStats(): AssetPipelineStats {
    return {
      cachedTexturesCount: 6,
      cachedMeshesCount: this.cachedMeshes.size,
      buildingKitsGenerated: this.buildingCount,
      vehicleKitsGenerated: this.vehicleCount,
      characterKitsGenerated: this.characterCount
    };
  }

  public clearCache(): void {
    this.cachedMeshes.clear();
    this.buildingCount = 0;
    this.vehicleCount = 0;
    this.characterCount = 0;
  }
}
