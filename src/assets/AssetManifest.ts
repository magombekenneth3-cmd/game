import * as THREE from 'three';

export type AssetCategory = 'building' | 'vehicle' | 'character' | 'environment' | 'interior';

export interface AssetAttachmentPoint {
  x: number;
  y: number;
  z: number;
  rotationY?: number;
}

export interface AssetManifestEntry {
  id: string;
  category: AssetCategory;
  sourceFile: string;
  variantFamily: string;
  intendedScale: THREE.Vector3;
  lodLevels: number[];
  boundingDimensions: { width: number; height: number; depth: number };
  attachmentPoints?: Record<string, AssetAttachmentPoint>;
  license: string;
  author: string;
  fallbackAssetId?: string;
}

export const ASSET_MANIFEST: Record<string, AssetManifestEntry> = {
  // --- 1. BUILDINGS (13 Families) ---
  'bld_nairobi_shop_01': {
    id: 'bld_nairobi_shop_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/nairobi_shop_01.glb',
    variantFamily: 'nairobi_shop',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 15, height: 8, depth: 12 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_shop'
  },
  'bld_mixed_use_01': {
    id: 'bld_mixed_use_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/mixed_use_01.glb',
    variantFamily: 'mixed_use',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 22, height: 18, depth: 18 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_mixed_use'
  },
  'bld_modern_apartment_01': {
    id: 'bld_modern_apartment_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/modern_apartment_01.glb',
    variantFamily: 'modern_apartment',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 25, height: 26, depth: 20 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_apartment'
  },
  'bld_upscale_apartment_01': {
    id: 'bld_upscale_apartment_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/upscale_apartment_01.glb',
    variantFamily: 'upscale_apartment',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 28, height: 36, depth: 22 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_apartment'
  },
  'bld_townhouse_01': {
    id: 'bld_townhouse_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/townhouse_01.glb',
    variantFamily: 'townhouse',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 16, height: 10, depth: 14 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_residential'
  },
  'bld_office_block_01': {
    id: 'bld_office_block_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/office_block_01.glb',
    variantFamily: 'office_block',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 30, height: 42, depth: 24 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_office'
  },
  'bld_commercial_tower_01': {
    id: 'bld_commercial_tower_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/commercial_tower_01.glb',
    variantFamily: 'commercial_tower',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 32, height: 85, depth: 26 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_tower'
  },
  'bld_market_kiosk_01': {
    id: 'bld_market_kiosk_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/market_kiosk_01.glb',
    variantFamily: 'market_kiosk',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 4, height: 3.2, depth: 4 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_market'
  },
  'bld_industrial_01': {
    id: 'bld_industrial_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/industrial_01.glb',
    variantFamily: 'industrial',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 35, height: 9, depth: 28 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_warehouse'
  },
  'bld_restaurant_01': {
    id: 'bld_restaurant_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/restaurant_01.glb',
    variantFamily: 'restaurant',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 18, height: 6, depth: 15 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_restaurant'
  },
  'bld_nightclub_01': {
    id: 'bld_nightclub_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/nightclub_01.glb',
    variantFamily: 'nightclub',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 25, height: 12, depth: 22 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_nightclub'
  },
  'bld_hotel_01': {
    id: 'bld_hotel_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/hotel_01.glb',
    variantFamily: 'hotel',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 30, height: 52, depth: 24 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_hotel'
  },
  'bld_construction_01': {
    id: 'bld_construction_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/construction_01.glb',
    variantFamily: 'construction',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 24, height: 20, depth: 20 },
    license: 'Authored Original / ODbL Compliant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_bld_construction'
  },

  // --- 2. VEHICLES (8 Categories) ---
  'veh_matatu_ngong_01': {
    id: 'veh_matatu_ngong_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/matatu_ngong_01.glb',
    variantFamily: 'matatu',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.1, height: 2.2, depth: 5.2 },
    attachmentPoints: {
      driver: { x: -0.6, y: 1.1, z: 1.2 },
      passengerFront: { x: 0.6, y: 1.1, z: 1.2 },
      doorSide: { x: 1.05, y: 0.8, z: 0.2, rotationY: Math.PI / 2 },
      wheelFL: { x: -0.95, y: 0.45, z: 1.8 },
      wheelFR: { x: 0.95, y: 0.45, z: 1.8 },
      wheelRL: { x: -0.95, y: 0.45, z: -1.8 },
      wheelRR: { x: 0.95, y: 0.45, z: -1.8 },
      headlightL: { x: -0.8, y: 0.75, z: 2.5 },
      headlightR: { x: 0.8, y: 0.75, z: 2.5 }
    },
    license: 'Authored Original / Fictional Matatu Culture',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_matatu'
  },
  'veh_sedan_01': {
    id: 'veh_sedan_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/sedan_01.glb',
    variantFamily: 'sedan',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.8, height: 1.4, depth: 4.2 },
    attachmentPoints: {
      driver: { x: -0.5, y: 0.7, z: 0.2 },
      doorDriver: { x: -0.9, y: 0.6, z: 0.2 }
    },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_sedan'
  },
  'veh_suv_01': {
    id: 'veh_suv_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/suv_01.glb',
    variantFamily: 'suv',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.1, height: 1.8, depth: 4.6 },
    attachmentPoints: {
      driver: { x: -0.6, y: 0.9, z: 0.3 }
    },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_suv'
  },
  'veh_boda_boda_01': {
    id: 'veh_boda_boda_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/boda_boda_01.glb',
    variantFamily: 'motorcycle',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 0.8, height: 1.1, depth: 2.0 },
    attachmentPoints: {
      rider: { x: 0, y: 0.75, z: -0.2 }
    },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_boda'
  },

  // --- 3. CHARACTERS ---
  'char_player_01': {
    id: 'char_player_01',
    category: 'character',
    sourceFile: '/assets/models/characters/player_01.glb',
    variantFamily: 'humanoid_hero',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.6, height: 1.8, depth: 0.4 },
    attachmentPoints: {
      head: { x: 0, y: 1.65, z: 0 },
      handRight: { x: 0.4, y: 0.9, z: 0.2 },
      root: { x: 0, y: 0, z: 0 }
    },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_char_humanoid'
  },

  // --- 4. ENVIRONMENT PROPS ---
  'env_acacia_tree_01': {
    id: 'env_acacia_tree_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/acacia_tree_01.glb',
    variantFamily: 'acacia_tree',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 12, height: 9, depth: 12 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_env_acacia'
  },
  'env_mpesa_kiosk_01': {
    id: 'env_mpesa_kiosk_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/mpesa_kiosk_01.glb',
    variantFamily: 'mpesa_kiosk',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.8, height: 3.0, depth: 2.4 },
    license: 'Authored Original / Fictional Merchant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_env_mpesa'
  }
};
