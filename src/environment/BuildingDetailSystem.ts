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

    const metalMat = this.assetManager.getMaterial('facade_charcoal');
    const tankMat = this.assetManager.getMaterial('facade_sandstone');

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

    // 3. Optional Rooftop Equipment
    return detailGroup;
  }
}
