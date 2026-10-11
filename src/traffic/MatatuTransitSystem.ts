import * as THREE from 'three';
import {
  MatatuSacco,
  MatatuStage,
  MatatuTransitRoute,
  MatatuVehicleState,
  MatatuPassenger,
  MatatuPassengerRideState,
  MatatuTransitTelemetryStats,
  SaccoId
} from './MatatuTransitTypes';
import { PlayerState } from '../player/PlayerState';
import { AudioManager } from '../audio/AudioManager';

export class MatatuTransitSystem {
  private static instance?: MatatuTransitSystem;

  public saccos: Map<SaccoId, MatatuSacco> = new Map();
  public stages: Map<string, MatatuStage> = new Map();
  public routes: Map<string, MatatuTransitRoute> = new Map();
  public activeMatatus: Map<string, MatatuVehicleState> = new Map();

  // Player passenger ride state
  private playerRide?: MatatuPassengerRideState;

  // Telemetry accumulation
  private totalPassengersBoarded: number = 0;
  private totalFaresCollectedKES: number = 0;
  private completedTripsCount: number = 0;
  private passengerSpawnTimer: number = 0;

  constructor() {
    this.initDefaultSaccos();
    this.initDefaultStages();
    this.initDefaultRoutes();
  }

  public static getInstance(): MatatuTransitSystem {
    if (!MatatuTransitSystem.instance) {
      MatatuTransitSystem.instance = new MatatuTransitSystem();
    }
    return MatatuTransitSystem.instance;
  }

  public static resetInstance(): void {
    MatatuTransitSystem.instance = undefined;
  }

  // --- 1. SACCO INITIALIZATION ---
  private initDefaultSaccos(): void {
    const saccosList: MatatuSacco[] = [
      {
        id: 'super_metro',
        name: 'Super Metro Sacco',
        slogan: 'The Pride of Commuters',
        fleetColorPrimary: 0x0f2042, // Navy Blue
        fleetColorSecondary: 0xfacc15, // Golden Yellow
        baseFare: 50,
        peakMultiplier: 1.4, // 70 KES peak
        headwayMinutes: 3,
        toutCallouts: ['Tao Tao Tao!', 'Kencom direct!', 'Super Metro 50 bob!', 'Beba beba haraka!'],
        hornStyle: 'double_tap'
      },
      {
        id: 'city_hoppa',
        name: 'City Hoppa Transit',
        slogan: 'Clean & Orderly City Transit',
        fleetColorPrimary: 0x15803d, // Forest Green
        fleetColorSecondary: 0xeab308, // Gold
        baseFare: 50,
        peakMultiplier: 1.4,
        headwayMinutes: 4,
        toutCallouts: ['Tao City Hall!', 'Yaya Hurlingham!', 'Hoppa stage iko wazi!'],
        hornStyle: 'standard'
      },
      {
        id: 'ngong_126',
        name: 'Ngong 126 Electric Express',
        slogan: 'Fast Track Art Beast',
        fleetColorPrimary: 0x7e22ce, // Purple
        fleetColorSecondary: 0xec4899, // Hot Pink
        baseFare: 60,
        peakMultiplier: 1.33, // 80 KES peak
        headwayMinutes: 5,
        toutCallouts: ['Ngong Express Tao!', 'Hapa ni fly-over!', 'Ngong 126 direct!'],
        hornStyle: 'musical'
      },
      {
        id: 'forward_sacco',
        name: 'Forward Sacco Transit',
        slogan: 'Swift Forward Movement',
        fleetColorPrimary: 0xb91c1c, // Crimson
        fleetColorSecondary: 0xffffff, // White
        baseFare: 50,
        peakMultiplier: 1.4,
        headwayMinutes: 4,
        toutCallouts: ['Ambassador direct!', 'Tao 50!', 'Ingia twende!'],
        hornStyle: 'double_tap'
      },
      {
        id: 'kbs_transit',
        name: 'Kenya Bus Service (KBS)',
        slogan: 'Heritage Metro Bus',
        fleetColorPrimary: 0x1d4ed8, // Royal Blue
        fleetColorSecondary: 0xfef08a, // Pale Cream
        baseFare: 50,
        peakMultiplier: 1.3,
        headwayMinutes: 6,
        toutCallouts: ['GPO Railways!', 'Stage ya mwisho!', 'Tikiti mkononi!'],
        hornStyle: 'standard'
      }
    ];

    saccosList.forEach((s) => this.saccos.set(s.id, s));
  }

