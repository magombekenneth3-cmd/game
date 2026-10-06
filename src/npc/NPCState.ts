import * as THREE from 'three';
import { NPCData, NPCActivityType, NPCSimulationTier, ActivityDestination } from './NPCTypes';

export class NPCState {
  public data: NPCData;
  public currentPosition: THREE.Vector3;
  public currentActivity: NPCActivityType = 'HOME';
  public currentDestination?: ActivityDestination;
  public pathWaypoints: THREE.Vector3[] = [];
  public currentWaypointIndex: number = 0;
  public simulationTier: NPCSimulationTier = 'TIER3_ABSTRACT';

  constructor(data: NPCData) {
    this.data = data;
    this.currentPosition = data.homeLocation.clone();
  }

  public setActivity(activity: NPCActivityType, dest?: ActivityDestination): void {
    this.currentActivity = activity;
    this.currentDestination = dest;
  }

  public setPath(waypoints: THREE.Vector3[]): void {
    this.pathWaypoints = waypoints;
    this.currentWaypointIndex = 0;
  }

  public modifyRelationship(targetNpcId: string, deltaAffinity: number, deltaFamiliarity: number): void {
    let rel = this.data.relationships.get(targetNpcId);
    if (!rel) {
      rel = { targetNpcId, affinity: 0, trust: 50, familiarity: 0 };
      this.data.relationships.set(targetNpcId, rel);
    }
    rel.affinity = Math.min(100, Math.max(-100, rel.affinity + deltaAffinity));
    rel.familiarity = Math.min(100, Math.max(0, rel.familiarity + deltaFamiliarity));
  }
}
