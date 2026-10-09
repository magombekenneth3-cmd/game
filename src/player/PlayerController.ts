import * as THREE from 'three';
import { InputManager } from './InputManager';
import { PlayerState } from './PlayerState';
import { CharacterMotor } from './CharacterMotor';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { InteractionSystem } from './InteractionSystem';
import { VehicleManager } from '../vehicles/VehicleManager';
import { AssetPipeline } from '../assets/AssetPipeline';

export class PlayerController {
  public mesh: THREE.Group;
  public motor: CharacterMotor;
  public state: PlayerState;
  public input: InputManager;
  public cameraManager: ThirdPersonCamera;
  public interactionSystem: InteractionSystem;
  public vehicleManager?: VehicleManager;

  private scene: THREE.Scene;

  // Humanoid Body Parts for Animation
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private walkCycleTime: number = 0;

  constructor(
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    domElement: HTMLElement
  ) {
    this.scene = scene;

    this.mesh = new THREE.Group();
    this.mesh.name = 'PlayerCharacterMesh';

    this.motor = new CharacterMotor();
    this.state = new PlayerState();
    this.input = new InputManager(domElement);
    this.cameraManager = new ThirdPersonCamera(camera);
    this.interactionSystem = new InteractionSystem();

    this.createPlaceholderHumanoid();
    this.scene.add(this.mesh);

    // Initial Spawn Position on Ngong Road Corridor (X = 0, Z = 15)
    this.motor.position.set(0, 0.5, 15);
    this.cameraManager.snapToTarget(this.motor.position);
  }

  private createPlaceholderHumanoid(): void {
    const characterMesh = AssetPipeline.getInstance().getCharacterMesh('player');
    this.mesh.add(characterMesh);

    this.leftLeg = characterMesh.getObjectByName('LeftLeg') as THREE.Mesh || new THREE.Mesh();
    this.rightLeg = characterMesh.getObjectByName('RightLeg') as THREE.Mesh || new THREE.Mesh();
  }

  public update(
    deltaSeconds: number,
    groundMeshes: THREE.Object3D[] = [],
    collisionProxies?: THREE.Box3[],
    cameraOccluders?: THREE.Object3D[]
  ): void {
    const inputState = this.input.getInput();

    // Handling Vehicle Driving State
    if (this.state.getMode() === 'IN_VEHICLE' && this.vehicleManager) {
      this.mesh.visible = false;

      // Mouse Look for Vehicle Camera
      if (inputState.mouseX !== 0 || inputState.mouseY !== 0) {
        this.vehicleManager.vehicleCamera.handleMouseLook(inputState.mouseX, inputState.mouseY);
      }

      // Driving input forward to vehicle controller
      this.vehicleManager.vehicleController.updateDrivingInput(
        inputState.forward,
        inputState.backward,
        inputState.left,
        inputState.right,
        inputState.jump, // Space = Handbrake
        inputState.interact // E = Exit Vehicle
      );

      // Sync motor position to vehicle position for chunk streaming & camera tracking
      if (this.vehicleManager.activeVehicle) {
        this.motor.position.copy(this.vehicleManager.activeVehicle.state.position);
      }

      // Check if player wants to exit vehicle (KeyE)
      if (inputState.interact) {
        const exitPos = this.vehicleManager.exitVehicle(groundMeshes);
        if (exitPos) {
          this.motor.position.copy(exitPos);
          this.state.setMode('IDLE');
          this.mesh.visible = true;
        }
      }
      return;
    }

    // ON-FOOT MODE
    this.mesh.visible = true;

    // 1. Camera Mouse Look
    if (inputState.mouseX !== 0 || inputState.mouseY !== 0) {
      this.cameraManager.handleMouseInput(inputState.mouseX, inputState.mouseY);
    }

    // 2. Character Motor Movement (terrain ground raycasts strictly against groundMeshes)
    const cameraYaw = this.cameraManager.getYaw();
    const determinedMode = this.motor.update(inputState, cameraYaw, deltaSeconds, groundMeshes);

    if (collisionProxies && collisionProxies.length > 0) {
      this.motor.resolveObstacleCollisionsFromProxies(collisionProxies);
    }

    // 3. Update Player State & Stamina
    this.state.setMode(determinedMode);
    this.state.updateStamina(deltaSeconds, inputState.sprint);

    // 4. Sync Visual Mesh Position
    this.mesh.position.copy(this.motor.position);
    this.mesh.rotation.y = this.motor.rotationY;

    // 5. Update Leg Swing Animation
    this.updateWalkAnimation(deltaSeconds);

    // 6. Update Third-Person Orbit Camera (collision checks strictly against cameraOccluders)
    this.cameraManager.update(this.motor.position, deltaSeconds, cameraOccluders || []);


    // 7. Check Vehicle Entry Interaction if VehicleManager is attached
    if (inputState.interact && this.vehicleManager) {
      const prompt = this.vehicleManager.checkPlayerInteraction(this.motor.position);
      if (prompt.canEnter && prompt.vehicle) {
        const success = this.vehicleManager.enterVehicle(prompt.vehicle);
        if (success) {
          this.state.setMode('IN_VEHICLE');
          this.mesh.visible = false;
          return;
        }
      }
    }

    // 8. Update General Interaction System
    this.interactionSystem.update(this.motor.position, inputState.interact);
  }

  private updateWalkAnimation(deltaSeconds: number): void {
    const speed = this.motor.getSpeed();
    if (speed > 0.1) {
      this.walkCycleTime += deltaSeconds * speed * 2.5;
      const legAngle = Math.sin(this.walkCycleTime) * 0.4;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
    } else {
      this.walkCycleTime = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
    }
  }

  public getPosition(): THREE.Vector3 {
    if (this.state.getMode() === 'IN_VEHICLE' && this.vehicleManager && this.vehicleManager.activeVehicle) {
      return this.vehicleManager.activeVehicle.state.position;
    }
    return this.motor.position;
  }
}
