import * as THREE from 'three';

export class VehicleCamera {
  public camera: THREE.PerspectiveCamera;
  private currentPosition: THREE.Vector3 = new THREE.Vector3();
  private currentLookAt: THREE.Vector3 = new THREE.Vector3();

  private baseDistance: number = 8.5;
  private heightOffset: number = 2.8;
  private yaw: number = 0;
  private pitch: number = 0.2;

  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private tempDir: THREE.Vector3 = new THREE.Vector3();

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
  }

  public handleMouseLook(deltaX: number, deltaY: number, sensitivity: number = 0.0025): void {
    this.yaw -= deltaX * sensitivity;
    this.pitch += deltaY * sensitivity;
    this.pitch = Math.max(-0.1, Math.min(0.8, this.pitch));
  }

  public update(
    vehiclePos: THREE.Vector3,
    vehicleRotationY: number,
    speedKph: number,
    deltaSeconds: number,
    obstacles: THREE.Object3D[] = []
  ): void {
    const targetFocus = vehiclePos.clone().add(new THREE.Vector3(0, this.heightOffset, 0));

    // Dynamic distance expansion based on speed
    const dynamicDistance = this.baseDistance + (speedKph / 100) * 2.5;

    // Follow vehicle orientation when mouse is idle
    const cameraYaw = vehicleRotationY + this.yaw;

    const cosPitch = Math.cos(this.pitch);
    const offsetX = Math.sin(cameraYaw) * cosPitch * dynamicDistance;
    const offsetY = Math.sin(this.pitch) * dynamicDistance;
    const offsetZ = Math.cos(cameraYaw) * cosPitch * dynamicDistance;

    const idealPos = targetFocus.clone().add(new THREE.Vector3(offsetX, offsetY, offsetZ));

    // Raycast Collision Avoidance against building obstacles
    let actualDist = dynamicDistance;
    const buildingObstacles = obstacles.filter(obj => {
      let name = obj.name || '';
      return !name.includes('Vehicle') && !name.includes('Matatu') && !name.includes('Sedan') && !name.includes('SUV') && !name.includes('Truck') && !name.includes('Boda') && !name.includes('Player') && !name.includes('Character');
    });

    if (buildingObstacles.length > 0) {
      this.tempDir.subVectors(idealPos, targetFocus).normalize();
      this.raycaster.set(targetFocus, this.tempDir);
      this.raycaster.far = dynamicDistance;

      const hits = this.raycaster.intersectObjects(buildingObstacles, true);
      if (hits.length > 0) {
        // Only trigger collision if hitting a building structure
        actualDist = Math.max(4.0, hits[0].distance - 0.5);
      }
    }

    const finalPos = targetFocus.clone().add(
      new THREE.Vector3(
        Math.sin(cameraYaw) * cosPitch * actualDist,
        Math.sin(this.pitch) * actualDist,
        Math.cos(cameraYaw) * cosPitch * actualDist
      )
    );

    const lerpFactor = Math.min(1.0, deltaSeconds * 10.0);
    this.currentPosition.lerp(finalPos, lerpFactor);
    this.currentLookAt.lerp(targetFocus, lerpFactor);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }
}
