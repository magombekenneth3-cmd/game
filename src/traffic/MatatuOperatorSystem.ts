import * as THREE from 'three';
import {
  SaccoId,
  MatatuSacco,
  MatatuTransitRoute,
  MatatuStage,
  MatatuPassenger
} from './MatatuTransitTypes';
import {
  SaccoRank,
  SaccoReputationRecord,
  MatatuShiftSession,
  ShiftSummaryReport
} from './MatatuOperatorTypes';
import { MatatuTransitSystem } from './MatatuTransitSystem';
import { PlayerState } from '../player/PlayerState';
import { AudioManager } from '../audio/AudioManager';

export class MatatuOperatorSystem {
  private static instance?: MatatuOperatorSystem;

  public saccoRecords: Map<SaccoId, SaccoReputationRecord> = new Map();
  public activeSession?: MatatuShiftSession;

  // Unlocks & perk bonuses
  public unlockedCustomHorns: Set<string> = new Set();
  public unlockedUnderglow: boolean = false;

  constructor() {
    this.initSaccoRecords();
  }

  public static getInstance(): MatatuOperatorSystem {
    if (!MatatuOperatorSystem.instance) {
      MatatuOperatorSystem.instance = new MatatuOperatorSystem();
    }
    return MatatuOperatorSystem.instance;
  }

  public static resetInstance(): void {
    MatatuOperatorSystem.instance = undefined;
  }

  // --- 1. INITIALIZE SACCO RECORDS & PROGRESSION ---
  private initSaccoRecords(): void {
    const saccoIds: SaccoId[] = [
      'super_metro',
      'city_hoppa',
      'ngong_126',
      'forward_sacco',
      'kbs_transit'
    ];

    saccoIds.forEach((id) => {
      this.saccoRecords.set(id, {
        saccoId: id,
        reputation: 25,
        rank: 'SQUADDI',
        shiftsCompleted: 0,
        passengersTransported: 0,
        totalEarningsKES: 0,
        averageSatisfaction: 95.0,
        unlockedManyanga: false
      });
    });
  }

  public getSaccoRecord(saccoId: SaccoId): SaccoReputationRecord {
    let rec = this.saccoRecords.get(saccoId);
    if (!rec) {
      rec = {
        saccoId,
        reputation: 25,
        rank: 'SQUADDI',
        shiftsCompleted: 0,
        passengersTransported: 0,
        totalEarningsKES: 0,
        averageSatisfaction: 95.0,
        unlockedManyanga: false
      };
      this.saccoRecords.set(saccoId, rec);
    }
    return rec;
  }

  public calculateRank(reputation: number): SaccoRank {
    if (reputation >= 500) return 'MANYANGA_LEGEND';
    if (reputation >= 250) return 'METRO_CAPTAIN';
    if (reputation >= 100) return 'SENIOR_DERE';
    return 'SQUADDI';
  }

  // --- 2. SHIFT SESSION LIFECYCLE ---
  public startShift(
    vehicleId: string,
    saccoId: SaccoId,
    routeId: string,
    currentHours: number = 8.0
  ): MatatuShiftSession {
    const transitSystem = MatatuTransitSystem.getInstance();
    const route: MatatuTransitRoute | undefined = transitSystem.routes.get(routeId);
    const sacco: MatatuSacco | undefined = transitSystem.saccos.get(saccoId);

    const routeName = route ? route.name : 'Nairobi Transit Route';
    const routeCode = route ? route.code : 'ROUTE_EXPRESS';
    const firstStageId = route && route.stageSequence.length > 0 ? route.stageSequence[0] : 'stage_kencom';
    const targetStage: MatatuStage | undefined = transitSystem.stages.get(firstStageId);

    const isPeak = transitSystem.isRushHour(currentHours);
    const peakMultiplier = isPeak ? (sacco?.peakMultiplier || 1.4) : 1.0;

    const session: MatatuShiftSession = {
      shiftId: `shift_${Date.now()}_${saccoId}`,
      vehicleId,
      saccoId,
      routeId,
      routeName,
      routeCode,
      status: 'EN_ROUTE',
      currentStageIndex: 0,
      targetStageId: firstStageId,
      targetStageName: targetStage ? targetStage.name : 'Kencom Stage',
      targetStagePosition: targetStage ? targetStage.position.clone() : new THREE.Vector3(11.5, 0.2, 72.0),
      targetCurbPosition: targetStage ? targetStage.curbPosition.clone() : new THREE.Vector3(5.5, 0.07, 72.0),
      passengers: [],
      maxSeats: 14,
      doorOpen: false,
      handbrakeApplied: false,
      dockedAtStage: false,
      distanceToTargetCurbMeters: 50.0,
      elapsedSeconds: 0,
      scheduledMinutesRemaining: 15.0,
      earnings: {
        grossFaresKES: 0,
        tipsEarnedKES: 0,
        fuelCostKES: 0,
        saccoFeeKES: 0,
        netPayoutKES: 0
      },
      telemetry: {
        distanceDrivenMeters: 0,
        collisionCount: 0,
        speedViolations: 0,
        satisfactionScore: 100.0,
        stagesDockedCount: 0,
        commutersBoardedCount: 0,
        commutersAlightedCount: 0
      },
      isPeakRushHour: isPeak,
      rushHourMultiplier: peakMultiplier
    };

    this.activeSession = session;

    // Conductor audio announcement
    AudioManager.getInstance().playConductorPanelSlap();
    if (sacco && sacco.toutCallouts.length > 0) {
      AudioManager.getInstance().playToutCallout(sacco.toutCallouts[0]);
    }

    return session;
  }

