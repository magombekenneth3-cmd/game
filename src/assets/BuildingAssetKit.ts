import * as THREE from 'three';
import { BuildingData } from '../world/BuildingData';
import { TextureGenerator } from './TextureGenerator';

export class BuildingAssetKit {
  /**
   * Builds a hyperrealistic production-quality 3D building group for a GIS Building footprint.
   */
  public static createBuildingGroup(bld: BuildingData): THREE.Group {
    const group = new THREE.Group();
    group.name = `BuildingGroup_${bld.id}`;

    if (!bld.footprintPolygon || bld.footprintPolygon.length < 3) {
      return group;
    }

    // 1. Extrude polygon shape relative to building center
    const shape = new THREE.Shape();
    bld.footprintPolygon.forEach((pt, idx) => {
      const lx = pt.x - bld.center.x;
      const lz = pt.z - bld.center.z;
      if (idx === 0) shape.moveTo(lx, lz);
      else shape.lineTo(lx, lz);
    });
    shape.closePath();

    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: bld.height,
      bevelEnabled: bld.floors > 3,
      bevelSegments: 2,
      bevelSize: 0.25,
      bevelThickness: 0.25,
      steps: 1
    };

    const geom = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geom.rotateX(-Math.PI / 2);
    geom.computeVertexNormals();

    // 2. Select Hyperrealistic PBR Facade Textures & Materials
    const isCBD = bld.zone === 'cbd_commercial' || bld.buildingCategory === 'commercial_tower' || bld.buildingCategory === 'office_block';
    let facadeTexture: THREE.CanvasTexture;
    if (isCBD) {
      const cbdStyle = bld.buildingCategory === 'commercial_tower'
        ? 'curtain_glass'
        : (bld.height > 30 ? 'brutalist_concrete' : (bld.id.includes('brick') ? 'commercial_brick' : 'modernist_render'));
      facadeTexture = TextureGenerator.createCBDFacadeTexture(cbdStyle);
    } else {
      const facadeStyle = this.getStyleForCategory(bld.buildingCategory);
      facadeTexture = TextureGenerator.createFacadePanelTexture(facadeStyle);
    }

    const facadeNormalMap = TextureGenerator.createFacadeNormalMap();
    const facadeRoughnessMap = TextureGenerator.createFacadeRoughnessMap();
    const facadeEmissiveMap = TextureGenerator.createEmissiveWindowMap();

    const tileU = Math.max(1, Math.floor(bld.height / 6));
    const tileV = Math.max(1, bld.floors);

    facadeTexture.repeat.set(tileU, tileV);
    facadeNormalMap.repeat.set(tileU, tileV);
    facadeRoughnessMap.repeat.set(tileU, tileV);
    facadeEmissiveMap.repeat.set(tileU, tileV);

    const facadeMat = new THREE.MeshStandardMaterial({
      map: facadeTexture,
      normalMap: facadeNormalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughnessMap: facadeRoughnessMap,
      emissiveMap: facadeEmissiveMap,
      emissive: new THREE.Color(0xfff0dd),
      emissiveIntensity: 0.35,
      roughness: 0.75,
      metalness: 0.02
    });

