import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { SeededRandom } from '../utils/SeededRandom';

export class StreetFurnitureSystem {
  constructor(_assetManager?: AssetManager) {}

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

    // Utility Poles along road corridor edges
    const poleCount = Math.floor(rng.nextFloat() * 2) + 2;
    for (let i = 0; i < poleCount; i++) {
      const poleSide = i % 2 === 0 ? 1 : -1;
      const posX = minX + (poleSide * (14 + rng.nextFloat() * 4));
      const posZ = minZ + 20 + i * (chunkSize / poleCount);

      const poleGroup = AssetPipeline.getInstance().getCachedGLB('env_utility_pole_01');
      poleGroup.position.set(posX, 0.3, posZ);
      group.add(poleGroup);
    }

    // Street Bench along pedestrian sidewalk
    const benchGroup = AssetPipeline.getInstance().getCachedGLB('env_bench_01');
    benchGroup.position.set(minX + 16, 0.3, minZ + 45);
    group.add(benchGroup);

    return group;
  }
}
