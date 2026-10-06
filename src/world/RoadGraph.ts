import * as THREE from 'three';

export type RoadClass = 'highway' | 'arterial' | 'secondary' | 'residential' | 'service';

export interface RoadGraphNode {
  id: string;
  position: THREE.Vector3;
  connectedEdgeIds: string[];
}

export interface RoadGraphEdge {
  id: string;
  name: string;
  startNodeId: string;
  endNodeId: string;
  width: number;
  lanes: number;
  roadClass: RoadClass;
  oneWay: boolean;
  speedLimit: number; // km/h
  geometry: THREE.Vector3[];
}

export class RoadGraph {
  public nodes: Map<string, RoadGraphNode> = new Map();
  public edges: Map<string, RoadGraphEdge> = new Map();

  public addNode(id: string, position: THREE.Vector3): RoadGraphNode {
    if (this.nodes.has(id)) {
      return this.nodes.get(id)!;
    }
    const node: RoadGraphNode = {
      id,
      position: position.clone(),
      connectedEdgeIds: []
    };
    this.nodes.set(id, node);
    return node;
  }

  public addEdge(edge: RoadGraphEdge): void {
    this.edges.set(edge.id, edge);

    const startNode = this.nodes.get(edge.startNodeId);
    if (startNode && !startNode.connectedEdgeIds.includes(edge.id)) {
      startNode.connectedEdgeIds.push(edge.id);
    }

    const endNode = this.nodes.get(edge.endNodeId);
    if (endNode && !endNode.connectedEdgeIds.includes(edge.id)) {
      endNode.connectedEdgeIds.push(edge.id);
    }
  }

  public getNearestNode(position: THREE.Vector3, maxDistance: number = 100.0): RoadGraphNode | undefined {
    let nearest: RoadGraphNode | undefined;
    let minDistanceSq = maxDistance * maxDistance;

    this.nodes.forEach((node) => {
      const distSq = position.distanceToSquared(node.position);
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        nearest = node;
      }
    });

    return nearest;
  }

  public getConnectedEdges(nodeId: string): RoadGraphEdge[] {
    const node = this.nodes.get(nodeId);
    if (!node) return [];
    return node.connectedEdgeIds
      .map((id) => this.edges.get(id))
      .filter((e): e is RoadGraphEdge => e !== undefined);
  }

  public clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }
}
