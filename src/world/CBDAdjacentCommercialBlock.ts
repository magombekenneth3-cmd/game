import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';
import { BuildingData } from './BuildingData';
import { BuildingAssetKit } from '../assets/BuildingAssetKit';
import { EnvironmentAssetKit } from '../assets/EnvironmentAssetKit';
import { AssetPipeline } from '../assets/AssetPipeline';
import { CommercialBuildingSpec, DistrictBlockBoundary } from './UrbanLayout';

export class CBDAdjacentCommercialBlock {
  private scene: THREE.Scene;
  private assetManager: AssetManager;
  private buildings: BuildingData[] = [];
  private group: THREE.Group;

  constructor(scene: THREE.Scene, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;
    this.group = new THREE.Group();
    this.group.name = 'NairobiCBD_AdjacentCommercialBlock';
  }

  public getBoundary(): DistrictBlockBoundary {
    return {
      blockId: 'CBDAdjacentCommercialBlock_Kenyatta_South',
      zMin: 55,
      zMax: 140,
      carriagewayWidth: 14.6,
      westPromenade: { xMin: -26, xMax: -7.3, elevation: 0.20 },
      eastPromenade: { xMin: 7.3, xMax: 26, elevation: 0.20 }
    };
  }

  /**
   * Generates the adjacent commercial block along Kenyatta Avenue (X = 0, Z = 55 to 140).
   * Seamlessly continues the Cabro paving promenades, carriageway markings, curbs,
   * varied multistory commercial buildings, ground-floor active retail shops,
   * street trees in iron grates, traffic signals, and bilingual street signs.
   */
  public generate(): { buildings: BuildingData[]; group: THREE.Group; boundary: DistrictBlockBoundary } {
    this.createContinuousCabroPromenades();
    this.createCarriagewayRoadSurface();
    this.createStreetWallBuildings();
    this.createStreetFurniture();

    this.scene.add(this.group);
    return { buildings: this.buildings, group: this.group, boundary: this.getBoundary() };
  }

