import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';

export class TestSceneGenerator {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private streetPointLights: THREE.PointLight[] = [];

  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
  }

  public generate(): void {
    this.createGround();
    this.createRoadNetwork();
    this.createSidewalks();
    this.createModularBuildings();
    this.createVegetation();
    this.createStreetlights();
    this.createPlaceholderVehicle();
    this.createPlaceholderNPCs();
  }

  private createGround(): void {
    const groundGeo = new THREE.PlaneGeometry(300, 300);
    const groundMat = this.assetManager.getMaterial('ground_earth');
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  private createRoadNetwork(): void {
    // 2-lane asphalt road segment running along Z-axis
    const roadGeo = new THREE.PlaneGeometry(16, 200);
    const roadMat = this.assetManager.getMaterial('road_asphalt');
    
    // Configure repeat for road markings
    const textureMat = roadMat as THREE.MeshStandardMaterial;
    if (textureMat.map) {
      textureMat.map.repeat.set(1, 10);
    }

    const road = new THREE.Mesh(roadGeo, roadMat);
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0, 0);
    road.receiveShadow = true;
    this.scene.add(road);
  }

  private createSidewalks(): void {
    const sidewalkGeo = new THREE.BoxGeometry(4, 0.3, 200);
    const sidewalkMat = this.assetManager.getMaterial('sidewalk_concrete');

    // Left Sidewalk
    const leftSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    leftSidewalk.position.set(-10, 0.15, 0);
    leftSidewalk.receiveShadow = true;
    leftSidewalk.castShadow = true;
    this.scene.add(leftSidewalk);

    // Right Sidewalk
    const rightSidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    rightSidewalk.position.set(10, 0.15, 0);
    rightSidewalk.receiveShadow = true;
    rightSidewalk.castShadow = true;
    this.scene.add(rightSidewalk);
  }

  private createModularBuildings(): void {
    const facadeMaterials = [
      'facade_terracotta',
      'facade_ochre',
      'facade_sandstone',
      'facade_white',
      'facade_teal',
      'facade_charcoal'
    ];

    const glassMat = this.assetManager.getMaterial('building_glass');

    // 16 modular buildings placed along left and right sidewalk blocks
    const buildingPositions = [
      // Left side (x = -22)
      { x: -22, z: -80, w: 16, h: 18, d: 18, mat: 0 },
      { x: -22, z: -55, w: 14, h: 26, d: 16, mat: 1 },
      { x: -22, z: -30, w: 18, h: 12, d: 16, mat: 2 },
      { x: -22, z: -5,  w: 16, h: 32, d: 18, mat: 3 }, // High-rise tower
      { x: -22, z: 20,  w: 15, h: 15, d: 16, mat: 4 },
      { x: -22, z: 45,  w: 16, h: 22, d: 16, mat: 5 },
      { x: -22, z: 70,  w: 14, h: 10, d: 14, mat: 0 },

      // Right side (x = 22)
      { x: 22, z: -80, w: 16, h: 14, d: 18, mat: 3 },
      { x: 22, z: -55, w: 18, h: 35, d: 16, mat: 4 }, // Commercial landmark tower
      { x: 22, z: -30, w: 15, h: 20, d: 16, mat: 5 },
      { x: 22, z: -5,  w: 16, h: 16, d: 18, mat: 0 },
      { x: 22, z: 20,  w: 14, h: 28, d: 16, mat: 1 },
      { x: 22, z: 45,  w: 18, h: 12, d: 16, mat: 2 },
      { x: 22, z: 70,  w: 16, h: 18, d: 16, mat: 3 }
    ];

    buildingPositions.forEach((b) => {
      const bGroup = new THREE.Group();

      // Main structural block
      const bodyGeo = new THREE.BoxGeometry(b.w, b.h, b.d);
      const facadeMat = this.assetManager.getMaterial(facadeMaterials[b.mat]);
      const bodyMesh = new THREE.Mesh(bodyGeo, facadeMat);
      bodyMesh.position.y = b.h / 2 + 0.3;
      bodyMesh.castShadow = true;
      bodyMesh.receiveShadow = true;
      bGroup.add(bodyMesh);

      // Glass storefront / window bands
      const windowGeo = new THREE.BoxGeometry(b.w + 0.2, 2.5, b.d + 0.2);
      const windowBand1 = new THREE.Mesh(windowGeo, glassMat);
      windowBand1.position.y = 2.0;
      bGroup.add(windowBand1);

      if (b.h > 15) {
        const windowBand2 = new THREE.Mesh(windowGeo, glassMat);
        windowBand2.position.y = b.h * 0.6;
        bGroup.add(windowBand2);
      }

      // Roof ledge element
      const roofGeo = new THREE.BoxGeometry(b.w + 0.8, 0.6, b.d + 0.8);
      const roofMesh = new THREE.Mesh(roofGeo, facadeMat);
      roofMesh.position.y = b.h + 0.6;
      roofMesh.castShadow = true;
      bGroup.add(roofMesh);

      bGroup.position.set(b.x, 0, b.z);
      this.scene.add(bGroup);
    });
  }

  private createVegetation(): void {
    const treePositions = [
      { x: -10.5, z: -70 }, { x: -10.5, z: -40 }, { x: -10.5, z: -10 },
      { x: -10.5, z: 20 },  { x: -10.5, z: 50 },  { x: -10.5, z: 80 },
      { x: 10.5,  z: -60 }, { x: 10.5,  z: -30 }, { x: 10.5,  z: 0 },
      { x: 10.5,  z: 30 },  { x: 10.5,  z: 60 }
    ];

    const woodMat = this.assetManager.getMaterial('tree_wood');
    const foliageMat = this.assetManager.getMaterial('foliage_green');

    treePositions.forEach((pos) => {
      const treeGroup = new THREE.Group();

      // Trunk
      const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
      const trunk = new THREE.Mesh(trunkGeo, woodMat);
      trunk.position.y = 2;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      // Umbrella Acacia Crown
      const crownGeo = new THREE.CylinderGeometry(4.5, 1.0, 1.5, 8);
      const crown = new THREE.Mesh(crownGeo, foliageMat);
      crown.position.y = 4.5;
      crown.castShadow = true;
      treeGroup.add(crown);

      treeGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(treeGroup);
    });
  }

  private createStreetlights(): void {
    const lightPositions = [
      { x: -9, z: -65 }, { x: -9, z: -25 }, { x: -9, z: 15 }, { x: -9, z: 55 },
      { x: 9,  z: -45 }, { x: 9,  z: -5 },  { x: 9,  z: 35 }, { x: 9,  z: 75 }
    ];

    const metalMat = this.assetManager.getMaterial('facade_charcoal');
    const bulbMat = this.assetManager.getMaterial('streetlight_emissive');

    lightPositions.forEach((pos) => {
      const lightGroup = new THREE.Group();

      // Pole
      const poleGeo = new THREE.CylinderGeometry(0.12, 0.18, 6.5, 8);
      const pole = new THREE.Mesh(poleGeo, metalMat);
      pole.position.y = 3.25;
      pole.castShadow = true;
      lightGroup.add(pole);

      // Arm
      const armGeo = new THREE.BoxGeometry(1.5, 0.1, 0.1);
      const arm = new THREE.Mesh(armGeo, metalMat);
      arm.position.set(pos.x < 0 ? 0.6 : -0.6, 6.4, 0);
      lightGroup.add(arm);

      // Bulb Mesh
      const bulbGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.set(pos.x < 0 ? 1.2 : -1.2, 6.2, 0);
      lightGroup.add(bulb);

      // Point Light for Night Illumination
      const pLight = new THREE.PointLight(0xffaa44, 0, 18);
      pLight.position.set(pos.x < 0 ? 1.2 : -1.2, 6.0, 0);
      lightGroup.add(pLight);
      this.streetPointLights.push(pLight);

      lightGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(lightGroup);
    });
  }

  private createPlaceholderVehicle(): void {
    // Fictional African Matatu / Minibus
    const vehicleGroup = new THREE.Group();

    const bodyMat = this.assetManager.getMaterial('matatu_yellow');
    const glassMat = this.assetManager.getMaterial('building_glass');
    const tireMat = this.assetManager.getMaterial('vehicle_tire');

    // Main Body Box
    const bodyGeo = new THREE.BoxGeometry(2.4, 2.2, 5.2);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.6;
    body.castShadow = true;
    body.receiveShadow = true;
    vehicleGroup.add(body);

    // Windshield & Windows
    const windowGeo = new THREE.BoxGeometry(2.42, 0.9, 3.2);
    const windows = new THREE.Mesh(windowGeo, glassMat);
    windows.position.set(0, 1.9, 0.5);
    vehicleGroup.add(windows);

    // Wheels
    const tireGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 16);
    tireGeo.rotateZ(Math.PI / 2);

    const wheelPositions = [
      { x: -1.2, y: 0.45, z: 1.6 },
      { x: 1.2,  y: 0.45, z: 1.6 },
      { x: -1.2, y: 0.45, z: -1.6 },
      { x: 1.2,  y: 0.45, z: -1.6 }
    ];

    wheelPositions.forEach((wp) => {
      const wheel = new THREE.Mesh(tireGeo, tireMat);
      wheel.position.set(wp.x, wp.y, wp.z);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
    });

    vehicleGroup.position.set(4, 0.3, -15);
    this.scene.add(vehicleGroup);
  }

  private createPlaceholderNPCs(): void {
    const npcColors = [0xE53935, 0x1E88E5, 0x43A047, 0xFB8C00, 0x8E24AA, 0x00ACC1];
    const npcPositions = [
      { x: -9.5, z: -20 }, { x: -9.2, z: 5 },   { x: -9.8, z: 30 },
      { x: 9.5,  z: -35 }, { x: 9.2,  z: -10 }, { x: 9.6,  z: 40 }
    ];

    npcPositions.forEach((pos, idx) => {
      const npcGroup = new THREE.Group();

      const mat = new THREE.MeshStandardMaterial({
        color: npcColors[idx % npcColors.length],
        roughness: 0.5
      });

      // Character Capsule Body
      const capsuleGeo = new THREE.CapsuleGeometry(0.4, 1.0, 8, 16);
      const capsule = new THREE.Mesh(capsuleGeo, mat);
      capsule.position.y = 0.9;
      capsule.castShadow = true;
      npcGroup.add(capsule);

      // Head
      const headGeo = new THREE.SphereGeometry(0.25, 12, 12);
      const headMat = new THREE.MeshStandardMaterial({ color: 0x4E3629, roughness: 0.8 });
      const head = new THREE.Mesh(headGeo, headMat);
      head.position.y = 1.7;
      head.castShadow = true;
      npcGroup.add(head);

      npcGroup.position.set(pos.x, 0.3, pos.z);
      this.scene.add(npcGroup);
    });
  }

  public updateStreetlights(on: boolean): void {
    this.assetManager.updateStreetlightsEmissive(on);
    this.streetPointLights.forEach((pl) => {
      pl.intensity = on ? 4.0 : 0.0;
    });
  }
}
