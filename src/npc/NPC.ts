import * as THREE from 'three';
import { NPCData } from './NPCTypes';
import { NPCState } from './NPCState';
import { AssetPipeline } from '../assets/AssetPipeline';
import { CharacterAnimationController } from '../assets/CharacterAnimationController';

export class NPC {
  public state: NPCState;
  public visualMesh?: THREE.Group;
  public animController?: CharacterAnimationController;
  private scene: THREE.Scene;
  private walkSpeed: number = 2.8;

  constructor(data: NPCData, scene: THREE.Scene) {
    this.scene = scene;
    this.state = new NPCState(data);
  }

  public updateMovement(deltaSeconds: number): void {
    const isMoving = this.state.pathWaypoints.length > 0 && this.state.currentWaypointIndex < this.state.pathWaypoints.length;

    if (!this.animController && this.visualMesh) {
      const childMesh = this.visualMesh.children[0];
      const anims = (childMesh?.userData?.animations as THREE.AnimationClip[]) ||
        AssetPipeline.getInstance().getCharacterMeshAnimations(this.state.data.archetype);
      let hasBones = false;
      this.visualMesh.traverse((c) => { if ((c as THREE.Bone).isBone) hasBones = true; });

      if (hasBones && anims && anims.length > 0) {
        const root = childMesh || this.visualMesh;
        this.animController = new CharacterAnimationController(root, anims);
        this.animController.setState('idle');
      }
    }

    if (this.animController) {
      this.animController.setState(isMoving ? 'walk' : 'idle');
      this.animController.update(deltaSeconds);
    }

    if (!isMoving) return;

    const targetWaypoint = this.state.pathWaypoints[this.state.currentWaypointIndex];
    const distToWaypoint = this.state.currentPosition.distanceTo(targetWaypoint);

    if (distToWaypoint <= 1.0) {
      // Arrived at waypoint
      this.state.currentWaypointIndex++;
      if (this.state.currentWaypointIndex >= this.state.pathWaypoints.length) {
        // Arrived at final destination!
        this.onArrivalAtDestination();
        return;
      }
    }

    // Move toward current waypoint
    const moveDir = targetWaypoint.clone().sub(this.state.currentPosition).normalize();
    this.state.currentPosition.add(moveDir.multiplyScalar(this.walkSpeed * deltaSeconds));

    if (this.visualMesh) {
      this.visualMesh.position.copy(this.state.currentPosition);
      this.visualMesh.rotation.y = Math.atan2(moveDir.x, moveDir.z);
    }
  }

  public onArrivalAtDestination(): void {
    this.state.pathWaypoints = [];
    if (this.animController) {
      this.animController.setState('idle');
    }
    console.log(`📍 NPC ${this.state.data.firstName} ${this.state.data.lastName} arrived at ${this.state.currentActivity} destination.`);
  }

  public updateVisualMeshPresence(): void {
    const isDetailed = this.state.simulationTier === 'TIER0_VICINITY' || this.state.simulationTier === 'TIER1_NEARBY';

    if (isDetailed && !this.visualMesh) {
      // Create 3D Visual Mesh for detailed simulation
      this.visualMesh = this.createVisualMesh();
      this.visualMesh.position.copy(this.state.currentPosition);
      this.scene.add(this.visualMesh);
    } else if (!isDetailed && this.visualMesh) {
      // Remove 3D Visual Mesh when transitioning to abstract Tier 2/3 simulation
      if (this.animController) {
        this.animController.dispose();
        this.animController = undefined;
      }
      this.scene.remove(this.visualMesh);
      this.visualMesh = undefined;
    }
  }

  private createVisualMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = `NPCMesh_${this.state.data.id}`;

    const charMesh = AssetPipeline.getInstance().getCharacterMesh(this.state.data.archetype);
    group.add(charMesh);

    const anims = (charMesh.userData?.animations as THREE.AnimationClip[]) ||
      AssetPipeline.getInstance().getCharacterMeshAnimations(this.state.data.archetype);
    let hasBones = false;
    charMesh.traverse((c) => { if ((c as THREE.Bone).isBone) hasBones = true; });

    if (hasBones && anims.length > 0) {
      this.animController = new CharacterAnimationController(charMesh, anims);
      this.animController.setState('idle');
    }

    return group;
  }

  public interactWith(other: NPC): void {
    // Basic social interaction modifying relationship familiarity and affinity
    this.state.modifyRelationship(other.state.data.id, +5, +10);
    other.state.modifyRelationship(this.state.data.id, +5, +10);
    console.log(`🗣️ Social interaction between ${this.state.data.firstName} and ${other.state.data.firstName}`);
  }

  public dispose(): void {
    if (this.animController) {
      this.animController.dispose();
      this.animController = undefined;
    }
    if (this.visualMesh) {
      this.scene.remove(this.visualMesh);
      this.visualMesh = undefined;
    }
  }
}
