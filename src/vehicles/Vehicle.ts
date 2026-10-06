import * as THREE from 'three';
import { VehicleDefinition, VehicleRuntimeState } from './VehicleTypes';
import { VehiclePhysics } from './VehiclePhysics';
import { VehicleStateManager } from './VehicleState';
import { AssetManager } from '../engine/AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';

export class Vehicle {
  public definition: VehicleDefinition;
  public state: VehicleRuntimeState;
  public physics: VehiclePhysics;
  public stateManager: VehicleStateManager;
  public visualMesh: THREE.Group;
  private scene: THREE.Scene;

  constructor(
    definition: VehicleDefinition,
    initialPosition: THREE.Vector3,
    initialRotationY: number,
    scene: THREE.Scene,
    assetManager: AssetManager
  ) {
    this.definition = definition;
    this.scene = scene;

    this.state = {
      position: initialPosition.clone(),
      rotationY: initialRotationY,
      velocity: new THREE.Vector3(),
      currentSpeedKph: 0,
      modeState: 'PARKED',
      throttle: 0,
      steering: 0,
      brake: 0,
      handbrake: false,
      occupiedSeats: 0,
      damage: 0
    };

    this.physics = new VehiclePhysics(this.definition, this.state);
    this.stateManager = new VehicleStateManager();
    this.visualMesh = this.createVisualMesh(assetManager);

    this.visualMesh.position.copy(this.state.position);
    this.visualMesh.rotation.y = this.state.rotationY;
    this.scene.add(this.visualMesh);
  }

  public update(fixedDt: number, environmentMeshes: THREE.Object3D[] = []): void {
    if (this.state.modeState === 'DRIVING' || this.state.velocity.lengthSq() > 0.01) {
      this.physics.stepFixed({
        throttle: this.state.throttle,
        reverse: this.state.throttle < 0 ? Math.abs(this.state.throttle) : 0,
        steer: this.state.steering,
        handbrake: this.state.handbrake,
        exitVehicle: false
      }, fixedDt, environmentMeshes);

      this.visualMesh.position.copy(this.state.position);
      this.visualMesh.rotation.y = this.state.rotationY;
    }
  }

  private createVisualMesh(_assetManager: AssetManager): THREE.Group {
    const group = new THREE.Group();
    group.name = `VehicleMesh_${this.definition.id}`;

    const category = (this.definition.type as any) || 'sedan';
    const mesh = AssetPipeline.getInstance().getVehicleMesh(category);
    group.add(mesh);

    return group;
  }

  public dispose(): void {
    this.scene.remove(this.visualMesh);
  }
}
