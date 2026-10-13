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

  /**
   * Releases GPU resources owned EXCLUSIVELY by this NPC's visual mesh.
   *
   * Ownership rules (Three.js semantics):
   *
   *   Procedural figures (isProceduralFallback=true on the figure child):
   *     ProceduralHumanFigure.createFullFigure() allocates fresh BufferGeometry
   *     and MeshStandardMaterial for every call — both are privately owned.
   *     → Dispose geometry AND material.
   *
   *   GLB-sourced characters (cloneAssetTemplate, no isProceduralFallback flag):
   *     template.clone(true) copies the scene graph but SHARES BufferGeometry
   *     references with the cache template. Only materials are cloned
   *     (see cloneAssetTemplate → copyMaterial). Disposing geometry here would
   *     corrupt the shared cache template and break every other NPC using it.
   *     → Dispose material only, never geometry.
   *
   *   Vehicles (isProceduralVehicle=true set by VehicleAssetKit):
   *     VehicleAssetKit.createVehicleMesh() creates fresh geometry per call.
   *     → Dispose geometry AND material.
   *     Note: NPC.disposeGroup() is not called on vehicles, but the flag is
   *     documented here for completeness.
   */
  private static disposeGroup(group: THREE.Group): void {
    group.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;

      // Determine geometry ownership from the figure child's userData.
      // The figure group (ProceduralHuman or the cloned GLB root) is the
      // first child of the wrapper group. Check from the object itself
      // upward to the group root.
      let ownsGeometry = false;
      let current: THREE.Object3D | null = mesh;
      while (current && current !== group.parent) {
        if (current.userData.isProceduralFallback === true) {
          ownsGeometry = true;
          break;
        }
        current = current.parent;
      }

      if (ownsGeometry && mesh.geometry) {
        mesh.geometry.dispose();
      }
      // Materials: always safe to dispose — they are cloned per-NPC in both
      // cloneAssetTemplate (char_* branch) and ProceduralHumanFigure.
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => (m as THREE.Material).dispose());
      } else if (mesh.material) {
        (mesh.material as THREE.Material).dispose();
      }
    });
  }

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
    if (this.visualMesh && this.visualMesh.userData.proceduralWalkTime !== undefined) {
      this.visualMesh.userData.proceduralWalkTime += deltaSeconds;
      const charMesh = this.visualMesh.children[0] as THREE.Group;
      if (charMesh && charMesh.userData.isProceduralFallback) {
        const t      = this.visualMesh.userData.proceduralWalkTime as number;
        const offset = this.state.data.seed * 0.37;
        if (isMoving) {
          // Walking: full gait cycle — limbs swing, torso bobs
          ProceduralHumanFigure.applyWalkCycle(charMesh, t, this.walkSpeed);
        } else {
          // Idle: subtle breathing + weight-shift so NPCs never look frozen
          ProceduralHumanFigure.applyIdlePose(charMesh, t, offset);
        }
      }
    }

    if (!isMoving) return;

    const targetWaypoint = this.state.pathWaypoints[this.state.currentWaypointIndex];

    // D2: Use XZ-plane distance only so vertical elevation differences between
    // waypoints don't prevent arrival detection or cause vertical drift.
    const dx = targetWaypoint.x - this.state.currentPosition.x;
    const dz = targetWaypoint.z - this.state.currentPosition.z;
    const distToWaypointXZ = Math.sqrt(dx * dx + dz * dz);

    if (distToWaypointXZ <= 1.0) {
      // Arrived at waypoint — snap Y to waypoint height to follow terrain/sidewalk slope
      this.state.currentPosition.y = targetWaypoint.y;
      this.state.currentWaypointIndex++;
      if (this.state.currentWaypointIndex >= this.state.pathWaypoints.length) {
        // Arrived at final destination!
        this.onArrivalAtDestination();
        return;
      }
    }

    // Move toward current waypoint on XZ plane — never drift vertically mid-step.
    // Y is updated only on waypoint arrival (above) so feet stay on surface.
    const moveDirXZ = new THREE.Vector3(dx, 0, dz).normalize();
    this.state.currentPosition.x += moveDirXZ.x * this.walkSpeed * deltaSeconds;
    this.state.currentPosition.z += moveDirXZ.z * this.walkSpeed * deltaSeconds;

    if (this.visualMesh) {
      this.visualMesh.position.copy(this.state.currentPosition);
      this.visualMesh.rotation.y = Math.atan2(moveDirXZ.x, moveDirXZ.z);
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
      // Transition to abstract — remove and dispose any existing mesh
      if (this.visualMesh) {
        if (this.animController) {
          this.animController.dispose();
          this.animController = undefined;
        }
        NPC.disposeGroup(this.visualMesh);  // D1: release GPU geometry/material
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
        NPC.disposeGroup(this.visualMesh);  // D1: release GPU geometry/material
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
      // Both LOD-0 and LOD-1 procedural figures own their geometry privately
      // (ProceduralHumanFigure allocates fresh BufferGeometry per call).
      // This flag lets disposeGroup() safely dispose geometry on LOD swap.
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
