import * as THREE from 'three';
import { InputManager } from './InputManager';
import { PlayerState } from './PlayerState';
import { CharacterMotor } from './CharacterMotor';
import { ThirdPersonCamera } from './ThirdPersonCamera';
import { InteractionSystem } from './InteractionSystem';
import { VehicleManager } from '../vehicles/VehicleManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { CharacterAnimationController } from '../assets/CharacterAnimationController';

export class PlayerController {
  public mesh: THREE.Group;
  public motor: CharacterMotor;
  public state: PlayerState;
  public input: InputManager;
  public cameraManager: ThirdPersonCamera;
  public interactionSystem: InteractionSystem;
  public vehicleManager?: VehicleManager;
  public animController: CharacterAnimationController | null = null;

  private scene: THREE.Scene;

  // Humanoid Body Parts for Animation
  private leftLeg!: THREE.Mesh;
  private rightLeg!: THREE.Mesh;
  private leftArm?: THREE.Object3D;
  private rightArm?: THREE.Object3D;
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

    const anims = (characterMesh.userData?.animations as THREE.AnimationClip[]) ||
      AssetPipeline.getInstance().getAnimations('char_player_01');
    let hasBones = false;
    characterMesh.traverse((c) => { if ((c as THREE.Bone).isBone) hasBones = true; });

    if (hasBones && anims && anims.length > 0) {
      this.animController = new CharacterAnimationController(characterMesh, anims);
      this.animController.setState('idle');
    }

    this.leftLeg = (characterMesh.getObjectByName('LeftUpLeg') || characterMesh.getObjectByName('LeftLeg')) as THREE.Mesh || new THREE.Mesh();
    this.rightLeg = (characterMesh.getObjectByName('RightUpLeg') || characterMesh.getObjectByName('RightLeg')) as THREE.Mesh || new THREE.Mesh();
    this.leftArm = characterMesh.getObjectByName('LeftArm') || undefined;
    this.rightArm = characterMesh.getObjectByName('RightArm') || undefined;
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

    // 5. Update Character Animation (Skeletal Mixer or Procedural Fallback)
    this.updateCharacterAnimation(deltaSeconds);

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

  private updateCharacterAnimation(deltaSeconds: number): void {
    const speed = this.motor.getSpeed();

    // Lazy initialization if model/animations finished loading asynchronously
    if (!this.animController) {
      const childMesh = this.mesh.children[0];
      const anims = (childMesh?.userData?.animations as THREE.AnimationClip[]) ||
        AssetPipeline.getInstance().getAnimations('char_player_01');
      let hasBones = false;
      this.mesh.traverse((c) => { if ((c as THREE.Bone).isBone) hasBones = true; });

      if (hasBones && anims && anims.length > 0) {
        const root = childMesh || this.mesh;
        this.animController = new CharacterAnimationController(root, anims);
        this.animController.setState('idle');
      }
    }

    if (this.animController && this.animController.actions.size > 0) {
      const isSprinting = this.state.getMode() === 'SPRINTING' || speed > 7.0;
      if (isSprinting) {
        this.animController.setState('run');
      } else if (speed > 0.1) {
        this.animController.setState('walk');
      } else {
        this.animController.setState('idle');
      }
      this.animController.update(deltaSeconds);
      return;
    }

    // Procedural Fallback if no skeletal animations
    this.updateWalkAnimation(deltaSeconds);
  }

  private updateWalkAnimation(deltaSeconds: number): void {
    const speed = this.motor.getSpeed();
    if (speed > 0.1) {
      this.walkCycleTime += deltaSeconds * speed * 2.5;
      const legAngle = Math.sin(this.walkCycleTime) * 0.45;
      this.leftLeg.rotation.x = legAngle;
      this.rightLeg.rotation.x = -legAngle;
      if (this.leftArm) this.leftArm.rotation.x = -legAngle * 0.6;
      if (this.rightArm) this.rightArm.rotation.x = legAngle * 0.6;
    } else {
      this.walkCycleTime = 0;
      this.leftLeg.rotation.x = 0;
      this.rightLeg.rotation.x = 0;
      if (this.leftArm) this.leftArm.rotation.x = 0;
      if (this.rightArm) this.rightArm.rotation.x = 0;
    }
  }

  public dispose(): void {
    if (this.animController) {
      this.animController.dispose();
      this.animController = null;
    }
  }

  public getPosition(): THREE.Vector3 {
    if (this.state.getMode() === 'IN_VEHICLE' && this.vehicleManager && this.vehicleManager.activeVehicle) {
      return this.vehicleManager.activeVehicle.state.position;
    }
    return this.motor.position;
  }
}
