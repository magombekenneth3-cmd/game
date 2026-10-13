import * as THREE from 'three';
import { NPCData } from './NPCTypes';
import { NPCState } from './NPCState';
import { AssetPipeline } from '../assets/AssetPipeline';
import { CharacterAnimationController } from '../assets/CharacterAnimationController';
import { ProceduralHumanFigure } from '../assets/ProceduralHumanFigure';

export class NPC {
  public state: NPCState;
  public visualMesh?: THREE.Group;
  public animController?: CharacterAnimationController;
  private scene: THREE.Scene;
  private walkSpeed: number = 2.8;
  /** Tracks which LOD mesh is currently spawned so we can swap on tier change. */
  private currentMeshLod: 0 | 1 | null = null;

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

    // Phase 12.4.5: Apply procedural walk cycle to ProceduralHumanFigure meshes.
    // These have no AnimationClip rig, so we drive limb transforms directly.
    if (isMoving && this.visualMesh && this.visualMesh.userData.proceduralWalkTime !== undefined) {
      this.visualMesh.userData.proceduralWalkTime += deltaSeconds;
      const charMesh = this.visualMesh.children[0] as THREE.Group;
      if (charMesh && charMesh.userData.isProceduralFallback) {
        ProceduralHumanFigure.applyWalkCycle(charMesh, this.visualMesh.userData.proceduralWalkTime, this.walkSpeed);
      }
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
    const tier = this.state.simulationTier;
    const isDetailed = tier === 'TIER0_VICINITY' || tier === 'TIER1_NEARBY';
    const targetLod: 0 | 1 = tier === 'TIER0_VICINITY' ? 0 : 1;

    if (!isDetailed) {
      // Transition to abstract — remove any existing mesh
      if (this.visualMesh) {
        if (this.animController) {
          this.animController.dispose();
          this.animController = undefined;
        }
        this.scene.remove(this.visualMesh);
        this.visualMesh = undefined;
        this.currentMeshLod = null;
      }
      return;
    }

    // Spawn or swap mesh when LOD tier changes
    if (!this.visualMesh || this.currentMeshLod !== targetLod) {
      // Remove old mesh if present
      if (this.visualMesh) {
        if (this.animController) {
          this.animController.dispose();
          this.animController = undefined;
        }
        this.scene.remove(this.visualMesh);
        this.visualMesh = undefined;
      }
      // Create correct LOD mesh
      this.visualMesh = this.createVisualMesh(targetLod);
      this.visualMesh.position.copy(this.state.currentPosition);
      this.scene.add(this.visualMesh);
      this.currentMeshLod = targetLod;
    }
  }

  private createVisualMesh(lod: 0 | 1 = 0): THREE.Group {
    const group = new THREE.Group();
    group.name = `NPCMesh_${this.state.data.id}`;

    let charMesh: THREE.Group;

    if (lod === 1) {
      // LOD-1 (80–200m): lightweight 3-part silhouette — saves ~12 draw calls
      charMesh = ProceduralHumanFigure.createSimplifiedFigure({
        archetype: this.state.data.archetype,
        seed: this.state.data.seed
      });
      charMesh.userData.isProceduralFallback = true;
    } else {
      // LOD-0 (≤80m): full 16-part articulated figure with hair and clothing
      charMesh = AssetPipeline.getInstance().getCharacterMesh(this.state.data.archetype, this.state.data.seed);
    }

    group.add(charMesh);

    // Wire skeleton animation controller if the mesh has bones (GLB route)
    if (lod === 0) {
      const anims = (charMesh.userData?.animations as THREE.AnimationClip[]) ||
        AssetPipeline.getInstance().getCharacterMeshAnimations(this.state.data.archetype);
      let hasBones = false;
      charMesh.traverse((c) => { if ((c as THREE.Bone).isBone) hasBones = true; });

      if (hasBones && anims.length > 0) {
        this.animController = new CharacterAnimationController(charMesh, anims);
        this.animController.setState('idle');
      }
    }

    // Phase 12.4.5: seed walk timer so sibling NPCs are phase-offset
    group.userData.proceduralWalkTime = this.state.data.seed * 0.37;
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
