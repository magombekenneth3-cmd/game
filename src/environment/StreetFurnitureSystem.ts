import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';
import { SeededRandom } from '../utils/SeededRandom';

export class StreetFurnitureSystem {
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public generateFurnitureForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number = 100.0,
    seed: number = 1337
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `StreetFurniture_${chunkX}_${chunkZ}`;

    const chunkSeed = seed + chunkX * 41235 ^ chunkZ * 87654;
    const rng = new SeededRandom(chunkSeed);

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;

    const metalMat = this.assetManager.getMaterial('facade_charcoal');
    const woodMat = this.assetManager.getMaterial('tree_wood');

    // Utility Poles & Overhead Cable Hooks
    const poleCount = Math.floor(rng.nextFloat() * 3) + 2;
    for (let i = 0; i < poleCount; i++) {
      const poleGroup = new THREE.Group();
      poleGroup.name = 'Detail_UtilityPole';

      const posX = minX + 5 + i * (chunkSize / poleCount);
      const posZ = minZ + 15 + (rng.nextFloat() - 0.5) * 10;

      const poleGeo = new THREE.CylinderGeometry(0.15, 0.22, 7.5, 8);
      const pole = new THREE.Mesh(poleGeo, woodMat);
      pole.position.y = 3.75;
      pole.castShadow = true;
      poleGroup.add(pole);

      // Crossarm
      const armGeo = new THREE.BoxGeometry(1.6, 0.15, 0.15);
      const arm = new THREE.Mesh(armGeo, woodMat);
      arm.position.set(0, 7.0, 0);
      poleGroup.add(arm);

      poleGroup.position.set(posX, 0.3, posZ);
      group.add(poleGroup);
    }

    // Bus Shelter & Seating
    const shelterGeo = new THREE.BoxGeometry(4.0, 2.5, 2.0);
    const shelter = new THREE.Mesh(shelterGeo, metalMat);
    shelter.name = 'Detail_BusShelter';
    shelter.position.set(minX + 30, 1.55, minZ + 80);
    group.add(shelter);

    return group;
  }
}
