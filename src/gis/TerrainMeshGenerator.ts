import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';

export class TerrainMeshGenerator {
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public generateTerrain(size: number = 400, segments: number = 64): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments);
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Undulating slope formula matching Nairobi's geography:
      // Upper Hill ridge (+X, +Z) rising up to +12m, tapering to valley floor (-X, -Z)
      const slope = (x * 0.04) + (z * 0.03);
      const noise = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 1.5;
      const elevation = slope + noise;

      pos.setY(i, Math.max(-2, elevation));
    }

    geo.computeVertexNormals();

    const groundMat = this.assetManager.getMaterial('ground_earth');
    const terrain = new THREE.Mesh(geo, groundMat);
    terrain.position.y = -0.1;
    terrain.receiveShadow = true;

    return terrain;
  }
}
