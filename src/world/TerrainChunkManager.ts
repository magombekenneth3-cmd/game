import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';

export class TerrainChunkManager {
  private assetManager: AssetManager;
  private chunkSize: number;

  constructor(assetManager: AssetManager, chunkSize: number = 100.0) {
    this.assetManager = assetManager;
    this.chunkSize = chunkSize;
  }

  /**
   * Calculates elevation Y at any world position (X, Z).
   * Sloping Upper Hill ridge topology formula.
   */
  public getElevationAt(x: number, z: number): number {
    const slope = (x * 0.04) + (z * 0.03);
    const noise = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
    return Math.max(-2, slope + noise);
  }

  public createTerrainChunkMesh(chunkX: number, chunkZ: number, resolution: number = 16): THREE.Mesh {
    const minX = chunkX * this.chunkSize;
    const minZ = chunkZ * this.chunkSize;

    const geo = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize, resolution, resolution);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const lx = pos.getX(i);
      const lz = pos.getZ(i);

      const worldX = minX + lx + this.chunkSize / 2;
      const worldZ = minZ + lz + this.chunkSize / 2;

      const elevation = this.getElevationAt(worldX, worldZ);
      pos.setY(i, elevation);
    }

    geo.computeVertexNormals();

    const groundMat = this.assetManager.getMaterial('ground_earth');
    const mesh = new THREE.Mesh(geo, groundMat);
    mesh.name = `TerrainChunk_${chunkX}:${chunkZ}`;
    mesh.position.set(minX + this.chunkSize / 2, -0.1, minZ + this.chunkSize / 2);
    mesh.receiveShadow = true;

    return mesh;
  }
}
