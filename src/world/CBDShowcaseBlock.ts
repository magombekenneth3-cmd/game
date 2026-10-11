import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { BuildingData } from './BuildingData';
import { BuildingAssetKit } from '../assets/BuildingAssetKit';
import { EnvironmentAssetKit } from '../assets/EnvironmentAssetKit';

export class CBDShowcaseBlock {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private buildings: BuildingData[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.group = new THREE.Group();
    this.group.name = 'NairobiCBD_ShowcaseBlock';
  }

  /**
   * Builds the authentic Nairobi CBD Showcase Block along Kenyatta Avenue (X = 0, Z = -30 to 55).
   * Generates continuous commercial street walls, ground-floor active shops with awnings,
   * seamless Cabro paving promenades, street trees in iron grates, traffic signals,
   * street name posts, and a dedicated Matatu Stage.
   */
  public generate(): { buildings: BuildingData[]; group: THREE.Group } {
    this.createContinuousCabroPromenades();
    this.createStreetWallBuildings();
    this.createStreetFurniture();
    this.createMatatuStage();

    this.scene.add(this.group);
    return { buildings: this.buildings, group: this.group };
  }

  /**
   * Creates seamless Cabro paver promenades extending from road curbs to building facades.
   * Eliminates dirt gaps and creates authentic pedestrian walkways.
   */
  private createContinuousCabroPromenades(): void {
    const cabroMat = this.assetManager.getMaterial('sidewalk_cabro') || this.assetManager.getMaterial('sidewalk_concrete');

    // West Promenade (X: -26 to -7.3, Z: -30 to 55)
    const westGeo = new THREE.PlaneGeometry(18.5, 85);
    westGeo.rotateX(-Math.PI / 2);
    const westMesh = new THREE.Mesh(westGeo, cabroMat);
    westMesh.name = 'CBD_Promenade_West';
    westMesh.position.set(-16.5, 0.20, 12.5);
    westMesh.receiveShadow = true;
    this.group.add(westMesh);

    // East Promenade (X: 7.3 to 26, Z: -30 to 55)
    const eastGeo = new THREE.PlaneGeometry(18.5, 85);
    eastGeo.rotateX(-Math.PI / 2);
    const eastMesh = new THREE.Mesh(eastGeo, cabroMat);
    eastMesh.name = 'CBD_Promenade_East';
    eastMesh.position.set(16.5, 0.20, 12.5);
    eastMesh.receiveShadow = true;
    this.group.add(eastMesh);

    // Mid-block Pedestrian Zebra Crossing (Z = 12, width 14m across carriageway)
    const zebraWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    for (let s = -6.0; s <= 6.0; s += 1.2) {
      const stripeGeo = new THREE.BoxGeometry(0.7, 0.02, 3.2);
      const stripe = new THREE.Mesh(stripeGeo, zebraWhiteMat);
      stripe.position.set(s, 0.07, 12.0);
      stripe.receiveShadow = true;
      this.group.add(stripe);
    }
  }

