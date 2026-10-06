import { RelationshipState, RelationshipPersistence } from './InteractionTypes';
import { InteractionMemoryManager } from './InteractionMemory';

export class RelationshipSystem {
  private relationships: Map<string, RelationshipState> = new Map();
  public memoryManager: InteractionMemoryManager;

  constructor(memoryManager?: InteractionMemoryManager) {
    this.memoryManager = memoryManager || new InteractionMemoryManager();
  }

  private getKey(playerId: string, npcId: string): string {
    return `${playerId}:${npcId}`;
  }

  public getRelationship(playerId: string, npcId: string): RelationshipState {
    const key = this.getKey(playerId, npcId);
    if (!this.relationships.has(key)) {
      this.relationships.set(key, {
        affinity: 0,
        trust: 50,
        familiarity: 0,
        respect: 0
      });
    }
    return this.relationships.get(key)!;
  }

  public updateRelationship(
    playerId: string,
    npcId: string,
    deltaAffinity: number = 0,
    deltaTrust: number = 0,
    deltaFamiliarity: number = 0,
    deltaRespect: number = 0
  ): RelationshipState {
    const rel = this.getRelationship(playerId, npcId);

    rel.affinity = Math.min(100, Math.max(-100, rel.affinity + deltaAffinity));
    rel.trust = Math.min(100, Math.max(0, rel.trust + deltaTrust));
    rel.familiarity = Math.min(100, Math.max(0, rel.familiarity + deltaFamiliarity));
    rel.respect = Math.min(100, Math.max(-100, rel.respect + deltaRespect));

    return rel;
  }

  public serialize(playerId: string, npcId: string): RelationshipPersistence {
    const relationship = this.getRelationship(playerId, npcId);
    const memory = this.memoryManager.getMemory(npcId);

    return {
      playerId,
      npcId,
      relationship: { ...relationship },
      memory: { ...memory }
    };
  }

  public deserialize(record: RelationshipPersistence): void {
    const key = this.getKey(record.playerId, record.npcId);
    this.relationships.set(key, { ...record.relationship });
    this.memoryManager.setMemory(record.npcId, { ...record.memory });
  }

  public clear(): void {
    this.relationships.clear();
    this.memoryManager.clear();
  }
}
