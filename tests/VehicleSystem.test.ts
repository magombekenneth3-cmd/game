import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { VehicleSpawner } from '../src/vehicles/VehicleSpawner';
import { VehiclePhysics } from '../src/vehicles/VehiclePhysics';
import { VehicleStateManager } from '../src/vehicles/VehicleState';
import { VehicleLODManager } from '../src/vehicles/VehicleLOD';
import { VehicleCollisionHelper } from '../src/vehicles/VehicleCollision';
import { VehicleManager } from '../src/vehicles/VehicleManager';
import { NAIROBI_DRIVING_RULES } from '../src/vehicles/VehicleTypes';
import { AssetManager } from '../src/engine/AssetManager';

describe('Phase 5 — Vehicle & Driving System Unit Tests', () => {
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let assetManager: AssetManager;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    assetManager = new AssetManager();
  });

  describe('1. Vehicle Definitions & Spawner', () => {
    it('validates vehicle definitions have positive dimensions, mass, and speed', () => {
      const types = ['matatu', 'sedan', 'suv', 'pickup', 'van', 'compact_car', 'motorcycle'] as const;
      types.forEach((t) => {
        const def = VehicleSpawner.getDefinition(t, `test_${t}`);
        expect(def.mass).toBeGreaterThan(0);
        expect(def.length).toBeGreaterThan(0);
        expect(def.width).toBeGreaterThan(0);
        expect(def.height).toBeGreaterThan(0);
        expect(def.maxSpeed).toBeGreaterThan(0);
        expect(def.acceleration).toBeGreaterThan(0);
        expect(def.braking).toBeGreaterThan(0);
        expect(def.seats).toBeGreaterThan(0);
      });
    });

    it('spawns deterministic fleet from seed 1337', () => {
      const fleet1 = VehicleSpawner.spawnDeterministicFleet(1337, scene, assetManager);
      const scene2 = new THREE.Scene();
      const fleet2 = VehicleSpawner.spawnDeterministicFleet(1337, scene2, assetManager);

      expect(fleet1.length).toBe(10);
      expect(fleet2.length).toBe(10);

      for (let i = 0; i < fleet1.length; i++) {
        expect(fleet1[i].definition.id).toBe(fleet2[i].definition.id);
        expect(fleet1[i].definition.type).toBe(fleet2[i].definition.type);
        expect(fleet1[i].state.position.x).toBeCloseTo(fleet2[i].state.position.x);
        expect(fleet1[i].state.position.z).toBeCloseTo(fleet2[i].state.position.z);
      }
    });

    it('includes Matatu as a first-class vehicle definition with correct properties', () => {
      const matatuDef = VehicleSpawner.getDefinition('matatu', 'matatu_1');
      expect(matatuDef.type).toBe('matatu');
      expect(matatuDef.seats).toBe(14);
      expect(matatuDef.displayName).toContain('Matatu');
    });
  });

  describe('2. Vehicle Physics', () => {
    it('accelerates forward on throttle and decelerates on friction/braking', () => {
      const def = VehicleSpawner.getDefinition('sedan', 'sedan_test');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(0, 0, 0),
        currentSpeedKph: 0,
        modeState: 'DRIVING' as const,
        throttle: 0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      const physics = new VehiclePhysics(def, state);

      // Apply throttle
      for (let i = 0; i < 60; i++) {
        physics.stepFixed({ throttle: 1.0, reverse: 0, steer: 0, handbrake: false, exitVehicle: false }, 1 / 60, []);
      }

      expect(state.velocity.length()).toBeGreaterThan(1.0);
      expect(state.currentSpeedKph).toBeGreaterThan(0);

      // Release throttle and apply handbrake to stop
      for (let i = 0; i < 120; i++) {
        physics.stepFixed({ throttle: 0, reverse: 0, steer: 0, handbrake: true, exitVehicle: false }, 1 / 60, []);
      }

      expect(state.velocity.length()).toBeLessThan(0.1);
    });

    it('supports reverse motion when reverse input is provided', () => {
      const def = VehicleSpawner.getDefinition('sedan', 'sedan_rev');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(0, 0, 0),
        currentSpeedKph: 0,
        modeState: 'DRIVING' as const,
        throttle: 0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      const physics = new VehiclePhysics(def, state);
      for (let i = 0; i < 30; i++) {
        physics.stepFixed({ throttle: 0, reverse: 1.0, steer: 0, handbrake: false, exitVehicle: false }, 1 / 60, []);
      }

      expect(state.velocity.z).toBeGreaterThan(0); // Backward motion
    });

    it('changes rotation heading on steering input when moving', () => {
      const def = VehicleSpawner.getDefinition('sedan', 'sedan_steer');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(0, 0, -5), // Moving forward
        currentSpeedKph: 18,
        modeState: 'DRIVING' as const,
        throttle: 1.0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      const physics = new VehiclePhysics(def, state);
      const initialRotY = state.rotationY;

      physics.stepFixed({ throttle: 1.0, reverse: 0, steer: 1.0, handbrake: false, exitVehicle: false }, 1 / 60, []);
      expect(state.rotationY).not.toEqual(initialRotY);
    });

    it('prevents vehicle speed from exceeding maxSpeed', () => {
      const def = VehicleSpawner.getDefinition('compact_car', 'compact_speed_cap');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(0, 0, -100), // Exceeding max speed
        currentSpeedKph: 360,
        modeState: 'DRIVING' as const,
        throttle: 1.0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      const physics = new VehiclePhysics(def, state);
      physics.stepFixed({ throttle: 1.0, reverse: 0, steer: 0, handbrake: false, exitVehicle: false }, 1 / 60, []);

      const maxMps = (def.maxSpeed * 1000) / 3600;
      expect(state.velocity.length()).toBeLessThanOrEqual(maxMps + 0.1);
    });
  });

  describe('3. State Machine & Transitions', () => {
    it('handles explicit state machine transitions correctly', () => {
      const stateManager = new VehicleStateManager();
      expect(stateManager.getState()).toBe('PARKED');

      stateManager.setState('ENTERING');
      expect(stateManager.getState()).toBe('ENTERING');

      stateManager.setState('OCCUPIED');
      expect(stateManager.getState()).toBe('OCCUPIED');

      stateManager.setState('DRIVING');
      expect(stateManager.getState()).toBe('DRIVING');

      stateManager.setState('EXITING');
      expect(stateManager.getState()).toBe('EXITING');

      stateManager.setState('PARKED');
      expect(stateManager.getState()).toBe('PARKED');
    });
  });

  describe('4. Driving Rules & Left-Side Traffic Configuration', () => {
    it('uses LEFT side traffic for Nairobi driving rules', () => {
      expect(NAIROBI_DRIVING_RULES.trafficSide).toBe('LEFT');
      expect(NAIROBI_DRIVING_RULES.defaultSpeedUnit).toBe('KPH');
    });
  });

  describe('5. Safe Vehicle Exit Point & Collision', () => {
    it('calculates a safe exit position on left driver door by default', () => {
      const def = VehicleSpawner.getDefinition('sedan', 'sedan_exit');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(),
        currentSpeedKph: 0,
        modeState: 'DRIVING' as const,
        throttle: 0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      const safePos = VehicleCollisionHelper.calculateSafeExitPosition(def, state, []);
      expect(safePos).toBeDefined();
      expect(safePos.x).not.toBe(0);
    });

    it('selects alternative exit side if left door is blocked by a building', () => {
      const def = VehicleSpawner.getDefinition('sedan', 'sedan_blocked');
      const state = {
        position: new THREE.Vector3(0, 0, 0),
        rotationY: 0,
        velocity: new THREE.Vector3(),
        currentSpeedKph: 0,
        modeState: 'DRIVING' as const,
        throttle: 0,
        steering: 0,
        brake: 0,
        handbrake: false,
        occupiedSeats: 1,
        damage: 0
      };

      // Mock building blocking left side (x < 0)
      const buildingMesh = new THREE.Mesh(
        new THREE.BoxGeometry(5, 5, 5),
        new THREE.MeshBasicMaterial()
      );
      buildingMesh.name = 'Building_Obstacle';
      buildingMesh.position.set(-2, 0, 0);

      const safePos = VehicleCollisionHelper.calculateSafeExitPosition(def, state, [buildingMesh]);
      expect(safePos).toBeDefined();
      // Should pick right side or front/rear candidate since left is blocked
      expect(safePos.x).toBeGreaterThan(0);
    });
  });

  describe('6. Vehicle Manager & Vehicle LOD', () => {
    it('spawns, fetches, and removes vehicles in VehicleManager', () => {
      const manager = new VehicleManager(scene, camera, assetManager);
      const veh = manager.spawnVehicle('suv', 'suv_1', new THREE.Vector3(10, 0, 10));

      expect(manager.getVehicle('suv_1')).toBe(veh);
      expect(manager.getAllVehicles().length).toBe(1);

      const removed = manager.removeVehicle('suv_1');
      expect(removed).toBe(true);
      expect(manager.getVehicle('suv_1')).toBeUndefined();
    });

    it('evaluates distance-based simulation LODs correctly', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      expect(VehicleLODManager.evaluateTier(new THREE.Vector3(10, 0, 0), playerPos, false)).toBe('TIER0_PLAYER_VICINITY');
      expect(VehicleLODManager.evaluateTier(new THREE.Vector3(120, 0, 0), playerPos, false)).toBe('TIER1_NEARBY');
      expect(VehicleLODManager.evaluateTier(new THREE.Vector3(350, 0, 0), playerPos, false)).toBe('TIER2_DISTANT');
      expect(VehicleLODManager.evaluateTier(new THREE.Vector3(600, 0, 0), playerPos, false)).toBe('TIER3_ABSTRACT');

      // Player active vehicle is always TIER0
      expect(VehicleLODManager.evaluateTier(new THREE.Vector3(600, 0, 0), playerPos, true)).toBe('TIER0_PLAYER_VICINITY');
    });

    it('allows player to enter and exit a vehicle cleanly', () => {
      const manager = new VehicleManager(scene, camera, assetManager);
      const veh = manager.spawnVehicle('matatu', 'matatu_test', new THREE.Vector3(0, 0, 0));

      expect(manager.driving).toBe(false);
      const entered = manager.enterVehicle(veh);
      expect(entered).toBe(true);
      expect(manager.driving).toBe(true);
      expect(veh.state.modeState).toBe('DRIVING');

      const exitPos = manager.exitVehicle([]);
      expect(exitPos).toBeDefined();
      expect(manager.driving).toBe(false);
      expect(veh.state.modeState).toBe('PARKED');
    });
  });
});
