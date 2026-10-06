import * as THREE from 'three';
import { VehicleDefinition, VehicleRuntimeState } from './VehicleTypes';
import { IVehicleInputState } from './VehicleInput';

export class VehiclePhysics {
  private def: VehicleDefinition;
  private state: VehicleRuntimeState;
  private downRaycaster: THREE.Raycaster = new THREE.Raycaster();
  private downVector: THREE.Vector3 = new THREE.Vector3(0, -1, 0);

  constructor(definition: VehicleDefinition, initialState: VehicleRuntimeState) {
    this.def = definition;
    this.state = initialState;
    this.downRaycaster.far = 10.0;
  }

  /**
   * Fixed-timestep physics simulation step (60 Hz fixed dt).
   */
  public stepFixed(input: IVehicleInputState, fixedDt: number = 1 / 60, environmentMeshes: THREE.Object3D[] = []): void {
    const maxSpeedMps = (this.def.maxSpeed * 1000) / 3600; // Convert KPH to m/s
    const currentSpeedMps = this.state.velocity.length();

    // 1. Throttle / Acceleration & Braking / Reverse
    if (input.throttle > 0) {
      if (currentSpeedMps < maxSpeedMps) {
        const accelForce = this.def.acceleration * input.throttle * fixedDt;
        const forwardDir = new THREE.Vector3(-Math.sin(this.state.rotationY), 0, -Math.cos(this.state.rotationY));
        this.state.velocity.add(forwardDir.multiplyScalar(accelForce));
      }
    } else if (input.reverse > 0) {
      const reverseMaxMps = maxSpeedMps * 0.35;
      if (currentSpeedMps < reverseMaxMps) {
        const reverseForce = this.def.acceleration * 0.6 * input.reverse * fixedDt;
        const backwardDir = new THREE.Vector3(Math.sin(this.state.rotationY), 0, Math.cos(this.state.rotationY));
        this.state.velocity.add(backwardDir.multiplyScalar(reverseForce));
      }
    }

    // 2. Friction / Handbrake Deceleration
    const frictionFactor = input.handbrake ? 0.85 : 0.96;
    this.state.velocity.multiplyScalar(frictionFactor);

    if (this.state.velocity.length() > maxSpeedMps) {
      this.state.velocity.clampLength(0, maxSpeedMps);
    }

    if (this.state.velocity.length() < 0.05) {
      this.state.velocity.set(0, 0, 0);
    }

    // 3. Steering & Yaw Rotation (Speed-sensitive steering)
    const speedRatio = Math.min(1.0, currentSpeedMps / 5.0);
    if (speedRatio > 0.05 && Math.abs(input.steer) > 0.01) {
      // Reversing inverts steering angle
      const isReversing = input.reverse > 0 && input.throttle === 0;
      const steerDir = isReversing ? -1 : 1;
      const steerDelta = -input.steer * this.def.steeringRate * speedRatio * steerDir * fixedDt;
      this.state.rotationY += steerDelta;

      // Align velocity vector to vehicle orientation
      const newForward = new THREE.Vector3(-Math.sin(this.state.rotationY), 0, -Math.cos(this.state.rotationY));
      this.state.velocity.copy(newForward.multiplyScalar(currentSpeedMps * frictionFactor));
    }

    // 4. Update Position
    this.state.position.x += this.state.velocity.x * fixedDt;
    this.state.position.z += this.state.velocity.z * fixedDt;

    // 5. Update Speed KPH Metric
    this.state.currentSpeedKph = parseFloat(((this.state.velocity.length() * 3600) / 1000).toFixed(1));

    // 6. Terrain Ground Elevation Snap
    this.updateGroundElevation(environmentMeshes);

    // 7. Obstacle Box Collision
    this.resolveObstacleCollisions(environmentMeshes);
  }

  private updateGroundElevation(environmentMeshes: THREE.Object3D[]): void {
    if (environmentMeshes.length === 0) return;

    const rayOrigin = this.state.position.clone();
    rayOrigin.y += 3.0;

    this.downRaycaster.set(rayOrigin, this.downVector);
    const hits = this.downRaycaster.intersectObjects(environmentMeshes, true);

    if (hits.length > 0) {
      this.state.position.y = hits[0].point.y + 0.1;
    }
  }

  private resolveObstacleCollisions(environmentMeshes: THREE.Object3D[]): void {
    const halfWidth = this.def.width / 2 + 0.3;
    const halfLength = this.def.length / 2 + 0.3;

    environmentMeshes.forEach((mesh) => {
      if (mesh.name.startsWith('Building_')) {
        const box = new THREE.Box3().setFromObject(mesh);
        box.min.x -= halfWidth;
        box.max.x += halfWidth;
        box.min.z -= halfLength;
        box.max.z += halfLength;

        if (box.containsPoint(this.state.position)) {
          // Push vehicle out and stop velocity
          this.state.velocity.set(0, 0, 0);

          const dxMin = Math.abs(this.state.position.x - box.min.x);
          const dxMax = Math.abs(this.state.position.x - box.max.x);
          const dzMin = Math.abs(this.state.position.z - box.min.z);
          const dzMax = Math.abs(this.state.position.z - box.max.z);

          const minDelta = Math.min(dxMin, dxMax, dzMin, dzMax);
          if (minDelta === dxMin) this.state.position.x = box.min.x;
          else if (minDelta === dxMax) this.state.position.x = box.max.x;
          else if (minDelta === dzMin) this.state.position.z = box.min.z;
          else if (minDelta === dzMax) this.state.position.z = box.max.z;
        }
      }
    });
  }

  public get position(): THREE.Vector3 {
    return this.state.position;
  }
}
