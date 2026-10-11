import * as THREE from 'three';
import { SaccoId, MatatuPassenger } from './MatatuTransitTypes';

export type SaccoRank =
  | 'SQUADDI'          // Level 1: Novice driver (Rep 0 - 99)
  | 'SENIOR_DERE'      // Level 2: Experienced city driver (Rep 100 - 249)
  | 'METRO_CAPTAIN'    // Level 3: Route leader (Rep 250 - 499)
  | 'MANYANGA_LEGEND'; // Level 4: Master driver (Rep 500+)

export type MatatuShiftStatus =
  | 'INACTIVE'
  | 'EN_ROUTE'
  | 'APPROACHING_STAGE'
  | 'DOCKED_BOARDING'
  | 'CALLING_PASSENGERS'
  | 'DEPARTING'
  | 'COMPLETED';

export interface SaccoReputationRecord {
  saccoId: SaccoId;
  reputation: number;
  rank: SaccoRank;
  shiftsCompleted: number;
  passengersTransported: number;
  totalEarningsKES: number;
  averageSatisfaction: number;
  unlockedManyanga: boolean;
}

export interface ShiftEarnings {
  grossFaresKES: number;
  tipsEarnedKES: number;
  fuelCostKES: number;
  saccoFeeKES: number;
  netPayoutKES: number;
}

export interface ShiftTelemetry {
  distanceDrivenMeters: number;
  collisionCount: number;
  speedViolations: number;
  satisfactionScore: number; // 0 - 100%
  stagesDockedCount: number;
  commutersBoardedCount: number;
  commutersAlightedCount: number;
}

export interface MatatuShiftSession {
  shiftId: string;
  vehicleId: string;
  saccoId: SaccoId;
  routeId: string;
  routeName: string;
  routeCode: string;
  status: MatatuShiftStatus;
  currentStageIndex: number;
  targetStageId: string;
  targetStageName: string;
  targetStagePosition: THREE.Vector3;
  targetCurbPosition: THREE.Vector3;
  passengers: MatatuPassenger[];
  maxSeats: number;
  doorOpen: boolean;
  handbrakeApplied: boolean;
  dockedAtStage: boolean;
  distanceToTargetCurbMeters: number;
  elapsedSeconds: number;
  scheduledMinutesRemaining: number;
  earnings: ShiftEarnings;
  telemetry: ShiftTelemetry;
  isPeakRushHour: boolean;
  rushHourMultiplier: number;
}

export interface ShiftSummaryReport {
  shiftId: string;
  saccoId: SaccoId;
  saccoName: string;
  routeCode: string;
  totalTimeMinutes: number;
  stagesCompleted: number;
  passengersServed: number;
  finalSatisfaction: number;
  grossFaresKES: number;
  tipsEarnedKES: number;
  saccoFeeKES: number;
  fuelCostKES: number;
  netProfitKES: number;
  reputationGained: number;
  newRank: SaccoRank;
  unlockedNewTier: boolean;
}