  public getActiveSession(): MatatuShiftSession | undefined {
    return this.activeSession;
  }

  // --- 3. DOCKING & PASSENGER EXCHANGE LOGIC ---
  public canDockAtStage(
    vehiclePosition: THREE.Vector3,
    speedKph: number,
    _handbrake: boolean
  ): { canDock: boolean; stage?: MatatuStage; distanceMeters: number; reason?: string } {
    if (!this.activeSession) {
      return { canDock: false, distanceMeters: 999, reason: 'No active matatu shift session' };
    }

    const transitSystem = MatatuTransitSystem.getInstance();
    const stage = transitSystem.stages.get(this.activeSession.targetStageId);
    if (!stage) {
      return { canDock: false, distanceMeters: 999, reason: 'Stage not found' };
    }

    const dist = vehiclePosition.distanceTo(stage.curbPosition);
    if (dist > 6.0) {
      return { canDock: false, stage, distanceMeters: dist, reason: `Too far from stage bay (${dist.toFixed(1)}m > 6.0m)` };
    }

    if (speedKph > 5.0) {
      return { canDock: false, stage, distanceMeters: dist, reason: `Speed too high (${Math.round(speedKph)} kph > 5 kph)` };
    }

    return { canDock: true, stage, distanceMeters: dist };
  }

  public dockAndExchangePassengers(currentHours: number = 8.0): {
    success: boolean;
    boarded: number;
    alighted: number;
    faresKES: number;
    tipsKES: number;
  } {
    if (!this.activeSession) {
      return { success: false, boarded: 0, alighted: 0, faresKES: 0, tipsKES: 0 };
    }

    const transitSystem = MatatuTransitSystem.getInstance();
    const stage = transitSystem.stages.get(this.activeSession.targetStageId);
    if (!stage) {
      return { success: false, boarded: 0, alighted: 0, faresKES: 0, tipsKES: 0 };
    }

    this.activeSession.dockedAtStage = true;
    this.activeSession.doorOpen = true;
    this.activeSession.status = 'DOCKED_BOARDING';

    // 1. Alight passengers destination matching this stage
    const staying: MatatuPassenger[] = [];
    let alightedCount = 0;
    for (const p of this.activeSession.passengers) {
      if (p.destinationStageId === stage.id) {
        alightedCount++;
      } else {
        staying.push(p);
      }
    }
    this.activeSession.passengers = staying;
    this.activeSession.telemetry.commutersAlightedCount += alightedCount;

    // 2. Board waiting passengers
    const availableSeats = this.activeSession.maxSeats - this.activeSession.passengers.length;
    const toBoardCount = Math.min(availableSeats, stage.waitingPassengers.length);
    let faresCollected = 0;
    let tipsCollected = 0;

    const farePerHead = transitSystem.getFare(this.activeSession.routeId, currentHours);

    for (let i = 0; i < toBoardCount; i++) {
      const waiting = stage.waitingPassengers.shift();
      if (!waiting) break;

      const newPassenger: MatatuPassenger = {
        id: waiting.passengerId,
        isPlayer: false,
        originStageId: stage.id,
        destinationStageId: waiting.targetStageId,
        boardTime: performance.now(),
        farePaid: farePerHead
      };
      this.activeSession.passengers.push(newPassenger);
      faresCollected += farePerHead;

      // Commuter tips if satisfaction is high
      if (this.activeSession.telemetry.satisfactionScore >= 90) {
        tipsCollected += Math.floor(farePerHead * 0.2); // 20% tip
      } else if (this.activeSession.telemetry.satisfactionScore >= 75) {
        tipsCollected += Math.floor(farePerHead * 0.1); // 10% tip
      }
    }

    this.activeSession.telemetry.commutersBoardedCount += toBoardCount;
    this.activeSession.telemetry.stagesDockedCount++;
    this.activeSession.earnings.grossFaresKES += faresCollected;
    this.activeSession.earnings.tipsEarnedKES += tipsCollected;

    // Audio feedback: Conductor metal roof slap and tout callout
    AudioManager.getInstance().playConductorPanelSlap();
    const sacco = transitSystem.saccos.get(this.activeSession.saccoId);
    if (sacco && sacco.toutCallouts.length > 0) {
      const callout = sacco.toutCallouts[Math.floor(Math.random() * sacco.toutCallouts.length)];
      AudioManager.getInstance().playToutCallout(callout);
    }

    return {
      success: true,
      boarded: toBoardCount,
      alighted: alightedCount,
      faresKES: faresCollected,
      tipsKES: tipsCollected
    };
  }