  /**
   * Generates continuous street-wall commercial buildings with ground floor active shops.
   */
  private createStreetWallBuildings(): void {
    const configs: Array<{
      id: string;
      name: string;
      cx: number;
      cz: number;
      w: number;
      d: number;
      floors: number;
      height: number;
      category: 'commercial_tower' | 'office_block' | 'shop';
      shops: string[];
      entranceX: number;
      entranceZ: number;
    }> = [
      // --- WEST STREET WALL (Facing East towards Avenue) ---
      {
        id: 'cbd_bld_w1',
        name: 'Kenyatta Commercial Plaza & Chambers',
        cx: -25,
        cz: -8,
        w: 22,
        d: 18,
        floors: 9,
        height: 32,
        category: 'office_block',
        shops: ['M-Pesa Authorized Center', 'Equity Bank Access'],
        entranceX: -14,
        entranceZ: -8
      },
      {
        id: 'cbd_bld_w2',
        name: 'City Towers & Kimathi Arcade',
        cx: -25,
        cz: 16,
        w: 22,
        d: 18,
        floors: 14,
        height: 48,
        category: 'commercial_tower',
        shops: ['Java House Coffee', 'Quickmart City Express'],
        entranceX: -14,
        entranceZ: 16
      },
      {
        id: 'cbd_bld_w3',
        name: 'Harambee Commercial Suites',
        cx: -25,
        cz: 38,
        w: 20,
        d: 18,
        floors: 6,
        height: 22,
        category: 'shop',
        shops: ['Goodlife Pharmacy', 'Bata Shoes'],
        entranceX: -15,
        entranceZ: 38
      },

      // --- EAST STREET WALL (Facing West towards Avenue) ---
      {
        id: 'cbd_bld_e1',
        name: 'Nation Centre Business Plaza',
        cx: 25,
        cz: -8,
        w: 22,
        d: 18,
        floors: 10,
        height: 35,
        category: 'office_block',
        shops: ['TechPoint Electronics', 'City Bookshop & Stationers'],
        entranceX: 14,
        entranceZ: -8
      },
      {
        id: 'cbd_bld_e2',
        name: 'Mama Ngina Chambers',
        cx: 25,
        cz: 16,
        w: 22,
        d: 18,
        floors: 8,
        height: 28,
        category: 'office_block',
        shops: ['Standard Chartered Agent', 'Simba Cleaners'],
        entranceX: 14,
        entranceZ: 16
      },
      {
        id: 'cbd_bld_e3',
        name: 'Pioneer House & Arcade',
        cx: 25,
        cz: 38,
        w: 20,
        d: 18,
        floors: 6,
        height: 22,
        category: 'shop',
        shops: ['Nairobi Central Chemist', 'Kenyatta Avenue Bakery'],
        entranceX: 15,
        entranceZ: 38
      }
    ];

    configs.forEach((cfg) => {
      const halfW = cfg.w / 2;
      const halfD = cfg.d / 2;

      const footprint = [
        { x: cfg.cx - halfW, z: cfg.cz - halfD },
        { x: cfg.cx + halfW, z: cfg.cz - halfD },
        { x: cfg.cx + halfW, z: cfg.cz + halfD },
        { x: cfg.cx - halfW, z: cfg.cz + halfD }
      ];

      const bldData: BuildingData = {
        id: cfg.id,
        name: cfg.name,
        footprintPolygon: footprint,
        center: new THREE.Vector3(cfg.cx, 0, cfg.cz),
        height: cfg.height,
        floors: cfg.floors,
        zone: 'cbd_commercial',
        districtId: 'district_nairobi',
        buildingCategory: cfg.category,
        entrances: [{ id: `${cfg.id}_main`, position: new THREE.Vector3(cfg.entranceX, 0, cfg.entranceZ), type: 'main' }],
        hasGroundFloorShops: true,
        shopNames: cfg.shops,
        rooftopEquipment: cfg.floors > 8 ? ['antenna', 'water_tank', 'ac_unit'] : ['water_tank', 'solar_panel']
      };

      this.buildings.push(bldData);
      const bldGroup = BuildingAssetKit.createBuildingGroup(bldData);
      this.group.add(bldGroup);
    });
  }

