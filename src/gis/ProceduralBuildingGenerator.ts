import * as THREE from 'three';
import { BuildingData } from '../world/BuildingData';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';

export class ProceduralBuildingGenerator {
  constructor(_assetManager?: AssetManager) {}

  public generateBuildingFromData(bld: BuildingData): THREE.Group {
    return AssetPipeline.getInstance().getBuildingMesh(bld);
  }
}
