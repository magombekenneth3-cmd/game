import * as THREE from 'three';

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleSystem {
  public group: THREE.Group;
  private particles: Particle[] = [];
  private instancedMesh: THREE.InstancedMesh;
  private dummy: THREE.Object3D;
  private maxParticles: number = 200;

  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.group.name = 'ParticleSystemGroup';
    this.dummy = new THREE.Object3D();

    const geo = new THREE.PlaneGeometry(0.4, 0.4);
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });

    this.instancedMesh = new THREE.InstancedMesh(geo, mat, this.maxParticles);
    this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.group.add(this.instancedMesh);
    scene.add(this.group);
  }

  public spawnDust(pos: THREE.Vector3, vel: THREE.Vector3, color: THREE.Color = new THREE.Color(0xd4b886)): void {
    if (this.particles.length >= this.maxParticles) return;
    this.particles.push({
      position: pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0.1, (Math.random() - 0.5) * 0.4)),
      velocity: vel.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.4, (Math.random() - 0.5) * 0.5)),
      size: 0.3 + Math.random() * 0.4,
      alpha: 0.7,
      life: 0,
      maxLife: 0.8 + Math.random() * 0.4,
      color: color
    });
  }

  public update(deltaSeconds: number, camera: THREE.Camera): void {
    const alive: Particle[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life += deltaSeconds;
      if (p.life >= p.maxLife) continue;

      p.position.addScaledVector(p.velocity, deltaSeconds);
      p.alpha = 1 - p.life / p.maxLife;

      this.dummy.position.copy(p.position);
      this.dummy.scale.setScalar(p.size * (1 + p.life));
      this.dummy.lookAt(camera.position);
      this.dummy.updateMatrix();

      this.instancedMesh.setMatrixAt(alive.length, this.dummy.matrix);
      this.instancedMesh.setColorAt(alive.length, p.color);
      alive.length++;
    }

    this.particles = alive;
    this.instancedMesh.count = alive.length;
    this.instancedMesh.instanceMatrix.needsUpdate = true;
    if (this.instancedMesh.instanceColor) {
      this.instancedMesh.instanceColor.needsUpdate = true;
    }
  }
}