  public departStage(): boolean {
    if (!this.activeSession || !this.activeSession.dockedAtStage) {
      return false;
    }

    const transitSystem = MatatuTransitSystem.getInstance();
    const route = transitSystem.routes.get(this.activeSession.routeId);
    if (!route || route.stageSequence.length === 0) return false;

    this.activeSession.doorOpen = false;
    this.activeSession.dockedAtStage = false;
    this.activeSession.status = 'DEPARTING';

    // Double horn & door close chime
    const sacco = transitSystem.saccos.get(this.activeSession.saccoId);
    AudioManager.getInstance().playSaccoHorn(sacco ? sacco.hornStyle : 'double_tap');
    AudioManager.getInstance().playMatatuDoorChime();

    // Advance to next stage in sequence
    const nextIdx = (this.activeSession.currentStageIndex + 1) % route.stageSequence.length;
    this.activeSession.currentStageIndex = nextIdx;
    const nextStageId = route.stageSequence[nextIdx];
    const nextStage = transitSystem.stages.get(nextStageId);

    if (nextStage) {
      this.activeSession.targetStageId = nextStage.id;
      this.activeSession.targetStageName = nextStage.name;
      this.activeSession.targetStagePosition = nextStage.position.clone();
      this.activeSession.targetCurbPosition = nextStage.curbPosition.clone();
    }

    return true;
  }

  // --- 4. TELEMETRY, SATISFACTION & DRIVING FEEDBACK ---
  public reportCollision(impactSpeed: number): void {
    if (!this.activeSession) return;
    this.activeSession.telemetry.collisionCount++;

    const penalty = Math.min(25, 6 + Math.round(impactSpeed * 0.4));
    this.activeSession.telemetry.satisfactionScore = Math.max(
      15,
      this.activeSession.telemetry.satisfactionScore - penalty
    );

    // Audio gasp from passengers
    AudioManager.getInstance().playPassengerGasp();
  }

  public reportSpeedViolation(): void {
    if (!this.activeSession) return;
    this.activeSession.telemetry.speedViolations++;
    this.activeSession.telemetry.satisfactionScore = Math.max(
      20,
      this.activeSession.telemetry.satisfactionScore - 3
    );
  }

  public reportSmoothCruising(fixedDt: number): void {
    if (!this.activeSession) return;
    // Slowly regenerate satisfaction for smooth driving
    if (this.activeSession.telemetry.satisfactionScore < 100) {
      this.activeSession.telemetry.satisfactionScore = Math.min(
        100,
        this.activeSession.telemetry.satisfactionScore + 0.5 * fixedDt
      );
    }
  }

  // --- 5. PER-FRAME UPDATE LOOP ---
  public update(
    fixedDt: number,
    vehiclePosition: THREE.Vector3,
    vehicleSpeedKph: number,
    handbrake: boolean,
    currentHours: number
  ): void {
    if (!this.activeSession) return;

    this.activeSession.elapsedSeconds += fixedDt;
    this.activeSession.handbrakeApplied = handbrake;

    const transitSystem = MatatuTransitSystem.getInstance();
    this.activeSession.isPeakRushHour = transitSystem.isRushHour(currentHours);
    this.activeSession.rushHourMultiplier = this.activeSession.isPeakRushHour ? 1.4 : 1.0;

    // Calculate distance to current target curb
    const distToTarget = vehiclePosition.distanceTo(this.activeSession.targetCurbPosition);
    this.activeSession.distanceToTargetCurbMeters = distToTarget;

    // Update telemetry distance
    if (vehicleSpeedKph > 1.0) {
      const metersDriven = (vehicleSpeedKph / 3.6) * fixedDt;
      this.activeSession.telemetry.distanceDrivenMeters += metersDriven;
    }

    // Evaluate state machine transitions
    if (!this.activeSession.dockedAtStage) {
      if (distToTarget <= 20.0 && distToTarget > 6.0) {
        this.activeSession.status = 'APPROACHING_STAGE';
      } else if (distToTarget <= 6.0 && vehicleSpeedKph <= 5.0) {
        this.activeSession.status = 'APPROACHING_STAGE';
      } else if (this.activeSession.status === 'DEPARTING' && distToTarget > 15.0) {
        this.activeSession.status = 'EN_ROUTE';
      }
    }

    // Driving quality checks
    if (vehicleSpeedKph > 80.0) {
      this.reportSpeedViolation();
    } else if (vehicleSpeedKph >= 15.0 && vehicleSpeedKph <= 60.0) {
      this.reportSmoothCruising(fixedDt);
    }
  }

