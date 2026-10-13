import { NPCArchetype } from '../npc/NPCTypes';
import { SeededRandom } from '../utils/SeededRandom';

export type CharacterRole = NPCArchetype | 'player';

export interface CharacterAppearanceOptions {
  /** Stable per-person seed. Use NPCData.seed so a character keeps the same look. */
  seed?: number;
  /** Explicit authored model override for bespoke, named characters. */
  assetId?: string;
  /** Linear multipliers applied to the source skin texture. */
  skinToneMultiplier?: { r: number; g: number; b: number };
  /** Optional clothing tint for the upper garment. */
  outfitColor?: number;
}

export interface CharacterVisualProfile {
  assetId: string;
  skinToneMultiplier?: { r: number; g: number; b: number };
  outfitTopColor?: number;
  outfitBottomColor?: number;
}

interface RoleLook {
  assets: readonly string[];
  tops: readonly number[];
  bottoms: readonly number[];
  canTintSkin?: boolean;
}

const skinToneMultipliers = [
  { r: 0.76, g: 0.68, b: 0.61 },
  { r: 0.88, g: 0.80, b: 0.72 },
  { r: 0.98, g: 0.90, b: 0.82 },
  { r: 1.05, g: 0.98, b: 0.91 }
] as const;

const darkTrousers = [0x26313a, 0x353b3b, 0x454039, 0x303d36, 0x3e3540] as const;

const roleLooks: Record<CharacterRole, RoleLook> = {
  player: {
    assets: ['char_player_01'],
    tops: [],
    bottoms: []
  },
  student: {
    assets: ['char_pedestrian_student_01'],
    tops: [0x28445a, 0x40594b, 0x714d45, 0x62526f, 0x867355],
    bottoms: darkTrousers
  },
  young_professional: {
    assets: ['char_pedestrian_business_01', 'char_driver_01'],
    tops: [0x27384c, 0x45494a, 0x5c5147, 0x405047, 0x543c48, 0x777264],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  office_worker: {
    assets: ['char_pedestrian_business_01'],
    tops: [0x27384c, 0x45494a, 0x5c5147, 0x405047, 0x543c48, 0x777264],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  business_owner: {
    assets: ['char_pedestrian_business_01', 'char_worker_street_01'],
    tops: [0x344b4a, 0x67513f, 0x4d485c, 0x40504a, 0x7c6953],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  market_vendor: {
    assets: ['char_worker_street_01'],
    tops: [0x465648, 0x665441, 0x405460, 0x6c514d, 0x77715d],
    bottoms: darkTrousers
  },
  shopkeeper: {
    assets: ['char_worker_street_01', 'char_pedestrian_business_01'],
    tops: [0x465648, 0x665441, 0x405460, 0x6c514d, 0x77715d],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  driver: {
    assets: ['char_driver_01'],
    tops: [0x324d4a, 0x3a4b5d, 0x685540, 0x50584d],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  security_guard: {
    assets: ['char_guard_security_01'],
    tops: [0x34443d, 0x3f493f],
    bottoms: [0x303a34, 0x394039]
  },
  teacher: {
    assets: ['char_pedestrian_business_01'],
    tops: [0x48514c, 0x5b5148, 0x35495a, 0x716858],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  health_worker: {
    assets: ['char_pedestrian_business_01'],
    tops: [0x3f5b57, 0x435369, 0x635752],
    bottoms: darkTrousers,
    canTintSkin: true
  },
  musician: {
    assets: ['char_pedestrian_casual_01'],
    tops: [0x405169, 0x704945, 0x4e5c46, 0x62506e, 0x8b6548],
    bottoms: darkTrousers
  },
  artist: {
    assets: ['char_pedestrian_casual_01', 'char_worker_street_01'],
    tops: [0x405169, 0x704945, 0x4e5c46, 0x62506e, 0x8b6548],
    bottoms: darkTrousers
  },
  unemployed: {
    assets: ['char_pedestrian_casual_01', 'char_player_01'],
    tops: [0x46504a, 0x4c5260, 0x675247, 0x625b4c],
    bottoms: darkTrousers
  }
};

export function getCharacterVisualProfile(
  archetype: CharacterRole,
  seed: number,
  overrides: CharacterAppearanceOptions = {}
): CharacterVisualProfile {
  const roleLook = roleLooks[archetype] || roleLooks.office_worker;
  const random = new SeededRandom(seed);
  const assetId = overrides.assetId || random.choice([...roleLook.assets]);

  // Keep the protagonist's authored costume and material colors intact.
  if (archetype === 'player') return { assetId };

  const profile: CharacterVisualProfile = { assetId };
  if (roleLook.canTintSkin) {
    profile.skinToneMultiplier = overrides.skinToneMultiplier || random.choice([...skinToneMultipliers]);
  }

  if (roleLook.tops.length > 0) {
    profile.outfitTopColor = overrides.outfitColor ?? random.choice([...roleLook.tops]);
  }
  if (roleLook.bottoms.length > 0) {
    profile.outfitBottomColor = random.choice([...roleLook.bottoms]);
  }

  return profile;
}

