import { RoadGraph, RoadGraphEdge } from '../world/RoadGraph';
import { LaneSystem, TrafficLane } from './LaneSystem';

interface AStarNode {
  nodeId: string;
  gScore: number;
  fScore: number;
  parentEdge?: RoadGraphEdge;
  parentNodeId?: string;
}

export class TrafficNavigation {
  public static findRoute(
    startRoadId: string,
    endRoadId: string,
    roadGraph: RoadGraph,
    congestionMap?: Map<string, number>
  ): string[] {
    const startEdge = roadGraph.edges.get(startRoadId);
    const endEdge = roadGraph.edges.get(endRoadId);

    if (!startEdge || !endEdge) return [];
    if (startRoadId === endRoadId) return [startRoadId];

    const openSet: Map<string, AStarNode> = new Map();
    const closedSet: Set<string> = new Set();

    const startNode = roadGraph.nodes.get(startEdge.startNodeId);
    const destinationNode = roadGraph.nodes.get(endEdge.endNodeId);

    if (!startNode || !destinationNode) return [];

    const h = (posA: any, posB: any) => posA.distanceTo(posB);

    openSet.set(startNode.id, {
      nodeId: startNode.id,
      gScore: 0,
      fScore: h(startNode.position, destinationNode.position)
    });

    while (openSet.size > 0) {
      let current: AStarNode | undefined;
      let minF = Infinity;

      openSet.forEach((n) => {
        if (n.fScore < minF) {
          minF = n.fScore;
          current = n;
        }
      });

      if (!current) break;

      if (current.nodeId === destinationNode.id) {
        // Reconstruct path
        const roadPath: string[] = [];
        let curr: AStarNode | undefined = current;
        while (curr && curr.parentEdge) {
          roadPath.unshift(curr.parentEdge.id);
          const parentId: string | undefined = curr.parentNodeId;
          curr = parentId ? openSet.get(parentId) || closedSetNodeMap.get(parentId) : undefined;
        }
        if (roadPath.length === 0 || roadPath[0] !== startRoadId) {
          roadPath.unshift(startRoadId);
        }
        return roadPath;
      }

      openSet.delete(current.nodeId);
      closedSet.add(current.nodeId);
      closedSetNodeMap.set(current.nodeId, current);

      const connectedEdges = roadGraph.getConnectedEdges(current.nodeId);
      for (const edge of connectedEdges) {
        const neighborNodeId = edge.startNodeId === current.nodeId ? edge.endNodeId : edge.startNodeId;
        if (closedSet.has(neighborNodeId)) continue;

        const neighborNode = roadGraph.nodes.get(neighborNodeId);
        if (!neighborNode) continue;

        const distance = edge.geometry && edge.geometry.length >= 2
          ? edge.geometry[0].distanceTo(edge.geometry[1])
          : 50.0;

        const congestionFactor = congestionMap?.get(edge.id) || 0;
        const edgeCost = distance * (1.0 + congestionFactor * 2.0);

        const tentativeG = current.gScore + edgeCost;

        const existing = openSet.get(neighborNodeId);
        if (!existing || tentativeG < existing.gScore) {
          openSet.set(neighborNodeId, {
            nodeId: neighborNodeId,
            gScore: tentativeG,
            fScore: tentativeG + h(neighborNode.position, destinationNode.position),
            parentEdge: edge,
            parentNodeId: current.nodeId
          });
        }
      }
    }

    // Fallback: direct route if pathfinding search exhausted
    return [startRoadId, endRoadId];
  }

  public static convertRoadSequenceToLanes(
    roadIds: string[],
    laneSystem: LaneSystem
  ): TrafficLane[] {
    const result: TrafficLane[] = [];
    roadIds.forEach((roadId) => {
      const lanes = laneSystem.getLanesForRoad(roadId);
      if (lanes.length > 0) {
        result.push(lanes[0]);
      }
    });
    return result;
  }
}

const closedSetNodeMap = new Map<string, AStarNode>();
