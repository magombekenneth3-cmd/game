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

    // Super Metro Authentic Rear Livery Panel (KDG 842P, route header, taillights)
    const rearTex = TextureGenerator.createSuperMetroRearTexture();
    const rearMat = new THREE.MeshStandardMaterial({
      map: rearTex,
      roughness: 0.3,
      metalness: 0.1
    });
    const rearPanel = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.76), rearMat);
    rearPanel.name = 'SuperMetro_RearLivery';
    rearPanel.position.set(0, 1.1, -2.256);
    rearPanel.rotation.y = Math.PI;
    group.add(rearPanel);

    // 4 Wheels
    this.attachWheels(group, 0.95, 2.2, 0.45);

    // Destination Signboard ("SUPER METRO • CBD EXPRESS")
    const signMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xfbbf24, emissiveIntensity: 0.85 });
    const signGeo = new THREE.BoxGeometry(1.4, 0.25, 0.1);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.15, 2.0);
    group.add(sign);

    VehicleAssetKit.attachVehicleLights(group, 2.0, 4.5, 0.95);

    // Front Chrome Bull-Bar & Kenyan Yellow License Plate
    const bullBarMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.15 });
    const bullBar = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.35, 0.08), bullBarMat);
    bullBar.position.set(0, 0.5, 2.29);
    group.add(bullBar);

    const plateMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const frontPlate = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.02), plateMat);
    frontPlate.position.set(0, 0.45, 2.34);
    group.add(frontPlate);

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
    VehicleAssetKit.attachVehicleLights(group, 1.8, 4.2, 0.52);

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
    VehicleAssetKit.attachVehicleLights(group, 2.1, 4.6, 0.80);

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
    VehicleAssetKit.attachVehicleLights(group, 2.4, 7.2, 1.20);

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

  /**
   * Phase 12.5: Attach vehicle light lenses to a vehicle mesh group.
   * Creates named Mesh children so VehicleLightSystem can toggle emissive state.
   *
   * Named children added:
   *  HeadlightL / HeadlightR  — white, front
   *  BrakelightL / BrakelightR — red, rear
   *  IndicatorFL / IndicatorFR — amber, front corners
   *  IndicatorRL / IndicatorRR — amber, rear corners
   *
   * @param bodyWidth   Overall vehicle body width in metres
   * @param bodyLength  Overall vehicle body length in metres
   * @param mountHeight Y centre of the light cluster (typically 0.5–1.1m)
   */
  public static attachVehicleLights(
    group: THREE.Group,
    bodyWidth: number,
    bodyLength: number,
    mountHeight: number
  ): void {
    const halfW  = bodyWidth  / 2 - 0.12;
    const halfL  = bodyLength / 2 - 0.06;
    const h      = mountHeight;

    // -- Materials (base emissiveIntensity = 0 = off) --
    const headMat = new THREE.MeshStandardMaterial({
      color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0,
      roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.90
    });
    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0xcc0000, emissive: 0xff2200, emissiveIntensity: 0,
      roughness: 0.1, metalness: 0.1,
      transparent: true, opacity: 0.88
    });
    const indicatorMat = new THREE.MeshStandardMaterial({
      color: 0xe08000, emissive: 0xff9900, emissiveIntensity: 0,
      roughness: 0.15, metalness: 0.0,
      transparent: true, opacity: 0.85
    });

    const lensGeo = new THREE.BoxGeometry(0.22, 0.10, 0.04);
    const indGeo  = new THREE.BoxGeometry(0.12, 0.08, 0.04);

    const make = (name: string, mat: THREE.MeshStandardMaterial, geo: THREE.BufferGeometry, x: number, y: number, z: number): THREE.Mesh => {
      const m = new THREE.Mesh(geo, mat.clone()); // clone so each lens is independently addressable
      m.name = name;
      m.position.set(x, y, z);
      return m;
    };

    // Headlights — front face
    group.add(make('HeadlightL',    headMat, lensGeo, -halfW, h,  halfL));
    group.add(make('HeadlightR',    headMat, lensGeo,  halfW, h,  halfL));

    // Brake lights — rear face
    group.add(make('BrakelightL',   brakeMat, lensGeo, -halfW, h, -halfL));
    group.add(make('BrakelightR',   brakeMat, lensGeo,  halfW, h, -halfL));

    // Indicators — front corners
    group.add(make('IndicatorFL',   indicatorMat, indGeo, -halfW - 0.05, h,  halfL - 0.05));
    group.add(make('IndicatorFR',   indicatorMat, indGeo,  halfW + 0.05, h,  halfL - 0.05));

    // Indicators — rear corners
    group.add(make('IndicatorRL',   indicatorMat, indGeo, -halfW - 0.05, h, -halfL + 0.05));
    group.add(make('IndicatorRR',   indicatorMat, indGeo,  halfW + 0.05, h, -halfL + 0.05));
  }
}