  // --- 2. TRANSIT STAGES INITIALIZATION ---
  private initDefaultStages(): void {
    const stagesList: MatatuStage[] = [
      {
        id: 'stage_kencom',
        name: 'Kencom / Ambassador Stage',
        shortName: 'Kencom',
        district: 'CBD',
        position: new THREE.Vector3(18.0, 0.2, 72.0),
        curbPosition: new THREE.Vector3(7.2, 0.25, 72.0),
        shelterPosition: new THREE.Vector3(14.5, 0.2, 72.0),
        bayHeading: 0,
        capacity: 35,
        waitingPassengers: [
          { passengerId: 'commuter_kc_1', targetStageId: 'stage_gpo', arrivedTime: 0 },
          { passengerId: 'commuter_kc_2', targetStageId: 'stage_railways', arrivedTime: 0 },
          { passengerId: 'commuter_kc_3', targetStageId: 'stage_hurlingham', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_gpo',
        name: 'GPO / Teleposta Stage',
        shortName: 'GPO',
        district: 'CBD',
        position: new THREE.Vector3(-14.0, 0.2, 26.0),
        curbPosition: new THREE.Vector3(-5.5, 0.25, 26.0),
        shelterPosition: new THREE.Vector3(-11.5, 0.2, 26.0),
        bayHeading: Math.PI,
        capacity: 30,
        waitingPassengers: [
          { passengerId: 'commuter_gpo_1', targetStageId: 'stage_kencom', arrivedTime: 0 },
          { passengerId: 'commuter_gpo_2', targetStageId: 'stage_yaya', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_railways',
        name: 'Railways Bus Terminus',
        shortName: 'Railways',
        district: 'CBD',
        position: new THREE.Vector3(0.0, 0.2, -45.0),
        curbPosition: new THREE.Vector3(-5.0, 0.25, -45.0),
        shelterPosition: new THREE.Vector3(-10.0, 0.2, -45.0),
        bayHeading: 0,
        capacity: 45,
        waitingPassengers: [
          { passengerId: 'commuter_rw_1', targetStageId: 'stage_hurlingham', arrivedTime: 0 },
          { passengerId: 'commuter_rw_2', targetStageId: 'stage_valley_arcade', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_city_hall',
        name: 'City Hall / Wabera Stage',
        shortName: 'City Hall',
        district: 'CBD',
        position: new THREE.Vector3(-8.0, 0.2, 10.0),
        curbPosition: new THREE.Vector3(-5.5, 0.25, 10.0),
        shelterPosition: new THREE.Vector3(-10.5, 0.2, 10.0),
        bayHeading: Math.PI,
        capacity: 25,
        waitingPassengers: [
          { passengerId: 'commuter_ch_1', targetStageId: 'stage_kencom', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_hurlingham',
        name: 'Hurlingham Plaza Stage',
        shortName: 'Hurlingham',
        district: 'Kilimani',
        position: new THREE.Vector3(50.0, 0.2, -30.0),
        curbPosition: new THREE.Vector3(45.0, 0.25, -30.0),
        shelterPosition: new THREE.Vector3(48.5, 0.2, -30.0),
        bayHeading: -Math.PI / 2,
        capacity: 25,
        waitingPassengers: [
          { passengerId: 'commuter_hl_1', targetStageId: 'stage_yaya', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_yaya',
        name: 'Yaya Transit Hub',
        shortName: 'Yaya Centre',
        district: 'Kilimani',
        position: new THREE.Vector3(-20.0, 0.2, -40.0),
        curbPosition: new THREE.Vector3(-24.0, 0.25, -40.0),
        shelterPosition: new THREE.Vector3(-28.0, 0.2, -40.0),
        bayHeading: Math.PI / 2,
        capacity: 35,
        waitingPassengers: [
          { passengerId: 'commuter_yy_1', targetStageId: 'stage_kencom', arrivedTime: 0 },
          { passengerId: 'commuter_yy_2', targetStageId: 'stage_gpo', arrivedTime: 0 }
        ]
      },
      {
        id: 'stage_valley_arcade',
        name: 'Valley Arcade Stage',
        shortName: 'Valley Arcade',
        district: 'Kilimani',
        position: new THREE.Vector3(-100.0, 0.2, -75.0),
        curbPosition: new THREE.Vector3(-95.0, 0.25, -75.0),
        shelterPosition: new THREE.Vector3(-98.5, 0.2, -75.0),
        bayHeading: Math.PI,
        capacity: 20,
        waitingPassengers: [
          { passengerId: 'commuter_va_1', targetStageId: 'stage_railways', arrivedTime: 0 }
        ]
      }
    ];

    stagesList.forEach((stg) => this.stages.set(stg.id, stg));
  }

  // --- 3. TRANSIT ROUTES INITIALIZATION ---
  private initDefaultRoutes(): void {
    const routesList: MatatuTransitRoute[] = [
      {
        id: 'route_105_supermetro',
        code: 'ROUTE_105',
        name: 'Route 105 — Super Metro CBD Express',
        saccoId: 'super_metro',
        stageSequence: ['stage_kencom', 'stage_city_hall', 'stage_gpo', 'stage_railways'],
        roadIds: ['way_kenyatta_ave', 'way_valley_road'],
        offPeakFare: 50,
        peakFare: 70,
        looping: true
      },
      {
        id: 'route_111_ngong',
        code: 'ROUTE_111',
        name: 'Route 111 — Ngong Road Express',
        saccoId: 'ngong_126',
        stageSequence: ['stage_railways', 'stage_gpo', 'stage_hurlingham', 'stage_yaya', 'stage_valley_arcade'],
        roadIds: ['way_ngong_road', 'way_argwings_kodhek'],
        offPeakFare: 60,
        peakFare: 80,
        looping: true
      },
      {
        id: 'route_46_cityhoppa',
        code: 'ROUTE_46',
        name: 'Route 46 — City Hoppa Kilimani Shuttle',
        saccoId: 'city_hoppa',
        stageSequence: ['stage_kencom', 'stage_gpo', 'stage_hurlingham', 'stage_yaya'],
        roadIds: ['way_argwings_kodhek', 'way_ralph_bunche'],
        offPeakFare: 50,
        peakFare: 70,
        looping: true
      }
    ];

    routesList.forEach((r) => this.routes.set(r.id, r));
  }

  // --- 4. FARE & RUSH HOUR PRICING LOGIC ---
  public isRushHour(hours: number): boolean {
    const norm = ((hours % 24) + 24) % 24;
    // Morning rush: 7:00 - 9:30 AM | Evening rush: 16:30 - 19:30 PM
    return (norm >= 7.0 && norm <= 9.5) || (norm >= 16.5 && norm <= 19.5);
  }

  public getFare(routeId: string, currentHours: number): number {
    const route = this.routes.get(routeId);
    if (!route) return 50;
    return this.isRushHour(currentHours) ? route.peakFare : route.offPeakFare;
  }

  // --- 5. VEHICLE REGISTRATION & STATE ---
  public registerMatatuVehicle(
    vehicleId: string,
    saccoId: SaccoId,
    routeId: string
  ): MatatuVehicleState {
    const existing = this.activeMatatus.get(vehicleId);
    if (existing) return existing;

    const state: MatatuVehicleState = {
      vehicleId,
      saccoId,
      routeId,
      dwellState: 'EN_ROUTE',
      indicatorState: 'OFF',
      currentStageIndex: 0,
      dwellTimerSeconds: 0,
      maxDwellSeconds: 6.0,
      passengers: [],
      maxSeats: 14,
      doorOpen: false,
      hazardsActive: false,
      hornActive: false
    };

    this.activeMatatus.set(vehicleId, state);
    return state;
  }

  public getMatatuState(vehicleId: string): MatatuVehicleState | undefined {
    return this.activeMatatus.get(vehicleId);
  }

  // --- 6. SIMULATION UPDATE ---
  public update(fixedDt: number, currentHours: number): void {
    // 1. Natural replenishment of commuters at stages over time
    this.passengerSpawnTimer += fixedDt;
    if (this.passengerSpawnTimer >= 12.0) {
      this.passengerSpawnTimer = 0;
      this.spawnWaitingCommuters();
    }

    // 2. Update active matatus state machines
    this.activeMatatus.forEach((matatu) => {
      this.updateMatatuStateMachine(matatu, fixedDt, currentHours);
    });

    // 3. Track player ride progression if player is passenger
    if (this.playerRide) {
      this.playerRide.rideDurationSeconds += fixedDt;
      const matatu = this.activeMatatus.get(this.playerRide.vehicleId);
      if (matatu) {
        const route = this.routes.get(matatu.routeId);
        if (route && route.stageSequence.length > 0) {
          const nextIdx = (matatu.currentStageIndex + 1) % route.stageSequence.length;
          const nextStage = this.stages.get(route.stageSequence[nextIdx]);
          if (nextStage) {
            this.playerRide.nextStageName = nextStage.name;
          }
        }
      }
    }
  }

  private updateMatatuStateMachine(
    matatu: MatatuVehicleState,
    fixedDt: number,
    currentHours: number
  ): void {
    const route = this.routes.get(matatu.routeId);
    if (!route || route.stageSequence.length === 0) return;

    const stageId = route.stageSequence[matatu.currentStageIndex];
    const stage = this.stages.get(stageId);
    matatu.currentStageId = stageId;

    switch (matatu.dwellState) {
      case 'EN_ROUTE':
        matatu.doorOpen = false;
        matatu.hazardsActive = false;
        matatu.indicatorState = 'OFF';
        break;

      case 'APPROACHING_STAGE':
        matatu.indicatorState = 'LEFT';
        matatu.doorOpen = false;
        break;

      case 'DWELLING_AT_STAGE':
      case 'BOARDING_ALIGHTING':
      case 'CALLING_PASSENGERS':
        matatu.dwellTimerSeconds += fixedDt;
        matatu.hazardsActive = true;
        matatu.doorOpen = true;
        matatu.indicatorState = 'HAZARDS';

        // Exchange passengers halfway through dwell
        if (matatu.dwellState === 'DWELLING_AT_STAGE' && matatu.dwellTimerSeconds >= 1.0) {
          matatu.dwellState = 'BOARDING_ALIGHTING';
          if (stage) {
            this.exchangePassengers(matatu, stage, currentHours);
          }
        }

        // Call passengers / tout vocal cue
        if (matatu.dwellState === 'BOARDING_ALIGHTING' && matatu.dwellTimerSeconds >= 3.0) {
          matatu.dwellState = 'CALLING_PASSENGERS';
          const sacco = this.saccos.get(matatu.saccoId);
          if (sacco && sacco.toutCallouts.length > 0) {
            const callout = sacco.toutCallouts[Math.floor(Math.random() * sacco.toutCallouts.length)];
            AudioManager.getInstance().playToutCallout(callout);
          }
        }

        // Finish dwell timer
        if (matatu.dwellTimerSeconds >= matatu.maxDwellSeconds) {
          matatu.dwellState = 'DEPARTING_STAGE';
          matatu.dwellTimerSeconds = 0;
          matatu.doorOpen = false;
          matatu.hazardsActive = false;
          matatu.indicatorState = 'RIGHT';

          // Double horn tap on departure
          AudioManager.getInstance().playMatatuDoubleHorn();
          AudioManager.getInstance().playMatatuDoorChime();
        }
        break;

      case 'DEPARTING_STAGE':
        matatu.dwellTimerSeconds += fixedDt;
        matatu.indicatorState = 'RIGHT';
        if (matatu.dwellTimerSeconds >= 2.5) {
          matatu.dwellState = 'EN_ROUTE';
          matatu.dwellTimerSeconds = 0;
          matatu.indicatorState = 'OFF';
          // Advance to next stage in route
          matatu.currentStageIndex = (matatu.currentStageIndex + 1) % route.stageSequence.length;
          this.completedTripsCount++;
        }
        break;
    }
  }

  // --- 7. PASSENGER EXCHANGE & BOARDING ---
  private exchangePassengers(
    matatu: MatatuVehicleState,
    stage: MatatuStage,
    currentHours: number
  ): void {
    const route = this.routes.get(matatu.routeId);
    if (!route) return;

    const fare = this.getFare(route.id, currentHours);

    // 1. Alight passengers whose destination is this stage
    const stayingPassengers: MatatuPassenger[] = [];
    for (const p of matatu.passengers) {
      if (p.destinationStageId === stage.id) {
        // Alight passenger
        this.totalPassengersBoarded++;
        this.totalFaresCollectedKES += p.farePaid;
      } else {
        stayingPassengers.push(p);
      }
    }
    matatu.passengers = stayingPassengers;

    // 2. Board waiting commuters up to capacity
    const availableSeats = matatu.maxSeats - matatu.passengers.length;
    if (availableSeats > 0 && stage.waitingPassengers.length > 0) {
      const boardCount = Math.min(availableSeats, stage.waitingPassengers.length);
      for (let i = 0; i < boardCount; i++) {
        const waiting = stage.waitingPassengers.shift();
        if (waiting) {
          matatu.passengers.push({
            id: waiting.passengerId,
            isPlayer: false,
            originStageId: stage.id,
            destinationStageId: waiting.targetStageId,
            boardTime: performance.now(),
            farePaid: fare
          });
          this.totalPassengersBoarded++;
          this.totalFaresCollectedKES += fare;
        }
      }
    }
  }

  private spawnWaitingCommuters(): void {
    const stageIds = Array.from(this.stages.keys());
    this.stages.forEach((stage) => {
      if (stage.waitingPassengers.length < stage.capacity) {
        const otherStages = stageIds.filter((id) => id !== stage.id);
        if (otherStages.length > 0) {
          const dest = otherStages[Math.floor(Math.random() * otherStages.length)];
          stage.waitingPassengers.push({
            passengerId: `commuter_${stage.id}_${Date.now()}_${Math.floor(Math.random() * 100)}`,
            targetStageId: dest,
            arrivedTime: performance.now()
          });
        }
      }
    });
  }

  // --- 8. PLAYER PASSENGER RIDE SYSTEM ---
  public canPlayerBoard(
    vehicleId: string,
    _playerPos: THREE.Vector3,
    playerCash: number,
    _maxRadiusMeters: number = 4.5
  ): {
    allowed: boolean;
    reason?: string;
    fare: number;
    route?: MatatuTransitRoute;
    stage?: MatatuStage;
    sacco?: MatatuSacco;
  } {
    const matatu = this.activeMatatus.get(vehicleId);
    if (!matatu) {
      return { allowed: false, reason: 'Vehicle not registered on public transit network', fare: 0 };
    }

    const route = this.routes.get(matatu.routeId);
    const sacco = this.saccos.get(matatu.saccoId);
    const stage = matatu.currentStageId ? this.stages.get(matatu.currentStageId) : undefined;
    const fare = route ? route.offPeakFare : 50;

    // Check dwell state — must be dwelling or calling passengers
    const isDwelling =
      matatu.dwellState === 'DWELLING_AT_STAGE' ||
      matatu.dwellState === 'BOARDING_ALIGHTING' ||
      matatu.dwellState === 'CALLING_PASSENGERS';

    if (!isDwelling) {
      return { allowed: false, reason: 'Matatu is not stopped at a stage', fare, route, stage, sacco };
    }

    // Check capacity
    if (matatu.passengers.length >= matatu.maxSeats) {
      return { allowed: false, reason: 'Matatu is at full capacity (14 seats occupied)', fare, route, stage, sacco };
    }

    // Check cash
    if (playerCash < fare) {
      return { allowed: false, reason: `Insufficient cash (Requires KES ${fare})`, fare, route, stage, sacco };
    }

    return { allowed: true, fare, route, stage, sacco };
  }

  public boardPlayer(
    vehicleId: string,
    playerState: PlayerState,
    currentHours: number = 12.0
  ): boolean {
    const matatu = this.activeMatatus.get(vehicleId);
    if (!matatu) return false;

    const route = this.routes.get(matatu.routeId);
    if (!route) return false;

    const sacco = this.saccos.get(matatu.saccoId);
    const fare = this.getFare(route.id, currentHours);

    // Deduct fare
    const deducted = playerState.deductCash(fare);
    if (!deducted) return false;

    // Audio effects: coin chime, door chime, radio music
    AudioManager.getInstance().playCoin();
    AudioManager.getInstance().playMatatuDoorChime();
    AudioManager.getInstance().setMatatuRadio(true);

    // Add player to passengers list
    const playerPassenger: MatatuPassenger = {
      id: 'player_protagonist',
      isPlayer: true,
      originStageId: matatu.currentStageId || 'stage_kencom',
      destinationStageId: route.stageSequence[(matatu.currentStageIndex + 2) % route.stageSequence.length],
      boardTime: performance.now(),
      farePaid: fare
    };
    matatu.passengers.push(playerPassenger);

    // Set player ride state
    const nextIdx = (matatu.currentStageIndex + 1) % route.stageSequence.length;
    const nextStage = this.stages.get(route.stageSequence[nextIdx]);

    this.playerRide = {
      vehicleId,
      routeId: route.id,
      routeName: route.name,
      saccoName: sacco ? sacco.name : 'Nairobi Matatu',
      boardingStageId: playerPassenger.originStageId,
      currentStageId: matatu.currentStageId,
      nextStageName: nextStage ? nextStage.name : 'Next Stage',
      farePaid: fare,
      rideDurationSeconds: 0
    };

    playerState.setMode('RIDING_AS_PASSENGER');
    this.totalPassengersBoarded++;
    this.totalFaresCollectedKES += fare;

    return true;
  }

  public alightPlayer(
    playerState: PlayerState,
    vehiclePos?: THREE.Vector3,
    vehicleRotationY: number = 0
  ): THREE.Vector3 {
    if (this.playerRide) {
      const matatu = this.activeMatatus.get(this.playerRide.vehicleId);
      if (matatu) {
        matatu.passengers = matatu.passengers.filter((p) => !p.isPlayer);
      }
      this.playerRide = undefined;
    }

    // Stop matatu radio
    AudioManager.getInstance().setMatatuRadio(false);
    AudioManager.getInstance().playMatatuDoorChime();

    playerState.setMode('IDLE');

    // Calculate safe sidewalk exit coordinate (to the left/passenger side of vehicle)
    if (vehiclePos) {
      const sidewalkOffset = new THREE.Vector3(2.2, 0.1, 0.5);
      sidewalkOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), vehicleRotationY);
      return vehiclePos.clone().add(sidewalkOffset);
    }

    return new THREE.Vector3(0, 0.5, 15);
  }

  public isPlayerRiding(): boolean {
    return !!this.playerRide;
  }

  public getCurrentPlayerRide(): MatatuPassengerRideState | undefined {
    return this.playerRide;
  }

  // --- 9. TELEMETRY & STATS ---
  public getTelemetry(currentHours: number = 12.0): MatatuTransitTelemetryStats {
    let waitingTotal = 0;
    this.stages.forEach((stg) => {
      waitingTotal += stg.waitingPassengers.length;
    });

    const isPeak = this.isRushHour(currentHours);

    return {
      activeMatatuCount: this.activeMatatus.size,
      totalPassengersBoarded: this.totalPassengersBoarded,
      totalFaresCollectedKES: this.totalFaresCollectedKES,
      stagesCount: this.stages.size,
      totalWaitingPassengers: waitingTotal,
      averageDwellTimeSeconds: 6.0,
      currentPeakMultiplier: isPeak ? 1.4 : 1.0,
      isPeakRushHour: isPeak
    };
  }
}
