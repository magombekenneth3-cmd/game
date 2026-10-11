import * as THREE from 'three';

export type SaccoId =
  | 'super_metro'
  | 'city_hoppa'
  | 'ngong_126'
  | 'forward_sacco'
  | 'kbs_transit';

export interface MatatuSacco {
  id: SaccoId;
  name: string;
  slogan: string;
  fleetColorPrimary: number;   // hex color
  fleetColorSecondary: number; // hex color
  baseFare: number;           // KES off-peak
  peakMultiplier: number;     // e.g. 1.4 for rush hour
  headwayMinutes: number;     // dispatch interval
  toutCallouts: string[];     // Authentic conductor phrases
  hornStyle: 'double_tap' | 'musical' | 'standard';
}

export type MatatuDwellState =
  | 'EN_ROUTE'
  | 'APPROACHING_STAGE'
  | 'DWELLING_AT_STAGE'
  | 'BOARDING_ALIGHTING'
  | 'CALLING_PASSENGERS'
  | 'DEPARTING_STAGE';

export type TurnIndicatorState = 'OFF' | 'LEFT' | 'RIGHT' | 'HAZARDS';

export interface MatatuPassenger {
  id: string;
  isPlayer: boolean;
  originStageId: string;
  destinationStageId: string;
  boardTime: number;
  farePaid: number;
}

export interface MatatuStage {
  id: string;
  name: string;
  shortName: string;
  district: 'CBD' | 'Kilimani' | 'Upper Hill';
  position: THREE.Vector3;      // Central stage coordinate
  curbPosition: THREE.Vector3;  // Stopping point for vehicle bay
  shelterPosition: THREE.Vector3; // Sidewalk waiting area
  bayHeading: number;           // Orientation angle in radians
  capacity: number;             // Maximum commuters waiting
  waitingPassengers: Array<{
    passengerId: string;
    targetStageId: string;
    arrivedTime: number;
  }>;
}

export interface MatatuTransitRoute {
  id: string;
  code: string;               // e.g. 'ROUTE_105', 'ROUTE_111', 'ROUTE_46'
  name: string;               // e.g. 'Route 105 — Super Metro CBD Express'
  saccoId: SaccoId;
  stageSequence: string[];    // Array of MatatuStage IDs
  roadIds: string[];          // Associated RoadGraph edge IDs
  offPeakFare: number;        // KES (e.g. 50)
  peakFare: number;           // KES (e.g. 70 or 80)
  looping: boolean;
}

export interface MatatuVehicleState {
  vehicleId: string;
  saccoId: SaccoId;
  routeId: string;
  dwellState: MatatuDwellState;
  indicatorState: TurnIndicatorState;
  currentStageIndex: number;
  currentStageId?: string;
  dwellTimerSeconds: number;
  maxDwellSeconds: number;
  passengers: MatatuPassenger[];
  maxSeats: number;           // Usually 14 for commuter minibus
  doorOpen: boolean;
  hazardsActive: boolean;
  hornActive: boolean;
}

export interface MatatuPassengerRideState {
  vehicleId: string;
  routeId: string;
  routeName: string;
  saccoName: string;
  boardingStageId: string;
  currentStageId?: string;
  nextStageName: string;
  farePaid: number;
  rideDurationSeconds: number;
}

export interface MatatuTransitTelemetryStats {
  activeMatatuCount: number;
  totalPassengersBoarded: number;
  totalFaresCollectedKES: number;
  stagesCount: number;
  totalWaitingPassengers: number;
  averageDwellTimeSeconds: number;
  currentPeakMultiplier: number;
  isPeakRushHour: boolean;
}
