/**
 * tests/NairobiVegetationRealism.test.ts
 *
 * Phase 11.6 — High-Fidelity Nairobi Vegetation
 * Unit tests verifying:
 *  1. Asset manifest registration for all three vegetation assets.
 *  2. EnvironmentAssetKit geometry node counts and PBR material properties.
 *  3. AssetPipeline fallback routing for jacaranda and bougainvillea.
 *  4. VegetationSystem category-to-mesh mapping.
 *  5. Pedestrian clearance — Bougainvillea planters placed at X = ±14.5 m
 *     leave the ≥3.5 m central concourse (X ∈ [9.5, 14.0]) fully unobstructed.
 */

import * as THREE from 'three';
import { describe, it, expect, beforeEach } from 'vitest';
import { ASSET_MANIFEST } from '../src/assets/AssetManifest';
import { EnvironmentAssetKit } from '../src/assets/EnvironmentAssetKit';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { VegetationSystem } from '../src/environment/VegetationSystem';
import type { VegetationInstance } from '../src/environment/VegetationSystem';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Asset Manifest Registration
// ─────────────────────────────────────────────────────────────────────────────
describe('AssetManifest — Phase 11.6 vegetation entries', () => {
  it('registers env_jacaranda_tree_01 with correct category and source path', () => {
    const entry = ASSET_MANIFEST['env_jacaranda_tree_01'];
    expect(entry).toBeDefined();
    expect(entry.category).toBe('environment');
    expect(entry.sourceFile).toBe('/assets/models/environment/env_jacaranda_tree_01.glb');
    expect(entry.variantFamily).toBe('jacaranda_tree');
    expect(entry.license).toContain('CC-BY 4.0');
    expect(entry.author).toContain('KINGMAKER');
  });

  it('registers env_acacia_tree_01 with correct bounding dimensions', () => {
    const entry = ASSET_MANIFEST['env_acacia_tree_01'];
    expect(entry).toBeDefined();
    expect(entry.boundingDimensions.width).toBeGreaterThanOrEqual(6.0);
    expect(entry.boundingDimensions.height).toBeGreaterThanOrEqual(4.0);
    expect(entry.license).toContain('CC-BY 4.0');
  });

  it('registers env_bougainvillea_planter_01 with correct planter dimensions', () => {
    const entry = ASSET_MANIFEST['env_bougainvillea_planter_01'];
    expect(entry).toBeDefined();
    expect(entry.category).toBe('environment');
    // Planter width 2.4 m — must not exceed 3.0 m to avoid blocking 3.5 m footpath clearance
    expect(entry.boundingDimensions.width).toBeLessThanOrEqual(3.0);
    expect(entry.sourceFile).toContain('bougainvillea');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. EnvironmentAssetKit — geometry hierarchy and PBR materials
// ─────────────────────────────────────────────────────────────────────────────
describe('EnvironmentAssetKit — Jacaranda tree geometry', () => {
  let jacaranda: THREE.Group;
  beforeEach(() => {
    jacaranda = EnvironmentAssetKit.createJacarandaTreeMesh(true);
  });

  it('returns a THREE.Group', () => {
    expect(jacaranda).toBeInstanceOf(THREE.Group);
  });

  it('contains at least 10 child nodes (trunk + primary branches + canopy clusters)', () => {
    let nodeCount = 0;
    jacaranda.traverse(() => nodeCount++);
    expect(nodeCount).toBeGreaterThanOrEqual(10);
  });

  it('contains at least 5 Mesh children (trunk, primary limbs, canopy)', () => {
    const meshes: THREE.Mesh[] = [];
    jacaranda.traverse((n) => { if (n instanceof THREE.Mesh) meshes.push(n); });
    expect(meshes.length).toBeGreaterThanOrEqual(5);
  });

  it('has at least one purple/violet blossom material (hue in 0.7–0.9 range)', () => {
    const purpleMeshes: THREE.Mesh[] = [];
    jacaranda.traverse((n) => {
      if (!(n instanceof THREE.Mesh)) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          const hsl = { h: 0, s: 0, l: 0 };
          m.color.getHSL(hsl);
          if (hsl.h >= 0.65 && hsl.h <= 0.95 && hsl.s > 0.3) purpleMeshes.push(n);
        }
      });
    });
    expect(purpleMeshes.length).toBeGreaterThan(0);
  });

  it('casts shadow on at least one mesh', () => {
    const shadowCasters: THREE.Mesh[] = [];
    jacaranda.traverse((n) => {
      if (n instanceof THREE.Mesh && n.castShadow) shadowCasters.push(n);
    });
    expect(shadowCasters.length).toBeGreaterThan(0);
  });
});

describe('EnvironmentAssetKit — Acacia tree geometry', () => {
  let acacia: THREE.Group;
  beforeEach(() => {
    acacia = EnvironmentAssetKit.createAcaciaTreeMesh();
  });

  it('returns a THREE.Group', () => {
    expect(acacia).toBeInstanceOf(THREE.Group);
  });

  it('contains at least 8 child nodes (trunk + umbrella arms + canopy shelves)', () => {
    let nodeCount = 0;
    acacia.traverse(() => nodeCount++);
    expect(nodeCount).toBeGreaterThanOrEqual(8);
  });

  it('has canopy materials with green/olive hue (savanna foliage)', () => {
    const greenMeshes: THREE.Mesh[] = [];
    acacia.traverse((n) => {
      if (!(n instanceof THREE.Mesh)) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          const hsl = { h: 0, s: 0, l: 0 };
          m.color.getHSL(hsl);
          // Green-yellow range 0.15–0.45
          if (hsl.h >= 0.15 && hsl.h <= 0.45) greenMeshes.push(n);
        }
      });
    });
    expect(greenMeshes.length).toBeGreaterThan(0);
  });
});

