import * as THREE from 'three';
import { RoadGraph, RoadGraphNode } from '../world/RoadGraph';

/**
 * NPCNavigation — sidewalk-aware pedestrian pathfinding.
 *
 * Phase 12 fix (D3): previously routed NPCs along the road centreline,
 * placing pedestrians in the middle of traffic. This revision offsets
 * every road-graph waypoint to the pedestrian walkway (left sidewalk,
 * ~2.3m from road edge) and caps path length to avoid routing through
 * the entire district for short wander moves.
 *
 * Sidewalk geometry constants (from ProceduralRoadGenerator):
 *   halfWidth           = road.width / 2  (typically 5–7m for CBD roads)
 *   curbOffset          = halfWidth + 0.3m
 *   sidewalkCentre      = halfWidth + 0.3 + 1.5 = halfWidth + 1.8m  (left)
 *                       = -(halfWidth + 1.8m)                         (right)
 *
 * We use a fixed conservative SIDEWALK_OFFSET = 6.5m (works for roads
 * 4–10m wide) so we don't need to query per-road width at runtime.
 * NPCs always walk on the LEFT sidewalk relative to their direction of
 * travel — consistent with Kenyan keep-left convention.
 */

/** Distance from road centreline to pedestrian walkway centre (metres). */
const SIDEWALK_OFFSET = 6.5;

/** Maximum number of road-graph nodes to traverse per path call.
 *  Keeps the path local — prevents NPCs routing 200m away for a 20m wander. */
const MAX_PATH_NODES = 4;

export class NPCNavigation {
  private roadGraph: RoadGraph;

  constructor(roadGraph: RoadGraph) {
    this.roadGraph = roadGraph;
  }

  /**
   * Returns a sequence of waypoints from startPos to destPos routed along
   * the pedestrian sidewalk rather than the road centreline.
   *
   * Algorithm:
   *  1. Snap start and dest to nearest road-graph nodes.
   *  2. Walk up to MAX_PATH_NODES connected edges from the start node.
   *  3. Offset each centreline point to the left sidewalk using the road
   *     tangent normal (perpendicular to the edge direction).
   *  4. Append the final destination (also sidewalk-offset from the nearest node).
   */
  public findPath(startPos: THREE.Vector3, destPos: THREE.Vector3): THREE.Vector3[] {
    const waypoints: THREE.Vector3[] = [];

    const startNode = this.roadGraph.getNearestNode(startPos, 150.0);
    const endNode   = this.roadGraph.getNearestNode(destPos,  150.0);

    if (!startNode || !endNode || startNode.id === endNode.id) {
      // Fallback: straight-line with sidewalk offset from the nearest node
      if (startNode) {
        waypoints.push(this.sidewalkPoint(startPos, startNode));
      }
      waypoints.push(destPos.clone());
      return waypoints;
    }

    // Start: offset from the start-node's position to the left sidewalk
    waypoints.push(this.sidewalkPoint(startPos, startNode));

    // Traverse connected edges up to MAX_PATH_NODES deep, sidewalk-offsetting
    // each geometry point along the edge.
    const connectedEdges = this.roadGraph.getConnectedEdges(startNode.id);
    let nodeCount = 0;

    for (const edge of connectedEdges) {
      if (nodeCount >= MAX_PATH_NODES) break;

      if (edge.geometry.length >= 2) {
        // Compute the predominant edge direction from first to last geometry pt
        const edgeDir = edge.geometry[edge.geometry.length - 1]
          .clone()
          .sub(edge.geometry[0])
          .normalize();

        // Left normal (Kenyan keep-left: NPC walks on left kerb)
        const leftNormal = new THREE.Vector3(-edgeDir.z, 0, edgeDir.x);

        for (const pt of edge.geometry) {
          const sidewalkPt = pt.clone().add(
            leftNormal.clone().multiplyScalar(SIDEWALK_OFFSET)
          );
          sidewalkPt.y = pt.y + 0.20; // sidewalk is 0.20m above road surface
          waypoints.push(sidewalkPt);
        }
        nodeCount++;
      }
    }

    // End: offset the destination toward the nearest road-node's left kerb
    waypoints.push(this.sidewalkPoint(destPos, endNode));

    return waypoints;
  }

  /**
   * Returns a point offset to the left sidewalk from `worldPos`,
   * using the direction from the nearest road node to `worldPos` as the edge direction.
   */
  private sidewalkPoint(worldPos: THREE.Vector3, nearestNode: RoadGraphNode): THREE.Vector3 {
    const toPoint = worldPos.clone().sub(nearestNode.position);
    toPoint.y = 0;

    let edgeDir: THREE.Vector3;
    if (toPoint.lengthSq() > 0.01) {
      edgeDir = toPoint.normalize();
    } else {
      // Fallback: use X-axis when point is directly on node
      edgeDir = new THREE.Vector3(1, 0, 0);
    }

    const leftNormal = new THREE.Vector3(-edgeDir.z, 0, edgeDir.x);
    const result = worldPos.clone().add(leftNormal.multiplyScalar(SIDEWALK_OFFSET));
    result.y = 0.20; // on top of sidewalk surface
    return result;
  }
}
