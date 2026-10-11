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
   * Radius (from the world origin) inside which the ground is held flat. Roads, sidewalks,
   * buildings, kiosks and street props are all authored near Y=0, and the raw ridge formula
   * rose several metres across the streamed area, burying them. Nairobi's CBD is also
   * comparatively level, so relief is blended back in only beyond this radius.
   */
  public static readonly URBAN_CORE_RADIUS = 700;
  public static readonly URBAN_CORE_BLEND = 500;

  /**
   * Raw ridge topology (before urban-core flattening).
   */
  public getRawRidgeElevation(x: number, z: number): number {
    const slope = (x * 0.04) + (z * 0.03);
    const noise = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
    return Math.max(-2, slope + noise);
  }

  /**
   * Calculates elevation Y at any world position (X, Z).
   * Ridge topology faded to level ground inside the urban core.
   */
  public getElevationAt(x: number, z: number): number {
    const d = Math.hypot(x, z);
    const t = Math.min(1, Math.max(0, (d - TerrainChunkManager.URBAN_CORE_RADIUS) / TerrainChunkManager.URBAN_CORE_BLEND));
    const mask = t * t * (3 - 2 * t);
    return this.getRawRidgeElevation(x, z) * mask;
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
