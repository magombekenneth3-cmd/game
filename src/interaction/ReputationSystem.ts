import { ReputationCategory, ReputationSnapshot } from './InteractionTypes';

export class ReputationSystem {
  private playerReputations: Map<string, ReputationSnapshot> = new Map();

  public getSnapshot(playerId: string): ReputationSnapshot {
    if (!this.playerReputations.has(playerId)) {
      this.playerReputations.set(playerId, {
        STREET: 0,
        BUSINESS: 0,
        COMMUNITY: 0,
        SOCIAL: 0,
        TRUST: 0
      });
    }
    return { ...this.playerReputations.get(playerId)! };
  }

  public getReputation(playerId: string, category: ReputationCategory): number {
    const snapshot = this.getSnapshot(playerId);
    return snapshot[category];
  }

  public changeReputation(
    playerId: string,
    category: ReputationCategory,
    amount: number,
    _reason?: string
  ): number {
    const snapshot = this.getSnapshot(playerId);
    const updated = Math.min(100, Math.max(-100, snapshot[category] + amount));
    snapshot[category] = updated;
    this.playerReputations.set(playerId, snapshot);

    return updated;
  }
}
