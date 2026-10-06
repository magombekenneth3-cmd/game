export interface TrafficTelemetryStats {
  totalTrafficVehicles: number;
  activeTrafficVehicles: number;
  detailedVehicles: number;
  abstractVehicles: number;
  averageTrafficSpeedKph: number;
  congestedRoadsCount: number;
  activeIntersectionsCount: number;
  vehiclesWaitingAtSignalsCount: number;
  activeTransitVehiclesCount: number;
  trafficIncidentsCount: number;
  pathfindingQueriesCount: number;
}

export class TrafficTelemetry {
  private stats: TrafficTelemetryStats = {
    totalTrafficVehicles: 0,
    activeTrafficVehicles: 0,
    detailedVehicles: 0,
    abstractVehicles: 0,
    averageTrafficSpeedKph: 0,
    congestedRoadsCount: 0,
    activeIntersectionsCount: 0,
    vehiclesWaitingAtSignalsCount: 0,
    activeTransitVehiclesCount: 0,
    trafficIncidentsCount: 0,
    pathfindingQueriesCount: 0
  };

  public update(newStats: Partial<TrafficTelemetryStats>): void {
    this.stats = { ...this.stats, ...newStats };
  }

  public getStats(): TrafficTelemetryStats {
    return { ...this.stats };
  }
}
