import * as THREE from 'three';
import { BuildingClassification, InteriorRoom } from './InteriorTypes';

export class InteriorLightingSystem {
  public static createLightingForInterior(
    group: THREE.Group,
    category: BuildingClassification,
    rooms: InteriorRoom[],
    bounds: THREE.Box3
  ): THREE.PointLight[] {
    const lights: THREE.PointLight[] = [];

    // Ambient interior fill light
    const ambientLight = new THREE.AmbientLight(
      category === 'NIGHTCLUB' ? 0x221133 : 0xffffff,
      category === 'NIGHTCLUB' ? 0.6 : 0.9
    );
    group.add(ambientLight);

    // Per-room ceiling point lights
    rooms.forEach((room, idx) => {
      const center = new THREE.Vector3();
      room.bounds.getCenter(center);
      const heightY = bounds.max.y - 0.4;

      let color = 0xfff4e0; // Warm white default
      let intensity = 1.5;
      let distance = 15.0;

      if (category === 'NIGHTCLUB') {
        if (room.type === 'MAIN_FLOOR' || room.type === 'DANCE_FLOOR') {
          color = idx % 2 === 0 ? 0x00e5ff : 0xff007f; // Cyan / Neon Pink
          intensity = 3.0;
          distance = 20.0;
        } else if (room.type === 'VIP') {
          color = 0xffd700; // Gold
          intensity = 2.0;
        } else if (room.type === 'BAR') {
          color = 0xff4081; // Pink
          intensity = 2.2;
        }
      } else if (category === 'GARAGE' || category === 'WAREHOUSE') {
        color = 0xe0f7fa; // Cool industrial white
        intensity = 2.0;
      }

      const light = new THREE.PointLight(color, intensity, distance);
      light.position.set(center.x, heightY, center.z);

      // Simple visual bulb mesh
      const bulbGeo = new THREE.SphereGeometry(0.15, 8, 8);
      const bulbMat = new THREE.MeshBasicMaterial({ color });
      const bulbMesh = new THREE.Mesh(bulbGeo, bulbMat);
      light.add(bulbMesh);

      group.add(light);
      lights.push(light);
    });

    return lights;
  }
}
