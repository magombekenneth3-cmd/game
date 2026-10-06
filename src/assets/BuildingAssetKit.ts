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
    geom.rotateX(Math.PI / 2);

    // 2. Select Hyperrealistic PBR Facade Textures & Materials
    const facadeStyle = this.getStyleForCategory(bld.buildingCategory);
    const facadeTexture = TextureGenerator.createFacadePanelTexture(facadeStyle);
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
      roughness: 0.7,
      metalness: 0.15
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
        color: 0x0f172a,
        roughness: 0.1,
        metalness: 0.85,
        transparent: true,
        opacity: 0.85,
        clearcoat: 0.8,
        clearcoatRoughness: 0.1
      });

      const glassGeom = new THREE.ExtrudeGeometry(shape, { depth: storefrontHeight, bevelEnabled: false });
      glassGeom.rotateX(Math.PI / 2);
      const glassMesh = new THREE.Mesh(glassGeom, glassMat);
      glassMesh.name = `Detail_Storefront_${bld.id}`;
      glassMesh.position.y = 0.05;
      glassMesh.castShadow = true;
      group.add(glassMesh);

      // Storefront Signboard Banner
      const shopName = bld.shopNames && bld.shopNames.length > 0 ? bld.shopNames[0] : bld.name || 'COMMERCIAL CENTER';
      const signTexture = TextureGenerator.createStorefrontSignTexture(shopName);
      const signMat = new THREE.MeshStandardMaterial({
        map: signTexture,
        roughness: 0.3,
        emissive: new THREE.Color(0xffffff),
        emissiveMap: signTexture,
        emissiveIntensity: 0.25
      });
      const signBox = new THREE.BoxGeometry(Math.min(8.0, bld.height > 15 ? 10 : 5), 1.2, 0.3);
      const signMesh = new THREE.Mesh(signBox, signMat);
      signMesh.name = `Detail_Signboard_${bld.id}`;
      signMesh.position.set(0, storefrontHeight + 0.6, (bld.height > 10 ? 3.5 : 2.5));
      signMesh.castShadow = true;
      group.add(signMesh);

      // Storefront Awning Canopy
      const canopyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.5 });
      const canopyBox = new THREE.BoxGeometry(Math.min(9.0, bld.height > 15 ? 11 : 6), 0.25, 1.4);
      const canopyMesh = new THREE.Mesh(canopyBox, canopyMat);
      canopyMesh.name = `Detail_Canopy_${bld.id}`;
      canopyMesh.position.set(0, storefrontHeight, (bld.height > 10 ? 3.8 : 2.8));
      canopyMesh.castShadow = true;
      group.add(canopyMesh);
    }

    // 4. Balconies & Architectural Detailing for Residential/Apartment Blocks
    if (bld.buildingCategory === 'apartment_block' || bld.buildingCategory === 'residential_house') {
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

    // 5. Parapet Perimeter Roof Wall & Rooftop Infrastructure
    const roofY = bld.height + 0.1;
    const parapetMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.7 });
    const parapetBox = new THREE.BoxGeometry(4.0, 0.8, 0.3);
    const parapet = new THREE.Mesh(parapetBox, parapetMat);
    parapet.position.set(0, roofY + 0.4, 0);
    group.add(parapet);

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

    // 6. Perimeter Security Wall & Entry Gate
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
