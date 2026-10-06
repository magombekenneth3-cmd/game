import * as THREE from 'three';

export type InteractionTargetType = 'NPC' | 'DOOR' | 'VEHICLE' | 'OBJECT' | 'LOCATION';

export type InteractionActionId =
  | 'TALK'
  | 'GREET'
  | 'ASK_ABOUT'
  | 'INTRODUCE_SELF'
  | 'SAY_GOODBYE'
  | 'FOLLOW'
  | 'STOP_FOLLOWING'
  | 'ENTER'
  | 'EXIT'
  | 'USE'
  | 'INSPECT'
  // Future action placeholders:
  | 'BUY'
  | 'SELL'
  | 'HIRE'
  | 'DATE'
  | 'THREATEN'
  | 'BRIBE'
  | 'STEAL'
  | 'GIVE'
  | 'REQUEST_FAVOR'
  | 'START_MISSION';

export type ConversationSpeaker = 'PLAYER' | 'NPC';

export type NPCTone = 'friendly' | 'neutral' | 'reserved' | 'enthusiastic' | 'suspicious';

export type ReputationCategory = 'STREET' | 'BUSINESS' | 'COMMUNITY' | 'SOCIAL' | 'TRUST';

export interface InteractionTarget {
  id: string;
  type: InteractionTargetType;
  position: THREE.Vector3;
  interactionRadius: number;
  enabled: boolean;
  displayName: string;
  data?: unknown;
}

export interface RelationshipState {
  affinity: number;    // -100 to +100
  trust: number;       // 0 to 100
  familiarity: number; // 0 to 100
  respect: number;     // -100 to +100
}

export type ReputationSnapshot = Record<ReputationCategory, number>;

export interface InteractionContext {
  playerId: string;
  targetId: string;
  targetType: InteractionTargetType;
  distance: number;
  timeOfDay: number;
  locationId?: string;
  relationship?: RelationshipState;
  reputation?: ReputationSnapshot;
  targetData?: unknown;
}

export interface InteractionAction {
  id: InteractionActionId;
  displayName: string;
  description?: string;
  handler?: (context: InteractionContext) => void;
}

export interface InteractionMemory {
  interactionCount: number;
  lastInteractionTime: number;
  lastInteractionType: string;
  positiveInteractions: number;
  negativeInteractions: number;
  topicsDiscussed: string[];
}

export interface RelationshipPersistence {
  playerId: string;
  npcId: string;
  relationship: RelationshipState;
  memory: InteractionMemory;
}

export interface ConversationResponse {
  id: string;
  text: string;
  nextNodeId?: string;
  actionId?: InteractionActionId;
  affinityDelta?: number;
  trustDelta?: number;
  familiarityDelta?: number;
  respectDelta?: number;
  topic?: string;
}

export interface ConversationNode {
  id: string;
  speaker: ConversationSpeaker;
  text: string;
  responses?: ConversationResponse[];
}
