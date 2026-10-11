import * as THREE from 'three';
import { VehicleManager } from '../vehicles/VehicleManager';
import { LaneSystem } from './LaneSystem';
import { RoadGraph } from '../world/RoadGraph';
import { TrafficController } from './TrafficController';
import { TrafficDriver, TransitRoute } from './TrafficTypes';
import { TrafficDensity } from './TrafficDensity';
import { SeededRandom } from '../utils/SeededRandom';
import { MatatuTransitSystem } from './MatatuTransitSystem';
import { SaccoId } from './MatatuTransitTypes';

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

    const transitSystem = MatatuTransitSystem.getInstance();
    const saccosOrder: SaccoId[] = ['super_metro', 'city_hoppa', 'ngong_126', 'forward_sacco', 'kbs_transit'];

    // 1. Build Transit Routes synchronized with MatatuTransitSystem
    const transitRoutes: TransitRoute[] = [];
    transitSystem.routes.forEach((route) => {
      const stops = route.stageSequence.map((stageId) => {
        const stage = transitSystem.stages.get(stageId);
        return {
          id: stageId,
          name: stage ? stage.name : stageId,
          position: stage ? stage.curbPosition.clone() : new THREE.Vector3(0, 0.3, 0),
          routeIds: [route.id]
        };
      });

      transitRoutes.push({
        id: route.id,
        name: route.name,
        roadSequence: route.roadIds.length > 0 ? route.roadIds : Array.from(roadGraph.edges.keys()).slice(0, 4),
        stops
      });
    });

    // Fallback if no routes defined
    if (transitRoutes.length === 0) {
      transitRoutes.push({
        id: 'route_111_ngong',
        name: 'Route 111 — Ngong Road Express',
        roadSequence: Array.from(roadGraph.edges.keys()).slice(0, 4),
        stops: [
          { id: 'stage_kencom', name: 'Kencom / Ambassador Stage', position: new THREE.Vector3(7.2, 0.25, 72), routeIds: ['route_111_ngong'] },
          { id: 'stage_gpo', name: 'GPO / Teleposta Stage', position: new THREE.Vector3(-5.5, 0.25, 26), routeIds: ['route_111_ngong'] }
        ]
      });
    }

    // 2. Spawn 30 Deterministic Traffic Drivers & Vehicles
    const count = 30;
    let matatuCounter = 0;

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
      let assignedTransitRoute: TransitRoute | undefined;

      if (isMatatu || type === 'matatu') {
        const assignedRouteObj = transitRoutes[matatuCounter % transitRoutes.length];
        assignedTransitRoute = assignedRouteObj;

        const saccoId = saccosOrder[matatuCounter % saccosOrder.length];
        transitSystem.registerMatatuVehicle(vehId, saccoId, assignedRouteObj.id);
        matatuCounter++;
      }

      const controller = new TrafficController(driver, vehicle, routeLanes, assignedTransitRoute);
      controllers.push(controller);
    }

    return { controllers, transitRoutes };
  }
}
