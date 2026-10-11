/**
 * tests/NairobiMatatuSimulation.test.ts
 *
 * Phase 11.7 — Dynamic Matatu and Public Transport Simulation
 * Unit tests verifying:
 *  1. Authentic Nairobi Sacco registrations (Super Metro, City Hoppa, Ngong 126, Forward, KBS).
 *  2. Stage infrastructure, positions, curb bays, and waiting commuter queues.
 *  3. Transit route topologies and stage sequences.
 *  4. Time-of-day dynamic fare pricing (off-peak 50 KES vs rush-hour 70–80 KES).
 *  5. Stage approach, dwell, tout calling, and departure state machine transitions.
 *  6. Commuter boarding capacity limits (14-seat max capacity) and alighting.
 *  7. Player passenger ride system (fare deduction, passenger camera, radio activation, safe alighting).
 *  8. Audio hooks: double-horn, door chime, and tout vocal callouts.
 *  9. Matatu transit telemetry aggregation.
 */

import * as THREE from 'three';
import { describe, it, expect, beforeEach } from 'vitest';
import { MatatuTransitSystem } from '../src/traffic/MatatuTransitSystem';
import { PlayerState } from '../src/player/PlayerState';
import { AudioManager } from '../src/audio/AudioManager';
import { VehicleCamera } from '../src/vehicles/VehicleCamera';

