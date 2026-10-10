import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { CharacterAnimationController } from '../src/assets/CharacterAnimationController';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { NPC } from '../src/npc/NPC';
import { NPCData } from '../src/npc/NPCTypes';
import { PlayerController } from '../src/player/PlayerController';

describe('Phase 11.2 — Character Animation & Realism Tests', () => {
  let rootObject: THREE.Group;
  let testClips: THREE.AnimationClip[];

  beforeEach(() => {
    rootObject = new THREE.Group();

    // Create a mock bone hierarchy with SkinnedMesh
    const boneRoot = new THREE.Bone();
    boneRoot.name = 'Hips';
    const boneSpine = new THREE.Bone();
    boneSpine.name = 'Spine';
    boneRoot.add(boneSpine);

    const skeleton = new THREE.Skeleton([boneRoot, boneSpine]);
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial();
    const skinnedMesh = new THREE.SkinnedMesh(geometry, material);
    skinnedMesh.bind(skeleton);

    rootObject.add(boneRoot);
    rootObject.add(skinnedMesh);

    // Create realistic test AnimationClips
    const idleTrack = new THREE.VectorKeyframeTrack('Hips.position', [0, 1], [0, 0, 0, 0, 0.05, 0]);
    const idleClip = new THREE.AnimationClip('Idle', 1.0, [idleTrack]);

    const walkTrack = new THREE.VectorKeyframeTrack('Hips.position', [0, 0.5, 1], [0, 0, 0, 0, 0.1, 0.5, 0, 0, 1]);
    const walkClip = new THREE.AnimationClip('Walk', 1.0, [walkTrack]);

    const runTrack = new THREE.VectorKeyframeTrack('Hips.position', [0, 0.25, 0.5], [0, 0, 0, 0, 0.2, 1, 0, 0, 2]);
    const runClip = new THREE.AnimationClip('Run', 0.5, [runTrack]);

    testClips = [idleClip, walkClip, runClip];
  });

  it('1. CharacterAnimationController initializes actions and starts in idle', () => {
    const controller = new CharacterAnimationController(rootObject, testClips);

    expect(controller.actions.has('idle')).toBe(true);
    expect(controller.actions.has('walk')).toBe(true);
    expect(controller.actions.has('run')).toBe(true);

    controller.setState('idle');
    expect(controller.currentState).toBe('idle');

    controller.update(0.016);
    expect(controller.mixer.time).toBeGreaterThan(0);
  });

  it('2. CharacterAnimationController smoothly transitions between movement states', () => {
    const controller = new CharacterAnimationController(rootObject, testClips);

    controller.setState('idle');
    expect(controller.currentState).toBe('idle');

    controller.setState('walk', 0.1);
    expect(controller.currentState).toBe('walk');

    controller.setState('run', 0.1);
    expect(controller.currentState).toBe('run');

    controller.setState('idle', 0.1);
    expect(controller.currentState).toBe('idle');
  });

  it('3. CharacterAnimationController handles empty or missing animation clips gracefully', () => {
    const emptyController = new CharacterAnimationController(rootObject, []);

    expect(emptyController.actions.size).toBe(0);
    expect(() => {
      emptyController.setState('walk');
      emptyController.update(0.016);
    }).not.toThrow();
  });

  it('4. Cloned skinned meshes receive independent skeletons and distinct animation mixers', () => {
    const pipeline = AssetPipeline.getInstance();

    const cloneA = pipeline.cloneAssetTemplate('char_test', rootObject);
    const cloneB = pipeline.cloneAssetTemplate('char_test', rootObject);

    let skelA: THREE.Skeleton | null = null;
    let skelB: THREE.Skeleton | null = null;

    cloneA.traverse((c) => {
      if ((c as THREE.SkinnedMesh).isSkinnedMesh) skelA = (c as THREE.SkinnedMesh).skeleton;
    });

    cloneB.traverse((c) => {
      if ((c as THREE.SkinnedMesh).isSkinnedMesh) skelB = (c as THREE.SkinnedMesh).skeleton;
    });

    expect(skelA).toBeDefined();
    expect(skelB).toBeDefined();
    expect(skelA).not.toBe(skelB); // Must NOT share skeleton instances
  });

  it('5. NPC attaches animation controller and updates state on movement', () => {
    const scene = new THREE.Scene();
    const data: NPCData = {
      id: 'npc_anim_test',
      firstName: 'Kenneth',
      lastName: 'Kamau',
      archetype: 'young_professional',
      gender: 'MALE',
      wealthTier: 'MIDDLE_CLASS',
      homeLocation: new THREE.Vector3(0, 0, 0),
      workLocation: new THREE.Vector3(10, 0, 10),
      scheduleId: 'standard_workday',
      relationships: new Map()
    };

    const npc = new NPC(data, scene);
    npc.state.simulationTier = 'TIER0_VICINITY';
    npc.updateVisualMeshPresence();
    expect(npc.visualMesh).toBeDefined();

    // Moving along waypoints
    npc.state.pathWaypoints = [new THREE.Vector3(10, 0, 10)];
    npc.state.currentWaypointIndex = 0;
    npc.updateMovement(0.05);

    if (npc.animController) {
      expect(npc.animController.currentState).toBe('walk');
    }

    // Reaching destination
    npc.onArrivalAtDestination();
    if (npc.animController) {
      expect(npc.animController.currentState).toBe('idle');
    }

    // Disposing NPC cleans up animation resources
    npc.dispose();
    expect(npc.animController).toBeUndefined();
    expect(npc.visualMesh).toBeUndefined();
  });

  it('6. Multiple NPC instances animate independently without sharing animation state', () => {
    const scene = new THREE.Scene();
    const data1: NPCData = {
      id: 'npc_1',
      firstName: 'Alice',
      lastName: 'Mutua',
      archetype: 'young_professional',
      gender: 'FEMALE',
      wealthTier: 'MIDDLE_CLASS',
      homeLocation: new THREE.Vector3(0, 0, 0),
      workLocation: new THREE.Vector3(10, 0, 10),
      scheduleId: 'work',
      relationships: new Map()
    };
    const data2: NPCData = {
      id: 'npc_2',
      firstName: 'Bob',
      lastName: 'Ochieng',
      archetype: 'young_professional',
      gender: 'MALE',
      wealthTier: 'MIDDLE_CLASS',
      homeLocation: new THREE.Vector3(5, 0, 5),
      workLocation: new THREE.Vector3(20, 0, 20),
      scheduleId: 'work',
      relationships: new Map()
    };

    const npc1 = new NPC(data1, scene);
    const npc2 = new NPC(data2, scene);

    npc1.state.simulationTier = 'TIER0_VICINITY';
    npc2.state.simulationTier = 'TIER0_VICINITY';

    npc1.updateVisualMeshPresence();
    npc2.updateVisualMeshPresence();

    // Attach controllers with test clips to verify independent states
    if (npc1.visualMesh) {
      npc1.animController = new CharacterAnimationController(npc1.visualMesh, testClips);
    }
    if (npc2.visualMesh) {
      npc2.animController = new CharacterAnimationController(npc2.visualMesh, testClips);
    }

    npc1.animController?.setState('walk');
    npc2.animController?.setState('idle');

    expect(npc1.animController?.currentState).toBe('walk');
    expect(npc2.animController?.currentState).toBe('idle');
    expect(npc1.animController?.mixer).not.toBe(npc2.animController?.mixer);

    npc1.dispose();
    npc2.dispose();
  });

  it('7. PlayerController integrates animation controller and updates states based on movement speed', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const mockDomElement = {
      addEventListener: () => {},
      removeEventListener: () => {}
    } as any;

    const player = new PlayerController(scene, camera, mockDomElement);

    // Provide test animations
    player.animController = new CharacterAnimationController(player.mesh, testClips);
    player.animController.setState('idle');

    // Idle when stationary
    player.update(0.1);
    expect(player.animController.currentState).toBe('idle');

    // Simulate walking input
    player.input.getInput = () => ({
      forward: true, backward: false, left: false, right: false,
      sprint: false, jump: false, interact: false, pause: false,
      mouseX: 0, mouseY: 0
    });
    for (let i = 0; i < 5; i++) player.update(0.1);
    expect(player.animController.currentState).toBe('walk');

    // Simulate running/sprinting input
    player.input.getInput = () => ({
      forward: true, backward: false, left: false, right: false,
      sprint: true, jump: false, interact: false, pause: false,
      mouseX: 0, mouseY: 0
    });
    for (let i = 0; i < 5; i++) player.update(0.1);
    expect(player.animController.currentState).toBe('run');

    // Stopping returns to idle
    player.input.getInput = () => ({
      forward: false, backward: false, left: false, right: false,
      sprint: false, jump: false, interact: false, pause: false,
      mouseX: 0, mouseY: 0
    });
    for (let i = 0; i < 15; i++) player.update(0.1);
    expect(player.animController.currentState).toBe('idle');

    // Disposing cleans up
    player.dispose();
    expect(player.animController).toBeNull();
  });

  it('8. AssetPipeline retargets Mixamo animation clips to Player character rig without 100m translation artifact', () => {
    const pipeline = AssetPipeline.getInstance();

    // Construct mock mixamo clips with mixamorig: track names and large Mixamo Hips Z offset
    const mixamoHipsTrack = new THREE.VectorKeyframeTrack(
      'mixamorigHips.position',
      [0, 1],
      [-0.16, 1.147, 106.13, -0.16, 1.157, 106.13]
    );
    const mixamoSpineTrack = new THREE.QuaternionKeyframeTrack(
      'mixamorigSpine.quaternion',
      [0, 1],
      [0, 0, 0, 1, 0, 0.05, 0, 0.998]
    );
    const businessClips = [
      new THREE.AnimationClip('Idle', 1.0, [mixamoHipsTrack, mixamoSpineTrack]),
      new THREE.AnimationClip('Walk', 1.0, [mixamoHipsTrack, mixamoSpineTrack]),
      new THREE.AnimationClip('Run', 0.5, [mixamoHipsTrack, mixamoSpineTrack])
    ];

    (pipeline as any).animationCache.set('char_pedestrian_business_01', businessClips);
    (pipeline as any).animationCache.delete('char_player_01');

    const playerClips = pipeline.getAnimations('char_player_01');
    expect(playerClips.length).toBe(3);

    const idleClip = playerClips.find(c => c.name === 'Idle');
    expect(idleClip).toBeDefined();

    const hipsTrack = idleClip!.tracks.find(t => t.name === 'Hips.position');
    expect(hipsTrack).toBeDefined();
    // Verify Hips Z is in the normal ReadyPlayerMe meters range (~0.01m), NOT 106m!
    expect(hipsTrack!.values[2]).toBeCloseTo(0.01, 1);
    expect(hipsTrack!.values[5]).toBeCloseTo(0.01, 1);

    const spineTrack = idleClip!.tracks.find(t => t.name === 'Spine.quaternion');
    expect(spineTrack).toBeDefined();
    expect(spineTrack!.name).toBe('Spine.quaternion'); // Clean target name without mixamorig prefix
  });
});

