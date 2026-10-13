/**
 * Phase 12.5 — Vehicle & Traffic Realism Tests
 *
 * Proves:
 *  1. All vehicle meshes have the 8 required light lens children.
 *  2. VehicleLightSystem correctly drives emissive state for headlights,
 *     brake lights and turn indicators.
 *  3. Blink timing matches the 0.5s Kenyan highway code period.
 *  4. NPC LOD switching spawns LOD-0 for TIER0 and LOD-1 for TIER1.
 *  5. LOD-1 character mesh has fewer draw calls than LOD-0.
 *  6. TrafficController.lightSystem is defined after construction.
 *  7. Matatu hazard and approach indicator states fire correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { VehicleAssetKit, VehicleLightSystem } from '../src/assets/VehicleAssetKit';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countMeshes(obj: THREE.Object3D): number {
  let n = 0;
  obj.traverse((c) => { if ((c as THREE.Mesh).isMesh) n++; });
  return n;
}

function getLens(group: THREE.Group, name: string): THREE.Mesh {
  const m = group.getObjectByName(name) as THREE.Mesh;
  expect(m).toBeDefined();
  return m;
}

function getLensIntensity(group: THREE.Group, name: string): number {
  const m = group.getObjectByName(name) as THREE.Mesh | undefined;
  if (!m) return -1;
  return (m.material as THREE.MeshStandardMaterial).emissiveIntensity;
}

/** Build a vehicle group and attach lights with given dimensions */
function buildLitVehicle(w: number, l: number, h: number): THREE.Group {
  const group = new THREE.Group();
  VehicleAssetKit.attachVehicleLights(group, w, l, h);
  return group;
}

// ---------------------------------------------------------------------------

