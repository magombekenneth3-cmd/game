import * as THREE from 'three';

export type TrafficIncidentType =
  | 'stalled_vehicle'
  | 'blocked_lane'
  | 'minor_collision'
  | 'temporary_obstruction';

export interface TrafficIncident {
  id: string;
  type: TrafficIncidentType;
  roadId: string;
  laneId?: string;
  position: THREE.Vector3;
  durationSeconds: number;
  elapsedSeconds: number;
}

export class TrafficIncidentManager {
  private incidents: Map<string, TrafficIncident> = new Map();

  public createIncident(
    id: string,
    type: TrafficIncidentType,
    roadId: string,
    position: THREE.Vector3,
    durationSeconds: number = 30.0,
    laneId?: string
  ): TrafficIncident {
    const incident: TrafficIncident = {
      id,
      type,
      roadId,
      laneId,
      position: position.clone(),
      durationSeconds,
      elapsedSeconds: 0
    };
    this.incidents.set(id, incident);
    return incident;
  }

  public update(dt: number): void {
    const toRemove: string[] = [];
    this.incidents.forEach((inc, id) => {
      inc.elapsedSeconds += dt;
      if (inc.elapsedSeconds >= inc.durationSeconds) {
        toRemove.push(id);
      }
    });
    toRemove.forEach((id) => this.incidents.delete(id));
  }

  public getIncidentsForRoad(roadId: string): TrafficIncident[] {
    const result: TrafficIncident[] = [];
    this.incidents.forEach((inc) => {
      if (inc.roadId === roadId) {
        result.push(inc);
      }
    });
    return result;
  }

  public isLaneBlocked(laneId: string): boolean {
    let blocked = false;
    this.incidents.forEach((inc) => {
      if (inc.laneId === laneId) blocked = true;
    });
    return blocked;
  }

  public getAllIncidents(): TrafficIncident[] {
    return Array.from(this.incidents.values());
  }

  public clear(): void {
    this.incidents.clear();
  }
}
