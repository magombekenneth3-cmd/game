import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { MatatuOperatorSystem } from '../src/traffic/MatatuOperatorSystem';
import { MatatuTransitSystem } from '../src/traffic/MatatuTransitSystem';
import { PlayerState } from '../src/player/PlayerState';

describe('Phase 11.8 — Matatu Operator & Transit Economy Tests', () => {
  let operatorSystem: MatatuOperatorSystem;
  let transitSystem: MatatuTransitSystem;
  let playerState: PlayerState;

  beforeEach(() => {
    MatatuTransitSystem.resetInstance();
    MatatuOperatorSystem.resetInstance();
    operatorSystem = MatatuOperatorSystem.getInstance();
    transitSystem = MatatuTransitSystem.getInstance();
    playerState = new PlayerState();
  });

  // --- 1. SACCO REPUTATION & RANK PROGRESSION ---
  describe('Sacco Reputation & Rank Progression', () => {
    it('initializes default records for all 5 Nairobi Saccos', () => {
      const saccoIds = ['super_metro', 'city_hoppa', 'ngong_126', 'forward_sacco', 'kbs_transit'] as const;
      saccoIds.forEach((id) => {
        const record = operatorSystem.getSaccoRecord(id);
        expect(record).toBeDefined();
        expect(record.saccoId).toBe(id);
        expect(record.rank).toBe('SQUADDI');
        expect(record.reputation).toBe(25);
      });
    });

    it('correctly calculates ranks across reputation tiers', () => {
      expect(operatorSystem.calculateRank(50)).toBe('SQUADDI');
      expect(operatorSystem.calculateRank(100)).toBe('SENIOR_DERE');
      expect(operatorSystem.calculateRank(249)).toBe('SENIOR_DERE');
      expect(operatorSystem.calculateRank(250)).toBe('METRO_CAPTAIN');
      expect(operatorSystem.calculateRank(499)).toBe('METRO_CAPTAIN');
      expect(operatorSystem.calculateRank(500)).toBe('MANYANGA_LEGEND');
      expect(operatorSystem.calculateRank(1200)).toBe('MANYANGA_LEGEND');
    });

    it('unlocks Manyanga custom specs and underglow at MANYANGA_LEGEND rank', () => {
      const record = operatorSystem.getSaccoRecord('ngong_126');
      record.reputation = 520;
      record.rank = operatorSystem.calculateRank(record.reputation);

      const session = operatorSystem.startShift('matatu_test_1', 'ngong_126', 'route_111_ngong126');
      const summary = operatorSystem.endShift(playerState);

      expect(summary).toBeDefined();
      expect(summary?.newRank).toBe('MANYANGA_LEGEND');
      expect(record.unlockedManyanga).toBe(true);
      expect(operatorSystem.unlockedUnderglow).toBe(true);
    });
  });

  // --- 2. SHIFT LIFECYCLE & ROUTE TRACKING ---
  describe('Shift Lifecycle & Route Tracking', () => {
    it('starts shift session with route details and initial stage target', () => {
      const session = operatorSystem.startShift(
        'matatu_metro_01',
        'super_metro',
        'route_105_supermetro',
        8.0 // 8:00 AM rush hour
      );

      expect(session).toBeDefined();
      expect(session.saccoId).toBe('super_metro');
      expect(session.routeCode).toBe('ROUTE_105');
      expect(session.status).toBe('EN_ROUTE');
      expect(session.maxSeats).toBe(14);
      expect(session.isPeakRushHour).toBe(true);
      expect(session.rushHourMultiplier).toBe(1.4);
      expect(session.telemetry.satisfactionScore).toBe(100);
      expect(session.targetStageId).toBe('stage_kencom');
      expect(session.targetStageName).toBe('Kencom / Ambassador Stage');
    });

    it('calculates curb distance and transitions state on approach', () => {
      const session = operatorSystem.startShift(
        'matatu_metro_01',
        'super_metro',
        'route_105_supermetro',
        14.0 // 14:00 off-peak
      );

      // Target curb for Kencom is at (5.5, 0.07, 72.0)
      const distantPos = new THREE.Vector3(5.5, 0.07, 20.0); // 52m away
      operatorSystem.update(0.1, distantPos, 40, false, 14.0);
      expect(session.distanceToTargetCurbMeters).toBeCloseTo(52, 0);
      expect(session.status).toBe('EN_ROUTE');

      const approachPos = new THREE.Vector3(5.5, 0.07, 60.0); // 12m away
      operatorSystem.update(0.1, approachPos, 20, false, 14.0);
      expect(session.distanceToTargetCurbMeters).toBeCloseTo(12, 0);
      expect(session.status).toBe('APPROACHING_STAGE');
    });
  });

  // --- 3. DOCKING & COMMUTER BOARDING MINI-GAME ---
  describe('Stage Docking & Passenger Boarding', () => {
    it('rejects docking if vehicle is too far or speeding', () => {
      operatorSystem.startShift('matatu_1', 'super_metro', 'route_105_supermetro');

      // Too far (50m)
      const farPos = new THREE.Vector3(5.5, 0.07, 10.0);
      const checkFar = operatorSystem.canDockAtStage(farPos, 0, true);
      expect(checkFar.canDock).toBe(false);
      expect(checkFar.reason).toContain('Too far');

      // Close (2m) but speeding (25 kph)
      const closePos = new THREE.Vector3(5.5, 0.07, 73.0);
      const checkFast = operatorSystem.canDockAtStage(closePos, 25, true);
      expect(checkFast.canDock).toBe(false);
      expect(checkFast.reason).toContain('Speed too high');

      // Close and stopped
      const checkValid = operatorSystem.canDockAtStage(closePos, 2, true);
      expect(checkValid.canDock).toBe(true);
    });

    it('boards waiting commuters, calculates rush hour fare, and collects tips', () => {
      const session = operatorSystem.startShift(
        'matatu_metro_01',
        'super_metro',
        'route_105_supermetro',
        8.0 // Morning Rush Hour
      );

      // Add waiting commuters to Kencom Stage
      const kencom = transitSystem.stages.get('stage_kencom')!;
      kencom.waitingPassengers = [
        { passengerId: 'commuter_1', targetStageId: 'stage_gpo', arrivedTime: 100 },
        { passengerId: 'commuter_2', targetStageId: 'stage_gpo', arrivedTime: 105 },
        { passengerId: 'commuter_3', targetStageId: 'stage_cityhall', arrivedTime: 110 }
      ];

      const result = operatorSystem.dockAndExchangePassengers(8.0);

      expect(result.success).toBe(true);
      expect(result.boarded).toBe(3);
      expect(session.passengers.length).toBe(3);
      expect(session.dockedAtStage).toBe(true);
      expect(session.doorOpen).toBe(true);

      // Super Metro Route 105 peak fare is 70 KES
      // 3 * 70 = 210 KES gross fares
      expect(result.faresKES).toBe(210);
      // Satisfaction is 100% (>= 90%), so +20% tips: floor(70 * 0.2) = 14 * 3 = 42 KES
      expect(result.tipsKES).toBe(42);
      expect(session.earnings.grossFaresKES).toBe(210);
      expect(session.earnings.tipsEarnedKES).toBe(42);
    });

    it('enforces 14-seat maximum capacity on commuter boarding', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      const kencom = transitSystem.stages.get('stage_kencom')!;

      // Populate stage with 20 commuters
      kencom.waitingPassengers = [];
      for (let i = 0; i < 20; i++) {
        kencom.waitingPassengers.push({
          passengerId: `commuter_${i}`,
          targetStageId: 'stage_gpo',
          arrivedTime: i * 5
        });
      }

      const result = operatorSystem.dockAndExchangePassengers(14.0); // Off-peak (50 KES)
      expect(result.boarded).toBe(14); // Exactly capped at 14 seats
      expect(session.passengers.length).toBe(14);
      expect(kencom.waitingPassengers.length).toBe(6); // 6 commuters left waiting
    });

    it('alights onboard passengers whose destination matches current stage', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');

      // Pre-fill with passengers heading to GPO vs City Hall
      session.passengers = [
        { id: 'p1', isPlayer: false, originStageId: 'stage_kencom', destinationStageId: 'stage_gpo', boardTime: 0, farePaid: 50 },
        { id: 'p2', isPlayer: false, originStageId: 'stage_kencom', destinationStageId: 'stage_gpo', boardTime: 0, farePaid: 50 },
        { id: 'p3', isPlayer: false, originStageId: 'stage_kencom', destinationStageId: 'stage_city_hall', boardTime: 0, farePaid: 50 }
      ];

      // Set target stage to GPO and clear waiting queue to isolate alighting
      session.targetStageId = 'stage_gpo';
      const gpoStage = transitSystem.stages.get('stage_gpo')!;
      gpoStage.waitingPassengers = [];

      const result = operatorSystem.dockAndExchangePassengers(14.0);

      expect(result.alighted).toBe(2);
      expect(session.passengers.length).toBe(1);
      expect(session.passengers[0].destinationStageId).toBe('stage_city_hall');
      expect(session.telemetry.commutersAlightedCount).toBe(2);
    });
  });

  // --- 4. STAGE DEPARTURE & ROUTE ADVANCEMENT ---
  describe('Stage Departure & Route Advancement', () => {
    it('closes doors, advances stage index, and updates target stage on departure', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      session.dockedAtStage = true;
      session.doorOpen = true;

      expect(session.currentStageIndex).toBe(0); // Kencom
      expect(session.targetStageId).toBe('stage_kencom');

      const departed = operatorSystem.departStage();

      expect(departed).toBe(true);
      expect(session.doorOpen).toBe(false);
      expect(session.dockedAtStage).toBe(false);
      expect(session.status).toBe('DEPARTING');
      expect(session.currentStageIndex).toBe(1); // City Hall
      expect(session.targetStageId).toBe('stage_city_hall');
      expect(session.targetStageName).toBe('City Hall / Wabera Stage');
    });
  });

  // --- 5. TELEMETRY, SATISFACTION & INFRACTIONS ---
  describe('Driving Telemetry & Satisfaction Scoring', () => {
    it('penalizes passenger satisfaction upon collision and plays gasp audio', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      expect(session.telemetry.satisfactionScore).toBe(100);

      operatorSystem.reportCollision(20.0); // 20 kph collision

      expect(session.telemetry.collisionCount).toBe(1);
      expect(session.telemetry.satisfactionScore).toBeLessThan(100);
      expect(session.telemetry.satisfactionScore).toBeGreaterThanOrEqual(15);
    });

    it('penalizes speed violations above 80 kph', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      operatorSystem.reportSpeedViolation();

      expect(session.telemetry.speedViolations).toBe(1);
      expect(session.telemetry.satisfactionScore).toBe(97);
    });

    it('smooth cruising gradually restores satisfaction score', () => {
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      session.telemetry.satisfactionScore = 80;

      operatorSystem.reportSmoothCruising(4.0); // 4 seconds of smooth driving
      expect(session.telemetry.satisfactionScore).toBeCloseTo(82, 0);
    });
  });

  // --- 6. SHIFT ACCOUNTING & WALLET PAYOUT ---
  describe('Shift Settlement & Wallet Payout', () => {
    it('calculates net payout deducting Sacco fees & fuel, and credits player cash', () => {
      const startingCash = playerState.getCash();
      const session = operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');

      session.earnings.grossFaresKES = 1000;
      session.earnings.tipsEarnedKES = 150;
      session.telemetry.distanceDrivenMeters = 4000; // 4 km
      session.telemetry.stagesDockedCount = 3;
      session.telemetry.commutersBoardedCount = 18;

      const summary = operatorSystem.endShift(playerState);

      expect(summary).toBeDefined();
      expect(summary?.grossFaresKES).toBe(1000);
      expect(summary?.tipsEarnedKES).toBe(150);
      expect(summary?.saccoFeeKES).toBe(150); // 15% of 1000
      expect(summary?.fuelCostKES).toBe(180); // 4 km * 45 KES
      // Net = 1000 + 150 - 150 - 180 = 820 KES
      expect(summary?.netProfitKES).toBe(820);

      // Player cash credited
      expect(playerState.getCash()).toBe(startingCash + 820);
      expect(playerState.getReputation()).toBeGreaterThan(10);
      expect(operatorSystem.getActiveSession()).toBeUndefined();
    });
  });

  // --- 7. CONDUCTOR ACTIONS & AUDIO HOOKS ---
  describe('Conductor Makanga Actions', () => {
    it('triggers tout callouts and panel slaps without error', () => {
      operatorSystem.startShift('matatu_metro_01', 'super_metro', 'route_105_supermetro');
      expect(() => {
        operatorSystem.triggerMakangaCallout();
        operatorSystem.triggerSaccoHorn();
      }).not.toThrow();
    });
  });
});