describe('Phase 11.7 — Nairobi Matatu & Public Transport Simulation', () => {
  let transitSystem: MatatuTransitSystem;
  let playerState: PlayerState;

  beforeEach(() => {
    MatatuTransitSystem.resetInstance();
    transitSystem = MatatuTransitSystem.getInstance();
    playerState = new PlayerState();
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Authentic Nairobi Sacco Registrations
  // ─────────────────────────────────────────────────────────────────────────────
  describe('1. Authentic Nairobi Sacco Registrations', () => {
    it('registers all 5 authentic Nairobi Saccos with proper branding and slogans', () => {
      const saccos = transitSystem.saccos;
      expect(saccos.size).toBeGreaterThanOrEqual(5);

      const superMetro = saccos.get('super_metro');
      expect(superMetro).toBeDefined();
      expect(superMetro!.name).toBe('Super Metro Sacco');
      expect(superMetro!.slogan).toBe('The Pride of Commuters');
      expect(superMetro!.fleetColorPrimary).toBe(0x0f2042); // Navy Blue
      expect(superMetro!.fleetColorSecondary).toBe(0xfacc15); // Golden Yellow
      expect(superMetro!.hornStyle).toBe('double_tap');

      const cityHoppa = saccos.get('city_hoppa');
      expect(cityHoppa).toBeDefined();
      expect(cityHoppa!.name).toBe('City Hoppa Transit');
      expect(cityHoppa!.slogan).toBe('Clean & Orderly City Transit');

      const ngong126 = saccos.get('ngong_126');
      expect(ngong126).toBeDefined();
      expect(ngong126!.name).toBe('Ngong 126 Electric Express');
      expect(ngong126!.slogan).toBe('Fast Track Art Beast');
      expect(ngong126!.hornStyle).toBe('musical');

      const forward = saccos.get('forward_sacco');
      expect(forward).toBeDefined();
      expect(forward!.name).toBe('Forward Sacco Transit');

      const kbs = saccos.get('kbs_transit');
      expect(kbs).toBeDefined();
      expect(kbs!.name).toBe('Kenya Bus Service (KBS)');
    });

    it('provides authentic conductor/tout callout phrases for each Sacco', () => {
      const superMetro = transitSystem.saccos.get('super_metro')!;
      expect(superMetro.toutCallouts.length).toBeGreaterThanOrEqual(3);
      expect(superMetro.toutCallouts.some(c => c.includes('Tao') || c.includes('Kencom'))).toBe(true);

      const ngong126 = transitSystem.saccos.get('ngong_126')!;
      expect(ngong126.toutCallouts.some(c => c.includes('Ngong'))).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Stage Infrastructure & Coordinates
  // ─────────────────────────────────────────────────────────────────────────────
  describe('2. Stage Infrastructure & Coordinates', () => {
    it('registers core Nairobi stages along CBD and Kilimani corridors', () => {
      const stages = transitSystem.stages;
      expect(stages.size).toBeGreaterThanOrEqual(7);

      expect(stages.has('stage_kencom')).toBe(true);
      expect(stages.has('stage_gpo')).toBe(true);
      expect(stages.has('stage_railways')).toBe(true);
      expect(stages.has('stage_city_hall')).toBe(true);
      expect(stages.has('stage_hurlingham')).toBe(true);
      expect(stages.has('stage_yaya')).toBe(true);
      expect(stages.has('stage_valley_arcade')).toBe(true);
    });

    it('verifies that each stage has defined curb stopping position and sidewalk shelter position', () => {
      const kencom = transitSystem.stages.get('stage_kencom')!;
      expect(kencom.curbPosition).toBeInstanceOf(THREE.Vector3);
      expect(kencom.shelterPosition).toBeInstanceOf(THREE.Vector3);
      expect(kencom.capacity).toBeGreaterThanOrEqual(25);

      // Curb position should be closer to carriageway (X ~ 7.2) than shelter (X ~ 14.5)
      expect(Math.abs(kencom.curbPosition.x)).toBeLessThan(Math.abs(kencom.shelterPosition.x));

      const gpo = transitSystem.stages.get('stage_gpo')!;
      expect(Math.abs(gpo.curbPosition.x)).toBeLessThan(Math.abs(gpo.shelterPosition.x));
    });

    it('initializes commuter queues with valid destination stages', () => {
      const kencom = transitSystem.stages.get('stage_kencom')!;
      expect(kencom.waitingPassengers.length).toBeGreaterThan(0);
      kencom.waitingPassengers.forEach((commuter) => {
        expect(commuter.targetStageId).toBeDefined();
        expect(transitSystem.stages.has(commuter.targetStageId)).toBe(true);
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Route Topologies & Sequences
  // ─────────────────────────────────────────────────────────────────────────────
  describe('3. Route Topologies & Sequences', () => {
    it('registers realistic routes with continuous stage sequences', () => {
      const routes = transitSystem.routes;
      expect(routes.size).toBeGreaterThanOrEqual(3);

      const r105 = routes.get('route_105_supermetro')!;
      expect(r105.code).toBe('ROUTE_105');
      expect(r105.saccoId).toBe('super_metro');
      expect(r105.stageSequence.length).toBeGreaterThanOrEqual(4);
      expect(r105.stageSequence).toContain('stage_kencom');
      expect(r105.stageSequence).toContain('stage_gpo');

      const r111 = routes.get('route_111_ngong')!;
      expect(r111.code).toBe('ROUTE_111');
      expect(r111.saccoId).toBe('ngong_126');
      expect(r111.stageSequence).toContain('stage_yaya');
      expect(r111.stageSequence).toContain('stage_railways');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Time-of-Day Dynamic Fare Modeling
  // ─────────────────────────────────────────────────────────────────────────────
  describe('4. Time-of-Day Dynamic Fare Modeling', () => {
    it('correctly identifies Nairobi rush hours (morning 7–9:30 AM and evening 16:30–19:30 PM)', () => {
      // Off-peak
      expect(transitSystem.isRushHour(12.0)).toBe(false);
      expect(transitSystem.isRushHour(14.5)).toBe(false);
      expect(transitSystem.isRushHour(22.0)).toBe(false);
      expect(transitSystem.isRushHour(3.0)).toBe(false);

      // Morning rush
      expect(transitSystem.isRushHour(7.5)).toBe(true);
      expect(transitSystem.isRushHour(8.0)).toBe(true);
      expect(transitSystem.isRushHour(9.0)).toBe(true);

      // Evening rush
      expect(transitSystem.isRushHour(17.0)).toBe(true);
      expect(transitSystem.isRushHour(18.5)).toBe(true);
      expect(transitSystem.isRushHour(19.0)).toBe(true);
    });

    it('calculates off-peak vs peak fares accurately for Route 105 and Route 111', () => {
      // Route 105: 50 KES off-peak, 70 KES peak
      expect(transitSystem.getFare('route_105_supermetro', 13.0)).toBe(50);
      expect(transitSystem.getFare('route_105_supermetro', 8.0)).toBe(70);
      expect(transitSystem.getFare('route_105_supermetro', 18.0)).toBe(70);

      // Route 111: 60 KES off-peak, 80 KES peak
      expect(transitSystem.getFare('route_111_ngong', 11.0)).toBe(60);
      expect(transitSystem.getFare('route_111_ngong', 8.5)).toBe(80);
      expect(transitSystem.getFare('route_111_ngong', 17.5)).toBe(80);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Stage Approach, Dwell, & Departure State Machine
  // ─────────────────────────────────────────────────────────────────────────────
  describe('5. Stage Approach, Dwell, & Departure State Machine', () => {
    it('initializes matatu vehicle in EN_ROUTE state with doors closed and no hazards', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_01', 'super_metro', 'route_105_supermetro');
      expect(matatu.dwellState).toBe('EN_ROUTE');
      expect(matatu.doorOpen).toBe(false);
      expect(matatu.hazardsActive).toBe(false);
      expect(matatu.indicatorState).toBe('OFF');
      expect(matatu.maxSeats).toBe(14);
    });

    it('transitions through APPROACHING_STAGE with left indicator', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_02', 'super_metro', 'route_105_supermetro');
      matatu.dwellState = 'APPROACHING_STAGE';
      transitSystem.update(0.1, 12.0);
      expect(matatu.indicatorState).toBe('LEFT');
      expect(matatu.doorOpen).toBe(false);
    });

    it('activates doors open and hazard blinkers when dwelling at a stage', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_03', 'super_metro', 'route_105_supermetro');
      matatu.dwellState = 'DWELLING_AT_STAGE';
      transitSystem.update(0.1, 12.0);
      expect(matatu.doorOpen).toBe(true);
      expect(matatu.hazardsActive).toBe(true);
      expect(matatu.indicatorState).toBe('HAZARDS');
    });

    it('progresses dwell stages from DWELLING -> BOARDING -> CALLING -> DEPARTING -> EN_ROUTE', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_04', 'super_metro', 'route_105_supermetro');
      matatu.dwellState = 'DWELLING_AT_STAGE';
      matatu.dwellTimerSeconds = 0;

      // At 1.2s -> advances to BOARDING_ALIGHTING
      transitSystem.update(1.2, 12.0);
      expect(matatu.dwellState).toBe('BOARDING_ALIGHTING');

      // At 3.2s -> advances to CALLING_PASSENGERS
      transitSystem.update(2.0, 12.0);
      expect(matatu.dwellState).toBe('CALLING_PASSENGERS');

      // At 6.1s (past maxDwellSeconds) -> advances to DEPARTING_STAGE with right indicator
      transitSystem.update(3.0, 12.0);
      expect(matatu.dwellState).toBe('DEPARTING_STAGE');
      expect(matatu.doorOpen).toBe(false);
      expect(matatu.hazardsActive).toBe(false);
      expect(matatu.indicatorState).toBe('RIGHT');

      // Past departure delay (2.5s) -> transitions back to EN_ROUTE and advances route index
      transitSystem.update(2.6, 12.0);
      expect(matatu.dwellState).toBe('EN_ROUTE');
      expect(matatu.indicatorState).toBe('OFF');
      expect(matatu.currentStageIndex).toBe(1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 6. Commuter Boarding & Seat Capacity Constraints
  // ─────────────────────────────────────────────────────────────────────────────
  describe('6. Commuter Boarding & Seat Capacity Constraints', () => {
    it('boards waiting commuters from stage queue when dwelling', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_05', 'super_metro', 'route_105_supermetro');
      const stage = transitSystem.stages.get('stage_kencom')!;
      const initialWaiting = stage.waitingPassengers.length;
      expect(initialWaiting).toBeGreaterThan(0);

      matatu.dwellState = 'DWELLING_AT_STAGE';
      matatu.dwellTimerSeconds = 0.9;

      // Update to trigger BOARDING_ALIGHTING
      transitSystem.update(0.3, 12.0);
      expect(matatu.passengers.length).toBeGreaterThan(0);
      expect(stage.waitingPassengers.length).toBeLessThan(initialWaiting);
    });

    it('enforces maximum 14-seat commuter capacity (does not overfill)', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_06', 'super_metro', 'route_105_supermetro');
      const stage = transitSystem.stages.get('stage_kencom')!;

      // Add 20 commuters to stage queue
      for (let i = 0; i < 20; i++) {
        stage.waitingPassengers.push({
          passengerId: `extra_commuter_${i}`,
          targetStageId: 'stage_gpo',
          arrivedTime: 0
        });
      }

      matatu.dwellState = 'DWELLING_AT_STAGE';
      matatu.dwellTimerSeconds = 0.9;
      transitSystem.update(0.3, 12.0);

      expect(matatu.passengers.length).toBeLessThanOrEqual(14);
      expect(matatu.passengers.length).toBe(14);
    });

    it('alights passengers whose target stage matches the current stage', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_07', 'super_metro', 'route_105_supermetro');
      // Pre-load passenger targeting stage_gpo
      matatu.passengers.push({
        id: 'alighting_commuter',
        isPlayer: false,
        originStageId: 'stage_kencom',
        destinationStageId: 'stage_gpo',
        boardTime: 0,
        farePaid: 50
      });

      // Move matatu to stage_gpo (index 2 in sequence)
      matatu.currentStageIndex = 2; // stage_gpo
      matatu.dwellState = 'DWELLING_AT_STAGE';
      matatu.dwellTimerSeconds = 0.9;

      transitSystem.update(0.3, 12.0);
      const remainingPassenger = matatu.passengers.find(p => p.id === 'alighting_commuter');
      expect(remainingPassenger).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 7. Player Passenger Ride System
  // ─────────────────────────────────────────────────────────────────────────────
  describe('7. Player Passenger Ride System', () => {
    it('evaluates player boarding permission based on dwell state, capacity, and cash', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_08', 'super_metro', 'route_105_supermetro');
      const playerPos = new THREE.Vector3(7.2, 0.2, 72.0);

      // 1. Not dwelling -> rejected
      matatu.dwellState = 'EN_ROUTE';
      let check = transitSystem.canPlayerBoard('test_matatu_08', playerPos, 2500);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('not stopped');

      // 2. Dwelling but player has 0 KES -> rejected
      matatu.dwellState = 'DWELLING_AT_STAGE';
      check = transitSystem.canPlayerBoard('test_matatu_08', playerPos, 20);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('Insufficient cash');

      // 3. Dwelling but full capacity (14 seats) -> rejected
      for (let i = 0; i < 14; i++) {
        matatu.passengers.push({
          id: `full_seat_${i}`,
          isPlayer: false,
          originStageId: 'stage_kencom',
          destinationStageId: 'stage_gpo',
          boardTime: 0,
          farePaid: 50
        });
      }
      check = transitSystem.canPlayerBoard('test_matatu_08', playerPos, 2500);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('capacity');

      // 4. Free seat & sufficient cash -> allowed
      matatu.passengers.pop(); // 13 seats occupied
      check = transitSystem.canPlayerBoard('test_matatu_08', playerPos, 2500);
      expect(check.allowed).toBe(true);
      expect(check.fare).toBe(50);
      expect(check.sacco!.name).toBe('Super Metro Sacco');
    });

    it('boards player, deducts fare from player cash, and enters RIDING_AS_PASSENGER mode', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_09', 'super_metro', 'route_105_supermetro');
      matatu.dwellState = 'DWELLING_AT_STAGE';

      const initialCash = playerState.getCash(); // 2500 KES
      const success = transitSystem.boardPlayer('test_matatu_09', playerState, 12.0); // 50 KES fare

      expect(success).toBe(true);
      expect(playerState.getCash()).toBe(initialCash - 50);
      expect(playerState.getMode()).toBe('RIDING_AS_PASSENGER');
      expect(transitSystem.isPlayerRiding()).toBe(true);

      const ride = transitSystem.getCurrentPlayerRide();
      expect(ride).toBeDefined();
      expect(ride!.saccoName).toBe('Super Metro Sacco');
      expect(ride!.farePaid).toBe(50);
      expect(ride!.nextStageName).toBeDefined();
    });

    it('alights player safely onto sidewalk and restores IDLE mode', () => {
      const matatu = transitSystem.registerMatatuVehicle('test_matatu_10', 'super_metro', 'route_105_supermetro');
      matatu.dwellState = 'DWELLING_AT_STAGE';
      transitSystem.boardPlayer('test_matatu_10', playerState, 12.0);

      const vehPos = new THREE.Vector3(7.2, 0.25, 72.0);
      const exitPos = transitSystem.alightPlayer(playerState, vehPos, 0);

      expect(playerState.getMode()).toBe('IDLE');
      expect(transitSystem.isPlayerRiding()).toBe(false);
      expect(exitPos.x).toBeGreaterThan(vehPos.x); // Offset to passenger/sidewalk side
      expect(exitPos.z).toBeCloseTo(vehPos.z + 0.5, 0.1);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 8. VehicleCamera Passenger Mode
  // ─────────────────────────────────────────────────────────────────────────────
  describe('8. VehicleCamera Passenger Mode', () => {
    it('switches cameraMode between CHASE and PASSENGER with interior eye level', () => {
      const camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
      const vehCam = new VehicleCamera(camera);

      expect(vehCam.cameraMode).toBe('CHASE');
      vehCam.setCameraMode('PASSENGER');
      expect(vehCam.cameraMode).toBe('PASSENGER');

      // In passenger mode, update places camera near cabin seat offset
      const vehPos = new THREE.Vector3(10, 0.2, 30);
      vehCam.update(vehPos, 0, 40, 0.1, []);

      // Height should be approximately vehPos.y + 1.35
      expect(camera.position.y).toBeCloseTo(vehPos.y + 1.35, 0.5);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 9. Sound Atmosphere & Audio Hooks
  // ─────────────────────────────────────────────────────────────────────────────
  describe('9. Sound Atmosphere & Audio Hooks', () => {
    it('executes audio methods without throwing errors', () => {
      const audio = AudioManager.getInstance();
      expect(() => audio.playMatatuDoubleHorn()).not.toThrow();
      expect(() => audio.playMatatuDoorChime()).not.toThrow();
      expect(() => audio.playToutCallout('Tao Tao Tao!')).not.toThrow();
      expect(() => audio.setMatatuRadio(true)).not.toThrow();
      expect(() => audio.setMatatuRadio(false)).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 10. Transit Telemetry Reporting
  // ─────────────────────────────────────────────────────────────────────────────
  describe('10. Transit Telemetry Reporting', () => {
    it('aggregates active matatus, waiting commuters, and peak hour multiplier', () => {
      transitSystem.registerMatatuVehicle('tel_veh_1', 'super_metro', 'route_105_supermetro');
      transitSystem.registerMatatuVehicle('tel_veh_2', 'ngong_126', 'route_111_ngong');

      const offPeakTelemetry = transitSystem.getTelemetry(12.0);
      expect(offPeakTelemetry.activeMatatuCount).toBe(2);
      expect(offPeakTelemetry.stagesCount).toBeGreaterThanOrEqual(7);
      expect(offPeakTelemetry.totalWaitingPassengers).toBeGreaterThan(0);
      expect(offPeakTelemetry.isPeakRushHour).toBe(false);
      expect(offPeakTelemetry.currentPeakMultiplier).toBe(1.0);

      const peakTelemetry = transitSystem.getTelemetry(8.0); // Morning rush
      expect(peakTelemetry.isPeakRushHour).toBe(true);
      expect(peakTelemetry.currentPeakMultiplier).toBe(1.4);
    });
  });
});