    const bodyMesh = new THREE.Mesh(geom, facadeMat);
    bodyMesh.name = `BuildingBody_${bld.id}`;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // 3. Ground-Floor Podium Storefront & Signboard Banners
    if (bld.hasGroundFloorShops) {
      const storefrontHeight = Math.min(4.0, bld.height * 0.35);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0x64748b,
        roughness: 0.05,
        metalness: 0.0,
        transparent: true,
        opacity: 0.45,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05
      });

      const glassGeom = new THREE.ExtrudeGeometry(shape, { depth: storefrontHeight, bevelEnabled: false });
      glassGeom.rotateX(-Math.PI / 2);
      glassGeom.computeVertexNormals();
      const glassMesh = new THREE.Mesh(glassGeom, glassMat);
      glassMesh.name = `Detail_Storefront_${bld.id}`;
      glassMesh.position.y = 0.05;
      glassMesh.castShadow = true;
      group.add(glassMesh);

      // Determine Frontage Orientation from Entrance
      let forwardX = 0;
      let forwardZ = (bld.height > 10 ? 3.5 : 2.5);
      let angle = 0;
      if (bld.entrances && bld.entrances.length > 0) {
        const ent = bld.entrances[0].position;
        const dx = ent.x - bld.center.x;
        const dz = ent.z - bld.center.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 0.5) {
          forwardX = (dx / dist) * Math.min(dist, 4.2);
          forwardZ = (dz / dist) * Math.min(dist, 4.2);
          angle = Math.atan2(dx, dz);
        }
      }

      // Storefront Signboard Banners & Striped Awnings
      const shops = bld.shopNames && bld.shopNames.length > 0 ? bld.shopNames : [bld.name || 'COMMERCIAL CENTER'];
      shops.forEach((shopName, sIdx) => {
        const lateralOffset = (sIdx - (shops.length - 1) / 2) * 5.5;
        const perpX = Math.cos(angle) * lateralOffset;
        const perpZ = -Math.sin(angle) * lateralOffset;

        const signTexture = TextureGenerator.createStorefrontSignTexture(shopName);
        const signMat = new THREE.MeshStandardMaterial({
          map: signTexture,
          roughness: 0.3,
          emissive: new THREE.Color(0xffffff),
          emissiveMap: signTexture,
          emissiveIntensity: 0.25
        });
        const signBox = new THREE.BoxGeometry(4.8, 1.1, 0.25);
        const signMesh = new THREE.Mesh(signBox, signMat);
        signMesh.name = `Detail_Signboard_${bld.id}_${sIdx}`;
        signMesh.rotation.y = angle;
        signMesh.position.set(forwardX + perpX, storefrontHeight + 0.6, forwardZ + perpZ);
        signMesh.castShadow = true;
        group.add(signMesh);

        // Striped Canvas Awning Canopy
        const awningTex = TextureGenerator.createAwningTexture(sIdx % 2 === 0 ? 'green_white' : 'orange_white');
        const canopyMat = new THREE.MeshStandardMaterial({ map: awningTex, roughness: 0.6 });
        const canopyBox = new THREE.BoxGeometry(5.2, 0.2, 1.6);
        const canopyMesh = new THREE.Mesh(canopyBox, canopyMat);
        canopyMesh.name = `Detail_Canopy_${bld.id}_${sIdx}`;
        canopyMesh.rotation.y = angle;
        canopyMesh.position.set(forwardX + perpX * 1.05, storefrontHeight, forwardZ + perpZ * 1.05);
        canopyMesh.castShadow = true;
        group.add(canopyMesh);
      });
    }


    // 4. Balconies & Architectural Detailing for Apartment Blocks
    if (bld.buildingCategory === 'apartment_block') {
      const balconyMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7, roughness: 0.4 });
      for (let floor = 1; floor < bld.floors; floor++) {
        const balconyGeo = new THREE.BoxGeometry(2.6, 0.9, 0.9);
        const balcony = new THREE.Mesh(balconyGeo, balconyMat);
        balcony.name = `Detail_Balcony_${bld.id}_fl${floor}`;
        balcony.position.set(0, floor * 3.2, (bld.height > 10 ? 4.2 : 2.5));
        balcony.castShadow = true;
        group.add(balcony);
      }
    }

    // 4b. Dedicated Residential House Construction Rules (Pitched Roof, Porch, Burglar Grilles, Compound Wall & Gate)
    if (bld.buildingCategory === 'residential_house') {
      this.addResidentialHouseDetails(group, bld);
    }

    // 5. Parapet Perimeter Roof Wall & Rooftop Infrastructure
    const roofY = bld.height + 0.1;
    if (bld.buildingCategory !== 'residential_house') {
      const parapetMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
      const parapetBox = new THREE.BoxGeometry(4.0, 0.8, 0.3);
      const parapet = new THREE.Mesh(parapetBox, parapetMat);
      parapet.position.set(0, roofY + 0.4, 0);
      group.add(parapet);
    }

    if (bld.rooftopEquipment && bld.rooftopEquipment.length > 0) {
      bld.rooftopEquipment.forEach((eq, idx) => {
        if (eq === 'water_tank') {
          // Black/Blue Roto Water Tank on Steel Stand
          const tankGroup = new THREE.Group();
          tankGroup.name = `Detail_WaterTank_${bld.id}`;
          tankGroup.position.set((idx - 0.5) * 3.5, roofY + 1.1, 0);

          const tankMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 });
          const tankGeo = new THREE.CylinderGeometry(1.0, 1.0, 2.0, 16);
          const tank = new THREE.Mesh(tankGeo, tankMat);
          tank.castShadow = true;
          tankGroup.add(tank);

          // Steel stand legs
          const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85 });
          const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8);
          for (let l = 0; l < 4; l++) {
            const angle = (l * Math.PI) / 2;
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(Math.cos(angle) * 0.75, -1.0, Math.sin(angle) * 0.75);
            tankGroup.add(leg);
          }

          group.add(tankGroup);
        } else if (eq === 'solar_panel') {
          const panelMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.1 });
          const panelGeo = new THREE.BoxGeometry(2.6, 0.1, 1.8);
          const panel = new THREE.Mesh(panelGeo, panelMat);
          panel.name = `Detail_SolarPanel_${bld.id}`;
          panel.rotation.x = 0.25;
          panel.position.set((idx - 0.5) * 3.8, roofY + 0.4, 1.5);
          panel.castShadow = true;
          group.add(panel);
        } else if (eq === 'antenna') {
          const antennaMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9, roughness: 0.2 });
          const antennaGeo = new THREE.CylinderGeometry(0.06, 0.12, 7.5, 8);
          const antenna = new THREE.Mesh(antennaGeo, antennaMat);
          antenna.name = `Detail_Antenna_${bld.id}`;
          antenna.position.set(0, roofY + 3.75, 0);
          antenna.castShadow = true;
          group.add(antenna);
        }
      });
    }

    // High-rise Skyscraper Aviation Warning Beacon
    if (bld.height > 40) {
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
      const beaconGeo = new THREE.SphereGeometry(0.4, 8, 8);
      const beacon = new THREE.Mesh(beaconGeo, beaconMat);
      beacon.name = `Detail_AviationBeacon_${bld.id}`;
      beacon.position.set(0, roofY + 7.8, 0);
      group.add(beacon);
    }

    // 6. Perimeter Security Wall & Entry Gate for Commercial / Apartment Blocks
    if (bld.buildingCategory === 'apartment_block' || bld.buildingCategory === 'office_block' || bld.buildingCategory === 'commercial_tower') {
      const wallMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.8 });
      const wallBox = new THREE.BoxGeometry(0.4, 2.4, 9.0);

      const wallWest = new THREE.Mesh(wallBox, wallMat);
      wallWest.name = `Detail_PerimeterWall_${bld.id}_W`;
      wallWest.position.set(-7.5, 1.2, 0);
      wallWest.castShadow = true;
      wallWest.receiveShadow = true;
      group.add(wallWest);

      const wallEast = new THREE.Mesh(wallBox, wallMat);
      wallEast.name = `Detail_PerimeterWall_${bld.id}_E`;
      wallEast.position.set(7.5, 1.2, 0);
      wallEast.castShadow = true;
      wallEast.receiveShadow = true;
      group.add(wallEast);

      // Security Gate Booth
      const boothMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
      const boothBox = new THREE.BoxGeometry(1.8, 2.2, 1.8);
      const booth = new THREE.Mesh(boothBox, boothMat);
      booth.name = `Detail_SecurityBooth_${bld.id}`;
      booth.position.set(0, 1.1, 7.5);
      booth.castShadow = true;
      group.add(booth);
    }

    group.position.copy(bld.center);
    return group;
  }

  /**
   * Dedicated Construction Rules for Authentic Nairobi Residential Houses.
   * Generates recognizable pitched corrugated/tile roof, front veranda porch,
   * burglar-proof window grilles, and walled residential compound with gate.
   */
  private static addResidentialHouseDetails(group: THREE.Group, bld: BuildingData): void {
    // 1. Calculate footprint bounding dimensions
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    if (bld.footprintPolygon && bld.footprintPolygon.length >= 3) {
      for (const pt of bld.footprintPolygon) {
        const lx = pt.x - bld.center.x;
        const lz = pt.z - bld.center.z;
        if (lx < minX) minX = lx;
        if (lx > maxX) maxX = lx;
        if (lz < minZ) minZ = lz;
        if (lz > maxZ) maxZ = lz;
      }
    } else {
      minX = -6; maxX = 6; minZ = -5; maxZ = 5;
    }
    const width = maxX - minX;
    const depth = maxZ - minZ;
    const roofY = bld.height;

    // 2. Recognizable Pitched Hipped Roof (Terracotta / Galvanized Iron Sheets)
    const roofHeight = 2.4;
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Nairobi red clay tile
      roughness: 0.60,
      metalness: 0.10
    });
    const roofGeo = new THREE.ConeGeometry(Math.hypot(width + 1.2, depth + 1.2) * 0.52, roofHeight, 4);
    roofGeo.rotateY(Math.PI / 4);
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.name = `Detail_ResidentialPitchedRoof_${bld.id}`;
    roofMesh.position.set((minX + maxX) / 2, roofY + roofHeight / 2, (minZ + maxZ) / 2);
    roofMesh.scale.set((width + 1.4) / Math.max(1, depth), 1, 1);
    roofMesh.castShadow = true;
    roofMesh.receiveShadow = true;
    group.add(roofMesh);

    // Eaves overhang fascia board
    const fasciaMat = new THREE.MeshStandardMaterial({ color: 0x3d322a, roughness: 0.8 });
    const fasciaGeo = new THREE.BoxGeometry(width + 1.2, 0.2, depth + 1.2);
    const fascia = new THREE.Mesh(fasciaGeo, fasciaMat);
    fascia.position.set((minX + maxX) / 2, roofY + 0.1, (minZ + maxZ) / 2);
    group.add(fascia);

    // 3. Front Veranda / Porch with Columns & Steps
    const entranceZ = maxZ;
    const porchMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7 });
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.5 });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.7 });
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });

    // Porch floor slab
    const porchFloorGeo = new THREE.BoxGeometry(4.0, 0.3, 2.2);
    const porchFloor = new THREE.Mesh(porchFloorGeo, porchMat);
    porchFloor.position.set(0, 0.15, entranceZ + 1.1);
    porchFloor.castShadow = true;
    porchFloor.receiveShadow = true;
    group.add(porchFloor);

    // Porch roof canopy
    const porchRoofGeo = new THREE.BoxGeometry(4.2, 0.25, 2.4);
    const porchRoof = new THREE.Mesh(porchRoofGeo, roofMat);
    porchRoof.position.set(0, 3.2, entranceZ + 1.2);
    porchRoof.castShadow = true;
    group.add(porchRoof);

    // 2 Porch support columns
    [-1.8, 1.8].forEach((cx) => {
      const colGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.9, 10);
      const col = new THREE.Mesh(colGeo, columnMat);
      col.position.set(cx, 1.6, entranceZ + 2.0);
      col.castShadow = true;
      group.add(col);
    });

    // Front Entrance Door & Steps
    const doorGeo = new THREE.BoxGeometry(1.2, 2.4, 0.1);
    const door = new THREE.Mesh(doorGeo, doorMat);
    door.position.set(0, 1.2, entranceZ + 0.05);
    group.add(door);

    const stepGeo = new THREE.BoxGeometry(2.0, 0.15, 0.6);
    const step = new THREE.Mesh(stepGeo, porchMat);
    step.position.set(0, 0.075, entranceZ + 2.3);
    group.add(step);

    // 4. Windows with Decorative Burglar Grilles
    [-3.2, 3.2].forEach((wx) => {
      const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.1), columnMat);
      winFrame.position.set(wx, 1.8, entranceZ + 0.05);
      group.add(winFrame);

      // Burglar grill bars
      for (let g = -0.6; g <= 0.6; g += 0.3) {
        const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), grillMat);
        bar.position.set(wx + g, 1.8, entranceZ + 0.12);
        group.add(bar);
      }
    });

    // 5. Multi-storey maisonette first-floor balcony & balustrade
    if ((bld.floors && bld.floors >= 2) || bld.id.includes('maisonette')) {
      const balconyFloorGeo = new THREE.BoxGeometry(4.2, 0.22, 1.4);
      const balconyFloor = new THREE.Mesh(balconyFloorGeo, porchMat);
      balconyFloor.name = `Detail_MaisonetteBalcony_${bld.id}`;
      balconyFloor.position.set(0, 3.65, entranceZ + 0.8);
      balconyFloor.castShadow = true;
      group.add(balconyFloor);

      const balustradeGeo = new THREE.BoxGeometry(4.2, 0.05, 0.05);
      const balustrade = new THREE.Mesh(balustradeGeo, grillMat);
      balustrade.name = `Detail_MaisonetteBalustrade_${bld.id}`;
      balustrade.position.set(0, 4.65, entranceZ + 1.45);
      group.add(balustrade);
    }

    // 6. Residential Compound Boundary Wall & Metal Security Gate (modular)
    const compound = BuildingAssetKit.createCompoundPerimeter(bld);
    if (compound && compound.children.length > 0) {
      group.add(compound);
    }
  }

  /**
   * Generates a separate, modular Kenyan residential compound boundary wall and metal security gate.
   * Fits different plot sizes without distorting the house itself.
   */
  public static createCompoundPerimeter(bld: BuildingData): THREE.Group {
    const compound = new THREE.Group();
    compound.name = `Compound_Perimeter_${bld.id}`;

    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    if (bld.footprintPolygon && bld.footprintPolygon.length >= 3) {
      for (const pt of bld.footprintPolygon) {
        const lx = pt.x - bld.center.x;
        const lz = pt.z - bld.center.z;
        if (lx < minX) minX = lx;
        if (lx > maxX) maxX = lx;
        if (lz < minZ) minZ = lz;
        if (lz > maxZ) maxZ = lz;
      }
    } else {
      minX = -10; maxX = 10; minZ = -11; maxZ = 11;
    }

    const width = maxX - minX;
    const depth = maxZ - minZ;

    const wallMarginX = Math.max(8.0, width / 2);
    const wallMarginZ = Math.max(9.0, depth / 2);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.85 });
    const columnMat = new THREE.MeshStandardMaterial({ color: 0xd4d4d8, roughness: 0.5 });
    const grillMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.3 });

    // West and East boundary walls
    const sideWallGeo = new THREE.BoxGeometry(0.35, 2.2, wallMarginZ * 2);
    const wallW = new THREE.Mesh(sideWallGeo, wallMat);
    wallW.name = `Detail_PerimeterWall_${bld.id}_W`;
    wallW.position.set(-wallMarginX, 1.1, 0);
    wallW.castShadow = true;
    wallW.receiveShadow = true;
    compound.add(wallW);

    const wallE = new THREE.Mesh(sideWallGeo, wallMat);
    wallE.name = `Detail_PerimeterWall_${bld.id}_E`;
    wallE.position.set(wallMarginX, 1.1, 0);
    wallE.castShadow = true;
    wallE.receiveShadow = true;
    compound.add(wallE);

    // Back compound wall (North)
    const backWallGeo = new THREE.BoxGeometry(wallMarginX * 2, 2.2, 0.35);
    const wallN = new THREE.Mesh(backWallGeo, wallMat);
    wallN.name = `Detail_PerimeterWall_${bld.id}_N`;
    wallN.position.set(0, 1.1, -wallMarginZ);
    wallN.castShadow = true;
    wallN.receiveShadow = true;
    compound.add(wallN);

    // Front compound wall with gate opening
    const frontSegmentWidth = Math.max(1.0, wallMarginX - 2.5);
    const frontWallSegmentGeo = new THREE.BoxGeometry(frontSegmentWidth, 2.2, 0.35);
    const wallSW = new THREE.Mesh(frontWallSegmentGeo, wallMat);
    wallSW.position.set(-(wallMarginX + 2.5) / 2, 1.1, wallMarginZ);
    wallSW.castShadow = true;
    compound.add(wallSW);

    const wallSE = new THREE.Mesh(frontWallSegmentGeo, wallMat);
    wallSE.position.set((wallMarginX + 2.5) / 2, 1.1, wallMarginZ);
    wallSE.castShadow = true;
    compound.add(wallSE);

    // Compound Gate Pillars & Wrought Iron Gate
    [-2.5, 2.5].forEach((gx) => {
      const pillarGeo = new THREE.BoxGeometry(0.65, 2.6, 0.65);
      const pillar = new THREE.Mesh(pillarGeo, columnMat);
      pillar.position.set(gx, 1.3, wallMarginZ);
      pillar.castShadow = true;
      compound.add(pillar);
    });

    const gateGeo = new THREE.BoxGeometry(4.4, 2.0, 0.08);
    const gateMesh = new THREE.Mesh(gateGeo, grillMat);
    gateMesh.name = `Detail_CompoundSecurityGate_${bld.id}`;
    gateMesh.position.set(0, 1.1, wallMarginZ);
    gateMesh.castShadow = true;
    compound.add(gateMesh);

    return compound;
  }

  private static getStyleForCategory(cat: string): 'terracotta' | 'ochre' | 'sandstone' | 'white' | 'teal' | 'charcoal' {
    switch (cat) {
      case 'commercial_tower': return 'teal';
      case 'office_block': return 'sandstone';
      case 'apartment_block': return 'terracotta';
      case 'market_structure':
      case 'shop': return 'ochre';
      case 'warehouse': return 'charcoal';
      default: return 'white';
    }
  }
}
