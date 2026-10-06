import * as THREE from 'three';

export type NPCArchetype =
  | 'student'
  | 'young_professional'
  | 'office_worker'
  | 'business_owner'
  | 'market_vendor'
  | 'shopkeeper'
  | 'driver'
  | 'security_guard'
  | 'teacher'
  | 'health_worker'
  | 'musician'
  | 'artist'
  | 'unemployed';

export type NPCActivityType =
  | 'WORK'
  | 'SHOP'
  | 'EAT'
  | 'TRAVEL'
  | 'SOCIALIZE'
  | 'DATE'
  | 'CLUB'
  | 'CONCERT'
  | 'GYM'
  | 'HOME'
  | 'SLEEP'
  | 'EVENT';

export type NPCSimulationTier = 'TIER0_VICINITY' | 'TIER1_NEARBY' | 'TIER2_DISTANT' | 'TIER3_ABSTRACT';

export interface NPCPersonality {
  sociability: number;         // 0.0 to 1.0
  ambition: number;            // 0.0 to 1.0
  riskTolerance: number;       // 0.0 to 1.0
  nightlifePreference: number; // 0.0 to 1.0
  friendliness: number;        // 0.0 to 1.0
  discipline: number;          // 0.0 to 1.0
}

export interface NPCNeeds {
  energy: number;        // 0 to 100
  hunger: number;        // 0 to 100 (100 = full, 0 = starving)
  social: number;        // 0 to 100
  entertainment: number; // 0 to 100
  money: number;         // cash units
  safety: number;        // 0 to 100
}

export interface NPCScheduleEntry {
  startHour: number;
  endHour: number;
  activityType: NPCActivityType;
  preferredDestinationTag: string;
}

export interface NPCRelationship {
  targetNpcId: string;
  affinity: number;    // -100 to +100
  trust: number;       // 0 to 100
  familiarity: number; // 0 to 100
}

export interface ActivityDestination {
  id: string;
  displayName: string;
  position: THREE.Vector3;
  activities: NPCActivityType[];
  tags: string[];
  capacity: number;
  currentOccupancy: number;
}

export interface NPCData {
  id: string;
  seed: number;
  firstName: string;
  lastName: string;
  age: number;
  archetype: NPCArchetype;
  occupation: string;
  districtId: string;
  homeLocation: THREE.Vector3;
  workLocation?: THREE.Vector3;
  personality: NPCPersonality;
  needs: NPCNeeds;
  schedule: NPCScheduleEntry[];
  relationships: Map<string, NPCRelationship>;
}
