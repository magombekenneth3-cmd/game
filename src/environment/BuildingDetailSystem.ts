import * as THREE from 'three';
import { BuildingData } from '../world/BuildingData';
import { AssetManager } from '../engine/AssetManager';
import { SeededRandom } from '../utils/SeededRandom';

export class BuildingDetailSystem {
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public decorateBuilding(building: BuildingData, seed: number = 1337): THREE.Group {
    const detailGroup = new THREE.Group();
    detailGroup.name = `BuildingDetail_${building.id}`;

    const rng = new SeededRandom(seed + building.id.length * 101);

    const glassMat = this.assetManager.getMaterial('building_glass');
    const metalMat = this.assetManager.getMaterial('facade_charcoal');
    const tankMat = this.assetManager.getMaterial('facade_sandstone');

    const width = 14.0;
    const depth = 14.0;

    // 1. Rooftop Water Tanks
    const hasWaterTank = true;
    if (hasWaterTank) {
      const tankGeo = new THREE.CylinderGeometry(0.9, 0.9, 1.6, 12);
      const tank = new THREE.Mesh(tankGeo, tankMat);
      tank.name = 'Detail_WaterTank';
      tank.position.set(
        building.center.x + (rng.nextFloat() - 0.5) * 4,
        building.height + 0.8,
        building.center.z + (rng.nextFloat() - 0.5) * 4
      );
      tank.castShadow = true;
      detailGroup.add(tank);
    }

    // 2. Rooftop Satellite Dishes / Solar Panels
    const hasSolarPanel = rng.nextFloat() < 0.6;
    if (hasSolarPanel) {
      const panelGeo = new THREE.BoxGeometry(2.0, 0.1, 1.5);
      const panel = new THREE.Mesh(panelGeo, metalMat);
      panel.name = 'Detail_SolarPanel';
      panel.rotation.x = 0.25; // Tilted toward equator
      panel.position.set(
        building.center.x + (rng.nextFloat() - 0.5) * 3,
        building.height + 0.2,
        building.center.z + (rng.nextFloat() - 0.5) * 3
      );
      detailGroup.add(panel);
    }

    // 3. Ground Level Perimeter Wall & Security Gate
    if (building.buildingCategory === 'apartment_block' || building.buildingCategory === 'residential_house' || building.buildingCategory === 'office_block') {
      const wallMat = this.assetManager.getMaterial('facade_sandstone');
      const wallGeo = new THREE.BoxGeometry(width + 4.0, 2.2, 0.3);

      const northWall = new THREE.Mesh(wallGeo, wallMat);
      northWall.name = 'Detail_PerimeterWall';
      northWall.position.set(building.center.x, 1.1, building.center.z + depth / 2 + 2.0);
      detailGroup.add(northWall);

      // Security Booth
      const boothGeo = new THREE.BoxGeometry(2.0, 2.2, 2.0);
      const booth = new THREE.Mesh(boothGeo, wallMat);
      booth.name = 'Detail_SecurityBooth';
      booth.position.set(building.center.x + width / 2 + 1.5, 1.1, building.center.z + depth / 2 + 2.0);
      detailGroup.add(booth);
    }

    // 4. Shopfront Awnings for Commercial Buildings
    if (building.buildingCategory === 'shop' || building.buildingCategory === 'mixed_use' || building.hasGroundFloorShops) {
      const awningMat = this.assetManager.getMaterial('facade_terracotta');
      const awningGeo = new THREE.BoxGeometry(width * 0.8, 0.2, 1.5);
      const awning = new THREE.Mesh(awningGeo, awningMat);
      awning.name = 'Detail_Awning';
      awning.position.set(building.center.x, 3.2, building.center.z - depth / 2 - 0.7);
      detailGroup.add(awning);
    }

    // 5. Balconies & AC Units
    if (building.height > 10) {
      const balconyMat = glassMat;
      const balconyGeo = new THREE.BoxGeometry(2.5, 1.0, 0.8);
      const balcony = new THREE.Mesh(balconyGeo, balconyMat);
      balcony.name = 'Detail_Balcony';
      balcony.position.set(building.center.x, building.height * 0.5, building.center.z + depth / 2 + 0.4);
      detailGroup.add(balcony);
    }

    return detailGroup;
  }
}