  /**
   * Places street trees in cast-iron grates, traffic signals, street name posts, and bollards.
   */
  private createStreetFurniture(): void {
    // 1. Street Trees in Iron Grates along Cabro Sidewalks (Jacaranda and Acacia)
    const treePositions = [
      { x: -8.4, z: -14, type: 'jacaranda' as const },
      { x: -8.4, z: 2,   type: 'jacaranda' as const },
      { x: -8.4, z: 24,  type: 'palm' as const },
      { x: -8.4, z: 42,  type: 'jacaranda' as const },
      { x: 8.4,  z: -14, type: 'jacaranda' as const },
      { x: 8.4,  z: 2,   type: 'acacia' as const },
      { x: 8.4,  z: 24,  type: 'jacaranda' as const },
      { x: 8.4,  z: 42,  type: 'palm' as const }
    ];

    treePositions.forEach((pos) => {
      const tree = EnvironmentAssetKit.createTreeInPavingMesh(pos.type);
      tree.position.set(pos.x, 0.0, pos.z);
      this.group.add(tree);
    });

    // 2. Traffic Signals at Pedestrian Crossing (Z = 12)
    const signalWest = EnvironmentAssetKit.createTrafficLightMesh();
    signalWest.position.set(-8.2, 0.2, 10.5);
    signalWest.rotation.y = Math.PI / 2;
    this.group.add(signalWest);

    const signalEast = EnvironmentAssetKit.createTrafficLightMesh();
    signalEast.position.set(8.2, 0.2, 13.5);
    signalEast.rotation.y = -Math.PI / 2;
    this.group.add(signalEast);

    // 3. Nairobi CBD Street Name Signposts
    const signPost1 = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'KIMATHI ST');
    signPost1.position.set(-8.6, 0.2, -2.0);
    this.group.add(signPost1);

    const signPost2 = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'MOI AVE');
    signPost2.position.set(8.6, 0.2, -2.0);
    signPost2.rotation.y = Math.PI;
    this.group.add(signPost2);

    // 4. Protective Curb Bollards along Crossing & Walkway
    const bollardZ = [-2, 0, 10.5, 13.5, 20, 22];
    bollardZ.forEach((z) => {
      const bWest = EnvironmentAssetKit.createStreetBollardMesh();
      bWest.position.set(-7.5, 0.2, z);
      this.group.add(bWest);

      const bEast = EnvironmentAssetKit.createStreetBollardMesh();
      bEast.position.set(7.5, 0.2, z);
      this.group.add(bEast);
    });
  }

  /**
   * Sets up a dedicated Nairobi CBD Matatu Stage with commuter shelter and parked Matatu minibus.
   */
  private createMatatuStage(): void {
    // Matatu Commuter Shelter on West Sidewalk
    const shelter = EnvironmentAssetKit.createMatatuStageShelterMesh();
    shelter.position.set(-11.5, 0.2, 26);
    shelter.rotation.y = Math.PI / 2;
    this.group.add(shelter);

    // Parked Super Metro Matatu minibus at the stage
    const matatu = AssetPipeline.getInstance().getVehicleMesh('matatu');
    matatu.name = 'CBD_Stage_SuperMetroMatatu';
    matatu.position.set(-5.5, 0.25, 26);
    matatu.rotation.y = Math.PI;
    this.group.add(matatu);

    // Yellow bus-stop curb marking box (painted on asphalt at stage bay)
    const stageBoxGeo = new THREE.BoxGeometry(3.2, 0.02, 12.0);
    const stageBoxMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const stageBox = new THREE.Mesh(stageBoxGeo, stageBoxMat);
    stageBox.position.set(-5.5, 0.07, 26);
    stageBox.receiveShadow = true;
    this.group.add(stageBox);

    // Pedestrians waiting at the stage & walking along the promenade
    const pipeline = AssetPipeline.getInstance();
    const commuter1 = pipeline.getCharacterMesh('office_worker');
    commuter1.position.set(-10.2, 0.2, 25);
    commuter1.rotation.y = -Math.PI * 0.4;
    this.group.add(commuter1);

    const commuter2 = pipeline.getCharacterMesh('student');
    commuter2.position.set(-9.8, 0.2, 27.5);
    commuter2.rotation.y = -Math.PI * 0.6;
    this.group.add(commuter2);

    // Pedestrians browsing shops on East Promenade
    const shopper1 = pipeline.getCharacterMesh('business_owner');
    shopper1.position.set(11.5, 0.2, 14);
    shopper1.rotation.y = Math.PI * 0.5;
    this.group.add(shopper1);
  }
}
