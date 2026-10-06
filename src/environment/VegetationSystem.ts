import * as THREE from 'three';
import { LandUseType } from './EnvironmentTypes';
import { AssetManager } from '../engine/AssetManager';
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
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

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

    const byCategory: Map<VegetationCategory, VegetationInstance[]> = new Map();
    instances.forEach((inst) => {
      const list = byCategory.get(inst.category) || [];
      list.push(inst);
      byCategory.set(inst.category, list);
    });

    const woodMat = this.assetManager.getMaterial('tree_wood');
    const foliageMat = this.assetManager.getMaterial('foliage_green');

    byCategory.forEach((list, cat) => {
      const trunkGeo = cat === 'palms'
        ? new THREE.CylinderGeometry(0.2, 0.4, 6.0, 8)
        : new THREE.CylinderGeometry(0.3, 0.5, 4.5, 8);

      const crownGeo = cat === 'palms'
        ? new THREE.ConeGeometry(3.5, 2.0, 8)
        : new THREE.CylinderGeometry(4.2, 1.0, 1.8, 8);

      const trunkInst = new THREE.InstancedMesh(trunkGeo, woodMat, list.length);
      const crownInst = new THREE.InstancedMesh(crownGeo, foliageMat, list.length);

      trunkInst.castShadow = true;
      crownInst.castShadow = true;

      const dummy = new THREE.Object3D();

      list.forEach((item, idx) => {
        // Trunk Matrix
        dummy.position.copy(item.position);
        dummy.position.y += cat === 'palms' ? 3.0 : 2.25;
        dummy.rotation.y = item.rotationY;
        dummy.scale.copy(item.scale);
        dummy.updateMatrix();
        trunkInst.setMatrixAt(idx, dummy.matrix);

        // Crown Matrix
        dummy.position.copy(item.position);
        dummy.position.y += cat === 'palms' ? 6.0 : 5.0;
        dummy.rotation.y = item.rotationY;
        dummy.scale.copy(item.scale);
        dummy.updateMatrix();
        crownInst.setMatrixAt(idx, dummy.matrix);
      });

      trunkInst.instanceMatrix.needsUpdate = true;
      crownInst.instanceMatrix.needsUpdate = true;

      group.add(trunkInst);
      group.add(crownInst);
    });

    return group;
  }
}
