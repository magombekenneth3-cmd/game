import { NPC } from './NPC';
import { ActivityDestination } from './NPCTypes';

export interface NPCTelemetryStats {
  totalNPCs: number;
  detailedNPCs: number;
  abstractNPCs: number;
  updatesThisFrame: number;
}

export class NPCManager {
  public npcs: Map<string, NPC> = new Map();
  public destinations: Map<string, ActivityDestination> = new Map();

  constructor() {}

  public registerNPC(npc: NPC): void {
    this.npcs.set(npc.state.data.id, npc);
  }

  public registerDestination(dest: ActivityDestination): void {
    this.destinations.set(dest.id, dest);
  }

  public getTelemetry(): NPCTelemetryStats {
    let detailed = 0;
    let abstractCount = 0;

    this.npcs.forEach((npc) => {
      if (npc.state.simulationTier === 'TIER0_VICINITY' || npc.state.simulationTier === 'TIER1_NEARBY') {
        detailed++;
      } else {
        abstractCount++;
      }
    });

    return {
      totalNPCs: this.npcs.size,
      detailedNPCs: detailed,
      abstractNPCs: abstractCount,
      updatesThisFrame: 0
    };
  }

  public clear(): void {
    this.npcs.forEach((npc) => npc.dispose());
    this.npcs.clear();
    this.destinations.clear();
  }
}