  /**
   * Creates seamless Cabro paver promenades extending from road curbs to building facades (Z = 55 to 140).
   * Connects at Z = 55 with zero gap and matching elevation Y = 0.20.
   */
  private createContinuousCabroPromenades(): void {
    const cabroMat = this.assetManager.getMaterial('sidewalk_cabro') || this.assetManager.getMaterial('sidewalk_concrete');
    const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });

    const promenadeLength = 85.0; // Z: 55 to 140
    const promenadeWidth = 18.7;  // X: 7.3 to 26 (and -26 to -7.3)
    const zCenter = 55 + promenadeLength / 2; // 97.5

    // West Promenade (X: -26 to -7.3, Z: 55 to 140)
    const westGeo = new THREE.PlaneGeometry(promenadeWidth, promenadeLength);
    westGeo.rotateX(-Math.PI / 2);
    const westMesh = new THREE.Mesh(westGeo, cabroMat);
    westMesh.name = 'CBD_Adjacent_Promenade_West';
    westMesh.position.set(-16.65, 0.20, zCenter);
    westMesh.receiveShadow = true;
    this.group.add(westMesh);

    // East Promenade (X: 7.3 to 26, Z: 55 to 140)
    const eastGeo = new THREE.PlaneGeometry(promenadeWidth, promenadeLength);
    eastGeo.rotateX(-Math.PI / 2);
    const eastMesh = new THREE.Mesh(eastGeo, cabroMat);
    eastMesh.name = 'CBD_Adjacent_Promenade_East';
    eastMesh.position.set(16.65, 0.20, zCenter);
    eastMesh.receiveShadow = true;
    this.group.add(eastMesh);

    // Concrete Curbs at Road Margins (height 0.25, width 0.3)
    const westCurbGeo = new THREE.BoxGeometry(0.3, 0.25, promenadeLength);
    const westCurbMesh = new THREE.Mesh(westCurbGeo, curbMat);
    westCurbMesh.name = 'CBD_Adjacent_Curb_West';
    westCurbMesh.position.set(-7.45, 0.125, zCenter);
    westCurbMesh.receiveShadow = true;
    this.group.add(westCurbMesh);

    const eastCurbGeo = new THREE.BoxGeometry(0.3, 0.25, promenadeLength);
    const eastCurbMesh = new THREE.Mesh(eastCurbGeo, curbMat);
    eastCurbMesh.name = 'CBD_Adjacent_Curb_East';
    eastCurbMesh.position.set(7.45, 0.125, zCenter);
    eastCurbMesh.receiveShadow = true;
    this.group.add(eastCurbMesh);
  }

  /**
   * Generates asphalt roadway carriageway with lane markings and pedestrian zebra crossings.
   */
  private createCarriagewayRoadSurface(): void {
    const roadMat = this.assetManager.getMaterial('road_asphalt');
    const roadLength = 85.0; // Z: 55 to 140
    const roadWidth = 14.6;
    const zCenter = 97.5;

    // Asphalt carriageway plane (Y = 0.05)
    const roadGeo = new THREE.PlaneGeometry(roadWidth, roadLength);
    roadGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.name = 'CBD_Adjacent_Carriageway';
    roadMesh.position.set(0, 0.05, zCenter);
    roadMesh.receiveShadow = true;
    this.group.add(roadMesh);

    // Double Yellow Centerline Divider Lines
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const lineGeo = new THREE.BoxGeometry(0.12, 0.02, roadLength);

    const centerLineL = new THREE.Mesh(lineGeo, yellowMat);
    centerLineL.position.set(-0.15, 0.065, zCenter);
    centerLineL.receiveShadow = true;
    this.group.add(centerLineL);

    const centerLineR = new THREE.Mesh(lineGeo, yellowMat);
    centerLineR.position.set(0.15, 0.065, zCenter);
    centerLineR.receiveShadow = true;
    this.group.add(centerLineR);

    // Dashed White Lane Divider Lines (lanes 2 and 3)
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    for (let z = 56; z <= 139; z += 6.0) {
      const dashGeo = new THREE.BoxGeometry(0.15, 0.02, 3.2);

      const dashL = new THREE.Mesh(dashGeo, whiteMat);
      dashL.position.set(-3.65, 0.065, z);
      dashL.receiveShadow = true;
      this.group.add(dashL);

      const dashR = new THREE.Mesh(dashGeo, whiteMat);
      dashR.position.set(3.65, 0.065, z);
      dashR.receiveShadow = true;
      this.group.add(dashR);
    }

    // 1. Boundary Pedestrian Zebra Crossing (Z = 57, Wabera St / Muindi Mbingu St Cross Junction)
    for (let s = -6.0; s <= 6.0; s += 1.2) {
      const stripeGeo = new THREE.BoxGeometry(0.7, 0.02, 3.2);
      const stripe = new THREE.Mesh(stripeGeo, whiteMat);
      stripe.position.set(s, 0.07, 57.5);
      stripe.receiveShadow = true;
      this.group.add(stripe);
    }

    // 2. Mid-Block Pedestrian Zebra Crossing (Z = 95, Mid-Block Crosswalk)
    for (let s = -6.0; s <= 6.0; s += 1.2) {
      const stripeGeo = new THREE.BoxGeometry(0.7, 0.02, 3.2);
      const stripe = new THREE.Mesh(stripeGeo, whiteMat);
      stripe.position.set(s, 0.07, 95.0);
      stripe.receiveShadow = true;
      this.group.add(stripe);
    }
  }

  /**
   * Generates varied multistory commercial buildings along West and East street walls.
   * Includes authentic Nairobi commercial facades, active shopfronts, and rooftop equipment.
   */
  private createStreetWallBuildings(): void {
    const specs: CommercialBuildingSpec[] = [
      // --- WEST STREET WALL (X = -25, Facing East towards Avenue) ---
      {
        id: 'cbd_bld_w4',
        name: 'Jubilee Insurance Exchange & Chambers',
        cx: -25,
        cz: 68,
        width: 22,
        depth: 18,
        floors: 11,
        height: 38,
        category: 'office_block',
        shops: ['Jubilee Customer Center', 'Artcaffe Coffee & Bakery'],
        entranceX: -14,
        entranceZ: 68
      },
      {
        id: 'cbd_bld_w5',
        name: 'Kenya Re Plaza & Financial Chambers',
        cx: -25,
        cz: 92,
        width: 22,
        depth: 18,
        floors: 16,
        height: 54,
        category: 'commercial_tower',
        shops: ['KCB Bank Premium Branch', 'Safaricom Customer Care Centre'],
        entranceX: -14,
        entranceZ: 92
      },
      {
        id: 'cbd_bld_w6',
        name: 'Teleposta Commercial Arcade',
        cx: -25,
        cz: 116,
        width: 20,
        depth: 18,
        floors: 8,
        height: 28,
        category: 'office_block',
        shops: ['DHL Express ServicePoint', 'Nairobi Book Bureau'],
        entranceX: -15,
        entranceZ: 116
      },
      {
        id: 'cbd_bld_w7',
        name: 'City Market Commercial Suites',
        cx: -25,
        cz: 134,
        width: 16,
        depth: 18,
        floors: 5,
        height: 18,
        category: 'shop',
        shops: ['Healthy U Nutrition', 'Text Book Centre'],
        entranceX: -17,
        entranceZ: 134
      },

      // --- EAST STREET WALL (X = +25, Facing West towards Avenue) ---
      {
        id: 'cbd_bld_e4',
        name: 'Kencom Commercial Chambers',
        cx: 25,
        cz: 68,
        width: 22,
        depth: 18,
        floors: 12,
        height: 42,
        category: 'commercial_tower',
        shops: ['Co-operative Bank Branch', 'Naivas Foodmarket Express'],
        entranceX: 14,
        entranceZ: 68
      },
      {
        id: 'cbd_bld_e5',
        name: 'Sarova Stanley Commercial Wing',
        cx: 25,
        cz: 92,
        width: 22,
        depth: 18,
        floors: 9,
        height: 32,
        category: 'office_block',
        shops: ['Thorn Tree Travel Desk', 'Textiles & African Curios'],
        entranceX: 14,
        entranceZ: 92
      },
      {
        id: 'cbd_bld_e6',
        name: 'Hilton Arcade Commercial Hub',
        cx: 25,
        cz: 116,
        width: 20,
        depth: 18,
        floors: 14,
        height: 48,
        category: 'commercial_tower',
        shops: ['NCBA Bank Platinum', 'Optica Vision Care'],
        entranceX: 15,
        entranceZ: 116
      },
      {
        id: 'cbd_bld_e7',
        name: 'Moi Avenue Exchange Building',
        cx: 25,
        cz: 134,
        width: 16,
        depth: 18,
        floors: 6,
        height: 22,
        category: 'shop',
        shops: ['City Pharmacy 24HR', 'Nairobi Cyber & Print Hub'],
        entranceX: 17,
        entranceZ: 134
      }
    ];

    specs.forEach((spec) => {
      const halfW = spec.width / 2;
      const halfD = spec.depth / 2;

      const footprint = [
        { x: spec.cx - halfW, z: spec.cz - halfD },
        { x: spec.cx + halfW, z: spec.cz - halfD },
        { x: spec.cx + halfW, z: spec.cz + halfD },
        { x: spec.cx - halfW, z: spec.cz + halfD }
      ];

      const bldData: BuildingData = {
        id: spec.id,
        name: spec.name,
        footprintPolygon: footprint,
        center: new THREE.Vector3(spec.cx, 0, spec.cz),
        height: spec.height,
        floors: spec.floors,
        zone: 'cbd_commercial',
        districtId: 'district_nairobi',
        buildingCategory: spec.category,
        entrances: [{ id: `${spec.id}_main`, position: new THREE.Vector3(spec.entranceX, 0, spec.entranceZ), type: 'main' }],
        hasGroundFloorShops: true,
        shopNames: spec.shops,
        rooftopEquipment: spec.floors > 8 ? ['antenna', 'water_tank', 'ac_unit'] : ['water_tank', 'solar_panel']
      };

      this.buildings.push(bldData);
      const bldGroup = BuildingAssetKit.createBuildingGroup(bldData);
      this.group.add(bldGroup);
    });
  }

  /**
   * Places street trees in cast-iron grates, traffic signals, bilingual street name posts,
   * protective curb bollards, streetlights, and commercial street kiosks.
   */
  private createStreetFurniture(): void {
    // 1. Street Trees in Cast-Iron Grates along Cabro Sidewalks (Jacaranda, Acacia, Palm)
    const treePositions = [
      { x: -8.4, z: 64,  type: 'jacaranda' as const },
      { x: -8.4, z: 80,  type: 'acacia' as const },
      { x: -8.4, z: 104, type: 'jacaranda' as const },
      { x: -8.4, z: 120, type: 'palm' as const },
      { x: -8.4, z: 136, type: 'jacaranda' as const },
      { x: 8.4,  z: 64,  type: 'palm' as const },
      { x: 8.4,  z: 80,  type: 'jacaranda' as const },
      { x: 8.4,  z: 104, type: 'acacia' as const },
      { x: 8.4,  z: 120, type: 'jacaranda' as const },
      { x: 8.4,  z: 136, type: 'palm' as const }
    ];

    treePositions.forEach((pos) => {
      const tree = EnvironmentAssetKit.createTreeInPavingMesh(pos.type);
      tree.position.set(pos.x, 0.0, pos.z);
      this.group.add(tree);
    });

    // 2. Traffic Signals at Pedestrian Crossings (Z = 57.5 and Z = 95.0)
    const signal1West = EnvironmentAssetKit.createTrafficLightMesh();
    signal1West.position.set(-8.2, 0.2, 56.0);
    signal1West.rotation.y = Math.PI / 2;
    this.group.add(signal1West);

    const signal1East = EnvironmentAssetKit.createTrafficLightMesh();
    signal1East.position.set(8.2, 0.2, 59.0);
    signal1East.rotation.y = -Math.PI / 2;
    this.group.add(signal1East);

    const signal2West = EnvironmentAssetKit.createTrafficLightMesh();
    signal2West.position.set(-8.2, 0.2, 93.5);
    signal2West.rotation.y = Math.PI / 2;
    this.group.add(signal2West);

    const signal2East = EnvironmentAssetKit.createTrafficLightMesh();
    signal2East.position.set(8.2, 0.2, 96.5);
    signal2East.rotation.y = -Math.PI / 2;
    this.group.add(signal2East);

    // 3. Nairobi Bilingual Enamel Street Name Signposts
    // Boundary Cross Street at Z = 56: Wabera St / Muindi Mbingu St
    const signPostBoundaryWest = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'WABERA ST');
    signPostBoundaryWest.position.set(-8.6, 0.2, 55.5);
    this.group.add(signPostBoundaryWest);

    const signPostBoundaryEast = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'MUINDI MBINGU ST');
    signPostBoundaryEast.position.set(8.6, 0.2, 55.5);
    signPostBoundaryEast.rotation.y = Math.PI;
    this.group.add(signPostBoundaryEast);

    // South Junction at Z = 136: Moi Ave / Haile Selassie Ave
    const signPostSouthWest = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'MOI AVE');
    signPostSouthWest.position.set(-8.6, 0.2, 136.0);
    this.group.add(signPostSouthWest);

    const signPostSouthEast = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'HAILE SELASSIE AVE');
    signPostSouthEast.position.set(8.6, 0.2, 136.0);
    signPostSouthEast.rotation.y = Math.PI;
    this.group.add(signPostSouthEast);

    // 4. Protective Curb Bollards along Crossings
    const bollardZ = [56.0, 59.0, 93.5, 96.5, 115.0, 135.0];
    bollardZ.forEach((z) => {
      const bWest = EnvironmentAssetKit.createStreetBollardMesh();
      bWest.position.set(-7.5, 0.2, z);
      this.group.add(bWest);

      const bEast = EnvironmentAssetKit.createStreetBollardMesh();
      bEast.position.set(7.5, 0.2, z);
      this.group.add(bEast);
    });

    // 5. Commercial Street Kiosks along Wide Promenades
    const pipeline = AssetPipeline.getInstance();

    // M-Pesa Authorized Agent Kiosk on East Promenade
    const mpesaKiosk = pipeline.getMPesaKioskMesh();
    mpesaKiosk.name = 'CBD_Adjacent_MPesaKiosk';
    mpesaKiosk.position.set(11.0, 0.20, 76.0);
    mpesaKiosk.rotation.y = -Math.PI / 2;
    this.group.add(mpesaKiosk);

    // Fresh Produce Mama Mboga Stall on West Promenade
    const mamaMboga = pipeline.getMamaMbogaStallMesh();
    mamaMboga.name = 'CBD_Adjacent_MamaMbogaStall';
    mamaMboga.position.set(-11.0, 0.20, 108.0);
    mamaMboga.rotation.y = Math.PI / 2;
    this.group.add(mamaMboga);

    // 6. Pedestrians along the adjacent promenade
    const pedestrian1 = pipeline.getCharacterMesh('office_worker');
    pedestrian1.position.set(-10.5, 0.20, 72.0);
    pedestrian1.rotation.y = 0.2;
    this.group.add(pedestrian1);

    const pedestrian2 = pipeline.getCharacterMesh('student');
    pedestrian2.position.set(11.0, 0.20, 98.0);
    pedestrian2.rotation.y = -0.4;
    this.group.add(pedestrian2);
  }
}
