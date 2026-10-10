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
    sourceFile: '/assets/models/buildings/bld_nairobi_shop_01.glb',
    variantFamily: 'nairobi_shop',
    intendedScale: new THREE.Vector3(5.0, 3.5, 5.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 10, height: 8, depth: 10 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_shop'
  },
  'bld_nairobi_shop_02': {
    id: 'bld_nairobi_shop_02',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_nairobi_shop_02.glb',
    variantFamily: 'nairobi_shop',
    intendedScale: new THREE.Vector3(5.0, 3.5, 5.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 10, height: 7, depth: 10 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_shop'
  },
  'bld_mixed_use_01': {
    id: 'bld_mixed_use_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_mixed_use_01.glb',
    variantFamily: 'mixed_use',
    intendedScale: new THREE.Vector3(6.0, 4.5, 6.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 12, height: 13, depth: 12 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_mixed_use'
  },
  'bld_mixed_use_02': {
    id: 'bld_mixed_use_02',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_mixed_use_02.glb',
    variantFamily: 'mixed_use',
    intendedScale: new THREE.Vector3(7.0, 4.5, 7.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 14, height: 16, depth: 14 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_mixed_use'
  },
  'bld_modern_apartment_01': {
    id: 'bld_modern_apartment_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_modern_apartment_01.glb',
    variantFamily: 'modern_apartment',
    intendedScale: new THREE.Vector3(7.0, 5.0, 7.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 14, height: 18, depth: 14 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_apartment'
  },
  'bld_modern_apartment_02': {
    id: 'bld_modern_apartment_02',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_modern_apartment_02.glb',
    variantFamily: 'modern_apartment',
    intendedScale: new THREE.Vector3(8.0, 5.5, 8.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 16, height: 20, depth: 16 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_apartment'
  },
  'bld_residential_villa_01': {
    id: 'bld_residential_villa_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_residential_villa_01.glb',
    variantFamily: 'residential_villa',
    intendedScale: new THREE.Vector3(5.5, 3.0, 5.5),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 11, height: 7, depth: 11 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_villa'
  },
  'bld_office_block_01': {
    id: 'bld_office_block_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_office_block_01.glb',
    variantFamily: 'office_block',
    intendedScale: new THREE.Vector3(8.0, 7.0, 8.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 16, height: 27, depth: 16 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_office'
  },
  'bld_commercial_tower_01': {
    id: 'bld_commercial_tower_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_commercial_tower_01.glb',
    variantFamily: 'commercial_tower',
    intendedScale: new THREE.Vector3(10.0, 10.0, 10.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 20, height: 42, depth: 20 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_tower'
  },
  'bld_informal_kiosk_01': {
    id: 'bld_informal_kiosk_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_informal_kiosk_01.glb',
    variantFamily: 'informal_kiosk',
    intendedScale: new THREE.Vector3(1.8, 1.5, 1.8),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 3.6, height: 3.0, depth: 3.6 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_kiosk'
  },
  'bld_industrial_warehouse_01': {
    id: 'bld_industrial_warehouse_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_industrial_warehouse_01.glb',
    variantFamily: 'industrial_warehouse',
    intendedScale: new THREE.Vector3(8.0, 4.0, 10.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 16, height: 9, depth: 20 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_warehouse'
  },
  'bld_nightclub_01': {
    id: 'bld_nightclub_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_nightclub_01.glb',
    variantFamily: 'nightclub',
    intendedScale: new THREE.Vector3(8.0, 4.5, 8.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 16, height: 14, depth: 16 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_nightclub'
  },
  'bld_construction_site_01': {
    id: 'bld_construction_site_01',
    category: 'building',
    sourceFile: '/assets/models/buildings/bld_construction_site_01.glb',
    variantFamily: 'construction_site',
    intendedScale: new THREE.Vector3(4.0, 3.0, 4.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 8, height: 7, depth: 8 },
    license: 'CC0 1.0 Universal (Public Domain)',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_bld_construction'
  },

  // --- 2. VEHICLES (9 Models) ---
  'veh_sedan_01': {
    id: 'veh_sedan_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_sedan_01.glb',
    variantFamily: 'sedan',
    intendedScale: new THREE.Vector3(0.95, 0.75, 1.8),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.9, height: 1.6, depth: 4.6 },
    attachmentPoints: {
      driver: { x: -0.5, y: 0.7, z: 0.2 },
      doorDriver: { x: -0.9, y: 0.6, z: 0.2 }
    },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_sedan'
  },
  'veh_compact_01': {
    id: 'veh_compact_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_compact_01.glb',
    variantFamily: 'compact',
    intendedScale: new THREE.Vector3(0.85, 0.7, 1.6),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.7, height: 1.5, depth: 4.1 },
    attachmentPoints: { driver: { x: -0.45, y: 0.6, z: 0.1 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_sedan'
  },
  'veh_suv_landcruiser_01': {
    id: 'veh_suv_landcruiser_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_suv_landcruiser_01.glb',
    variantFamily: 'suv',
    intendedScale: new THREE.Vector3(1.0, 0.88, 1.85),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.0, height: 1.9, depth: 4.9 },
    attachmentPoints: { driver: { x: -0.6, y: 0.9, z: 0.3 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_suv'
  },
  'veh_pickup_01': {
    id: 'veh_pickup_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_pickup_01.glb',
    variantFamily: 'pickup',
    intendedScale: new THREE.Vector3(1.0, 0.85, 1.8),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.0, height: 1.8, depth: 4.8 },
    attachmentPoints: { driver: { x: -0.55, y: 0.8, z: 0.2 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_pickup'
  },
  'veh_van_01': {
    id: 'veh_van_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_van_01.glb',
    variantFamily: 'van',
    intendedScale: new THREE.Vector3(1.0, 1.0, 1.9),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.0, height: 2.15, depth: 5.2 },
    attachmentPoints: { driver: { x: -0.6, y: 1.0, z: 0.8 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_van'
  },
  'veh_truck_01': {
    id: 'veh_truck_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_truck_01.glb',
    variantFamily: 'truck',
    intendedScale: new THREE.Vector3(1.1, 1.0, 2.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.2, height: 2.15, depth: 5.5 },
    attachmentPoints: { driver: { x: -0.7, y: 1.4, z: 2.5 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_truck'
  },
  'veh_boda_boda_01': {
    id: 'veh_boda_boda_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_boda_boda_01.glb',
    variantFamily: 'motorcycle',
    intendedScale: new THREE.Vector3(0.7, 0.6, 1.2),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.4, height: 1.3, depth: 3.1 },
    attachmentPoints: { rider: { x: 0, y: 0.75, z: -0.2 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_veh_boda'
  },
  'veh_matatu_ngong_01': {
    id: 'veh_matatu_ngong_01',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_matatu_ngong_01.glb',
    variantFamily: 'matatu',
    intendedScale: new THREE.Vector3(0.98, 1.05, 1.9),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.96, height: 2.25, depth: 5.2 },
    attachmentPoints: {
      driver: { x: -0.6, y: 1.1, z: 1.2 },
      passengerFront: { x: 0.6, y: 1.1, z: 1.2 },
      doorSide: { x: 1.05, y: 0.8, z: 0.2, rotationY: Math.PI / 2 }
    },
    license: 'Authored Original / Fictional Matatu Art',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_matatu'
  },
  'veh_matatu_kibera_02': {
    id: 'veh_matatu_kibera_02',
    category: 'vehicle',
    sourceFile: '/assets/models/vehicles/veh_matatu_kibera_02.glb',
    variantFamily: 'matatu',
    intendedScale: new THREE.Vector3(0.98, 1.05, 1.9),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.96, height: 2.25, depth: 5.2 },
    attachmentPoints: { driver: { x: -0.6, y: 1.1, z: 1.2 } },
    license: 'Authored Original / Fictional Matatu Art',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_veh_matatu'
  },

  // --- 3. CHARACTERS (3 Archetypes) ---
  'char_player_01': {
    id: 'char_player_01',
    category: 'character',
    sourceFile: '/assets/models/characters/char_player_01.glb',
    variantFamily: 'humanoid_hero',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.7, height: 1.88, depth: 0.4 },
    attachmentPoints: { head: { x: 0, y: 1.65, z: 0 }, root: { x: 0, y: 0, z: 0 } },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Ready Player Me / Three.js',
    fallbackAssetId: 'fallback_char_humanoid'
  },
  'char_pedestrian_business_01': {
    id: 'char_pedestrian_business_01',
    category: 'character',
    sourceFile: '/assets/models/characters/char_pedestrian_business_01.glb',
    variantFamily: 'humanoid_npc',
    intendedScale: new THREE.Vector3(0.0102, 0.0102, 0.0102),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.7, height: 1.85, depth: 0.4 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Mixamo / Three.js',
    fallbackAssetId: 'fallback_char_humanoid'
  },
  'char_pedestrian_student_01': {
    id: 'char_pedestrian_student_01',
    category: 'character',
    sourceFile: '/assets/models/characters/char_pedestrian_student_01.glb',
    variantFamily: 'humanoid_npc',
    intendedScale: new THREE.Vector3(1.05, 1.05, 1.05),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.6, height: 1.75, depth: 0.4 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Mixamo / Three.js',
    fallbackAssetId: 'fallback_char_humanoid'
  },
  'char_driver_01': {
    id: 'char_driver_01',
    category: 'character',
    sourceFile: '/assets/models/characters/char_driver_01.glb',
    variantFamily: 'humanoid_npc',
    intendedScale: new THREE.Vector3(0.0102, 0.0102, 0.0102),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.7, height: 1.85, depth: 0.4 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Mixamo / Three.js',
    fallbackAssetId: 'fallback_char_humanoid'
  },
  'char_guard_security_01': {
    id: 'char_guard_security_01',
    category: 'character',
    sourceFile: '/assets/models/characters/char_guard_security_01.glb',
    variantFamily: 'humanoid_npc',
    intendedScale: new THREE.Vector3(0.0102, 0.0102, 0.0102),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 0.7, height: 1.85, depth: 0.4 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Mixamo / Three.js',
    fallbackAssetId: 'fallback_char_humanoid'
  },

  // --- 4. ENVIRONMENT PROPS (10 Props) ---
  'env_acacia_tree_01': {
    id: 'env_acacia_tree_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_acacia_tree_01.glb',
    variantFamily: 'acacia_tree',
    intendedScale: new THREE.Vector3(5.0, 4.5, 5.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 5.0, height: 6.0, depth: 5.0 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_acacia'
  },
  'env_palm_tree_01': {
    id: 'env_palm_tree_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_palm_tree_01.glb',
    variantFamily: 'palm_tree',
    intendedScale: new THREE.Vector3(3.0, 5.5, 3.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 3.5, height: 7.0, depth: 3.5 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_palm'
  },
  'env_shrub_01': {
    id: 'env_shrub_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_shrub_01.glb',
    variantFamily: 'shrub',
    intendedScale: new THREE.Vector3(1.5, 1.3, 1.5),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.5, height: 1.5, depth: 1.5 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_shrub'
  },
  'env_streetlight_01': {
    id: 'env_streetlight_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_streetlight_01.glb',
    variantFamily: 'streetlight',
    intendedScale: new THREE.Vector3(1.2, 11.0, 1.2),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.2, height: 6.0, depth: 1.2 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_streetlight'
  },
  'env_utility_pole_01': {
    id: 'env_utility_pole_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_utility_pole_01.glb',
    variantFamily: 'utility_pole',
    intendedScale: new THREE.Vector3(1.0, 14.0, 1.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 1.5, height: 8.0, depth: 1.5 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_utility_pole'
  },
  'env_mpesa_kiosk_01': {
    id: 'env_mpesa_kiosk_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_mpesa_kiosk_01.glb',
    variantFamily: 'mpesa_kiosk',
    intendedScale: new THREE.Vector3(3.5, 6.5, 5.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.8, height: 2.6, depth: 2.2 },
    license: 'Authored Original / Fictional Merchant',
    author: 'KINGMAKER Asset Team',
    fallbackAssetId: 'fallback_env_mpesa'
  },
  'env_mama_mboga_stall_01': {
    id: 'env_mama_mboga_stall_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_mama_mboga_stall_01.glb',
    variantFamily: 'market_stall',
    intendedScale: new THREE.Vector3(6.0, 5.5, 6.0),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.2, height: 2.5, depth: 2.2 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_mama_mboga'
  },
  'env_security_gate_01': {
    id: 'env_security_gate_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_security_gate_01.glb',
    variantFamily: 'security_gate',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 8.0, height: 2.4, depth: 0.4 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_gate'
  },
  'env_road_barrier_01': {
    id: 'env_road_barrier_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_road_barrier_01.glb',
    variantFamily: 'road_barrier',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 2.0, height: 0.8, depth: 0.5 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_barrier'
  },
  'env_construction_scaffolding_01': {
    id: 'env_construction_scaffolding_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_construction_scaffolding_01.glb',
    variantFamily: 'scaffolding',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 80, 200, 450],
    boundingDimensions: { width: 3.0, height: 4.0, depth: 1.5 },
    license: 'CC-BY 4.0 (Creative Commons Attribution 4.0 International)',
    author: 'Khronos Group / Google / Cesium / Wayfair / Microsoft',
    fallbackAssetId: 'fallback_env_scaffolding'
  },
  'env_bench_01': {
    id: 'env_bench_01',
    category: 'environment',
    sourceFile: '/assets/models/environment/env_bench_01.glb',
    variantFamily: 'bench',
    intendedScale: new THREE.Vector3(1.8, 1.8, 1.8),
    lodLevels: [0, 80, 200],
    boundingDimensions: { width: 1.3, height: 0.75, depth: 0.7 },
    license: 'CC0 1.0 Universal',
    author: 'Kenney (Kenney.nl)',
    fallbackAssetId: 'fallback_env_barrier'
  },

  // --- 5. INTERIORS (10 Furniture Props) ---
  'interior_chair_01': {
    id: 'interior_chair_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_chair_01.glb',
    variantFamily: 'chair',
    intendedScale: new THREE.Vector3(1.1, 2.0, 1.3),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 0.8, height: 0.8, depth: 0.6 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_table_01': {
    id: 'interior_table_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_table_01.glb',
    variantFamily: 'table',
    intendedScale: new THREE.Vector3(1.8, 2.0, 1.8),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 1.2, height: 0.5, depth: 0.8 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_sofa_01': {
    id: 'interior_sofa_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_sofa_01.glb',
    variantFamily: 'sofa',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 2.2, height: 0.8, depth: 1.0 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_bed_01': {
    id: 'interior_bed_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_bed_01.glb',
    variantFamily: 'bed',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 1.8, height: 0.6, depth: 2.0 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_shop_shelf_01': {
    id: 'interior_shop_shelf_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_shop_shelf_01.glb',
    variantFamily: 'shelf',
    intendedScale: new THREE.Vector3(2.0, 2.5, 2.0),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 1.6, height: 2.0, depth: 0.5 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_office_desk_01': {
    id: 'interior_office_desk_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_office_desk_01.glb',
    variantFamily: 'desk',
    intendedScale: new THREE.Vector3(2.2, 2.0, 1.8),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 1.6, height: 0.75, depth: 0.9 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_restaurant_table_01': {
    id: 'interior_restaurant_table_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_restaurant_table_01.glb',
    variantFamily: 'restaurant_table',
    intendedScale: new THREE.Vector3(2.5, 3.2, 2.5),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 1.0, height: 0.75, depth: 1.0 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_gym_treadmill_01': {
    id: 'interior_gym_treadmill_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_gym_treadmill_01.glb',
    variantFamily: 'treadmill',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 0.9, height: 1.4, depth: 1.8 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_vip_lounge_sofa_01': {
    id: 'interior_vip_lounge_sofa_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_vip_lounge_sofa_01.glb',
    variantFamily: 'vip_sofa',
    intendedScale: new THREE.Vector3(1, 1, 1),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 2.2, height: 0.8, depth: 1.0 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  },
  'interior_dj_booth_rig_01': {
    id: 'interior_dj_booth_rig_01',
    category: 'interior',
    sourceFile: '/assets/models/interiors/interior_dj_booth_rig_01.glb',
    variantFamily: 'dj_rig',
    intendedScale: new THREE.Vector3(4.5, 2.8, 4.5),
    lodLevels: [0, 40, 100],
    boundingDimensions: { width: 0.8, height: 1.8, depth: 0.8 },
    license: 'Authored Original',
    author: 'KINGMAKER Asset Team'
  }
};
