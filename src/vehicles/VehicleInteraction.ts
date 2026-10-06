import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { VehicleCollisionHelper } from './VehicleCollision';

export interface IVehicleInteractionPrompt {
  canEnter: boolean;
  canExit: boolean;
  vehicle?: Vehicle;
  promptText: string;
}

export class VehicleInteraction {
  private nearestVehicle?: Vehicle;
  private enterRadius: number = 4.0;

  public checkProximity(
    playerPos: THREE.Vector3,
    vehicles: Vehicle[],
    isInVehicle: boolean,
    activeVehicle?: Vehicle
  ): IVehicleInteractionPrompt {
    if (isInVehicle && activeVehicle) {
      return {
        canEnter: false,
        canExit: true,
        vehicle: activeVehicle,
        promptText: `Exit ${activeVehicle.definition.displayName}`
      };
    }

    let minDistance = Infinity;
    let closest: Vehicle | undefined;

    for (const veh of vehicles) {
      if (veh.state.modeState === 'PARKED' || veh.state.modeState === 'UNOCCUPIED') {
        const dist = playerPos.distanceTo(veh.state.position);
        if (dist <= this.enterRadius && dist < minDistance) {
          minDistance = dist;
          closest = veh;
        }
      }
    }

    this.nearestVehicle = closest;

    if (closest) {
      return {
        canEnter: true,
        canExit: false,
        vehicle: closest,
        promptText: `Enter ${closest.definition.displayName}`
      };
    }

    return {
      canEnter: false,
      canExit: false,
      promptText: ''
    };
  }

  public getNearestVehicle(): Vehicle | undefined {
    return this.nearestVehicle;
  }

  public calculateSafeExit(
    vehicle: Vehicle,
    environmentMeshes: THREE.Object3D[] = []
  ): THREE.Vector3 {
    return VehicleCollisionHelper.calculateSafeExitPosition(
      vehicle.definition,
      vehicle.state,
      environmentMeshes
    );
  }
}