  // --- 6. CONDUCTOR & OPERATOR INPUT ACTIONS ---
  public triggerMakangaCallout(): void {
    if (!this.activeSession) return;
    const transitSystem = MatatuTransitSystem.getInstance();
    const sacco = transitSystem.saccos.get(this.activeSession.saccoId);

    AudioManager.getInstance().playConductorPanelSlap();
    if (sacco && sacco.toutCallouts.length > 0) {
      const callout = sacco.toutCallouts[Math.floor(Math.random() * sacco.toutCallouts.length)];
      AudioManager.getInstance().playToutCallout(callout);
    }
  }

  public triggerSaccoHorn(): void {
    if (!this.activeSession) return;
    const transitSystem = MatatuTransitSystem.getInstance();
    const sacco = transitSystem.saccos.get(this.activeSession.saccoId);
    AudioManager.getInstance().playSaccoHorn(sacco ? sacco.hornStyle : 'double_tap');
  }

  // --- 7. END SHIFT & SETTLEMENT ---
  public endShift(playerState?: PlayerState): ShiftSummaryReport | undefined {
    if (!this.activeSession) return undefined;

    const transitSystem = MatatuTransitSystem.getInstance();
    const sacco = transitSystem.saccos.get(this.activeSession.saccoId);
    const saccoName = sacco ? sacco.name : 'Nairobi Sacco';

    const gross = this.activeSession.earnings.grossFaresKES;
    const tips = this.activeSession.earnings.tipsEarnedKES;
    const saccoFee = Math.round(gross * 0.15); // 15% Sacco operational management fee
    const fuelCost = Math.round((this.activeSession.telemetry.distanceDrivenMeters / 1000) * 45); // KES 45 / km diesel
    const netProfit = Math.max(0, gross + tips - saccoFee - fuelCost);

    // Reputation gain calculation
    const satisfactionBonus = Math.round((this.activeSession.telemetry.satisfactionScore / 100) * 20);
    const stagesBonus = this.activeSession.telemetry.stagesDockedCount * 10;
    const passengersBonus = this.activeSession.telemetry.commutersBoardedCount * 2;
    const repGained = Math.max(10, satisfactionBonus + stagesBonus + passengersBonus);

    // Update Sacco record
    const record = this.getSaccoRecord(this.activeSession.saccoId);
    const previousRank = record.rank;
    record.reputation += repGained;
    record.shiftsCompleted++;
    record.passengersTransported += this.activeSession.telemetry.commutersBoardedCount;
    record.totalEarningsKES += netProfit;
    record.averageSatisfaction = Math.round(
      (record.averageSatisfaction + this.activeSession.telemetry.satisfactionScore) / 2
    );
    record.rank = this.calculateRank(record.reputation);

    let unlockedNewTier = false;
    if (record.rank !== previousRank) {
      unlockedNewTier = true;
    }
    if (record.rank === 'MANYANGA_LEGEND' && !record.unlockedManyanga) {
      record.unlockedManyanga = true;
      this.unlockedUnderglow = true;
    }

    // Credit player wallet and overall reputation
    if (playerState) {
      playerState.addCash(netProfit);
      playerState.addReputation(Math.round(repGained / 2));
    }

    const summary: ShiftSummaryReport = {
      shiftId: this.activeSession.shiftId,
      saccoId: this.activeSession.saccoId,
      saccoName,
      routeCode: this.activeSession.routeCode,
      totalTimeMinutes: Math.round(this.activeSession.elapsedSeconds / 60),
      stagesCompleted: this.activeSession.telemetry.stagesDockedCount,
      passengersServed: this.activeSession.telemetry.commutersBoardedCount,
      finalSatisfaction: Math.round(this.activeSession.telemetry.satisfactionScore),
      grossFaresKES: gross,
      tipsEarnedKES: tips,
      saccoFeeKES: saccoFee,
      fuelCostKES: fuelCost,
      netProfitKES: netProfit,
      reputationGained: repGained,
      newRank: record.rank,
      unlockedNewTier
    };

    this.activeSession = undefined;
    return summary;
  }
}
