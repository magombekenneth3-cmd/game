import { ReputationSnapshot } from './InteractionTypes';

export interface InteractionTelemetryData {
  totalInteractions: number;
  activeTargetsCount: number;
  activeConversationsCount: number;
  relationshipRecordsCount: number;
  reputationSnapshot: ReputationSnapshot;
}

export class InteractionTelemetry {
  public totalInteractions: number = 0;

  public recordInteraction(): void {
    this.totalInteractions++;
  }
}
