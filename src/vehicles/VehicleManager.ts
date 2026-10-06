import * as THREE from 'three';
import { Vehicle } from './Vehicle';
import { VehicleType } from './VehicleTypes';
import { VehicleController } from './VehicleController';
import { VehicleCamera } from './VehicleCamera';
import { VehicleInteraction, IVehicleInteractionPrompt } from './VehicleInteraction';
import { VehicleLODManager, VehicleLODTier } from './VehicleLOD';
import { VehicleSpawner } from './VehicleSpawner';
import { VehicleAudioHooks } from './VehicleAudio';
import { AssetManager } from '../engine/AssetManager';

export class VehicleManager {
  public vehicles: Map<string, Vehicle> = new Map();
  private scene: THREE.Scene;
  private assetManager: AssetManager;

  public vehicleController: VehicleController;
  public vehicleCamera: VehicleCamera;
  public interaction: VehicleInteraction;
  public audio: VehicleAudioHooks;

  private lodTiers: Map<string, VehicleLODTier> = new Map();
  private isPlayerDriving: boolean = false;
  private activeVehicleId?: string;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, assetManager: AssetManager) {
    this.scene = scene;
    this.assetManager = assetManager;

    this.vehicleController = new VehicleController();
    this.vehicleCamera = new VehicleCamera(camera);
    this.interaction = new VehicleInteraction();
    this.audio = new VehicleAudioHooks();
  }

  public spawnVehicle(
    type: VehicleType,
    id: string,
    position: THREE.Vector3,
    rotationY: number = 0
  ): Vehicle {
    const def = VehicleSpawner.getDefinition(type, id);
    const vehicle = new Vehicle(def, position, rotationY, this.scene, this.assetManager);
    this.vehicles.set(id, vehicle);
    return vehicle;
  }

  public spawnDeterministicFleet(seed: number = 1337): Vehicle[] {
    const fleet = VehicleSpawner.spawnDeterministicFleet(seed, this.scene, this.assetManager);
    fleet.forEach((veh) => {
      this.vehicles.set(veh.definition.id, veh);
    });
    return fleet;
  }

  public removeVehicle(id: string): boolean {
    const veh = this.vehicles.get(id);
    if (veh) {
      if (this.activeVehicleId === id) {
        this.exitVehicle();
      }
      veh.dispose();
      this.vehicles.delete(id);
      this.lodTiers.delete(id);
      return true;
    }
    return false;
  }

  public getVehicle(id: string): Vehicle | undefined {
    return this.vehicles.get(id);
  }

  public getAllVehicles(): Vehicle[] {
    return Array.from(this.vehicles.values());
  }

  public getNearbyVehicles(pos: THREE.Vector3, radius: number): Vehicle[] {
    const result: Vehicle[] = [];
    this.vehicles.forEach((veh) => {
      if (veh.state.position.distanceTo(pos) <= radius) {
        result.push(veh);
      }
    });
    return result;
  }

  public enterVehicle(vehicle: Vehicle): boolean {
    if (vehicle.state.modeState === 'DRIVING' || vehicle.state.modeState === 'OCCUPIED') {
      return false;
    }

    vehicle.state.modeState = 'ENTERING';
    this.vehicleController.setActiveVehicle(vehicle);

    this.isPlayerDriving = true;
    this.activeVehicleId = vehicle.definition.id;

    vehicle.state.modeState = 'DRIVING';
    vehicle.state.occupiedSeats = 1;

    this.audio.playDoorOpen();
    this.audio.playEngineIdle();

    return true;
  }

  public exitVehicle(environmentMeshes: THREE.Object3D[] = []): THREE.Vector3 | undefined {
    const activeVeh = this.vehicleController.getActiveVehicle();
    if (!activeVeh) return undefined;

    activeVeh.state.modeState = 'EXITING';
    const exitPos = this.interaction.calculateSafeExit(activeVeh, environmentMeshes);

    this.audio.playDoorClose();

    this.vehicleController.setActiveVehicle(undefined);

    activeVeh.state.modeState = 'PARKED';
    activeVeh.state.occupiedSeats = 0;
    activeVeh.state.throttle = 0;
    activeVeh.state.steering = 0;
    activeVeh.state.velocity.set(0, 0, 0);
    this.isPlayerDriving = false;
    this.activeVehicleId = undefined;

    return exitPos;
  }

  public updateVehicleLOD(playerPos: THREE.Vector3): Map<string, VehicleLODTier> {
    this.lodTiers.clear();
    this.vehicles.forEach((veh, id) => {
      const isPlayer = id === this.activeVehicleId;
      const tier = VehicleLODManager.evaluateTier(veh.state.position, playerPos, isPlayer);
      this.lodTiers.set(id, tier);
    });
    return this.lodTiers;
  }

  public update(
    fixedDt: number,
    playerPos: THREE.Vector3,
    environmentMeshes: THREE.Object3D[] = []
  ): void {
    // 1. Evaluate LODs
    this.updateVehicleLOD(playerPos);

    // 2. Physics & State simulation per vehicle
    this.vehicles.forEach((veh, id) => {
      const tier = this.lodTiers.get(id) || 'TIER0_PLAYER_VICINITY';
      if (tier === 'TIER0_PLAYER_VICINITY' || tier === 'TIER1_NEARBY' || id === this.activeVehicleId) {
        veh.update(fixedDt, environmentMeshes);
      }
    });

    // 3. Update active vehicle camera if player is driving
    const activeVeh = this.vehicleController.getActiveVehicle();
    if (this.isPlayerDriving && activeVeh) {
      this.vehicleCamera.update(
        activeVeh.state.position,
        activeVeh.state.rotationY,
        activeVeh.state.currentSpeedKph,
        fixedDt,
        environmentMeshes
      );
    }
  }

  public checkPlayerInteraction(
    playerPos: THREE.Vector3
  ): IVehicleInteractionPrompt {
    const activeVeh = this.vehicleController.getActiveVehicle();
    return this.interaction.checkProximity(
      playerPos,
      this.getAllVehicles(),
      this.isPlayerDriving,
      activeVeh
    );
  }

  public get driving(): boolean {
    return this.isPlayerDriving;
  }

  public get activeVehicle(): Vehicle | undefined {
    return this.vehicleController.getActiveVehicle();
  }

  public getTelemetry(): {
    totalVehicles: number;
    activeVehicleType?: string;
    speedKph: number;
    drivingState: string;
  } {
    const activeVeh = this.vehicleController.getActiveVehicle();
    return {
      totalVehicles: this.vehicles.size,
      activeVehicleType: activeVeh?.definition.displayName,
      speedKph: activeVeh ? activeVeh.state.currentSpeedKph : 0,
      drivingState: activeVeh ? activeVeh.state.modeState : 'ON_FOOT'
    };
  }

  public dispose(): void {
    this.vehicles.forEach((veh) => veh.dispose());
    this.vehicles.clear();
  }
}
