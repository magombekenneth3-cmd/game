import * as THREE from 'three';
import { VehicleDefinition, VehicleType } from './VehicleTypes';
import { Vehicle } from './Vehicle';
import { AssetManager } from '../engine/AssetManager';

export class VehicleSpawner {
  public static getDefinition(type: VehicleType, id: string): VehicleDefinition {
    switch (type) {
      case 'matatu':
        return { id, type, displayName: 'Route 111 Matatu Minibus', mass: 3200, length: 5.4, width: 2.3, height: 2.4, maxSpeed: 110, acceleration: 6.5, braking: 9.0, steeringRate: 2.2, traction: 0.85, seats: 14 };
      case 'sedan':
        return { id, type, displayName: 'City Executive Sedan', mass: 1500, length: 4.6, width: 1.9, height: 1.5, maxSpeed: 160, acceleration: 8.5, braking: 11.0, steeringRate: 2.8, traction: 0.9, seats: 5 };
      case 'suv':
        return { id, type, displayName: 'Safari 4x4 SUV', mass: 2200, length: 4.9, width: 2.1, height: 1.9, maxSpeed: 140, acceleration: 7.5, braking: 10.0, steeringRate: 2.4, traction: 0.92, seats: 7 };
      case 'pickup':
        return { id, type, displayName: 'Double-Cab Pickup', mass: 2000, length: 5.1, width: 2.0, height: 1.8, maxSpeed: 135, acceleration: 7.0, braking: 9.5, steeringRate: 2.3, traction: 0.88, seats: 5 };
      case 'van':
        return { id, type, displayName: 'Cargo Delivery Van', mass: 2500, length: 5.2, width: 2.1, height: 2.2, maxSpeed: 120, acceleration: 6.0, braking: 8.5, steeringRate: 2.0, traction: 0.85, seats: 3 };
      case 'motorcycle':
        return { id, type, displayName: 'Boda-Boda Express Motorcycle', mass: 180, length: 2.1, width: 0.8, height: 1.2, maxSpeed: 110, acceleration: 12.0, braking: 14.0, steeringRate: 4.5, traction: 0.8, seats: 2 };
      default:
        return { id, type: 'compact_car', displayName: 'Urban Compact Hatchback', mass: 1200, length: 3.9, width: 1.7, height: 1.4, maxSpeed: 130, acceleration: 7.0, braking: 10.0, steeringRate: 3.0, traction: 0.9, seats: 4 };
    }
  }

  public static spawnDeterministicFleet(_seed: number, scene: THREE.Scene, assetManager: AssetManager): Vehicle[] {
    const fleet: Vehicle[] = [];

    const fleetTypes: VehicleType[] = [
      'matatu', 'matatu', 'sedan', 'sedan', 'suv', 'pickup', 'van', 'compact_car', 'compact_car', 'motorcycle'
    ];

    const roadPosOffsets = [
      { x: 12, z: 10, rot: 0 },
      { x: 25, z: -45, rot: Math.PI / 4 },
      { x: -35, z: -70, rot: -Math.PI / 2 },
      { x: 50, z: 60, rot: Math.PI / 3 },
      { x: -80, z: 40, rot: Math.PI },
      { x: 90, z: -30, rot: -Math.PI / 4 },
      { x: -110, z: -20, rot: 0 },
      { x: 70, z: -90, rot: Math.PI / 2 },
      { x: -60, z: 90, rot: -Math.PI / 3 },
      { x: 10, z: 40, rot: 0 }
    ];

    fleetTypes.forEach((type, idx) => {
      const def = this.getDefinition(type, `fleet_veh_${idx}`);
      const offset = roadPosOffsets[idx % roadPosOffsets.length];
      const pos = new THREE.Vector3(offset.x, 0.3, offset.z);

      const vehicle = new Vehicle(def, pos, offset.rot, scene, assetManager);
      fleet.push(vehicle);
    });

    return fleet;
  }
}
