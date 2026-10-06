import * as THREE from 'three';

export interface ParkingSlot {
  id: string;
  position: THREE.Vector3;
  isOccupied: boolean;
  occupiedVehicleId?: string;
}

export interface ParkingArea {
  id: string;
  name: string;
  slots: ParkingSlot[];
}

export class ParkingSystem {
  private parkingAreas: Map<string, ParkingArea> = new Map();

  public registerParkingArea(area: ParkingArea): void {
    this.parkingAreas.set(area.id, area);
  }

  public findAvailableSlotNear(position: THREE.Vector3, maxRadius: number = 80.0): ParkingSlot | undefined {
    let nearest: ParkingSlot | undefined;
    let minDistanceSq = maxRadius * maxRadius;

    this.parkingAreas.forEach((area) => {
      area.slots.forEach((slot) => {
        if (!slot.isOccupied) {
          const distSq = position.distanceToSquared(slot.position);
          if (distSq < minDistanceSq) {
            minDistanceSq = distSq;
            nearest = slot;
          }
        }
      });
    });

    return nearest;
  }

  public occupySlot(slotId: string, vehicleId: string): boolean {
    let success = false;
    this.parkingAreas.forEach((area) => {
      const slot = area.slots.find((s) => s.id === slotId);
      if (slot && !slot.isOccupied) {
        slot.isOccupied = true;
        slot.occupiedVehicleId = vehicleId;
        success = true;
      }
    });
    return success;
  }

  public vacateSlot(vehicleId: string): void {
    this.parkingAreas.forEach((area) => {
      const slot = area.slots.find((s) => s.occupiedVehicleId === vehicleId);
      if (slot) {
        slot.isOccupied = false;
        slot.occupiedVehicleId = undefined;
      }
    });
  }

  public getAllAreas(): ParkingArea[] {
    return Array.from(this.parkingAreas.values());
  }

  public clear(): void {
    this.parkingAreas.clear();
  }
}
