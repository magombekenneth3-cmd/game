import * as THREE from 'three';
import { WorldSign, SignCategory } from './EnvironmentTypes';
import { AssetManager } from '../engine/AssetManager';
import { SeededRandom } from '../utils/SeededRandom';

export class SignageSystem {
  private assetManager: AssetManager;
  private signs: WorldSign[] = [];

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public generateSignsForChunk(
    chunkX: number,
    chunkZ: number,
    chunkSize: number = 100.0,
    seed: number = 1337
  ): { group: THREE.Group; signs: WorldSign[] } {
    const group = new THREE.Group();
    group.name = `SignageGroup_${chunkX}_${chunkZ}`;

    const chunkSeed = seed + chunkX * 654321 ^ chunkZ * 123456;
    const rng = new SeededRandom(chunkSeed);
    const chunkSigns: WorldSign[] = [];

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;

    const signTexts = [
      'Ngong Road / CBD Expressway',
      'Yaya Commercial Center',
      'Kileleshwa Residential Estate',
      'Upper Hill Financial Plaza',
      'Mamboleo Electronics & M-Pesa',
      'Safari Karibu Lounge',
      'Kilimani Heights Apartments',
      'Construction Zone — Slow Down'
    ];

    const count = Math.floor(rng.nextFloat() * 3) + 2;
    const metalMat = this.assetManager.getMaterial('facade_charcoal');
    const boardMat = this.assetManager.getMaterial('facade_ochre');

    for (let i = 0; i < count; i++) {
      const posX = minX + 15 + rng.nextFloat() * (chunkSize - 30);
      const posZ = minZ + 15 + rng.nextFloat() * (chunkSize - 30);
      const pos = new THREE.Vector3(posX, 0.3, posZ);

      const category: SignCategory = (i % 2 === 0) ? 'ROAD' : (i % 3 === 0) ? 'ADVERTISING' : 'BUSINESS';
      const text = signTexts[Math.floor(rng.nextFloat() * signTexts.length)];

      const signGroup = new THREE.Group();
      signGroup.name = `Sign_${chunkX}_${chunkZ}_${i}`;

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.1, 0.12, 4.0, 8);
      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = 2.0;
      pole.castShadow = true;
      signGroup.add(pole);

      // Signboard
      const boardGeo = new THREE.BoxGeometry(3.0, 1.2, 0.15);
      const board = new THREE.Mesh(boardGeo, boardMat);
      board.position.set(0, 3.8, 0);
      signGroup.add(board);

      signGroup.position.copy(pos);
      group.add(signGroup);

      const signObj: WorldSign = {
        id: `sign_${chunkX}_${chunkZ}_${i}`,
        position: pos.clone(),
        rotationY: rng.nextFloat() * Math.PI * 2,
        text,
        category
      };

      chunkSigns.push(signObj);
      this.signs.push(signObj);
    }

    return { group, signs: chunkSigns };
  }

  public querySignsNear(position: THREE.Vector3, radius: number): WorldSign[] {
    const result: WorldSign[] = [];
    const radiusSq = radius * radius;
    this.signs.forEach((s) => {
      if (s.position.distanceToSquared(position) <= radiusSq) {
        result.push(s);
      }
    });
    return result;
  }

  public clear(): void {
    this.signs = [];
  }
}
