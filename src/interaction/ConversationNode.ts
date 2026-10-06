import { ConversationNode, ConversationResponse } from './InteractionTypes';

export class ConversationNodeBuilder {
  public static createNode(
    id: string,
    speaker: 'PLAYER' | 'NPC',
    text: string,
    responses: ConversationResponse[] = []
  ): ConversationNode {
    return {
      id,
      speaker,
      text,
      responses
    };
  }

  public static createResponse(
    id: string,
    text: string,
    nextNodeId?: string,
    affinityDelta: number = 0,
    trustDelta: number = 0,
    familiarityDelta: number = 0,
    topic?: string
  ): ConversationResponse {
    return {
      id,
      text,
      nextNodeId,
      affinityDelta,
      trustDelta,
      familiarityDelta,
      topic
    };
  }
}
