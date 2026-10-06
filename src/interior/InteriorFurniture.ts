import * as THREE from 'three';
import { BuildingClassification, InteriorRoom } from './InteriorTypes';
import { AssetManager } from '../engine/AssetManager';

export class InteriorFurnitureSystem {
  public static populateFurniture(
    parentGroup: THREE.Group,
    _category: BuildingClassification,
    rooms: InteriorRoom[],
    _assetManager?: AssetManager
  ): number {
    let furnitureCount = 0;

    rooms.forEach((room) => {
      const center = new THREE.Vector3();
      room.bounds.getCenter(center);
      const min = room.bounds.min;
      const max = room.bounds.max;
      const width = max.x - min.x;
      const depth = max.z - min.z;
      const floorY = min.y + 0.05;

      switch (room.type) {
        case 'BEDROOM':
          furnitureCount += this.createBed(parentGroup, new THREE.Vector3(min.x + 2, floorY, min.z + 2));
          furnitureCount += this.createWardrobe(parentGroup, new THREE.Vector3(max.x - 1.5, floorY, min.z + 2));
          break;

        case 'LIVING_ROOM':
          furnitureCount += this.createSofa(parentGroup, new THREE.Vector3(center.x, floorY, min.z + 2));
          furnitureCount += this.createTVUnit(parentGroup, new THREE.Vector3(center.x, floorY, max.z - 1.5));
          furnitureCount += this.createTableWithChairs(parentGroup, new THREE.Vector3(min.x + 2.5, floorY, center.z));
          break;

        case 'KITCHEN':
          furnitureCount += this.createCounter(parentGroup, new THREE.Vector3(min.x + 2, floorY, min.z + 1.5), width - 3);
          break;

        case 'SHOP_FLOOR':
          furnitureCount += this.createShelves(parentGroup, new THREE.Vector3(min.x + 1.5, floorY, min.z + 2));
          furnitureCount += this.createShelves(parentGroup, new THREE.Vector3(max.x - 1.5, floorY, min.z + 2));
          furnitureCount += this.createDisplayIsland(parentGroup, new THREE.Vector3(center.x, floorY, center.z));
          break;

        case 'RECEPTION':
          furnitureCount += this.createCheckoutCounter(parentGroup, new THREE.Vector3(center.x, floorY, min.z + 1.5));
          break;

        case 'DINING':
          furnitureCount += this.createTableWithChairs(parentGroup, new THREE.Vector3(min.x + 3, floorY, min.z + 3));
          furnitureCount += this.createTableWithChairs(parentGroup, new THREE.Vector3(max.x - 3, floorY, min.z + 3));
          furnitureCount += this.createTableWithChairs(parentGroup, new THREE.Vector3(center.x, floorY, max.z - 3));
          break;

        case 'BAR':
          furnitureCount += this.createBarCounter(parentGroup, new THREE.Vector3(min.x + 1.5, floorY, center.z), depth - 3);
          break;

        case 'MAIN_FLOOR':
        case 'DANCE_FLOOR':
          furnitureCount += this.createDanceFloorPlatform(parentGroup, new THREE.Vector3(center.x, floorY, center.z), width * 0.7, depth * 0.7);
          break;

        case 'DJ_BOOTH':
          furnitureCount += this.createDJBooth(parentGroup, new THREE.Vector3(center.x, floorY, center.z));
          break;

        case 'VIP':
        case 'SEATING':
          furnitureCount += this.createVIPLoungeSeating(parentGroup, new THREE.Vector3(center.x, floorY, center.z));
          break;

        case 'OFFICE':
          furnitureCount += this.createOfficeDesk(parentGroup, new THREE.Vector3(center.x, floorY, center.z));
          break;

        case 'GARAGE':
        case 'WORKSHOP':
          furnitureCount += this.createWorkbench(parentGroup, new THREE.Vector3(min.x + 2, floorY, min.z + 2));
          furnitureCount += this.createVehicleLiftBay(parentGroup, new THREE.Vector3(center.x, floorY, center.z));
          break;

        case 'GYM_FLOOR':
          furnitureCount += this.createGymBenches(parentGroup, new THREE.Vector3(min.x + 3, floorY, min.z + 3));
          furnitureCount += this.createTreadmills(parentGroup, new THREE.Vector3(max.x - 3, floorY, min.z + 3));
          break;

        case 'WAREHOUSE':
          furnitureCount += this.createPalletRacks(parentGroup, new THREE.Vector3(min.x + 3, floorY, center.z), depth - 4);
          furnitureCount += this.createPalletRacks(parentGroup, new THREE.Vector3(max.x - 3, floorY, center.z), depth - 4);
          break;
      }
    });

    return furnitureCount;
  }

