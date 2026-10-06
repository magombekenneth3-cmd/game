import * as THREE from 'three';
import { VehicleManager } from '../vehicles/VehicleManager';
import { Vehicle } from '../vehicles/Vehicle';
import { RoadGraph } from '../world/RoadGraph';
import { LaneSystem } from './LaneSystem';
import { IntersectionController } from './IntersectionController';
import { TrafficIncidentManager } from './TrafficIncident';
import { ParkingSystem } from './ParkingSystem';
import { TrafficTelemetry, TrafficTelemetryStats } from './TrafficTelemetry';
import { TrafficController } from './TrafficController';
import { TrafficSpawner } from './TrafficSpawner';
import { TrafficDensity } from './TrafficDensity';
import { TrafficLODManager } from './TrafficLOD';
import { TransitRoute } from './TrafficTypes';

export class TrafficManager {
  public laneSystem: LaneSystem;
  public intersectionController: IntersectionController;
  public incidentManager: TrafficIncidentManager;
  public parkingSystem: ParkingSystem;
  public telemetry: TrafficTelemetry;

  private controllers: TrafficController[] = [];
  private transitRoutes: TransitRoute[] = [];
  private congestionMap: Map<string, number> = new Map();
  private vehicleManager: VehicleManager;
  private roadGraph: RoadGraph;

  private pathfindingQueriesCount: number = 0;

  constructor(vehicleManager: VehicleManager, roadGraph: RoadGraph) {
    this.vehicleManager = vehicleManager;
    this.roadGraph = roadGraph;

    this.laneSystem = new LaneSystem();
    this.intersectionController = new IntersectionController();
    this.incidentManager = new TrafficIncidentManager();
    this.parkingSystem = new ParkingSystem();
    this.telemetry = new TrafficTelemetry();
  }

  public init(trafficSeed: number = 1337): void {
    // 1. Build Lanes from RoadGraph
    this.laneSystem.buildLanesFromRoadGraph(this.roadGraph);

    // 2. Build Intersections from RoadGraph & Lanes
    this.intersectionController.buildIntersectionsFromRoadGraph(this.roadGraph, this.laneSystem);

    // 3. Spawn Deterministic Traffic Fleet & Transit Routes
    const { controllers, transitRoutes } = TrafficSpawner.spawnDeterministicTrafficFleet(
      trafficSeed,
      this.vehicleManager,
      this.laneSystem,
      this.roadGraph
    );

    this.controllers = controllers;
    this.transitRoutes = transitRoutes;
  }

  public update(
    fixedDt: number,
    hours: number,
    playerPos: THREE.Vector3,
    playerVehicle?: Vehicle,
    pedestrianPositions: THREE.Vector3[] = [],
    environmentMeshes: THREE.Object3D[] = []
  ): void {
    // 1. Update Intersections & Signals
    this.intersectionController.update(fixedDt);

    // 2. Update Incidents
    this.incidentManager.update(fixedDt);

    // 3. Calculate Time-of-Day Density Factor
    const densityFactor = TrafficDensity.getDensityFactorForTime(hours);

    // 4. Update Congestion Map per Road Edge
    this.updateCongestionMap();

    // 5. Update Traffic AI Drivers with Simulation LOD
    const surroundingVehicles = this.vehicleManager.getAllVehicles();
    let totalSpeedSum = 0;
    let activeSpeedCount = 0;
    let detailedCount = 0;
    let abstractCount = 0;
    let waitingSignalCount = 0;
    let activeTransitCount = 0;

    const activeLimit = Math.ceil(this.controllers.length * densityFactor);

    this.controllers.forEach((ctrl, idx) => {
      const isPlayerVeh = playerVehicle && ctrl.vehicle.definition.id === playerVehicle.definition.id;
      const lodTier = TrafficLODManager.evaluateTier(ctrl.vehicle.state.position, playerPos, !!isPlayerVeh);

      if (idx < activeLimit && (lodTier === 'TIER0_FULL' || lodTier === 'TIER1_REDUCED' || isPlayerVeh)) {
        detailedCount++;

        ctrl.update(
          fixedDt,
          this.laneSystem,
          this.intersectionController,
          surroundingVehicles,
          playerPos,
          playerVehicle,
          pedestrianPositions,
          environmentMeshes
        );

        totalSpeedSum += ctrl.vehicle.state.currentSpeedKph;
        activeSpeedCount++;

        if (ctrl.aiState === 'WAITING_SIGNAL') waitingSignalCount++;
        if (ctrl.transitRoute) activeTransitCount++;
      } else {
        abstractCount++;
        // Abstract simulation: update basic vehicle state metrics without heavy raycasting
        if (ctrl.vehicle.state.modeState === 'DRIVING') {
          ctrl.vehicle.state.currentSpeedKph = ctrl.vehicle.definition.maxSpeed * 0.5 * densityFactor;
        }
      }
    });

    // 6. Update Telemetry
    const avgSpeed = activeSpeedCount > 0 ? parseFloat((totalSpeedSum / activeSpeedCount).toFixed(1)) : 0;
    let congestedRoadsCount = 0;
    this.congestionMap.forEach((val) => {
      if (val > 0.6) congestedRoadsCount++;
    });

    this.telemetry.update({
      totalTrafficVehicles: this.controllers.length,
      activeTrafficVehicles: activeLimit,
      detailedVehicles: detailedCount,
      abstractVehicles: abstractCount,
      averageTrafficSpeedKph: avgSpeed,
      congestedRoadsCount,
      activeIntersectionsCount: this.intersectionController.getAllIntersections().length,
      vehiclesWaitingAtSignalsCount: waitingSignalCount,
      activeTransitVehiclesCount: activeTransitCount,
      trafficIncidentsCount: this.incidentManager.getAllIncidents().length,
      pathfindingQueriesCount: this.pathfindingQueriesCount
    });
  }

  private updateCongestionMap(): void {
    this.congestionMap.clear();

    const roadCounts: Map<string, number> = new Map();
    this.controllers.forEach((ctrl) => {
      if (ctrl.driver.currentRoadId) {
        const current = roadCounts.get(ctrl.driver.currentRoadId) || 0;
        roadCounts.set(ctrl.driver.currentRoadId, current + 1);
      }
    });

    this.roadGraph.edges.forEach((edge) => {
      const count = roadCounts.get(edge.id) || 0;
      const capacity = (edge.lanes || 2) * 5; // e.g. 5 vehicles per lane capacity
      const congestion = Math.min(1.0, count / capacity);
      this.congestionMap.set(edge.id, parseFloat(congestion.toFixed(2)));
    });
  }

  public getCongestionForRoad(roadId: string): number {
    return this.congestionMap.get(roadId) || 0;
  }

  public getControllers(): TrafficController[] {
    return this.controllers;
  }

  public getTransitRoutes(): TransitRoute[] {
    return this.transitRoutes;
  }

  public getTelemetryStats(): TrafficTelemetryStats {
    return this.telemetry.getStats();
  }

  public clear(): void {
    this.controllers = [];
    this.transitRoutes = [];
    this.laneSystem.clear();
    this.intersectionController.clear();
    this.incidentManager.clear();
    this.parkingSystem.clear();
  }
}