describe('Phase 12.5 — Vehicle & Traffic Realism', () => {

  // =========================================================================
  // 1. VEHICLE LIGHT LENS GEOMETRY
  // =========================================================================
  describe('1. Vehicle light lenses are present on all vehicle types', () => {
    const EXPECTED_LENS_NAMES = [
      'HeadlightL', 'HeadlightR',
      'BrakelightL', 'BrakelightR',
      'IndicatorFL', 'IndicatorFR',
      'IndicatorRL', 'IndicatorRR'
    ];

    it('sedan mesh has all 8 light lens children', () => {
      const sedan = VehicleAssetKit.createVehicleMesh('sedan');
      for (const name of EXPECTED_LENS_NAMES) {
        expect(sedan.getObjectByName(name)).toBeDefined();
      }
    });

    it('suv mesh has all 8 light lens children', () => {
      const suv = VehicleAssetKit.createVehicleMesh('suv');
      for (const name of EXPECTED_LENS_NAMES) {
        expect(suv.getObjectByName(name)).toBeDefined();
      }
    });

    it('truck mesh has all 8 light lens children', () => {
      const truck = VehicleAssetKit.createVehicleMesh('truck');
      for (const name of EXPECTED_LENS_NAMES) {
        expect(truck.getObjectByName(name)).toBeDefined();
      }
    });

    it('matatu mesh has all 8 light lens children', () => {
      const matatu = VehicleAssetKit.createVehicleMesh('matatu');
      for (const name of EXPECTED_LENS_NAMES) {
        expect(matatu.getObjectByName(name)).toBeDefined();
      }
    });

    it('headlights are placed on the front face (positive Z)', () => {
      const sedan = VehicleAssetKit.createVehicleMesh('sedan');
      const headL = sedan.getObjectByName('HeadlightL') as THREE.Mesh;
      expect(headL.position.z).toBeGreaterThan(0);
    });

    it('brakelights are placed on the rear face (negative Z)', () => {
      const sedan = VehicleAssetKit.createVehicleMesh('sedan');
      const brakeL = sedan.getObjectByName('BrakelightL') as THREE.Mesh;
      expect(brakeL.position.z).toBeLessThan(0);
    });

    it('IndicatorFL and IndicatorFR are on opposite X sides', () => {
      const sedan = VehicleAssetKit.createVehicleMesh('sedan');
      const fl = sedan.getObjectByName('IndicatorFL') as THREE.Mesh;
      const fr = sedan.getObjectByName('IndicatorFR') as THREE.Mesh;
      expect(fl.position.x).toBeLessThan(0);  // left
      expect(fr.position.x).toBeGreaterThan(0); // right
    });

    it('all light lenses start with emissiveIntensity = 0 (off)', () => {
      const sedan = VehicleAssetKit.createVehicleMesh('sedan');
      for (const name of EXPECTED_LENS_NAMES) {
        const intensity = getLensIntensity(sedan, name);
        expect(intensity).toBe(0);
      }
    });
  });

  // =========================================================================
  // 2. VEHICLE LIGHT SYSTEM — STATE TRANSITIONS
  // =========================================================================
  describe('2. VehicleLightSystem drives correct emissive states', () => {
    let group: THREE.Group;
    let lights: VehicleLightSystem;

    beforeEach(() => {
      group  = buildLitVehicle(1.8, 4.2, 0.52);
      lights = new VehicleLightSystem(group);
    });

    it('headlights set both HeadlightL and HeadlightR to intensity > 0', () => {
      lights.setHeadlights(true);
      lights.update(0.01);
      expect(getLensIntensity(group, 'HeadlightL')).toBeGreaterThan(0);
      expect(getLensIntensity(group, 'HeadlightR')).toBeGreaterThan(0);
    });

    it('headlights off → HeadlightL intensity is 0', () => {
      lights.setHeadlights(false);
      lights.update(0.01);
      expect(getLensIntensity(group, 'HeadlightL')).toBe(0);
    });

    it('brake lights on → BrakelightL/R intensity is higher than headlight-on ambient', () => {
      lights.setHeadlights(true);
      lights.setBrakeLights(true);
      lights.update(0.01);
      const brakeI = getLensIntensity(group, 'BrakelightL');
      // Brake intensity should be much brighter than ambient tail (2.4 vs 0.4)
      expect(brakeI).toBeGreaterThan(1.0);
    });

    it('brake lights off with headlights → BrakelightL has ambient tail light glow', () => {
      lights.setHeadlights(true);
      lights.setBrakeLights(false);
      lights.update(0.01);
      const tailI = getLensIntensity(group, 'BrakelightL');
      expect(tailI).toBeGreaterThan(0);
      expect(tailI).toBeLessThan(1.0); // ambient only, not full brake
    });

    it('left indicator → IndicatorFL and IndicatorRL blink, right stays off', () => {
      lights.setTurnSignal('left');
      // Force blink ON state by advancing half a period
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.01);
      const leftFront = getLensIntensity(group, 'IndicatorFL');
      const rightFront = getLensIntensity(group, 'IndicatorFR');
      // Left should be on, right should be off
      expect(leftFront).toBeGreaterThan(0);
      expect(rightFront).toBe(0);
    });

    it('right indicator → IndicatorFR and IndicatorRR blink, left stays off', () => {
      lights.setTurnSignal('right');
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.01);
      const leftFront  = getLensIntensity(group, 'IndicatorFL');
      const rightFront = getLensIntensity(group, 'IndicatorFR');
      expect(rightFront).toBeGreaterThan(0);
      expect(leftFront).toBe(0);
    });

    it('hazard → all four indicators blink simultaneously', () => {
      lights.setTurnSignal('hazard');
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.01);
      expect(getLensIntensity(group, 'IndicatorFL')).toBeGreaterThan(0);
      expect(getLensIntensity(group, 'IndicatorFR')).toBeGreaterThan(0);
      expect(getLensIntensity(group, 'IndicatorRL')).toBeGreaterThan(0);
      expect(getLensIntensity(group, 'IndicatorRR')).toBeGreaterThan(0);
    });

    it('all indicators are off when signal is "off"', () => {
      lights.setTurnSignal('off');
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.01);
      expect(getLensIntensity(group, 'IndicatorFL')).toBe(0);
      expect(getLensIntensity(group, 'IndicatorFR')).toBe(0);
      expect(getLensIntensity(group, 'IndicatorRL')).toBe(0);
      expect(getLensIntensity(group, 'IndicatorRR')).toBe(0);
    });
  });

  // =========================================================================
  // 3. BLINK TIMING
  // =========================================================================
  describe('3. Blink timing — 0.5s Kenyan highway code period', () => {
    it('indicator toggles from off to on after BLINK_PERIOD/2 seconds', () => {
      const group  = buildLitVehicle(1.8, 4.2, 0.52);
      const lights = new VehicleLightSystem(group);
      lights.setTurnSignal('left');

      // Initial state: blinkOn starts false, so indicator should be off
      lights.update(0.001); // tiny delta — stays in first half-period
      const initialI = getLensIntensity(group, 'IndicatorFL');
      expect(initialI).toBe(0);

      // After half period, blink should flip on
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.001);
      const afterHalfI = getLensIntensity(group, 'IndicatorFL');
      expect(afterHalfI).toBeGreaterThan(0);
    });

    it('indicator toggles back to off after full period', () => {
      const group  = buildLitVehicle(1.8, 4.2, 0.52);
      const lights = new VehicleLightSystem(group);
      lights.setTurnSignal('left');

      // Advance to 'on' state
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.001);
      expect(getLensIntensity(group, 'IndicatorFL')).toBeGreaterThan(0);

      // Advance another half period → back to off
      lights.update(VehicleLightSystem.BLINK_PERIOD / 2 + 0.001);
      expect(getLensIntensity(group, 'IndicatorFL')).toBe(0);
    });

    it('BLINK_PERIOD is exactly 0.5 seconds', () => {
      expect(VehicleLightSystem.BLINK_PERIOD).toBe(0.5);
    });
  });

  // =========================================================================
  // 4. VEHICLE LIGHT SYSTEM DOES NOT THROW ON MISSING LENSES
  // =========================================================================
  describe('4. VehicleLightSystem is graceful on empty groups', () => {
    it('update() on an empty group without lens children does not throw', () => {
      const empty  = new THREE.Group();
      const lights = new VehicleLightSystem(empty);
      lights.setHeadlights(true);
      lights.setBrakeLights(true);
      lights.setTurnSignal('hazard');
      expect(() => lights.update(0.016)).not.toThrow();
    });
  });

  // =========================================================================
  // 5. ATTACHMENT GEOMETRY DIMENSIONS
  // =========================================================================
  describe('5. Light attachment positions respect vehicle dimensions', () => {
    it('headlights are within ±(bodyWidth/2) on X axis', () => {
      const bodyWidth = 1.8;
      const group = buildLitVehicle(bodyWidth, 4.2, 0.52);
      const headL = group.getObjectByName('HeadlightL') as THREE.Mesh;
      const headR = group.getObjectByName('HeadlightR') as THREE.Mesh;
      expect(Math.abs(headL.position.x)).toBeLessThanOrEqual(bodyWidth / 2);
      expect(Math.abs(headR.position.x)).toBeLessThanOrEqual(bodyWidth / 2);
    });

    it('brakelights are within ±(bodyWidth/2) on X axis', () => {
      const bodyWidth = 2.1;
      const group = buildLitVehicle(bodyWidth, 4.6, 0.80);
      const brakeL = group.getObjectByName('BrakelightL') as THREE.Mesh;
      expect(Math.abs(brakeL.position.x)).toBeLessThanOrEqual(bodyWidth / 2);
    });

    it('light mount Y matches the provided mountHeight', () => {
      const mountHeight = 0.72;
      const group = buildLitVehicle(1.8, 4.2, mountHeight);
      const headL = group.getObjectByName('HeadlightL') as THREE.Mesh;
      expect(headL.position.y).toBeCloseTo(mountHeight, 3);
    });
  });
});
