import * as THREE from 'three';
import { PlayerConfig, IInputState, PlayerStateMode } from './PlayerTypes';

export class CharacterMotor {
  public position: THREE.Vector3 = new THREE.Vector3(0, 0.5, 0);
  public velocity: THREE.Vector3 = new THREE.Vector3();
  public rotationY: number = 0;
  public isGrounded: boolean = true;

  private config: PlayerConfig;
  private currentSpeed: number = 0;
  private targetVelocity: THREE.Vector3 = new THREE.Vector3();
  private moveDirection: THREE.Vector3 = new THREE.Vector3();

  // Reusable Raycasters & Vectors for Zero-GC Execution
  private downRaycaster: THREE.Raycaster = new THREE.Raycaster();
  private downVector: THREE.Vector3 = new THREE.Vector3(0, -1, 0);
  private forwardVector: THREE.Vector3 = new THREE.Vector3();
  private rightVector: THREE.Vector3 = new THREE.Vector3();

  constructor(config?: Partial<PlayerConfig>) {
    this.config = {
      walkSpeed: 3.5,
      runSpeed: 6.5,
      sprintSpeed: 10.5,
      acceleration: 25.0,
      deceleration: 20.0,
      rotationSpeed: 12.0,
      gravity: 20.0,
      jumpForce: 7.5,
      ...config
    };
    this.downRaycaster.far = 10.0;
  }

  public update(
    input: IInputState,
    cameraYaw: number,
    deltaSeconds: number,
    environmentMeshes: THREE.Object3D[] = []
  ): PlayerStateMode {
    // 1. Determine Target Speed based on input
    const isMoving = input.forward || input.backward || input.left || input.right;
    let targetSpeed = 0;
    let determinedMode: PlayerStateMode = 'IDLE';

    if (isMoving) {
      if (input.sprint) {
        targetSpeed = this.config.sprintSpeed;
        determinedMode = 'SPRINTING';
      } else {
        targetSpeed = this.config.runSpeed;
        determinedMode = 'RUNNING';
      }
    }

    // 2. Calculate Direction Vector relative to Camera Yaw
    this.moveDirection.set(0, 0, 0);

    if (isMoving) {
      this.forwardVector.set(-Math.sin(cameraYaw), 0, -Math.cos(cameraYaw)).normalize();
      this.rightVector.set(Math.cos(cameraYaw), 0, -Math.sin(cameraYaw)).normalize();

      if (input.forward) this.moveDirection.add(this.forwardVector);
      if (input.backward) this.moveDirection.sub(this.forwardVector);
      if (input.right) this.moveDirection.add(this.rightVector);
      if (input.left) this.moveDirection.sub(this.rightVector);

      if (this.moveDirection.lengthSq() > 0) {
        this.moveDirection.normalize();

        // Smooth character rotation toward move direction
        const targetRotation = Math.atan2(this.moveDirection.x, this.moveDirection.z);
        let deltaAngle = targetRotation - this.rotationY;
        // Normalize angle difference to [-PI, PI]
        deltaAngle = Math.atan2(Math.sin(deltaAngle), Math.cos(deltaAngle));
        this.rotationY += deltaAngle * Math.min(1.0, deltaSeconds * this.config.rotationSpeed);
      }
    }

    // 3. Accelerate / Decelerate Speed
    if (isMoving) {
      this.currentSpeed = Math.min(targetSpeed, this.currentSpeed + this.config.acceleration * deltaSeconds);
    } else {
      this.currentSpeed = Math.max(0, this.currentSpeed - this.config.deceleration * deltaSeconds);
    }

    // 4. Calculate Horizontal Velocity & Update Position
    this.targetVelocity.copy(this.moveDirection).multiplyScalar(this.currentSpeed);
    this.position.x += this.targetVelocity.x * deltaSeconds;
    this.position.z += this.targetVelocity.z * deltaSeconds;

    // 5. Environment Collision Resolution (Obstacle Box Collision)
    this.resolveObstacleCollisions(environmentMeshes);

    // 6. Terrain Ground Height Snap Raycast
    this.updateGroundHeight(environmentMeshes);

    return this.currentSpeed > 0.1 ? determinedMode : 'IDLE';
  }

  private updateGroundHeight(environmentMeshes: THREE.Object3D[]): void {
    if (environmentMeshes.length === 0) return;

    // Cast ray downwards from slightly above player position
    const rayOrigin = this.position.clone();
    rayOrigin.y += 3.0;

    this.downRaycaster.set(rayOrigin, this.downVector);
    const hits = this.downRaycaster.intersectObjects(environmentMeshes, true);

    if (hits.length > 0) {
      const groundY = hits[0].point.y;
      // Smoothly snap Y position to ground elevation
      this.position.y = groundY + 0.1;
      this.isGrounded = true;
    }
  }

  public resolveObstacleCollisionsFromProxies(collisionProxies: THREE.Box3[]): void {
    const playerRadius = 0.6;

    collisionProxies.forEach((box) => {
      const minX = box.min.x - playerRadius;
      const maxX = box.max.x + playerRadius;
      const minZ = box.min.z - playerRadius;
      const maxZ = box.max.z + playerRadius;

      if (
        this.position.x >= minX && this.position.x <= maxX &&
        this.position.z >= minZ && this.position.z <= maxZ
      ) {
        const dxMin = Math.abs(this.position.x - minX);
        const dxMax = Math.abs(this.position.x - maxX);
        const dzMin = Math.abs(this.position.z - minZ);
        const dzMax = Math.abs(this.position.z - maxZ);

        const minDelta = Math.min(dxMin, dxMax, dzMin, dzMax);

        if (minDelta === dxMin) this.position.x = minX;
        else if (minDelta === dxMax) this.position.x = maxX;
        else if (minDelta === dzMin) this.position.z = minZ;
        else if (minDelta === dzMax) this.position.z = maxZ;
      }
    });
  }

  private resolveObstacleCollisions(environmentMeshes: THREE.Object3D[]): void {
    environmentMeshes.forEach((mesh) => {
      if (mesh.name.startsWith('Building_')) {
        const box = new THREE.Box3().setFromObject(mesh);
        this.resolveObstacleCollisionsFromProxies([box]);
      }
    });
  }

  public getSpeed(): number {
    return this.currentSpeed;
  }
}
