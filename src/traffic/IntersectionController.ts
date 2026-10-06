import { RoadGraph } from '../world/RoadGraph';
import { LaneSystem } from './LaneSystem';
import { TrafficSignal } from './TrafficSignal';

export type TrafficIntersectionType =
  | 'signalized'
  | 'stop-controlled'
  | 'yield-controlled'
  | 'uncontrolled'
  | 'roundabout';

export interface TrafficIntersection {
  id: string;
  nodeId: string;
  type: TrafficIntersectionType;
  incomingLanes: string[];
  outgoingLanes: string[];
  signal?: TrafficSignal;
  occupyingVehicleId?: string;
  queue: string[];
}

export class IntersectionController {
  private intersections: Map<string, TrafficIntersection> = new Map();

  public buildIntersectionsFromRoadGraph(roadGraph: RoadGraph, laneSystem: LaneSystem): Map<string, TrafficIntersection> {
    this.intersections.clear();

    roadGraph.nodes.forEach((node) => {
      const connectedEdges = roadGraph.getConnectedEdges(node.id);
      if (connectedEdges.length >= 2) {
        const incomingLanes: string[] = [];
        const outgoingLanes: string[] = [];

        connectedEdges.forEach((edge) => {
          const lanes = laneSystem.getLanesForRoad(edge.id);
          lanes.forEach((lane) => {
            if (lane.centerline.length >= 2) {
              const endPt = lane.centerline[lane.centerline.length - 1];
              const startPt = lane.centerline[0];

              if (endPt.distanceTo(node.position) < 15.0) {
                incomingLanes.push(lane.id);
              }
              if (startPt.distanceTo(node.position) < 15.0) {
                outgoingLanes.push(lane.id);
              }
            }
          });
        });

        let type: TrafficIntersectionType = 'uncontrolled';
        if (node.id.includes('roundabout') || node.connectedEdgeIds.length >= 4) {
          type = connectedEdges.length >= 4 ? 'signalized' : 'roundabout';
        } else if (connectedEdges.length === 3) {
          type = 'stop-controlled';
        }

        const signal = type === 'signalized'
          ? new TrafficSignal(`sig_${node.id}`, `inter_${node.id}`, Math.random() * 10)
          : undefined;

        const intersection: TrafficIntersection = {
          id: `inter_${node.id}`,
          nodeId: node.id,
          type,
          incomingLanes,
          outgoingLanes,
          signal,
          queue: []
        };

        this.intersections.set(intersection.id, intersection);
      }
    });

    return this.intersections;
  }

  public update(dt: number): void {
    this.intersections.forEach((inter) => {
      if (inter.signal) {
        inter.signal.update(dt);
      }
    });
  }

  public getIntersection(id: string): TrafficIntersection | undefined {
    return this.intersections.get(id);
  }

  public getIntersectionForNode(nodeId: string): TrafficIntersection | undefined {
    return this.intersections.get(`inter_${nodeId}`);
  }

  public canVehicleEnterIntersection(
    vehicleId: string,
    intersection: TrafficIntersection,
    _incomingLaneId: string
  ): boolean {
    if (intersection.type === 'signalized' && intersection.signal) {
      if (intersection.signal.isRed()) {
        return false;
      }
    }

    if (intersection.type === 'roundabout') {
      // Yield to existing vehicles inside the roundabout
      if (intersection.occupyingVehicleId && intersection.occupyingVehicleId !== vehicleId) {
        return false;
      }
    }

    if (intersection.type === 'stop-controlled') {
      if (intersection.occupyingVehicleId && intersection.occupyingVehicleId !== vehicleId) {
        return false;
      }
    }

    // Reserve intersection
    if (!intersection.occupyingVehicleId) {
      intersection.occupyingVehicleId = vehicleId;
    }

    return true;
  }

  public releaseIntersection(vehicleId: string, intersection: TrafficIntersection): void {
    if (intersection.occupyingVehicleId === vehicleId) {
      intersection.occupyingVehicleId = undefined;
    }
  }

  public getAllIntersections(): TrafficIntersection[] {
    return Array.from(this.intersections.values());
  }

  public clear(): void {
    this.intersections.clear();
  }
}
