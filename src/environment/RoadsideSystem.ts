import * as THREE from 'three';
import { EnvironmentObject, EnvironmentActivityTag } from './EnvironmentTypes';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { SeededRandom } from '../utils/SeededRandom';

export class RoadsideSystem {
  private assetManager: AssetManager;
  private objects: EnvironmentObject[] = [];

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public generateRoadsideProps(
    chunkX: number,
    chunkZ: number,
    roadPositions: THREE.Vector3[] = [],
    chunkSize: number = 100.0,
    seed: number = 1337
  ): { group: THREE.Group; envObjects: EnvironmentObject[] } {
    const group = new THREE.Group();
    group.name = `RoadsideGroup_${chunkX}_${chunkZ}`;

    const chunkSeed = seed + chunkX * 31337 ^ chunkZ * 54321;
    const rng = new SeededRandom(chunkSeed);
    const envObjects: EnvironmentObject[] = [];

    const minX = chunkX * chunkSize;
    const minZ = chunkZ * chunkSize;

    // 1. Roadside Kiosks & Produce Stalls (Mama Mboga / M-Pesa Kiosks)
    const kioskCount = Math.floor(rng.nextFloat() * 4) + 1;
    for (let i = 0; i < kioskCount; i++) {
      const posX = minX + 10 + rng.nextFloat() * (chunkSize - 20);
      const posZ = minZ + 10 + rng.nextFloat() * (chunkSize - 20);
      const pos = new THREE.Vector3(posX, 0.3, posZ);

      const isFood = rng.nextFloat() < 0.5;
      const tags: EnvironmentActivityTag[] = isFood ? ['FOOD', 'SOCIAL'] : ['SHOPPING', 'SERVICES'];

      const kioskGroup = isFood
        ? AssetPipeline.getInstance().getMamaMbogaStallMesh()
        : AssetPipeline.getInstance().getMPesaKioskMesh();

      kioskGroup.position.copy(pos);
      kioskGroup.rotation.y = rng.nextFloat() * Math.PI * 2;
      group.add(kioskGroup);

      const obj: EnvironmentObject = {
        id: `kiosk_${chunkX}_${chunkZ}_${i}`,
        category: isFood ? 'food_stall' : 'electronics_kiosk',
        position: pos.clone(),
        rotationY: rng.nextFloat() * Math.PI * 2,
        scale: new THREE.Vector3(1, 1, 1),
        tags
      };

      envObjects.push(obj);
      this.objects.push(obj);
    }

    // 2. Open Drainage Channels & Curbs along Roads
    roadPositions.forEach((roadPos, idx) => {
      const drainMat = this.assetManager.getMaterial('sidewalk_concrete');
      const drainGeo = new THREE.BoxGeometry(0.6, 0.4, 6.0);
      const drain = new THREE.Mesh(drainGeo, drainMat);
      drain.name = 'Detail_DrainageChannel';
      drain.position.set(roadPos.x + 4.5, 0.2, roadPos.z);
      group.add(drain);

      // Zebra Crossing
      if (idx % 3 === 0) {
        const zebraMat = this.assetManager.getMaterial('sidewalk_concrete');
        const zebraGeo = new THREE.BoxGeometry(6.0, 0.05, 3.0);
        const zebra = new THREE.Mesh(zebraGeo, zebraMat);
        zebra.name = 'Detail_ZebraCrossing';
        zebra.position.set(roadPos.x, 0.32, roadPos.z);
        group.add(zebra);

        envObjects.push({
          id: `crossing_${chunkX}_${chunkZ}_${idx}`,
          category: 'pedestrian_crossing',
          position: roadPos.clone(),
          rotationY: 0,
          scale: new THREE.Vector3(1, 1, 1),
          tags: ['TRANSIT']
        });
      }
    });

    return { group, envObjects };
  }

  public queryActivityLocations(
    center: THREE.Vector3,
    radius: number,
    tag?: EnvironmentActivityTag
  ): EnvironmentObject[] {
    const result: EnvironmentObject[] = [];
    const radiusSq = radius * radius;

    this.objects.forEach((obj) => {
      if (obj.position.distanceToSquared(center) <= radiusSq) {
        if (!tag || obj.tags.includes(tag)) {
          result.push(obj);
        }
      }
    });

    return result;
  }

  public clear(): void {
    this.objects = [];
  }
}
