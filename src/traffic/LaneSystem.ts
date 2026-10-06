import * as THREE from 'three';
import { RoadGraph, RoadGraphEdge } from '../world/RoadGraph';
import { VehicleType } from '../vehicles/VehicleTypes';

export interface TrafficLane {
  id: string;
  roadId: string;
  direction: 'FORWARD' | 'REVERSE';
  laneIndex: number;
  centerline: THREE.Vector3[];
  speedLimit: number;
  allowedVehicleTypes: VehicleType[];
}

export class LaneSystem {
  private lanes: Map<string, TrafficLane> = new Map();
  private roadToLanesMap: Map<string, TrafficLane[]> = new Map();

  public buildLanesFromRoadGraph(roadGraph: RoadGraph): Map<string, TrafficLane> {
    this.lanes.clear();
    this.roadToLanesMap.clear();

    roadGraph.edges.forEach((edge) => {
      const edgeLanes = this.generateLanesForEdge(edge, roadGraph);
      this.roadToLanesMap.set(edge.id, edgeLanes);
      edgeLanes.forEach((lane) => {
        this.lanes.set(lane.id, lane);
      });
    });

    return this.lanes;
  }

  private generateLanesForEdge(edge: RoadGraphEdge, roadGraph: RoadGraph): TrafficLane[] {
    const result: TrafficLane[] = [];
    const startNode = roadGraph.nodes.get(edge.startNodeId);
    const endNode = roadGraph.nodes.get(edge.endNodeId);

    if (!startNode || !endNode) return result;

    const startPos = startNode.position;
    const endPos = endNode.position;

    const dir = endPos.clone().sub(startPos).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    // Right perpendicular vector
    const right = new THREE.Vector3().crossVectors(dir, up).normalize();

    const laneWidth = 3.5;
    const totalLanes = edge.lanes || 2;
    const allTypes: VehicleType[] = ['sedan', 'compact_car', 'suv', 'pickup', 'van', 'matatu', 'motorcycle', 'truck'];

    if (edge.oneWay) {
      for (let i = 0; i < totalLanes; i++) {
        // Offset on left side for Nairobi driving rules
        const offsetDist = (i - (totalLanes - 1) / 2) * laneWidth;
        const offsetVec = right.clone().multiplyScalar(offsetDist);

        const laneCenterline = [
          startPos.clone().add(offsetVec),
          endPos.clone().add(offsetVec)
        ];

        const lane: TrafficLane = {
          id: `lane_${edge.id}_fwd_${i}`,
          roadId: edge.id,
          direction: 'FORWARD',
          laneIndex: i,
          centerline: laneCenterline,
          speedLimit: edge.speedLimit || 50,
          allowedVehicleTypes: allTypes
        };
        result.push(lane);
      }
    } else {
      // Two-way road: half lanes FORWARD, half lanes REVERSE
      const fwdCount = Math.max(1, Math.floor(totalLanes / 2));
      const revCount = Math.max(1, Math.ceil(totalLanes / 2));

      // Forward Lanes (Offset to Left of forward heading)
      for (let i = 0; i < fwdCount; i++) {
        const offsetDist = -(i + 0.5) * laneWidth; // Left of center line
        const offsetVec = right.clone().multiplyScalar(offsetDist);

        const laneCenterline = [
          startPos.clone().add(offsetVec),
          endPos.clone().add(offsetVec)
        ];

        result.push({
          id: `lane_${edge.id}_fwd_${i}`,
          roadId: edge.id,
          direction: 'FORWARD',
          laneIndex: i,
          centerline: laneCenterline,
          speedLimit: edge.speedLimit || 50,
          allowedVehicleTypes: allTypes
        });
      }

      // Reverse Lanes (Heading EndNode -> StartNode, offset to Left of reverse heading)
      for (let i = 0; i < revCount; i++) {
        const offsetDist = (i + 0.5) * laneWidth; // Right of forward center (left of reverse)
        const offsetVec = right.clone().multiplyScalar(offsetDist);

        const laneCenterline = [
          endPos.clone().add(offsetVec),
          startPos.clone().add(offsetVec)
        ];

        result.push({
          id: `lane_${edge.id}_rev_${i}`,
          roadId: edge.id,
          direction: 'REVERSE',
          laneIndex: i,
          centerline: laneCenterline,
          speedLimit: edge.speedLimit || 50,
          allowedVehicleTypes: allTypes
        });
      }
    }

    return result;
  }

  public getLane(id: string): TrafficLane | undefined {
    return this.lanes.get(id);
  }

  public getLanesForRoad(roadId: string): TrafficLane[] {
    return this.roadToLanesMap.get(roadId) || [];
  }

  public getNearestLane(position: THREE.Vector3): TrafficLane | undefined {
    let nearest: TrafficLane | undefined;
    let minDistanceSq = Infinity;

    this.lanes.forEach((lane) => {
      if (lane.centerline.length >= 2) {
        const start = lane.centerline[0];
        const end = lane.centerline[1];

        const seg = end.clone().sub(start);
        const lenSq = seg.lengthSq();
        let t = 0;
        if (lenSq > 0) {
          t = Math.max(0, Math.min(1, position.clone().sub(start).dot(seg) / lenSq));
        }
        const proj = start.clone().add(seg.multiplyScalar(t));
        const distSq = position.distanceToSquared(proj);

        if (distSq < minDistanceSq) {
          minDistanceSq = distSq;
          nearest = lane;
        }
      }
    });

    return nearest;
  }

  public getPointAlongLane(lane: TrafficLane, progressRatio: number): { position: THREE.Vector3; tangent: THREE.Vector3 } {
    const clampedProgress = Math.max(0, Math.min(1, progressRatio));
    if (lane.centerline.length < 2) {
      const pos = lane.centerline[0] ? lane.centerline[0].clone() : new THREE.Vector3();
      return { position: pos, tangent: new THREE.Vector3(0, 0, -1) };
    }

    const start = lane.centerline[0];
    const end = lane.centerline[1];

    const position = start.clone().lerp(end, clampedProgress);
    const tangent = end.clone().sub(start).normalize();

    return { position, tangent };
  }

  public getAllLanes(): TrafficLane[] {
    return Array.from(this.lanes.values());
  }

  public clear(): void {
    this.lanes.clear();
    this.roadToLanesMap.clear();
  }
}
