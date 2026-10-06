import * as THREE from 'three';
import { Vehicle } from '../vehicles/Vehicle';
import { TrafficDriver, TrafficVehicleState, TransitRoute } from './TrafficTypes';
import { TrafficLane, LaneSystem } from './LaneSystem';
import { IntersectionController } from './IntersectionController';
import { TrafficRules, NAIROBI_TRAFFIC_RULES } from './TrafficRules';

export class TrafficController {
  public driver: TrafficDriver;
  public vehicle: Vehicle;
  public aiState: TrafficVehicleState = 'CRUISING';

  public routeLanes: TrafficLane[] = [];
  public currentLaneIndex: number = 0;
  public laneProgress: number = 0; // 0.0 to 1.0

  public transitRoute?: TransitRoute;
  public currentStopIndex: number = 0;
  public dwellTimer: number = 0;

  private rules: TrafficRules = NAIROBI_TRAFFIC_RULES;

  constructor(
    driver: TrafficDriver,
    vehicle: Vehicle,
    routeLanes: TrafficLane[],
    transitRoute?: TransitRoute
  ) {
    this.driver = driver;
    this.vehicle = vehicle;
    this.routeLanes = routeLanes;
    this.transitRoute = transitRoute;
  }

  public update(
    fixedDt: number,
    laneSystem: LaneSystem,
    intersections: IntersectionController,
    surroundingVehicles: Vehicle[],
    _playerPos?: THREE.Vector3,
    playerVehicle?: Vehicle,
    pedestrianPositions?: THREE.Vector3[],
    environmentMeshes: THREE.Object3D[] = []
  ): void {
    if (this.aiState === 'PARKED') return;

    // Handle Matatu Dwell Time at Transit Stop
    if (this.transitRoute && this.dwellTimer > 0) {
      this.dwellTimer -= fixedDt;
      this.aiState = 'STOPPED';
      this.vehicle.state.throttle = 0;
      this.vehicle.state.handbrake = true;
      this.vehicle.physics.stepFixed(
        { throttle: 0, reverse: 0, steer: 0, handbrake: true, exitVehicle: false },
        fixedDt,
        environmentMeshes
      );
      if (this.dwellTimer <= 0) {
        this.aiState = 'CRUISING';
        this.currentStopIndex = (this.currentStopIndex + 1) % this.transitRoute.stops.length;
      }
      return;
    }

    // 1. Determine Current Lane
    let currentLane = this.routeLanes[this.currentLaneIndex];
    if (!currentLane) {
      currentLane = laneSystem.getNearestLane(this.vehicle.state.position) || this.routeLanes[0];
    }
    if (!currentLane) return;

    this.driver.currentLaneId = currentLane.id;
    this.driver.currentRoadId = currentLane.roadId;

    // 2. Calculate Target Position along Lane Centerline with Look-Ahead
    const currentSpeedMps = this.vehicle.state.velocity.length();
    const lookAheadDist = 12.0 + Math.min(30.0, currentSpeedMps * 2.0);

    const { position: currentTargetPos, tangent } = laneSystem.getPointAlongLane(currentLane, this.laneProgress);

    // Update progress along lane
    const moveDist = Math.max(0.1, currentSpeedMps * fixedDt);
    const laneLength = currentLane.centerline.length >= 2
      ? currentLane.centerline[0].distanceTo(currentLane.centerline[1])
      : 50.0;
    this.laneProgress += moveDist / laneLength;

    if (this.laneProgress >= 1.0) {
      this.laneProgress = 0;
      this.currentLaneIndex = (this.currentLaneIndex + 1) % Math.max(1, this.routeLanes.length);
    }

    // 3. Evaluate Desired Speed
    const speedLimitKph = currentLane.speedLimit || 50;
    let targetSpeedKph = speedLimitKph * this.driver.preferredSpeedMultiplier;
    targetSpeedKph = Math.min(this.vehicle.definition.maxSpeed, targetSpeedKph);

    // 4. Obstacle Detection & Following Distance
    let minObstacleDistance = Infinity;
    const vehiclePos = this.vehicle.state.position;

    // Check surrounding traffic vehicles ahead
    for (const other of surroundingVehicles) {
      if (other.definition.id === this.vehicle.definition.id) continue;
      const dist = vehiclePos.distanceTo(other.state.position);

      if (dist < lookAheadDist) {
        const toOther = other.state.position.clone().sub(vehiclePos).normalize();
        const dot = tangent.dot(toOther);
        if (dot > 0.6) { // Vehicle is ahead in current lane direction
          minObstacleDistance = Math.min(minObstacleDistance, dist);
        }
      }
    }

    // Check Player Vehicle ahead
    if (playerVehicle && playerVehicle.definition.id !== this.vehicle.definition.id) {
      const dist = vehiclePos.distanceTo(playerVehicle.state.position);
      if (dist < lookAheadDist) {
        const toPlayer = playerVehicle.state.position.clone().sub(vehiclePos).normalize();
        if (tangent.dot(toPlayer) > 0.6) {
          minObstacleDistance = Math.min(minObstacleDistance, dist);
        }
      }
    }

    // Check Pedestrian NPCs ahead
    if (pedestrianPositions) {
      for (const pedPos of pedestrianPositions) {
        const dist = vehiclePos.distanceTo(pedPos);
        if (dist < 15.0) {
          const toPed = pedPos.clone().sub(vehiclePos).normalize();
          if (tangent.dot(toPed) > 0.7) {
            minObstacleDistance = Math.min(minObstacleDistance, dist);
          }
        }
      }
    }

    // Check Intersections & Signal State ahead
    const nearNode = currentLane.roadId; // Use current road node
    const inter = intersections.getIntersectionForNode(nearNode);
    if (inter && inter.signal) {
      const distToInter = vehiclePos.distanceTo(currentTargetPos);
      if (distToInter < 20.0 && inter.signal.isRed()) {
        minObstacleDistance = Math.min(minObstacleDistance, distToInter);
        this.aiState = 'WAITING_SIGNAL';
      }
    }

    // Check Matatu Transit Stop
    if (this.transitRoute && this.transitRoute.stops.length > 0) {
      const targetStop = this.transitRoute.stops[this.currentStopIndex];
      if (targetStop) {
        const distToStop = vehiclePos.distanceTo(targetStop.position);
        if (distToStop <= 4.0) {
          this.dwellTimer = 4.0; // Stop for 4 seconds
          this.aiState = 'STOPPED';
        } else if (distToStop <= 25.0) {
          targetSpeedKph = Math.min(targetSpeedKph, 15.0);
        }
      }
    }

    // 5. Apply Speed Control & Following Distance Response
    const requiredMargin = this.rules.defaultFollowingDistance + currentSpeedMps * (1.2 - this.driver.awareness * 0.4);

    let throttleInput = 0;
    let handbrakeInput = false;

    if (minObstacleDistance < requiredMargin) {
      // Too close to obstacle ahead: brake/stop
      this.aiState = minObstacleDistance < 3.0 ? 'STOPPED' : 'FOLLOWING';
      throttleInput = 0;
      handbrakeInput = minObstacleDistance < 2.5;
    } else {
      if (this.aiState !== 'WAITING_SIGNAL' && this.aiState !== 'STOPPED') {
        this.aiState = 'CRUISING';
      }
      const speedKph = this.vehicle.state.currentSpeedKph;
      if (speedKph < targetSpeedKph) {
        throttleInput = Math.min(1.0, (targetSpeedKph - speedKph) / 20.0);
      }
    }

    // 6. Steering Calculation toward Look-Ahead target
    const lookAheadTarget = currentTargetPos.clone().add(tangent.clone().multiplyScalar(5.0));
    const toTarget = lookAheadTarget.clone().sub(vehiclePos).normalize();
    const vehicleForward = new THREE.Vector3(-Math.sin(this.vehicle.state.rotationY), 0, -Math.cos(this.vehicle.state.rotationY));

    // Calculate signed angle error
    const cross = vehicleForward.clone().cross(toTarget);
    let steerAngle = vehicleForward.angleTo(toTarget);
    if (cross.y < 0) steerAngle = -steerAngle;

    const steerInput = Math.max(-1.0, Math.min(1.0, steerAngle * 2.0));

    // 7. Pass Input to VehiclePhysics
    this.vehicle.state.throttle = throttleInput;
    this.vehicle.state.steering = steerInput;
    this.vehicle.state.handbrake = handbrakeInput;

    this.vehicle.physics.stepFixed(
      {
        throttle: throttleInput,
        reverse: 0,
        steer: steerInput,
        handbrake: handbrakeInput,
        exitVehicle: false
      },
      fixedDt,
      environmentMeshes
    );
  }
}
