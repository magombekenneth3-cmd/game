import * as THREE from 'three';
import { NPCManager } from './NPCManager';
import { NPCActivityPlanner } from './NPCActivity';
import { NPCNavigation } from './NPCNavigation';
import { NPCLODManager } from './NPCLOD';
import { NPCNeedsManager } from './NPCNeeds';
import { RoadGraph } from '../world/RoadGraph';

export class NPCSimulation {
  private manager: NPCManager;
  private planner: NPCActivityPlanner;
  private navigation: NPCNavigation;
  private frameCounter: number = 0;
  public lastUpdatesThisFrame: number = 0;

  constructor(manager: NPCManager, roadGraph: RoadGraph) {
    this.manager = manager;
    this.planner = new NPCActivityPlanner();
    this.navigation = new NPCNavigation(roadGraph);
  }

  public update(playerPos: THREE.Vector3, currentHours: number, deltaSeconds: number): void {
    this.frameCounter++;
    let updates = 0;

    // Sync activity destinations with activity planner
    this.manager.destinations.forEach((dest) => {
      this.planner.registerDestination(dest);
    });

    this.manager.npcs.forEach((npc) => {
      // 1. Evaluate Simulation Tier (LOD) based on distance to player
      const previousTier = npc.state.simulationTier;
      const newTier = NPCLODManager.evaluateTier(npc.state.currentPosition, playerPos);
      npc.state.simulationTier = newTier;

      // 2. Manage 3D Visual Mesh Presence on Tier Transitions
      if (previousTier !== newTier) {
        npc.updateVisualMeshPresence();
      }

      // 3. Throttled Tick Update Check
      if (!NPCLODManager.shouldUpdateThisFrame(newTier, this.frameCounter)) {
        return;
      }

      updates++;

      // 4. Update Needs Decay & Replenishment
      NPCNeedsManager.updateNeeds(npc.state.data.needs, npc.state.currentActivity, deltaSeconds);

      // 5. Evaluate Activity Planner & Schedule
      const plan = this.planner.planNextActivity(npc.state.data, currentHours);
      if (plan.activityType !== npc.state.currentActivity) {
        npc.state.setActivity(plan.activityType, plan.targetDestination);

        // Generate Path Waypoints if destination exists
        if (plan.targetDestination) {
          const waypoints = this.navigation.findPath(npc.state.currentPosition, plan.targetDestination.position);
          npc.state.setPath(waypoints);
        }
      }

      // 6. Update Pedestrian Navigation Movement
      npc.updateMovement(deltaSeconds);
    });

    this.lastUpdatesThisFrame = updates;
  }
}
