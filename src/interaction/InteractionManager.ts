import * as THREE from 'three';
import { InteractionSystem } from '../player/InteractionSystem';
import { NPCManager } from '../npc/NPCManager';
import { NPC } from '../npc/NPC';
import {
  InteractionTarget,
  InteractionTargetType,
  InteractionContext,
  InteractionAction,
  InteractionActionId
} from './InteractionTypes';
import { InteractionTargetHelper } from './InteractionTarget';
import { InteractionContextBuilder } from './InteractionContext';
import { InteractionResolver } from './InteractionResolver';
import { RelationshipSystem } from './RelationshipSystem';
import { ReputationSystem } from './ReputationSystem';
import { SocialLocationSystem } from './SocialLocationSystem';
import { ConversationSystem } from './ConversationSystem';
import { InteractionTelemetry, InteractionTelemetryData } from './InteractionTelemetry';

export class InteractionManager {
  public targets: Map<string, InteractionTarget> = new Map();
  public relationshipSystem: RelationshipSystem;
  public reputationSystem: ReputationSystem;
  public socialLocationSystem: SocialLocationSystem;
  public conversationSystem: ConversationSystem;
  public telemetry: InteractionTelemetry;

  private legacyInteractionSystem?: InteractionSystem;
  private npcManager?: NPCManager;
  private worldSeed: number;

  constructor(
    legacyInteractionSystem?: InteractionSystem,
    npcManager?: NPCManager,
    worldSeed: number = 1337
  ) {
    this.legacyInteractionSystem = legacyInteractionSystem;
    this.npcManager = npcManager;
    this.worldSeed = worldSeed;

    this.relationshipSystem = new RelationshipSystem();
    this.reputationSystem = new ReputationSystem();
    this.socialLocationSystem = new SocialLocationSystem();
    this.conversationSystem = new ConversationSystem(this.relationshipSystem, this.worldSeed);
    this.telemetry = new InteractionTelemetry();
  }

  public registerTarget(target: InteractionTarget): void {
    this.targets.set(target.id, target);

    if (this.legacyInteractionSystem) {
      this.legacyInteractionSystem.registerInteractable({
        id: target.id,
        displayName: target.displayName,
        interactionType: target.type === 'NPC' ? 'npc' : 'shop',
        position: target.position,
        interactionRadius: target.interactionRadius,
        canInteract: () => target.enabled,
        interact: () => this.triggerTargetAction(target.id, 'TALK', 'player_1')
      });
    }
  }

  public unregisterTarget(id: string): void {
    this.targets.delete(id);
    if (this.legacyInteractionSystem) {
      this.legacyInteractionSystem.unregisterInteractable(id);
    }
  }

  public registerNPCTargets(npcs: Map<string, NPC>): number {
    let registeredCount = 0;
    npcs.forEach((npc) => {
      const targetId = `target_npc_${npc.state.data.id}`;
      if (!this.targets.has(targetId)) {
        const target = InteractionTargetHelper.createTarget(
          targetId,
          'NPC',
          `${npc.state.data.firstName} ${npc.state.data.lastName}`,
          npc.state.currentPosition,
          3.5,
          true,
          npc
        );
        this.registerTarget(target);
        registeredCount++;
      } else {
        const target = this.targets.get(targetId)!;
        target.position.copy(npc.state.currentPosition);
      }
    });

    return registeredCount;
  }

  public findNearestTarget(playerPos: THREE.Vector3, type?: InteractionTargetType): InteractionTarget | undefined {
    let nearest: InteractionTarget | undefined;
    let minDistSq = Infinity;

    this.targets.forEach((target) => {
      if (target.enabled && (!type || target.type === type)) {
        const distSq = playerPos.distanceToSquared(target.position);
        if (distSq <= target.interactionRadius * target.interactionRadius && distSq < minDistSq) {
          minDistSq = distSq;
          nearest = target;
        }
      }
    });

    return nearest;
  }

  public resolveAvailableActionsForTarget(
    playerId: string,
    playerPos: THREE.Vector3,
    target: InteractionTarget,
    timeOfDay: number = 12.0
  ): { context: InteractionContext; actions: InteractionAction[] } {
    let relationship;
    if (target.type === 'NPC' && target.data && (target.data as NPC).state) {
      const npcId = (target.data as NPC).state.data.id;
      relationship = this.relationshipSystem.getRelationship(playerId, npcId);
    }

    const reputationSnapshot = this.reputationSystem.getSnapshot(playerId);

    const context = InteractionContextBuilder.buildContext(
      playerId,
      playerPos,
      target,
      timeOfDay,
      undefined,
      relationship,
      reputationSnapshot
    );

    const actions = InteractionResolver.resolveAvailableActions(context);
    return { context, actions };
  }

  public triggerTargetAction(
    targetId: string,
    actionId: InteractionActionId,
    playerId: string = 'player_1',
    _playerPos: THREE.Vector3 = new THREE.Vector3()
  ): boolean {
    const target = this.targets.get(targetId);
    if (!target || !target.enabled) return false;

    this.telemetry.recordInteraction();

    if (target.type === 'NPC' && target.data) {
      const npc = target.data as NPC;
      if (actionId === 'TALK' || actionId === 'GREET' || actionId === 'INTRODUCE_SELF') {
        this.conversationSystem.startConversation(playerId, npc);
        return true;
      }
    }

    return false;
  }

  public update(playerPos: THREE.Vector3, isInteractKeyPressed: boolean, playerId: string = 'player_1'): void {
    if (this.npcManager) {
      this.registerNPCTargets(this.npcManager.npcs);
    }

    const nearest = this.findNearestTarget(playerPos);
    if (nearest && isInteractKeyPressed && !this.conversationSystem.activeConversation) {
      const { actions } = this.resolveAvailableActionsForTarget(playerId, playerPos, nearest);
      if (actions.length > 0) {
        this.triggerTargetAction(nearest.id, actions[0].id, playerId, playerPos);
      }
    }
  }

  public getTelemetryData(playerId: string = 'player_1'): InteractionTelemetryData {
    return {
      totalInteractions: this.telemetry.totalInteractions,
      activeTargetsCount: this.targets.size,
      activeConversationsCount: this.conversationSystem.activeConversation ? 1 : 0,
      relationshipRecordsCount: 1,
      reputationSnapshot: this.reputationSystem.getSnapshot(playerId)
    };
  }
}
