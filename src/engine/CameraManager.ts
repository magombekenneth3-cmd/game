import * as THREE from 'three';
import { ICameraManager } from '../types';

export class CameraManager implements ICameraManager {
  public camera: THREE.PerspectiveCamera;
  private target: THREE.Vector3 = new THREE.Vector3(0, 5, 0);
  private orbitAngle: number = 0;
  private autoRotate: boolean = false;

  constructor(
    fov: number = 55,
    aspect: number = typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9
  ) {
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.5, 1000);
    // Initial isometric overview position looking at the district
    this.camera.position.set(45, 30, 45);
    this.camera.lookAt(this.target);
  }


  public update(aspect: number): void {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    if (this.autoRotate) {
      this.orbitAngle += 0.002;
      const radius = 60;
      const x = Math.cos(this.orbitAngle) * radius;
      const z = Math.sin(this.orbitAngle) * radius;
      this.camera.position.set(x, 25, z);
      this.camera.lookAt(this.target);
    }
  }

  public setPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  public lookAt(target: THREE.Vector3): void {
    this.target.copy(target);
    this.camera.lookAt(this.target);
  }

  public toggleAutoRotate(enabled?: boolean): void {
    this.autoRotate = enabled !== undefined ? enabled : !this.autoRotate;
  }
}