// ---------------------------------------------------------------------------
// VehicleLightSystem — Phase 12.5
// Drives headlight, brake light, and turn indicator emissive state at runtime.
// Call update() once per frame from TrafficController or VehiclePhysics.
// ---------------------------------------------------------------------------

export type TurnSignalState = 'off' | 'left' | 'right' | 'hazard';

export class VehicleLightSystem {
  private vehicleGroup: THREE.Group;
  private headlightsOn: boolean = false;
  private brakeLightsOn: boolean = false;
  private turnSignal: TurnSignalState = 'off';
  private blinkTimer: number = 0;
  private blinkOn: boolean = false;

  /** Blink period: Kenyan highway code = 60 blinks per minute = 0.5s per cycle */
  static readonly BLINK_PERIOD = 0.5;

  constructor(vehicleGroup: THREE.Group) {
    this.vehicleGroup = vehicleGroup;
  }

  public setHeadlights(on: boolean): void { this.headlightsOn = on; }
  public setBrakeLights(on: boolean): void { this.brakeLightsOn = on; }
  public setTurnSignal(state: TurnSignalState): void { this.turnSignal = state; }

  public update(deltaSeconds: number): void {
    // Advance blink timer
    this.blinkTimer += deltaSeconds;
    if (this.blinkTimer >= VehicleLightSystem.BLINK_PERIOD / 2) {
      this.blinkTimer = 0;
      this.blinkOn = !this.blinkOn;
    }

    // Headlights
    this.setLensEmissive('HeadlightL', this.headlightsOn ? 1.6 : 0);
    this.setLensEmissive('HeadlightR', this.headlightsOn ? 1.6 : 0);

    // Brake lights
    const brakeIntensity = this.brakeLightsOn ? 2.4 : (this.headlightsOn ? 0.4 : 0);
    this.setLensEmissive('BrakelightL', brakeIntensity);
    this.setLensEmissive('BrakelightR', brakeIntensity);

    // Turn indicators
    const leftActive  = this.turnSignal === 'left'   || this.turnSignal === 'hazard';
    const rightActive = this.turnSignal === 'right'  || this.turnSignal === 'hazard';
    const blink       = this.blinkOn ? 2.0 : 0;

    this.setLensEmissive('IndicatorFL', leftActive  ? blink : 0);
    this.setLensEmissive('IndicatorRL', leftActive  ? blink : 0);
    this.setLensEmissive('IndicatorFR', rightActive ? blink : 0);
    this.setLensEmissive('IndicatorRR', rightActive ? blink : 0);
  }

  private setLensEmissive(name: string, intensity: number): void {
    const lens = this.vehicleGroup.getObjectByName(name) as THREE.Mesh | undefined;
    if (!lens) return;
    const mat = lens.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = intensity;
    mat.needsUpdate = false; // emissiveIntensity change doesn't need full recompile
  }
}

