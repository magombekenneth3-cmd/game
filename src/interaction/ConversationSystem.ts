import { NPC } from '../npc/NPC';
import { NPCActivityType } from '../npc/NPCTypes';
import {
  ConversationNode,
  ConversationResponse,
  NPCTone,
  RelationshipState
} from './InteractionTypes';
import { RelationshipSystem } from './RelationshipSystem';
import { ConversationContextManager } from './ConversationContext';

export interface ActiveConversationState {
  npc: NPC;
  previousActivity: NPCActivityType;
  currentNode: ConversationNode;
  tone: NPCTone;
  relationship: RelationshipState;
}

export class ConversationSystem {
  public activeConversation: ActiveConversationState | null = null;
  public relationshipSystem: RelationshipSystem;
  public worldSeed: number;

  private onConversationChangeCallback?: (state: ActiveConversationState | null) => void;

  constructor(relationshipSystem: RelationshipSystem, worldSeed: number = 1337) {
    this.relationshipSystem = relationshipSystem;
    this.worldSeed = worldSeed;
  }

  public setOnConversationChange(callback: (state: ActiveConversationState | null) => void): void {
    this.onConversationChangeCallback = callback;
  }

  public startConversation(playerId: string, npc: NPC, timeOfDay: number = 12.0): ActiveConversationState {
    // 1. Safety check: Store previous NPC state/activity
    const previousActivity = npc.state.currentActivity;

    // Set NPC activity to SOCIALIZE / SOCIAL_INTERACTION to pause movement
    npc.state.setActivity('SOCIALIZE');

    // 2. Fetch relationship and memory
    const rel = this.relationshipSystem.getRelationship(playerId, npc.state.data.id);
    const memory = this.relationshipSystem.memoryManager.getMemory(npc.state.data.id);

    // 3. Evaluate NPC tone
    const tone = ConversationContextManager.determineNPCTone(
      npc.state.data.personality,
      rel,
      this.worldSeed,
      memory.interactionCount
    );

    // 4. Generate root node
    const greetingText = ConversationContextManager.formatGreeting(npc.state.data, tone, rel);
    const rootNode = this.generateRootNode(npc, rel);
    rootNode.text = greetingText;

    this.activeConversation = {
      npc,
      previousActivity,
      currentNode: rootNode,
      tone,
      relationship: rel
    };

    // Record memory interaction
    this.relationshipSystem.memoryManager.recordInteraction(
      npc.state.data.id,
      'GREET',
      timeOfDay,
      true
    );

    // Increase familiarity upon greeting
    this.relationshipSystem.updateRelationship(playerId, npc.state.data.id, 0, 0, 5, 0);

    if (this.onConversationChangeCallback) {
      this.onConversationChangeCallback(this.activeConversation);
    }

    console.log(`💬 Started conversation with ${npc.state.data.firstName} ${npc.state.data.lastName} (Tone: ${tone})`);
    return this.activeConversation;
  }

  public selectResponse(playerId: string, responseId: string): ConversationNode | null {
    if (!this.activeConversation) return null;

    const current = this.activeConversation.currentNode;
    const selected = current.responses?.find((r) => r.id === responseId);

    if (!selected) return null;

    // Apply relationship deltas
    this.relationshipSystem.updateRelationship(
      playerId,
      this.activeConversation.npc.state.data.id,
      selected.affinityDelta || 0,
      selected.trustDelta || 0,
      selected.familiarityDelta || 0,
      selected.respectDelta || 0
    );

    // Record topic if present
    if (selected.topic) {
      this.relationshipSystem.memoryManager.recordInteraction(
        this.activeConversation.npc.state.data.id,
        'TALK',
        12.0,
        (selected.affinityDelta || 0) >= 0,
        selected.topic
      );
    }

    // Check for Goodbye / Exit
    if (!selected.nextNodeId || selected.id === 'resp_goodbye') {
      this.endConversation();
      return null;
    }

    // Advance to next conversation node
    const nextNode = this.generateNextNode(selected, this.activeConversation.npc);
    this.activeConversation.currentNode = nextNode;

    if (this.onConversationChangeCallback) {
      this.onConversationChangeCallback(this.activeConversation);
    }

    return nextNode;
  }

  public endConversation(): void {
    if (!this.activeConversation) return;

    const { npc, previousActivity } = this.activeConversation;

    // Restore NPC to previous activity state cleanly
    npc.state.setActivity(previousActivity);

    console.log(`💬 Ended conversation with ${npc.state.data.firstName}. Restored activity to ${previousActivity}.`);
    this.activeConversation = null;

    if (this.onConversationChangeCallback) {
      this.onConversationChangeCallback(null);
    }
  }

  private generateRootNode(npc: NPC, rel: RelationshipState): ConversationNode {
    const isFriend = rel.affinity > 30;

    const responses: ConversationResponse[] = [
      {
        id: 'resp_1',
        text: "I'm exploring the Nairobi neighborhood.",
        nextNodeId: 'node_neighborhood',
        affinityDelta: 2,
        familiarityDelta: 3,
        topic: 'neighborhood'
      },
      {
        id: 'resp_2',
        text: `What do you do around here, ${npc.state.data.firstName}?`,
        nextNodeId: 'node_occupation',
        affinityDelta: 3,
        familiarityDelta: 5,
        topic: 'occupation'
      }
    ];

    if (isFriend) {
      responses.push({
        id: 'resp_follow',
        text: 'Would you like to walk with me for a bit?',
        nextNodeId: 'node_follow',
        affinityDelta: 5,
        familiarityDelta: 10,
        topic: 'companionship'
      });
    }

    responses.push({
      id: 'resp_goodbye',
      text: 'Good to meet you. See you around!',
      affinityDelta: 1,
      familiarityDelta: 1
    });

    return {
      id: 'node_root',
      speaker: 'NPC',
      text: '',
      responses
    };
  }

  private generateNextNode(selected: ConversationResponse, npc: NPC): ConversationNode {
    switch (selected.nextNodeId) {
      case 'node_neighborhood':
        return {
          id: 'node_neighborhood',
          speaker: 'NPC',
          text: `Kilimani is a bustling district! We have great spots like Yaya Mall, local eateries, and Club Velvet for nightlife.`,
          responses: [
            {
              id: 'resp_sub_1',
              text: 'Thanks for the local info!',
              nextNodeId: 'node_root',
              affinityDelta: 2
            },
            {
              id: 'resp_goodbye',
              text: 'Thanks, see you around!'
            }
          ]
        };

      case 'node_occupation':
        return {
          id: 'node_occupation',
          speaker: 'NPC',
          text: `I work as a ${npc.state.data.occupation || npc.state.data.archetype}. It keeps me busy around here!`,
          responses: [
            {
              id: 'resp_sub_2',
              text: 'Sounds interesting! Hard work pays off.',
              nextNodeId: 'node_root',
              affinityDelta: 4
            },
            {
              id: 'resp_goodbye',
              text: 'Nice talking to you!'
            }
          ]
        };

      case 'node_follow':
        return {
          id: 'node_follow',
          speaker: 'NPC',
          text: `Sure, I'd love to tag along for a while!`,
          responses: [
            {
              id: 'resp_goodbye',
              text: 'Let\'s go!'
            }
          ]
        };

      default:
        return {
          id: 'node_end',
          speaker: 'NPC',
          text: `Take care!`,
          responses: [
            { id: 'resp_goodbye', text: 'Goodbye!' }
          ]
        };
    }
  }
}
