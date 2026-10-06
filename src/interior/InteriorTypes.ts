import * as THREE from 'three';
import { EnvironmentActivityTag } from '../environment/EnvironmentTypes';

export type { EnvironmentActivityTag };

export type BuildingInteractionTier = 'EXTERIOR_ONLY' | 'ENTERABLE' | 'FUNCTIONAL';

export type BuildingClassification =
  | 'RESIDENTIAL'
  | 'APARTMENT'
  | 'OFFICE'
  | 'RETAIL'
  | 'RESTAURANT'
  | 'NIGHTCLUB'
  | 'HOTEL'
  | 'GYM'
  | 'CLINIC'
  | 'WAREHOUSE'
  | 'WORKSHOP'
  | 'GARAGE'
  | 'MARKET'
  | 'COMMUNITY'
  | 'CONSTRUCTION'
  | 'MIXED_USE';

export type InteriorRoomType =
  | 'ENTRY'
  | 'LOBBY'
  | 'SHOP_FLOOR'
  | 'DINING'
  | 'KITCHEN'
  | 'OFFICE'
  | 'BEDROOM'
  | 'LIVING_ROOM'
  | 'BATHROOM'
  | 'STORAGE'
  | 'BAR'
  | 'DANCE_FLOOR'
  | 'MAIN_FLOOR'
  | 'DJ_BOOTH'
  | 'SEATING'
  | 'VIP'
  | 'GYM_FLOOR'
  | 'RECEPTION'
  | 'CORRIDOR'
  | 'STAIRWELL'
  | 'GARAGE'
  | 'WORKSHOP'
  | 'WAREHOUSE';

export type SemanticLocationType =
  | 'SHOP'
  | 'RESTAURANT'
  | 'CLUB'
  | 'HOME'
  | 'OFFICE'
  | 'GYM'
  | 'HOTEL'
  | 'GARAGE'
  | 'WAREHOUSE'
  | 'SOCIAL'
  | 'TRANSIT';

export type InteriorLODState = 'INTERIOR_INACTIVE' | 'INTERIOR_BACKGROUND' | 'INTERIOR_ACTIVE';

export interface InteriorRoom {
  id: string;
  type: InteriorRoomType;
  displayName: string;
  bounds: THREE.Box3;
  entrances: string[]; // Array of connected door IDs
  activityTags: EnvironmentActivityTag[];
}

export interface InteriorSemanticLocation {
  id: string;
  buildingId: string;
  roomId: string;
  type: SemanticLocationType;
  position: THREE.Vector3;
  capacity: number;
  displayName?: string;
  activityTags: EnvironmentActivityTag[];
}

export interface InteriorDoor {
  id: string;
  buildingId: string;
  position: THREE.Vector3; // Exterior door position on building footprint
  facing: THREE.Vector3;
  destinationInteriorId: string;
  destinationRoomId: string;
  interiorSpawnPosition: THREE.Vector3; // Position inside interior when entering
  locked: boolean;
  isExteriorDoor: boolean;
  name?: string;
}

export interface InteriorPersistentState {
  interiorId: string;
  lastVisitTime: number;
  objectStates: Record<string, unknown>;
}

export interface BuildingInteriorMetadata {
  buildingId: string;
  buildingName: string;
  classification: BuildingClassification;
  interactionTier: BuildingInteractionTier;
  footprintCenter: THREE.Vector3;
  footprintWidth: number;
  footprintDepth: number;
  floors: number;
  doors: InteriorDoor[];
  semanticLocations: InteriorSemanticLocation[];
}
