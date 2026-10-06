import * as THREE from 'three';
import { RoadGraph } from '../world/RoadGraph';

export class NPCNavigation {
  private roadGraph: RoadGraph;

  constructor(roadGraph: RoadGraph) {
    this.roadGraph = roadGraph;
  }

  public findPath(startPos: THREE.Vector3, destPos: THREE.Vector3): THREE.Vector3[] {
    const waypoints: THREE.Vector3[] = [];

    // 1. Add Start Position
    waypoints.push(startPos.clone());

    // 2. Find Nearest RoadGraph Nodes for Origin and Destination
    const startNode = this.roadGraph.getNearestNode(startPos, 150.0);
    const endNode = this.roadGraph.getNearestNode(destPos, 150.0);

    if (startNode && endNode && startNode.id !== endNode.id) {
      waypoints.push(startNode.position.clone());

      // Find path along connected road graph edges
      const connectedEdges = this.roadGraph.getConnectedEdges(startNode.id);
      if (connectedEdges.length > 0) {
        const edge = connectedEdges[0];
        edge.geometry.forEach((pt) => waypoints.push(pt.clone()));
      }

      waypoints.push(endNode.position.clone());
    }

    // 3. Add Final Destination Position
    waypoints.push(destPos.clone());

    return waypoints;
  }
}
