import * as THREE from 'three';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { BuildingData } from './BuildingData';
import { BuildingAssetKit } from '../assets/BuildingAssetKit';
import { EnvironmentAssetKit } from '../assets/EnvironmentAssetKit';
import { TextureGenerator } from '../assets/TextureGenerator';
import { DistrictBlockBoundary } from './UrbanLayout';

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

  public getBoundary(): DistrictBlockBoundary {
    return {
      blockId: 'CBDShowcaseBlock_Kenyatta_North',
      zMin: -30,
      zMax: 55,
      carriagewayWidth: 14.6,
      westPromenade: { xMin: -26, xMax: -7.3, elevation: 0.20 },
      eastPromenade: { xMin: 7.3, xMax: 26, elevation: 0.20 }
    };
  }

  /**
   * Builds the authentic Nairobi CBD Showcase Block along Kenyatta Avenue (X = 0, Z = -30 to 55).
   * Generates continuous commercial street walls, ground-floor active shops with awnings,
   * seamless Cabro paving promenades, street trees in iron grates, traffic signals,
   * street name posts, and a dedicated Matatu Stage.
   */
  public generate(): { buildings: BuildingData[]; group: THREE.Group; boundary: DistrictBlockBoundary } {
    this.createContinuousCabroPromenades();
    this.createStreetWallBuildings();
    this.createStreetFurniture();
    this.createMatatuStage();

    this.scene.add(this.group);
    return { buildings: this.buildings, group: this.group, boundary: this.getBoundary() };
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

    // Prominent Kenyatta Ave / Kimathi St signpost near pedestrian crossing
    const signPostCrossing = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'KIMATHI ST');
    signPostCrossing.position.set(8.6, 0.2, 10.0);
    this.group.add(signPostCrossing);

    const signPost2 = EnvironmentAssetKit.createStreetSignPostMesh('KENYATTA AVE', 'MOI AVE');
    signPost2.position.set(8.6, 0.2, -2.0);
    signPost2.rotation.y = Math.PI;
    this.group.add(signPost2);

    // 4. Protective Curb Bollards along Crossing & Walkway (regular spacing along curbs)
    for (let z = -24; z <= 48; z += 4.0) {
      const bWest = EnvironmentAssetKit.createStreetBollardMesh();
      bWest.position.set(-7.5, 0.2, z);
      this.group.add(bWest);

      const bEast = EnvironmentAssetKit.createStreetBollardMesh();
      bEast.position.set(7.5, 0.2, z);
      this.group.add(bEast);
    }

    // 5. Branded Commercial Storefront Arcade (Safaricom & M-PESA, Java House, Equity Bank)
    const brandedArcade = EnvironmentAssetKit.createBrandedCommercialArcadeMesh();
    brandedArcade.name = 'CBD_Showcase_BrandedArcade';
    brandedArcade.position.set(14.5, 0.2, 16.0);
    brandedArcade.rotation.y = -Math.PI / 2;
    this.group.add(brandedArcade);

    // 6. High-Fidelity Mama Mboga Fresh Produce Sidewalk Stall
    const mamaMbogaStall = EnvironmentAssetKit.createHighFidelityMamaMbogaStallMesh();
    mamaMbogaStall.name = 'CBD_Showcase_MamaMbogaStall';
    mamaMbogaStall.position.set(11.2, 0.2, 11.0);
    mamaMbogaStall.rotation.y = -Math.PI * 0.4;
    this.group.add(mamaMbogaStall);

    // Mama Mboga Vendor character (Mary Wanjiku)
    const pipeline = AssetPipeline.getInstance();
    const vendorMary = pipeline.getCharacterMesh('business_owner');
    vendorMary.name = 'Vendor_MamaMary';
    vendorMary.position.set(11.6, 0.2, 11.8);
    vendorMary.rotation.y = -Math.PI * 0.9;
    this.group.add(vendorMary);

    // 7. Boda Boda Passenger Stage (Motorcycle & Rider)
    const bodaBoda = pipeline.getVehicleMesh('motorcycle');
    bodaBoda.name = 'CBD_Showcase_BodaBoda';
    bodaBoda.position.set(7.2, 0.2, 7.5);
    bodaBoda.rotation.y = 0.15;
    this.group.add(bodaBoda);

    const bodaRider = pipeline.getCharacterMesh('young_professional');
    bodaRider.name = 'Rider_BrianMwangi';
    bodaRider.position.set(8.2, 0.2, 7.5);
    bodaRider.rotation.y = -Math.PI * 0.5;
    this.group.add(bodaRider);

    // 8. Distant Skyline Landmark Vista: Kenyatta International Convention Centre (KICC)
    const kiccTower = EnvironmentAssetKit.createKICCTowerVistaMesh();
    kiccTower.name = 'CBD_Showcase_KICCTower';
    kiccTower.position.set(45.0, 0.0, 160.0);
    this.group.add(kiccTower);

    // 9. Prominent Facade Billboard: Kenya National Pride & Slogan
    const billboardTex = TextureGenerator.createKenyaBillboardTexture();
    const billboardMat = new THREE.MeshStandardMaterial({
      map: billboardTex,
      roughness: 0.25,
      metalness: 0.1,
      emissive: 0xffffff,
      emissiveMap: billboardTex,
      emissiveIntensity: 0.18
    });
    const billboardFrame = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 5.0, 9.4),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 })
    );
    billboardFrame.name = 'CBD_Facade_Billboard_Frame';
    billboardFrame.position.set(13.85, 13.5, 16.0);
    this.group.add(billboardFrame);

    const billboardPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(9.0, 4.6),
      billboardMat
    );
    billboardPlane.name = 'CBD_Facade_Billboard_Display';
    billboardPlane.position.set(13.68, 13.5, 16.0);
    billboardPlane.rotation.y = -Math.PI / 2; // Facing west towards Kenyatta Avenue
    this.group.add(billboardPlane);

    // Overhead floodlight lamps illuminating the billboard
    [-3.2, 0, 3.2].forEach((offsetZ) => {
      const lampArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 })
      );
      lampArm.position.set(13.2, 16.2, 16.0 + offsetZ);
      lampArm.rotation.z = Math.PI / 3;
      this.group.add(lampArm);

      const lampHead = new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.15, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xfef08a, emissive: 0xfef08a, emissiveIntensity: 0.6 })
      );
      lampHead.position.set(12.7, 15.9, 16.0 + offsetZ);
      this.group.add(lampHead);
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