  // --- Specific Furniture Creators ---

  private static createBed(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const frameGeo = new THREE.BoxGeometry(1.6, 0.4, 2.0);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.8 });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.y = 0.2;
    group.add(frameMesh);

    const matGeo = new THREE.BoxGeometry(1.5, 0.25, 1.9);
    const matMat = new THREE.MeshStandardMaterial({ color: 0xf5f5f5, roughness: 0.4 });
    const matMesh = new THREE.Mesh(matGeo, matMat);
    matMesh.position.y = 0.525;
    group.add(matMesh);

    parent.add(group);
    return 2;
  }

  private static createWardrobe(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(1.2, 2.0, 0.6);
    const mat = new THREE.MeshStandardMaterial({ color: 0x3e2723, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 1.0, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createSofa(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const baseGeo = new THREE.BoxGeometry(2.0, 0.4, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x1565c0, roughness: 0.6 });
    const baseMesh = new THREE.Mesh(baseGeo, mat);
    baseMesh.position.y = 0.2;
    group.add(baseMesh);

    const backGeo = new THREE.BoxGeometry(2.0, 0.6, 0.2);
    const backMesh = new THREE.Mesh(backGeo, mat);
    backMesh.position.set(0, 0.7, -0.3);
    group.add(backMesh);

    parent.add(group);
    return 2;
  }

  private static createTVUnit(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const standGeo = new THREE.BoxGeometry(1.8, 0.5, 0.4);
    const standMat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.5 });
    const standMesh = new THREE.Mesh(standGeo, standMat);
    standMesh.position.y = 0.25;
    group.add(standMesh);

    const tvGeo = new THREE.BoxGeometry(1.4, 0.8, 0.08);
    const tvMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 0.2, metalness: 0.8 });
    const tvMesh = new THREE.Mesh(tvGeo, tvMat);
    tvMesh.position.set(0, 1.15, 0);
    group.add(tvMesh);

    parent.add(group);
    return 2;
  }

  private static createTableWithChairs(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const tableTopGeo = new THREE.BoxGeometry(1.2, 0.08, 1.2);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x5d4037, roughness: 0.6 });
    const tableTop = new THREE.Mesh(tableTopGeo, tableMat);
    tableTop.position.y = 0.75;
    group.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.7, 8);
    const legPositions = [
      [-0.5, 0.35, -0.5], [0.5, 0.35, -0.5],
      [-0.5, 0.35, 0.5], [0.5, 0.35, 0.5]
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, tableMat);
      leg.position.set(x, y, z);
      group.add(leg);
    });

    parent.add(group);
    return 5;
  }

  private static createCounter(parent: THREE.Group, pos: THREE.Vector3, length: number): number {
    const geo = new THREE.BoxGeometry(length, 0.9, 0.7);
    const mat = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x + length / 2, pos.y + 0.45, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createShelves(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(0.6, 2.2, 1.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x795548, roughness: 0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 1.1, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createDisplayIsland(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(2.0, 1.0, 1.2);
    const mat = new THREE.MeshStandardMaterial({ color: 0x00bcd4, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.5, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createCheckoutCounter(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const deskGeo = new THREE.BoxGeometry(1.6, 0.95, 0.8);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x37474f, roughness: 0.5 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.475;
    group.add(desk);

    const regGeo = new THREE.BoxGeometry(0.4, 0.3, 0.4);
    const regMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 });
    const reg = new THREE.Mesh(regGeo, regMat);
    reg.position.set(0.3, 1.1, 0);
    group.add(reg);

    parent.add(group);
    return 2;
  }

  private static createBarCounter(parent: THREE.Group, pos: THREE.Vector3, length: number): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const barGeo = new THREE.BoxGeometry(0.8, 1.1, length);
    const barMat = new THREE.MeshStandardMaterial({ color: 0x8d6e63, roughness: 0.4, metalness: 0.2 });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.position.set(0, 0.55, length / 2);
    group.add(bar);

    const stoolCount = Math.floor(length / 1.2);
    for (let i = 0; i < stoolCount; i++) {
      const stoolGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.75, 12);
      const stoolMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.6 });
      const stool = new THREE.Mesh(stoolGeo, stoolMat);
      stool.position.set(0.7, 0.375, 0.8 + i * 1.2);
      group.add(stool);
    }

    parent.add(group);
    return 1 + stoolCount;
  }

  private static createDanceFloorPlatform(parent: THREE.Group, pos: THREE.Vector3, width: number, depth: number): number {
    const geo = new THREE.BoxGeometry(width, 0.05, depth);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x111122,
      roughness: 0.1,
      metalness: 0.9,
      emissive: 0x001133,
      emissiveIntensity: 0.3
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.025, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createDJBooth(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const deskGeo = new THREE.BoxGeometry(2.2, 1.1, 0.9);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.55;
    group.add(desk);

    const deckGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 16);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0xff0055, emissive: 0x330011 });
    const deck1 = new THREE.Mesh(deckGeo, deckMat);
    deck1.position.set(-0.6, 1.125, 0);
    group.add(deck1);

    const deck2 = new THREE.Mesh(deckGeo, deckMat);
    deck2.position.set(0.6, 1.125, 0);
    group.add(deck2);

    parent.add(group);
    return 3;
  }

  private static createVIPLoungeSeating(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const benchGeo = new THREE.BoxGeometry(2.6, 0.5, 1.0);
    const benchMat = new THREE.MeshStandardMaterial({ color: 0x880e4f, roughness: 0.5 });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.y = 0.25;
    group.add(bench);

    const tableGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.45, 16);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.2 });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.225, 1.2);
    group.add(table);

    parent.add(group);
    return 2;
  }

  private static createOfficeDesk(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const deskGeo = new THREE.BoxGeometry(1.6, 0.75, 0.8);
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x455a64, roughness: 0.6 });
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.375;
    group.add(desk);

    const chairGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.8, 12);
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x212121 });
    const chair = new THREE.Mesh(chairGeo, chairMat);
    chair.position.set(0, 0.4, -0.6);
    group.add(chair);

    parent.add(group);
    return 2;
  }

  private static createWorkbench(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(2.0, 0.9, 0.8);
    const mat = new THREE.MeshStandardMaterial({ color: 0x37474f, metalness: 0.5, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.45, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createVehicleLiftBay(parent: THREE.Group, pos: THREE.Vector3): number {
    const group = new THREE.Group();
    group.position.copy(pos);

    const postGeo = new THREE.BoxGeometry(0.3, 2.5, 0.3);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, roughness: 0.5 });
    const post1 = new THREE.Mesh(postGeo, postMat);
    post1.position.set(-1.5, 1.25, 0);
    group.add(post1);

    const post2 = new THREE.Mesh(postGeo, postMat);
    post2.position.set(1.5, 1.25, 0);
    group.add(post2);

    parent.add(group);
    return 2;
  }

  private static createGymBenches(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(1.2, 0.45, 0.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x212121, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.225, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createTreadmills(parent: THREE.Group, pos: THREE.Vector3): number {
    const geo = new THREE.BoxGeometry(0.8, 1.2, 1.5);
    const mat = new THREE.MeshStandardMaterial({ color: 0x424242, metalness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 0.6, pos.z);
    parent.add(mesh);
    return 1;
  }

  private static createPalletRacks(parent: THREE.Group, pos: THREE.Vector3, length: number): number {
    const geo = new THREE.BoxGeometry(0.8, 3.5, length);
    const mat = new THREE.MeshStandardMaterial({ color: 0xff6f00, metalness: 0.7, roughness: 0.4 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos.x, pos.y + 1.75, pos.z);
    parent.add(mesh);
    return 1;
  }
}
