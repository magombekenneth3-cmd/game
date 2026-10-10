import * as THREE from 'three';
import { LandUseType } from './EnvironmentTypes';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { SeededRandom } from '../utils/SeededRandom';

export type VegetationCategory =
  | 'acacia'
  | 'palms'
  | 'ornamental_street'
  | 'shrubs'
  | 'grass'
  | 'hedges';

export interface VegetationInstance {
  id: string;
  category: VegetationCategory;
  position: THREE.Vector3;
  scale: THREE.Vector3;
  rotationY: number;
}

export class VegetationSystem {
  constructor(_assetManager?: AssetManager) {}

  public getVegetationDensity(landUse: LandUseType): number {
    switch (landUse) {
      case 'CBD': return 0.1;
      case 'COMMERCIAL': return 0.4;
      case 'RESIDENTIAL': return 0.7;
      case 'PARK': return 1.0;
      case 'INFORMAL': return 0.5;
      default: return 0.5;
    }
  }

  public generateChunkVegetation(
    chunkX: number,
    chunkZ: number,
    landUse: LandUseType,
    roadExclusionZones: THREE.Box3[] = [],
    chunkSize: number = 100.0,
    seed: number = 1337
  ): VegetationInstance[] {
    const chunkSeed = seed + chunkX * 73856093 ^ chunkZ * 19349663;
    const rng = new SeededRandom(chunkSeed);

    const instances: VegetationInstance[] = [];
    const density = this.getVegetationDensity(landUse);
    const count = Math.floor(density * 25);

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;

    for (let i = 0; i < count; i++) {
      const posX = minX + rng.nextFloat() * chunkSize;
      const posZ = minZ + rng.nextFloat() * chunkSize;
      const pos = new THREE.Vector3(posX, 0.3, posZ);

      // Check road exclusion zone
      let isRoad = false;
      for (const zone of roadExclusionZones) {
        if (zone.containsPoint(pos)) {
          isRoad = true;
          break;
        }
      }
      if (isRoad) continue;

      const catRoll = rng.nextFloat();
      let category: VegetationCategory = 'acacia';
      if (catRoll < 0.35) category = 'acacia';
      else if (catRoll < 0.55) category = 'palms';
      else if (catRoll < 0.75) category = 'ornamental_street';
      else if (catRoll < 0.90) category = 'shrubs';
      else category = 'hedges';

      const scaleVal = 0.8 + rng.nextFloat() * 0.6;
      const scale = new THREE.Vector3(scaleVal, scaleVal, scaleVal);
      const rotationY = rng.nextFloat() * Math.PI * 2;

      instances.push({
        id: `veg_${chunkX}_${chunkZ}_${i}`,
        category,
        position: pos,
        scale,
        rotationY
      });
    }

    return instances;
  }

  public buildInstancedMeshGroup(instances: VegetationInstance[]): THREE.Group {
    const group = new THREE.Group();
    group.name = 'InstancedVegetationGroup';

    instances.forEach((inst) => {
      const pipeline = AssetPipeline.getInstance();
      const tree = (inst.category === 'palms')
        ? pipeline.getPalmTreeMesh()
        : pipeline.getAcaciaTreeMesh();

      tree.position.copy(inst.position);
      tree.rotation.y = inst.rotationY;
      tree.scale.multiply(inst.scale);
      group.add(tree);
    });

    return group;
  }
}
