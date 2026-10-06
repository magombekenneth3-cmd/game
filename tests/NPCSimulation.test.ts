import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { NPCSpawner } from '../src/npc/NPCSpawner';
import { NPCPersonalityGenerator } from '../src/npc/NPCPersonality';
import { NPCNeedsManager } from '../src/npc/NPCNeeds';
import { NPCScheduleGenerator } from '../src/npc/NPCSchedule';
import { NPCActivityPlanner } from '../src/npc/NPCActivity';
import { NPCLODManager } from '../src/npc/NPCLOD';
import { NPC } from '../src/npc/NPC';
import { RoadGraph, RoadGraphEdge } from '../src/world/RoadGraph';

describe('Phase 4 Living Population Simulation Tests', () => {
  it('generates deterministic NPC identities from a seed', () => {
    const spawner = new NPCSpawner();
    const homePos = new THREE.Vector3(10, 0, 20);

    const npc1 = spawner.generateDeterministicNPC('npc_101', 9999, homePos);
    const npc2 = spawner.generateDeterministicNPC('npc_101', 9999, homePos);

    expect(npc1.firstName).toBe(npc2.firstName);
    expect(npc1.lastName).toBe(npc2.lastName);
    expect(npc1.archetype).toBe(npc2.archetype);
    expect(npc1.personality.nightlifePreference).toBe(npc2.personality.nightlifePreference);
  });

  it('evaluates personality activity preferences (Nightlife preference boosts CLUB at night)', () => {
    const highNightlifePerson = {
      sociability: 0.8, ambition: 0.5, riskTolerance: 0.7,
      nightlifePreference: 0.9, friendliness: 0.7, discipline: 0.4
    };

    const nightScore = NPCPersonalityGenerator.evaluateActivityPreference(highNightlifePerson, 'CLUB', 23.0);
    const dayScore = NPCPersonalityGenerator.evaluateActivityPreference(highNightlifePerson, 'CLUB', 14.0);

    expect(nightScore).toBeGreaterThan(dayScore);
  });

  it('updates needs decay over time and replenishes energy during SLEEP', () => {
    const needs = { energy: 40, hunger: 50, social: 50, entertainment: 50, money: 5000, safety: 90 };

    // 1 game hour of SLEEP
    NPCNeedsManager.updateNeeds(needs, 'SLEEP', 60, 60);
    expect(needs.energy).toBe(65);

    // 1 game hour of awake WORK
    NPCNeedsManager.updateNeeds(needs, 'WORK', 60, 60);
    expect(needs.energy).toBe(61);
  });

  it('returns correct schedule activity for a given hour of day', () => {
    const personality = { sociability: 0.8, ambition: 0.8, riskTolerance: 0.5, nightlifePreference: 0.3, friendliness: 0.7, discipline: 0.8 };
    const schedule = NPCScheduleGenerator.generateSchedule(123, 'office_worker', personality);

    const morningActivity = NPCScheduleGenerator.getActivityForTime(schedule, 9.0); // 9:00 AM
    const nightActivity = NPCScheduleGenerator.getActivityForTime(schedule, 2.0);   // 2:00 AM

    expect(morningActivity.activityType).toBe('WORK');
    expect(nightActivity.activityType).toBe('SLEEP');
  });

  it('executes CLUB activity selection pipeline when nightlife conditions are met', () => {
    const planner = new NPCActivityPlanner();
    const scene = new THREE.Scene();
    const spawner = new NPCSpawner();

    planner.registerDestination({
      id: 'club_kileleshwa',
      displayName: 'Kileleshwa Club',
      position: new THREE.Vector3(50, 0, 50),
      activities: ['CLUB', 'SOCIALIZE'],
      tags: ['nightlife'],
      capacity: 100,
      currentOccupancy: 0
    });

    // Generate student with high nightlife preference
    const npcData = spawner.generateDeterministicNPC('student_1', 777, new THREE.Vector3(0, 0, 0));
    npcData.personality.nightlifePreference = 0.95;
    npcData.schedule = NPCScheduleGenerator.generateSchedule(777, 'student', npcData.personality);

    // At 23:00 (11:00 PM) night time
    const plan = planner.planNextActivity(npcData, 23.0);

    expect(plan.activityType).toBe('CLUB');
    expect(plan.targetDestination).toBeDefined();
    expect(plan.targetDestination!.displayName).toBe('Kileleshwa Club');
  });

  it('evaluates distance LOD simulation tiers correctly', () => {
    const playerPos = new THREE.Vector3(0, 0, 0);

    const nearPos = new THREE.Vector3(30, 0, 20); // 36m -> TIER0_VICINITY
    const midPos = new THREE.Vector3(120, 0, 0);  // 120m -> TIER1_NEARBY
    const farPos = new THREE.Vector3(600, 0, 0);  // 600m -> TIER3_ABSTRACT

    expect(NPCLODManager.evaluateTier(nearPos, playerPos)).toBe('TIER0_VICINITY');
    expect(NPCLODManager.evaluateTier(midPos, playerPos)).toBe('TIER1_NEARBY');
    expect(NPCLODManager.evaluateTier(farPos, playerPos)).toBe('TIER3_ABSTRACT');
  });

  it('modifies relationship familiarity and affinity during social interactions', () => {
    const scene = new THREE.Scene();
    const spawner = new NPCSpawner();

    const npc1 = new NPC(spawner.generateDeterministicNPC('n1', 1, new THREE.Vector3(0, 0, 0)), scene);
    const npc2 = new NPC(spawner.generateDeterministicNPC('n2', 2, new THREE.Vector3(5, 0, 0)), scene);

    npc1.interactWith(npc2);

    const rel1 = npc1.state.data.relationships.get('n2');
    const rel2 = npc2.state.data.relationships.get('n1');

    expect(rel1).toBeDefined();
    expect(rel1!.affinity).toBeGreaterThan(0);
    expect(rel1!.familiarity).toBeGreaterThan(0);
    expect(rel2!.affinity).toBeGreaterThan(0);
  });
});
