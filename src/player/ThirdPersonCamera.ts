import * as THREE from 'three';

export class ThirdPersonCamera {
  public camera: THREE.PerspectiveCamera;
  private targetPosition: THREE.Vector3 = new THREE.Vector3();
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();

  // Camera Orbit Parameters
  private distance: number = 7.0;
  private minDistance: number = 2.0;
  private maxDistance: number = 15.0;
  private heightOffset: number = 1.8;
  private yaw: number = 0; // Horizontal angle in radians
  private pitch: number = 0.25; // Vertical angle in radians

  private minPitch: number = -Math.PI / 6; // -30 degrees
  private maxPitch: number = Math.PI / 3;  // +60 degrees

  // Collision Avoidance
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private tempDir: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public handleZoom(delta: number): void {
    this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance + delta));
  }

  public handleMouseInput(deltaX: number, deltaY: number, sensitivity: number = 0.0025): void {
    this.yaw += deltaX * sensitivity;
    this.pitch += deltaY * sensitivity;
    this.pitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.pitch));
  }

  public update(playerPos: THREE.Vector3, deltaSeconds: number, cameraOccluders: THREE.Object3D[] = []): void {
    // 1. Calculate ideal target focus point (shoulder/head height)
    const targetFocus = this.targetPosition.copy(playerPos).add(new THREE.Vector3(0, this.heightOffset, 0));

    // 2. Calculate ideal camera offset vector based on yaw & pitch
    const cosPitch = Math.cos(this.pitch);
    const offsetX = Math.sin(this.yaw) * cosPitch * this.distance;
    const offsetY = Math.sin(this.pitch) * this.distance;
    const offsetZ = Math.cos(this.yaw) * cosPitch * this.distance;

    const idealCameraPos = targetFocus.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));
    // Enforce ground height floor to prevent subterranean camera clipping
    if (idealCameraPos.y < 0.5) {
      idealCameraPos.y = 0.5;
    }

    // 3. Camera Collision Avoidance (prevent clipping through buildings)
    let actualDistance = this.distance;
    if (cameraOccluders.length > 0) {
      this.tempDir.subVectors(idealCameraPos, targetFocus).normalize();
      this.raycaster.set(targetFocus, this.tempDir);
      this.raycaster.far = this.distance;

      const hits = this.raycaster.intersectObjects(cameraOccluders, true);
      if (hits.length > 0) {
        // Clamp camera distance to hit distance minus buffer margin
        actualDistance = Math.max(this.minDistance, hits[0].distance - 0.4);
      }
    }

    // Adjusted camera position after collision check
    const finalCameraPos = targetFocus.clone().add(
      new THREE.Vector3(
        Math.sin(this.yaw) * cosPitch * actualDistance,
        Math.sin(this.pitch) * actualDistance,
        Math.cos(this.yaw) * cosPitch * actualDistance
      )
    );

    // 4. Smooth Damping (Lerp)
    if (this.currentPosition.lengthSq() === 0) {
      this.currentPosition.copy(finalCameraPos);
      this.currentLookAt.copy(targetFocus);
    } else {
      const lerpFactor = Math.min(1.0, deltaSeconds * 12.0);
      this.currentPosition.lerp(finalCameraPos, lerpFactor);
      this.currentLookAt.lerp(targetFocus, lerpFactor);
    }

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public snapToTarget(playerPos: THREE.Vector3): void {
    const targetFocus = playerPos.clone().add(new THREE.Vector3(0, this.heightOffset, 0));
    const cosPitch = Math.cos(this.pitch);
    const finalCameraPos = targetFocus.clone().add(
      new THREE.Vector3(
        Math.sin(this.yaw) * cosPitch * this.distance,
        Math.sin(this.pitch) * this.distance,
        Math.cos(this.yaw) * cosPitch * this.distance
      )
    );
    this.currentPosition.copy(finalCameraPos);
    this.currentLookAt.copy(targetFocus);
    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  public getYaw(): number {
    return this.yaw;
  }
}
