import * as THREE from 'three';
import { VehicleManager } from '../vehicles/VehicleManager';
import { LaneSystem } from './LaneSystem';
import { RoadGraph } from '../world/RoadGraph';
import { TrafficController } from './TrafficController';
import { TrafficDriver, TransitRoute } from './TrafficTypes';
import { TrafficDensity } from './TrafficDensity';
import { SeededRandom } from '../utils/SeededRandom';

export class TrafficSpawner {
  public static spawnDeterministicTrafficFleet(
    trafficSeed: number,
    vehicleManager: VehicleManager,
    laneSystem: LaneSystem,
    roadGraph: RoadGraph
  ): { controllers: TrafficController[]; transitRoutes: TransitRoute[] } {
    const rng = new SeededRandom(trafficSeed);
    const controllers: TrafficController[] = [];

    const lanes = laneSystem.getAllLanes();
    if (lanes.length === 0) return { controllers: [], transitRoutes: [] };

    // 1. Create Matatu Transit Routes
    const transitRoutes: TransitRoute[] = [
      {
        id: 'route_111_ngong',
        name: 'Route 111 — Ngong Road Express',
        roadSequence: Array.from(roadGraph.edges.keys()).slice(0, 4),
        stops: [
          { id: 'stop_city_hall', name: 'City Hall Stage', position: new THREE.Vector3(0, 0.3, 10), routeIds: ['route_111_ngong'] },
          { id: 'stop_yaya_ctr', name: 'Yaya Transit Hub', position: new THREE.Vector3(-20, 0.3, -40), routeIds: ['route_111_ngong'] },
          { id: 'stop_kileleshwa', name: 'Kileleshwa Stage', position: new THREE.Vector3(40, 0.3, 20), routeIds: ['route_111_ngong'] }
        ]
      },
      {
        id: 'route_46_yaya',
        name: 'Route 46 — Yaya / Hurlingham Shuttle',
        roadSequence: Array.from(roadGraph.edges.keys()).slice(2, 6),
        stops: [
          { id: 'stop_hurlingham', name: 'Hurlingham Plaza', position: new THREE.Vector3(50, 0.3, -30), routeIds: ['route_46_yaya'] },
          { id: 'stop_yaya_ctr', name: 'Yaya Transit Hub', position: new THREE.Vector3(-20, 0.3, -40), routeIds: ['route_46_yaya'] }
        ]
      }
    ];

    // 2. Spawn 30 Deterministic Traffic Drivers & Vehicles
    const count = 30;
    for (let i = 0; i < count; i++) {
      const isMatatu = i % 5 === 0;
      const type = TrafficDensity.selectVehicleType(rng, isMatatu);

      const lane = lanes[i % lanes.length];
      const startPos = lane.centerline[0] ? lane.centerline[0].clone() : new THREE.Vector3(i * 10, 0.3, 0);

      // Offset slightly to prevent exact superposition
      startPos.x += (rng.nextFloat() - 0.5) * 2.0;
      startPos.z += (rng.nextFloat() - 0.5) * 2.0;

      const vehId = `traffic_veh_${i}`;
      const driverId = `driver_${i}`;

      const vehicle = vehicleManager.spawnVehicle(type, vehId, startPos, 0);

      const driver: TrafficDriver = {
        id: driverId,
        vehicleId: vehId,
        aggression: parseFloat((0.2 + rng.nextFloat() * 0.6).toFixed(2)),
        patience: parseFloat((0.3 + rng.nextFloat() * 0.6).toFixed(2)),
        awareness: parseFloat((0.7 + rng.nextFloat() * 0.3).toFixed(2)),
        preferredSpeedMultiplier: parseFloat((0.85 + rng.nextFloat() * 0.35).toFixed(2)),
        currentRoadId: lane.roadId,
        currentLaneId: lane.id
      };

      const routeLanes = [lane];
      const transitRoute = isMatatu ? transitRoutes[i % transitRoutes.length] : undefined;

      const controller = new TrafficController(driver, vehicle, routeLanes, transitRoute);
      controllers.push(controller);
    }

    return { controllers, transitRoutes };
  }
}
