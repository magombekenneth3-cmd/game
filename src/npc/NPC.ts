import * as THREE from 'three';
import { NPCData } from './NPCTypes';
import { NPCState } from './NPCState';
import { AssetPipeline } from '../assets/AssetPipeline';

export class NPC {
  public state: NPCState;
  public visualMesh?: THREE.Group;
  private scene: THREE.Scene;
  private walkSpeed: number = 2.8;

  constructor(data: NPCData, scene: THREE.Scene) {
    this.scene = scene;
    this.state = new NPCState(data);
  }

  public updateMovement(deltaSeconds: number): void {
    if (this.state.pathWaypoints.length === 0) return;
    if (this.state.currentWaypointIndex >= this.state.pathWaypoints.length) return;

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
      this.scene.remove(this.visualMesh);
      this.visualMesh = undefined;
    }
  }

  private createVisualMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = `NPCMesh_${this.state.data.id}`;

    const charMesh = AssetPipeline.getInstance().getCharacterMesh(this.state.data.archetype);
    group.add(charMesh);

    return group;
  }

  public interactWith(other: NPC): void {
    // Basic social interaction modifying relationship familiarity and affinity
    this.state.modifyRelationship(other.state.data.id, +5, +10);
    other.state.modifyRelationship(this.state.data.id, +5, +10);
    console.log(`🗣️ Social interaction between ${this.state.data.firstName} and ${other.state.data.firstName}`);
  }

  public dispose(): void {
    if (this.visualMesh) {
      this.scene.remove(this.visualMesh);
      this.visualMesh = undefined;
    }
  }
}
