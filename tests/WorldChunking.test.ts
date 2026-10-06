import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { WorldChunkManager } from '../src/world/WorldChunkManager';
import { SpatialIndex } from '../src/world/SpatialIndex';
import { RoadGraph, RoadGraphEdge } from '../src/world/RoadGraph';
import { BuildingDataNormalizer } from '../src/world/BuildingData';

describe('Phase 3 Scalable World Foundation Tests', () => {
  it('correctly maps world positions to deterministic chunk keys', () => {
    const scene = new THREE.Scene();
    const manager = new WorldChunkManager(scene, { chunkSize: 100.0 });

    expect(manager.getChunkKeyForPosition(50, 50)).toBe('0:0');
    expect(manager.getChunkKeyForPosition(150, 250)).toBe('1:2');
    expect(manager.getChunkKeyForPosition(-50, -150)).toBe('-1:-2');
  });

  it('updates chunk active LOD levels based on player position', () => {
    const scene = new THREE.Scene();
    const manager = new WorldChunkManager(scene, {
      chunkSize: 100.0,
      lod0Radius: 120.0,
      lod1Radius: 260.0,
      lod2Radius: 420.0,
      unloadRadius: 500.0
    });

    const chunkCenter = manager.getOrCreateChunk(0, 0);  // Center at (50, 0, 50)
    const chunkFar = manager.getOrCreateChunk(8, 8);     // Center at (850, 0, 850)

    const playerPos = new THREE.Vector3(50, 0, 50);
    manager.updatePlayerPosition(playerPos);

    expect(chunkCenter.lodLevel).toBe('LOD0');
    expect(chunkFar.lodLevel).toBe('UNLOADED');
  });

  it('inserts items into SpatialIndex and performs accurate radius queries', () => {
    const spatial = new SpatialIndex(50.0);

    spatial.insert({
      id: 'item_1',
      position: new THREE.Vector3(10, 0, 10),
      type: 'building',
      data: { name: 'Near Building' }
    });

    spatial.insert({
      id: 'item_2',
      position: new THREE.Vector3(300, 0, 300),
      type: 'building',
      data: { name: 'Far Building' }
    });

    const near = spatial.queryRadius(new THREE.Vector3(0, 0, 0), 50.0, 'building');
    expect(near.length).toBe(1);
    expect(near[0].data.name).toBe('Near Building');
  });

  it('builds a connected RoadGraph and returns connected edges', () => {
    const graph = new RoadGraph();

    graph.addNode('node_a', new THREE.Vector3(0, 0, 0));
    graph.addNode('node_b', new THREE.Vector3(100, 0, 0));

    const edge: RoadGraphEdge = {
      id: 'edge_1',
      name: 'Ngong Road Segment 1',
      startNodeId: 'node_a',
      endNodeId: 'node_b',
      width: 14,
      lanes: 4,
      roadClass: 'highway',
      oneWay: false,
      speedLimit: 70,
      geometry: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 0, 0)]
    };

    graph.addEdge(edge);

    const connected = graph.getConnectedEdges('node_a');
    expect(connected.length).toBe(1);
    expect(connected[0].name).toBe('Ngong Road Segment 1');

    const nearestNode = graph.getNearestNode(new THREE.Vector3(5, 0, 0));
    expect(nearestNode).toBeDefined();
    expect(nearestNode!.id).toBe('node_a');
  });

  it('normalizes building data metadata into entity models', () => {
    const rawBld = {
      id: 'bld_test_1',
      name: 'Britam Plaza Test',
      polygon: [{ x: 0, z: 0 }, { x: 20, z: 0 }, { x: 20, z: 20 }, { x: 0, z: 20 }],
      floors: 24,
      height: 82,
      zone: 'cbd_commercial' as const
    };

    const norm = BuildingDataNormalizer.normalize(rawBld, 'district_nairobi');
    expect(norm.buildingCategory).toBe('commercial_tower');
    expect(norm.center.x).toBe(10);
    expect(norm.center.z).toBe(10);
    expect(norm.entrances.length).toBeGreaterThan(0);
  });
});
