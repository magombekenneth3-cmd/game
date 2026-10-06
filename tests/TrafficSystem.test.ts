import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RoadGraph, RoadGraphEdge } from '../src/world/RoadGraph';
import { LaneSystem } from '../src/traffic/LaneSystem';
import { TrafficSignal } from '../src/traffic/TrafficSignal';
import { IntersectionController } from '../src/traffic/IntersectionController';
import { TrafficNavigation } from '../src/traffic/TrafficNavigation';
import { TrafficDensity } from '../src/traffic/TrafficDensity';
import { TrafficLODManager } from '../src/traffic/TrafficLOD';
import { TrafficIncidentManager } from '../src/traffic/TrafficIncident';
import { NAIROBI_TRAFFIC_RULES } from '../src/traffic/TrafficRules';
import { TrafficManager } from '../src/traffic/TrafficManager';
import { VehicleManager } from '../src/vehicles/VehicleManager';
import { AssetManager } from '../src/engine/AssetManager';

describe('Phase 6 — Traffic & Autonomous Transportation Unit Tests', () => {
  let roadGraph: RoadGraph;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let assetManager: AssetManager;

  beforeEach(() => {
    roadGraph = new RoadGraph();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, 16 / 9, 0.1, 1000);
    assetManager = new AssetManager();

    // Create a 4-node connected road network (Ngong Rd, Argwings Kodhek, Lenana, Ring Rd)
    roadGraph.addNode('node_1', new THREE.Vector3(-100, 0, 0));
    roadGraph.addNode('node_2', new THREE.Vector3(0, 0, 0));
    roadGraph.addNode('node_3', new THREE.Vector3(100, 0, 0));
    roadGraph.addNode('node_4', new THREE.Vector3(0, 0, 100));

    roadGraph.addEdge({
      id: 'road_ngong_1',
      name: 'Ngong Road West',
      startNodeId: 'node_1',
      endNodeId: 'node_2',
      width: 12,
      lanes: 2,
      roadClass: 'arterial',
      oneWay: false,
      speedLimit: 60,
      geometry: [new THREE.Vector3(-100, 0, 0), new THREE.Vector3(0, 0, 0)]
    });

    roadGraph.addEdge({
      id: 'road_ngong_2',
      name: 'Ngong Road East',
      startNodeId: 'node_2',
      endNodeId: 'node_3',
      width: 12,
      lanes: 2,
      roadClass: 'arterial',
      oneWay: false,
      speedLimit: 60,
      geometry: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(100, 0, 0)]
    });

    roadGraph.addEdge({
      id: 'road_lenana',
      name: 'Lenana Road',
      startNodeId: 'node_2',
      endNodeId: 'node_4',
      width: 10,
      lanes: 2,
      roadClass: 'secondary',
      oneWay: false,
      speedLimit: 50,
      geometry: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 100)]
    });
  });

  describe('1. Lane System & Left-Hand Driving', () => {
    it('generates lanes on the left side of roads with unique IDs', () => {
      const laneSystem = new LaneSystem();
      const lanes = laneSystem.buildLanesFromRoadGraph(roadGraph);

      expect(lanes.size).toBeGreaterThan(0);
      const ngongLanes = laneSystem.getLanesForRoad('road_ngong_1');
      expect(ngongLanes.length).toBeGreaterThanOrEqual(2);

      // Verify unique IDs
      const ids = new Set<string>();
      lanes.forEach((lane) => ids.add(lane.id));
      expect(ids.size).toBe(lanes.size);
    });

    it('enforces LEFT side traffic rules for Nairobi', () => {
      expect(NAIROBI_TRAFFIC_RULES.trafficSide).toBe('LEFT');
      expect(NAIROBI_TRAFFIC_RULES.obeySignals).toBe(true);
    });
  });

  describe('2. Intersection System & Traffic Signals', () => {
    it('cycles traffic signal state correctly over time', () => {
      const signal = new TrafficSignal('sig_1', 'inter_node_2', 0);
      expect(signal.state).toBe('GREEN');

      signal.update(13.0); // Past 12s green duration
      expect(signal.state).toBe('YELLOW');

      signal.update(4.0); // Past 3s yellow duration
      expect(signal.state).toBe('RED');

      signal.update(16.0); // Past 15s red duration
      expect(signal.state).toBe('GREEN');
    });

    it('builds intersection controllers and handles right-of-way locking', () => {
      const laneSystem = new LaneSystem();
      laneSystem.buildLanesFromRoadGraph(roadGraph);

      const intersectionCtrl = new IntersectionController();
      intersectionCtrl.buildIntersectionsFromRoadGraph(roadGraph, laneSystem);

      const interNode2 = intersectionCtrl.getIntersectionForNode('node_2');
      expect(interNode2).toBeDefined();

      if (interNode2) {
        const canEnter = intersectionCtrl.canVehicleEnterIntersection('veh_1', interNode2, interNode2.incomingLanes[0]);
        expect(canEnter).toBe(true);

        intersectionCtrl.releaseIntersection('veh_1', interNode2);
        expect(interNode2.occupyingVehicleId).toBeUndefined();
      }
    });
  });

  describe('3. Traffic Navigation & Routing', () => {
    it('finds valid A* route connecting start and end roads', () => {
      const route = TrafficNavigation.findRoute('road_ngong_1', 'road_lenana', roadGraph);
      expect(route).toBeDefined();
      expect(route.length).toBeGreaterThan(0);
      expect(route[0]).toBe('road_ngong_1');
    });
  });

  describe('4. Time-of-Day Traffic Density & Vehicle Mix', () => {
    it('varies traffic density factors according to Nairobi commuter hours', () => {
      expect(TrafficDensity.getDensityFactorForTime(8.0)).toBe(1.0);  // Morning Rush Peak
      expect(TrafficDensity.getDensityFactorForTime(12.0)).toBe(0.6); // Daytime Moderate
      expect(TrafficDensity.getDensityFactorForTime(17.5)).toBe(0.95); // Evening Rush Peak
      expect(TrafficDensity.getDensityFactorForTime(2.0)).toBe(0.15);  // Late Night Low
    });
  });

  describe('5. Matatu Autonomous Transit Foundation', () => {
    it('spawns matatus with assigned transit routes and stops', () => {
      const vehManager = new VehicleManager(scene, camera, assetManager);
      const trafficManager = new TrafficManager(vehManager, roadGraph);
      trafficManager.init(1337);

      const routes = trafficManager.getTransitRoutes();
      expect(routes.length).toBeGreaterThan(0);
      expect(routes[0].stops.length).toBeGreaterThan(0);
    });
  });

  describe('6. Traffic Incidents & Parking System', () => {
    it('creates traffic incidents that temporarily block lanes and expire after duration', () => {
      const incidentMgr = new TrafficIncidentManager();
      const inc = incidentMgr.createIncident('inc_1', 'blocked_lane', 'road_ngong_1', new THREE.Vector3(0, 0, 0), 10.0, 'lane_ngong_1_fwd_0');

      expect(incidentMgr.isLaneBlocked('lane_ngong_1_fwd_0')).toBe(true);

      incidentMgr.update(12.0); // Expire incident
      expect(incidentMgr.isLaneBlocked('lane_ngong_1_fwd_0')).toBe(false);
    });
  });

  describe('7. Simulation LOD & Telemetry', () => {
    it('evaluates LOD distance tiers correctly for traffic optimization', () => {
      const playerPos = new THREE.Vector3(0, 0, 0);
      expect(TrafficLODManager.evaluateTier(new THREE.Vector3(20, 0, 0), playerPos, false)).toBe('TIER0_FULL');
      expect(TrafficLODManager.evaluateTier(new THREE.Vector3(150, 0, 0), playerPos, false)).toBe('TIER1_REDUCED');
      expect(TrafficLODManager.evaluateTier(new THREE.Vector3(400, 0, 0), playerPos, false)).toBe('TIER2_ABSTRACT');
      expect(TrafficLODManager.evaluateTier(new THREE.Vector3(800, 0, 0), playerPos, false)).toBe('TIER3_STATISTICAL');
    });

    it('collects development traffic telemetry metrics', () => {
      const vehManager = new VehicleManager(scene, camera, assetManager);
      const trafficManager = new TrafficManager(vehManager, roadGraph);
      trafficManager.init(1337);
      trafficManager.update(0.016, 14.0, new THREE.Vector3(0, 0, 0));

      const stats = trafficManager.getTelemetryStats();
      expect(stats.totalTrafficVehicles).toBeGreaterThan(0);
      expect(stats.activeIntersectionsCount).toBeGreaterThanOrEqual(0);
    });
  });
});
