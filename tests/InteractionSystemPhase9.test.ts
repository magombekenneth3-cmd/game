import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { InteractionManager } from '../src/interaction/InteractionManager';
import { InteractionTargetHelper } from '../src/interaction/InteractionTarget';
import { InteractionResolver } from '../src/interaction/InteractionResolver';
import { ConversationContextManager } from '../src/interaction/ConversationContext';
import { NPC } from '../src/npc/NPC';
import { NPCSpawner } from '../src/npc/NPCSpawner';

describe('Phase 9 — Core Interaction & Social World Tests', () => {
  let mockScene: THREE.Scene;
  let interactionManager: InteractionManager;
  let spawner: NPCSpawner;
  let mockNPC: NPC;

  beforeEach(() => {
    mockScene = new THREE.Scene();
    spawner = new NPCSpawner();
    const npcData = spawner.generateDeterministicNPC('npc_test_101', 1337, new THREE.Vector3(10, 0, 10));
    mockNPC = new NPC(npcData, mockScene);

    interactionManager = new InteractionManager(undefined, undefined, 1337);
  });

  it('1. resolves interaction targets by type and distance', () => {
    const target = InteractionTargetHelper.createTarget(
      'target_1',
      'NPC',
      'Amina',
      new THREE.Vector3(5, 0, 5),
      3.5
    );
    interactionManager.registerTarget(target);

    const nearest = interactionManager.findNearestTarget(new THREE.Vector3(5, 0, 6));
    expect(nearest).toBeDefined();
    expect(nearest?.id).toBe('target_1');
  });

  it('2. validates interaction radius boundaries', () => {
    const target = InteractionTargetHelper.createTarget(
      'target_2',
      'OBJECT',
      'Kiosk',
      new THREE.Vector3(0, 0, 0),
      3.0
    );

    expect(InteractionTargetHelper.isTargetInRange(target, new THREE.Vector3(1, 0, 1))).toBe(true);
    expect(InteractionTargetHelper.isTargetInRange(target, new THREE.Vector3(5, 0, 5))).toBe(false);
  });

  it('3. resolves contextual actions for unknown vs close friend NPCs', () => {
    const target = InteractionTargetHelper.createTarget('target_npc_1', 'NPC', 'Oduor', new THREE.Vector3(0, 0, 0));

    // Unknown NPC context
    const unknownRes = interactionManager.resolveAvailableActionsForTarget('player_1', new THREE.Vector3(1, 0, 0), target);
    const unknownActionIds = unknownRes.actions.map((a) => a.id);
    expect(unknownActionIds).toContain('GREET');
    expect(unknownActionIds).toContain('INTRODUCE_SELF');
    expect(unknownActionIds).not.toContain('FOLLOW');

    // Close friend context (set high familiarity & affinity)
    interactionManager.relationshipSystem.updateRelationship('player_1', 'npc_test_101', 60, 50, 60, 50);

    const friendTarget = InteractionTargetHelper.createTarget('target_npc_2', 'NPC', 'Oduor', new THREE.Vector3(0, 0, 0), 3.5, true, mockNPC);
    const friendRes = interactionManager.resolveAvailableActionsForTarget('player_1', new THREE.Vector3(1, 0, 0), friendTarget);
    const friendActionIds = friendRes.actions.map((a) => a.id);

    expect(friendActionIds).toContain('FOLLOW');
    expect(friendActionIds).toContain('TALK');
  });

  it('4. manages conversation traversal and response selection', () => {
    const convState = interactionManager.conversationSystem.startConversation('player_1', mockNPC);
    expect(convState).toBeDefined();
    expect(convState.currentNode.id).toBe('node_root');

    const nextNode = interactionManager.conversationSystem.selectResponse('player_1', 'resp_1');
    expect(nextNode).toBeDefined();
    expect(nextNode?.id).toBe('node_neighborhood');
  });

  it('5. evaluates deterministic NPC personality tone and formatting', () => {
    const tone = ConversationContextManager.determineNPCTone(mockNPC.state.data.personality, undefined, 1337, 0);
    expect(['friendly', 'neutral', 'reserved', 'enthusiastic', 'suspicious']).toContain(tone);

    const greeting = ConversationContextManager.formatGreeting(mockNPC.state.data, 'friendly');
    expect(greeting.length).toBeGreaterThan(0);
  });

  it('6. records NPC memory of interactions and topics', () => {
    const memoryMgr = interactionManager.relationshipSystem.memoryManager;
    memoryMgr.recordInteraction('npc_test_101', 'TALK', 14.0, true, 'neighborhood');

    const memory = memoryMgr.getMemory('npc_test_101');
    expect(memory.interactionCount).toBe(1);
    expect(memory.topicsDiscussed).toContain('neighborhood');
    expect(memory.positiveInteractions).toBe(1);
  });

  it('7. modifies and bounds relationship metrics (affinity, trust, familiarity, respect)', () => {
    const relSys = interactionManager.relationshipSystem;
    const rel = relSys.updateRelationship('player_1', 'npc_test_101', 25, 10, 15, 5);

    expect(rel.affinity).toBe(25);
    expect(rel.trust).toBe(60);
    expect(rel.familiarity).toBe(15);
    expect(rel.respect).toBe(5);

    // Bounded check
    const boundedRel = relSys.updateRelationship('player_1', 'npc_test_101', 200, 200, 200, 200);
    expect(boundedRel.affinity).toBe(100);
    expect(boundedRel.trust).toBe(100);
    expect(boundedRel.familiarity).toBe(100);
  });

  it('8. modifies reputation primitives across categories', () => {
    const repSys = interactionManager.reputationSystem;
    const streetRep = repSys.changeReputation('player_1', 'STREET', 15, 'helped_vendor');
    const socialRep = repSys.changeReputation('player_1', 'SOCIAL', 20, 'club_networking');

    expect(streetRep).toBe(15);
    expect(socialRep).toBe(20);
    expect(repSys.getReputation('player_1', 'STREET')).toBe(15);
  });

  it('9. registers social locations and retrieves multipliers', () => {
    const socialSys = interactionManager.socialLocationSystem;
    socialSys.registerLocation({
      id: 'loc_club_velvet',
      locationType: 'CLUB',
      capacity: 200,
      socialMultiplier: 1.5,
      activities: ['CLUB', 'SOCIALIZE'],
      displayName: 'Club Velvet Kilimani'
    });

    const mult = socialSys.getSocialMultiplier('loc_club_velvet');
    expect(mult).toBe(1.5);
  });

  it('10. restores NPC activity state cleanly after conversation ends', () => {
    mockNPC.state.setActivity('WORK');
    expect(mockNPC.state.currentActivity).toBe('WORK');

    interactionManager.conversationSystem.startConversation('player_1', mockNPC);
    expect(mockNPC.state.currentActivity).toBe('SOCIALIZE');

    interactionManager.conversationSystem.endConversation();
    expect(mockNPC.state.currentActivity).toBe('WORK');
  });

  it('11. serializes and deserializes relationship and memory state', () => {
    const relSys = interactionManager.relationshipSystem;
    relSys.updateRelationship('player_1', 'npc_test_101', 30, 20, 10, 5);
    relSys.memoryManager.recordInteraction('npc_test_101', 'TALK', 12.0, true, 'business');

    const serialized = relSys.serialize('player_1', 'npc_test_101');
    expect(serialized.relationship.affinity).toBe(30);
    expect(serialized.memory.topicsDiscussed).toContain('business');

    // Deserialize into new system
    const newRelSys = new (relSys.constructor as any)();
    newRelSys.deserialize(serialized);

    const restoredRel = newRelSys.getRelationship('player_1', 'npc_test_101');
    const restoredMem = newRelSys.memoryManager.getMemory('npc_test_101');
    expect(restoredRel.affinity).toBe(30);
    expect(restoredMem.topicsDiscussed).toContain('business');
  });
});