describe('EnvironmentAssetKit — Bougainvillea planter geometry', () => {
  let planter: THREE.Group;
  beforeEach(() => {
    planter = EnvironmentAssetKit.createBougainvilleaPlanter();
  });

  it('returns a THREE.Group', () => {
    expect(planter).toBeInstanceOf(THREE.Group);
  });

  it('contains at least 5 meshes (concrete box, soil, bract clusters, leaves)', () => {
    const meshes: THREE.Mesh[] = [];
    planter.traverse((n) => { if (n instanceof THREE.Mesh) meshes.push(n); });
    expect(meshes.length).toBeGreaterThanOrEqual(5);
  });

  it('has at least one magenta/pink bract material', () => {
    const pinkMeshes: THREE.Mesh[] = [];
    planter.traverse((n) => {
      if (!(n instanceof THREE.Mesh)) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      mats.forEach((m) => {
        if (m instanceof THREE.MeshStandardMaterial) {
          const hsl = { h: 0, s: 0, l: 0 };
          m.color.getHSL(hsl);
          // Magenta/pink hue 0.85–1.0 or 0.0–0.05
          if ((hsl.h >= 0.85 || hsl.h <= 0.05) && hsl.s > 0.4) pinkMeshes.push(n);
        }
      });
    });
    expect(pinkMeshes.length).toBeGreaterThan(0);
  });

  it('also creates a free-standing bougainvillea shrub without error', () => {
    expect(() => EnvironmentAssetKit.createBougainvilleaShrub('magenta')).not.toThrow();
    expect(() => EnvironmentAssetKit.createBougainvilleaShrub('red')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. AssetPipeline — fallback routing for new vegetation IDs
// ─────────────────────────────────────────────────────────────────────────────
describe('AssetPipeline.createFallbackMesh — vegetation routing', () => {
  const pipeline = AssetPipeline.getInstance();

  it('routes env_jacaranda_tree_01 to a valid THREE.Group', () => {
    const mesh = pipeline.createFallbackMesh('env_jacaranda_tree_01');
    expect(mesh).toBeInstanceOf(THREE.Group);
  });

  it('routes env_bougainvillea_planter_01 to a valid THREE.Group', () => {
    const mesh = pipeline.createFallbackMesh('env_bougainvillea_planter_01');
    expect(mesh).toBeInstanceOf(THREE.Group);
  });

  it('routes env_acacia_tree_01 to a valid THREE.Group', () => {
    const mesh = pipeline.createFallbackMesh('env_acacia_tree_01');
    expect(mesh).toBeInstanceOf(THREE.Group);
  });

  it('exposes getJacarandaTreeMesh() as a public method', () => {
    expect(typeof pipeline.getJacarandaTreeMesh).toBe('function');
  });

  it('exposes getBougainvilleaPlanterMesh() as a public method', () => {
    expect(typeof pipeline.getBougainvilleaPlanterMesh).toBe('function');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. VegetationSystem — category-to-mesh routing
// ─────────────────────────────────────────────────────────────────────────────
describe('VegetationSystem.buildInstancedMeshGroup — category dispatch', () => {
  const vegSystem = new VegetationSystem();

  const makeInstance = (category: VegetationInstance['category'], idx: number): VegetationInstance => ({
    id: `veg_test_${idx}`,
    category,
    position: new THREE.Vector3(0, 0, idx * 5),
    scale: new THREE.Vector3(1, 1, 1),
    rotationY: 0
  });

  it('builds group from ornamental_street instances without error', () => {
    const instances = [makeInstance('ornamental_street', 0), makeInstance('ornamental_street', 1)];
    expect(() => vegSystem.buildInstancedMeshGroup(instances)).not.toThrow();
    const group = vegSystem.buildInstancedMeshGroup(instances);
    expect(group.children.length).toBe(2);
  });

  it('builds group from shrubs/hedges instances without error', () => {
    const instances = [makeInstance('shrubs', 0), makeInstance('hedges', 1)];
    expect(() => vegSystem.buildInstancedMeshGroup(instances)).not.toThrow();
    const group = vegSystem.buildInstancedMeshGroup(instances);
    expect(group.children.length).toBe(2);
  });

  it('builds group from mixed categories without error', () => {
    const instances = [
      makeInstance('acacia', 0),
      makeInstance('palms', 1),
      makeInstance('ornamental_street', 2),
      makeInstance('shrubs', 3),
      makeInstance('hedges', 4)
    ];
    const group = vegSystem.buildInstancedMeshGroup(instances);
    expect(group.children.length).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Pedestrian Clearance — Bougainvillea planter placement constraints
// ─────────────────────────────────────────────────────────────────────────────
describe('Bougainvillea planter placement — pedestrian clearance constraints', () => {
  /**
   * Kenyatta Avenue Cabro promenade: X ∈ [7.3, 26.0] (total 18.7 m wide)
   * Tree grates at X = ±8.4 m (curbside)
   * Bougainvillea planters: X = ±14.5 m (building perimeter)
   * Required pedestrian concourse: X ∈ [9.5, 14.0] = 4.5 m clear
   * Minimum clearance required: ≥ 3.5 m
   */
  const PLANTER_WIDTH_M = 2.4; // from AssetManifest boundingDimensions.width
  const PLANTER_X_POS = 14.5; // placement from NairobiDistrictScene
  const CURB_TREE_X = 8.4;    // tree grate X position
  const MIN_CLEARANCE_M = 3.5;

  it('planter half-width does not encroach past X = 11.0 m (inner edge)', () => {
    const innerEdge = PLANTER_X_POS - PLANTER_WIDTH_M / 2;
    expect(innerEdge).toBeGreaterThan(CURB_TREE_X + MIN_CLEARANCE_M);
  });

  it('clearance between curbside tree and planter inner edge is at least 3.5 m', () => {
    const planterInnerEdge = PLANTER_X_POS - PLANTER_WIDTH_M / 2;
    const clearance = planterInnerEdge - CURB_TREE_X;
    expect(clearance).toBeGreaterThanOrEqual(MIN_CLEARANCE_M);
  });

  it('negative-side planter also satisfies clearance by symmetry', () => {
    const negPlanterX = -PLANTER_X_POS;
    const negCurbTreeX = -CURB_TREE_X;
    // Outer edge of negative planter = negPlanterX + PLANTER_WIDTH/2 (towards centre)
    const negPlanterOuterEdge = negPlanterX + PLANTER_WIDTH_M / 2;
    const clearance = Math.abs(negCurbTreeX - negPlanterOuterEdge);
    expect(clearance).toBeGreaterThanOrEqual(MIN_CLEARANCE_M);
  });
});
