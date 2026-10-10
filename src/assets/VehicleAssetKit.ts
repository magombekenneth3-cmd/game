import * as THREE from 'three';
import { VehicleCategory } from '../vehicles/VehicleTypes';
import { TextureGenerator } from './TextureGenerator';

export class VehicleAssetKit {
  /**
   * Generates a detailed, production-quality 3D vehicle mesh group.
   */
  public static createVehicleMesh(category: VehicleCategory, paintColor: number = 0x1e3a8a): THREE.Group {
    switch (category) {
      case 'matatu':
        return this.createMatatuMesh();
      case 'suv':
        return this.createSUVMesh(paintColor);
      case 'motorcycle':
        return this.createBodaBodaMesh();
      case 'truck':
        return this.createTruckMesh(paintColor);
      case 'sedan':
      default:
        return this.createSedanMesh(paintColor);
    }
  }

  // --- 1. MATATU (Japanese Microbus style with custom East African art decal) ---
  private static createMatatuMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MatatuMesh';

    // Body chassis mesh with Matatu Art Decal Texture
    const artDecal = TextureGenerator.createMatatuDecalTexture();
    const bodyMat = new THREE.MeshStandardMaterial({
      map: artDecal,
      metalness: 0.4,
      roughness: 0.3
    });

    const bodyGeo = new THREE.BoxGeometry(2.0, 1.8, 4.5);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // Windshield & Windows (Dielectric Automotive Glass)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.45,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05
    });
    const glassGeo = new THREE.BoxGeometry(1.9, 0.7, 1.2);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.5, 1.2);
    group.add(glass);

    // 4 Wheels
    this.attachWheels(group, 0.95, 2.2, 0.45);

    // Destination Signboard ("KILIMANI - CBD")
    const signMat = new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x0284c7, emissiveIntensity: 0.8 });
    const signGeo = new THREE.BoxGeometry(1.4, 0.25, 0.1);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.15, 2.0);
    group.add(sign);

    return group;
  }

  // --- 2. SEDAN ---
  private static createSedanMesh(color: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'SedanMesh';

    const paintMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.22 });

    // Lower chassis
    const bodyGeo = new THREE.BoxGeometry(1.8, 0.65, 4.2);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = 0.55;
    body.castShadow = true;
    group.add(body);

    // Cabin roof & glass
    const cabinGeo = new THREE.BoxGeometry(1.5, 0.55, 2.0);
    const cabin = new THREE.Mesh(cabinGeo, paintMat);
    cabin.position.set(0, 1.1, -0.2);
    cabin.castShadow = true;
    group.add(cabin);

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      roughness: 0.05,
      metalness: 0.0,
      transparent: true,
      opacity: 0.45,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05
    });
    const glassGeo = new THREE.BoxGeometry(1.52, 0.5, 1.9);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.12, -0.2);
    group.add(glass);

    this.attachWheels(group, 0.85, 2.0, 0.35);

    return group;
  }

  // --- 3. SUV ---
  private static createSUVMesh(color: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'SUVMesh';

    const paintMat = new THREE.MeshStandardMaterial({ color, metalness: 0.55, roughness: 0.22 });

    const bodyGeo = new THREE.BoxGeometry(2.1, 1.1, 4.6);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = 0.85;
    body.castShadow = true;
    group.add(body);

    // Roof rack & spare tire on rear
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const rackGeo = new THREE.BoxGeometry(1.6, 0.1, 2.8);
    const rack = new THREE.Mesh(rackGeo, rackMat);
    rack.position.set(0, 1.45, -0.2);
    group.add(rack);

    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const tireGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 12);
    const spareTire = new THREE.Mesh(tireGeo, tireMat);
    spareTire.rotation.z = Math.PI / 2;
    spareTire.position.set(0, 0.9, -2.4);
    group.add(spareTire);

    this.attachWheels(group, 1.0, 2.3, 0.45);

    return group;
  }

  // --- 4. BODA BODA (Motorcycle) ---
  private static createBodaBodaMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'BodaBodaMesh';

    const frameMat = new THREE.MeshStandardMaterial({ color: 0xd32f2f, metalness: 0.8, roughness: 0.3 });
    const tankGeo = new THREE.BoxGeometry(0.4, 0.35, 0.8);
    const tank = new THREE.Mesh(tankGeo, frameMat);
    tank.position.set(0, 0.65, 0);
    group.add(tank);

    const seatMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const seatGeo = new THREE.BoxGeometry(0.35, 0.15, 0.9);
    const seat = new THREE.Mesh(seatGeo, seatMat);
    seat.position.set(0, 0.72, -0.5);
    group.add(seat);

    // Wheels (Front & Rear)
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);

    const wheelFront = new THREE.Mesh(tireGeo, tireMat);
    wheelFront.rotation.z = Math.PI / 2;
    wheelFront.position.set(0, 0.35, 0.9);
    group.add(wheelFront);

    const wheelRear = new THREE.Mesh(tireGeo, tireMat);
    wheelRear.rotation.z = Math.PI / 2;
    wheelRear.position.set(0, 0.35, -0.9);
    group.add(wheelRear);

    return group;
  }

  // --- 5. TRUCK / BUS ---
  private static createTruckMesh(color: number): THREE.Group {
    const group = new THREE.Group();
    group.name = 'TruckMesh';

    const cabinMat = new THREE.MeshStandardMaterial({ color, metalness: 0.5, roughness: 0.4 });
    const cabinGeo = new THREE.BoxGeometry(2.4, 2.0, 2.2);
    const cabin = new THREE.Mesh(cabinGeo, cabinMat);
    cabin.position.set(0, 1.25, 2.2);
    cabin.castShadow = true;
    group.add(cabin);

    const cargoMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
    const cargoGeo = new THREE.BoxGeometry(2.5, 2.4, 5.0);
    const cargo = new THREE.Mesh(cargoGeo, cargoMat);
    cargo.position.set(0, 1.5, -1.2);
    cargo.castShadow = true;
    group.add(cargo);

    this.attachWheels(group, 1.2, 3.2, 0.55);

    return group;
  }

  private static attachWheels(group: THREE.Group, width: number, length: number, radius: number): void {
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 });
    const rimMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const tireGeo = new THREE.CylinderGeometry(radius, radius, 0.3, 16);
    const rimGeo = new THREE.CylinderGeometry(radius * 0.6, radius * 0.6, 0.32, 12);

    const wheelOffsets = [
      [-width, radius, length / 2],
      [width, radius, length / 2],
      [-width, radius, -length / 2],
      [width, radius, -length / 2]
    ];

    wheelOffsets.forEach(([x, y, z]) => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(x, y, z);
      wheelGroup.rotation.z = Math.PI / 2;

      const tire = new THREE.Mesh(tireGeo, tireMat);
      const rim = new THREE.Mesh(rimGeo, rimMat);
      wheelGroup.add(tire);
      wheelGroup.add(rim);

      group.add(wheelGroup);
    });
  }
}
