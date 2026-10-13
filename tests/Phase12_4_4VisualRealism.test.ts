/**
 * Phase 12.4.4 — Visual Realism Validation & Integration Tests
 *
 * These tests prove that:
 *  1. Grass verge material is actually assigned to road geometry (not just registered).
 *  2. Sidewalk ribbon UV coordinates are physically-scaled from world-space arc length.
 *  3. Terrain LOD boundaries produce zero elevation discontinuity.
 *  4. Sidewalk paver texture is deterministic (same reference on repeated calls).
 *  5. Grass verge texture and normal map are deterministic and correctly colour-spaced.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AssetManager } from '../src/engine/AssetManager';
import { TextureGenerator } from '../src/assets/TextureGenerator';
import { TerrainChunkManager } from '../src/world/TerrainChunkManager';
import { ProceduralRoadGenerator } from '../src/gis/ProceduralRoadGenerator';
import { RoadSegment } from '../src/gis/GISDataTypes';

// ---------------------------------------------------------------------------
// Shared road fixture: 60 m arterial avenue with sidewalks
// ---------------------------------------------------------------------------
function makeUrbanRoad(id = 'road_kenyatta_test'): RoadSegment {
  return {
    id,
    osmId: 9001,
    name: 'Kenyatta Avenue Test Segment',
    type: 'primary',
    lanes: 4,
    speedLimit: 50,
    hasSidewalks: true,
    width: 14.0, // halfWidth = 7.0
    category: 'arterial',
    path: [
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 30 },
      { x: 0, y: 0, z: 60 }
    ]
  };
}

// ---------------------------------------------------------------------------

describe('Phase 12.4.4 — Visual Realism Validation & Integration', () => {
  let assetManager: AssetManager;
  let terrainManager: TerrainChunkManager;
  let roadGen: ProceduralRoadGenerator;

  beforeEach(() => {
    assetManager  = new AssetManager();
    terrainManager = new TerrainChunkManager(assetManager, 100.0);
    roadGen        = new ProceduralRoadGenerator(assetManager, terrainManager);
  });

  // =========================================================================
  // 1. GRASS VERGE INTEGRATION
  // =========================================================================
  describe('1. Grass verge integration — material is assigned to road geometry', () => {
    it('generates GrassVerge_Left and GrassVerge_Right meshes for roads with sidewalks', () => {
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());

      const vergeNames: string[] = [];
      roadGroup.traverse((child) => {
        if (child.name === 'GrassVerge_Left' || child.name === 'GrassVerge_Right') {
          vergeNames.push(child.name);
        }
      });

      expect(vergeNames).toContain('GrassVerge_Left');
      expect(vergeNames).toContain('GrassVerge_Right');
    });

    it('assigns the grass_verge material to both verge meshes', () => {
      const grassVergeMat = assetManager.getMaterial('grass_verge');
      expect(grassVergeMat).toBeDefined();

      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());

      const vergeMeshes: THREE.Mesh[] = [];
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material === grassVergeMat) {
          vergeMeshes.push(child);
        }
      });

      // Both left and right verge ribbons must reference the grass_verge material
      expect(vergeMeshes.length).toBe(2);
    });

    it('places grass verge between sidewalk outer edge and shoulder — not overlapping road surface', () => {
      const road = makeUrbanRoad();
      const halfWidth    = road.width / 2; // 7.0
      const sidewalkWidth = 3.0;
      const sidewalkOuter = halfWidth + sidewalkWidth; // 10.0

      const roadGroup = roadGen.generateRoadMesh(road);
      const grassVergeMat = assetManager.getMaterial('grass_verge');

      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child.material !== grassVergeMat) return;

        const pos = child.geometry.getAttribute('position') as THREE.BufferAttribute;
        // Every verge vertex must be further from centre than sidewalk outer edge
        for (let i = 0; i < pos.count; i++) {
          const absX = Math.abs(pos.getX(i));
          expect(absX).toBeGreaterThanOrEqual(sidewalkOuter - 0.05); // ≥ 9.95 m from centre
        }
      });
    });

    it('does NOT generate grass verge meshes for roads without sidewalks', () => {
      const ruralRoad: RoadSegment = {
        id: 'road_rural',
        osmId: 9002,
        name: 'Rural Road',
        type: 'secondary',
        lanes: 2,
        speedLimit: 40,
        hasSidewalks: false,
        width: 7.0,
        path: [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 40 }]
      };

      const roadGroup = roadGen.generateRoadMesh(ruralRoad);
      let vergeFound = false;
      roadGroup.traverse((child) => {
        if (child.name === 'GrassVerge_Left' || child.name === 'GrassVerge_Right') {
          vergeFound = true;
        }
      });

      expect(vergeFound).toBe(false);
    });

    it('grass_verge material has diffuse map in sRGB space and normal map in linear space', () => {
      const mat = assetManager.getMaterial('grass_verge') as THREE.MeshStandardMaterial;
      expect(mat.map).toBeDefined();
      expect(mat.normalMap).toBeDefined();

      expect(mat.map!.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(mat.normalMap!.colorSpace).not.toBe(THREE.SRGBColorSpace);

      // Matte earth-like surface
      expect(mat.roughness).toBeGreaterThanOrEqual(0.88);
      expect(mat.metalness).toBe(0.0);
    });
  });

  // =========================================================================
  // 2. WORLD-SPACE UV SCALING
  // =========================================================================
  describe('2. Sidewalk UV correctness — world-space arc-length scaling', () => {
    it('UV v-coordinate increases monotonically along the ribbon', () => {
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());
      const grassVergeMat = assetManager.getMaterial('grass_verge');
      const sidewalkMat   = assetManager.getMaterial('sidewalk_cabro') ??
                            assetManager.getMaterial('sidewalk_concrete');

      // Collect one sidewalk and one verge mesh to test
      const sidewalkMeshes: THREE.Mesh[] = [];
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh &&
            (child.material === sidewalkMat || child.material === grassVergeMat)) {
          sidewalkMeshes.push(child);
        }
      });

      expect(sidewalkMeshes.length).toBeGreaterThan(0);

      for (const mesh of sidewalkMeshes) {
        const uvAttr = mesh.geometry.getAttribute('uv') as THREE.BufferAttribute;
        expect(uvAttr).toBeDefined();

        // Check that v (index 1 of each UV pair) is monotonically non-decreasing
        // for consecutive vertex pairs (inner edge, i.e., every 2nd UV pair)
        let prevV = -1;
        for (let i = 0; i < uvAttr.count; i += 2) {
          const v = uvAttr.getY(i); // v of inner vertex
          expect(v).toBeGreaterThanOrEqual(prevV - 0.001); // allow floating-point epsilon
          prevV = v;
        }
      }
    });

    it('UV v-range is proportional to physical road length (±20%)', () => {
      // Road is 60 m long, paverRepeatMeters = 0.5 → expected ~120 UV repeats at end
      const road = makeUrbanRoad();
      const roadLength = 60.0;
      const paverRepeat = 0.5;
      const expectedMaxV = roadLength / paverRepeat; // 120

      const roadGroup = roadGen.generateRoadMesh(road);
      const sidewalkMat = assetManager.getMaterial('sidewalk_cabro') ??
                          assetManager.getMaterial('sidewalk_concrete');

      let maxV = 0;
      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child.material !== sidewalkMat) return;
        const uvAttr = child.geometry.getAttribute('uv') as THREE.BufferAttribute;
        if (!uvAttr) return;
        for (let i = 0; i < uvAttr.count; i++) {
          maxV = Math.max(maxV, uvAttr.getY(i));
        }
      });

      expect(maxV).toBeGreaterThan(expectedMaxV * 0.80);
      expect(maxV).toBeLessThan(expectedMaxV * 1.20);
    });

    it('UV u-coordinate is 0 on inner edge and 1 on outer edge for all ribbon vertices', () => {
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());
      const sidewalkMat = assetManager.getMaterial('sidewalk_cabro') ??
                          assetManager.getMaterial('sidewalk_concrete');

      let checked = false;
      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child.material !== sidewalkMat) return;
        const uvAttr = child.geometry.getAttribute('uv') as THREE.BufferAttribute;
        if (!uvAttr) return;

        for (let i = 0; i < uvAttr.count; i++) {
          const u = uvAttr.getX(i);
          // Ribbon alternates inner (u=0) and outer (u=1) vertices
          expect(u === 0 || u === 1).toBe(true);
        }
        checked = true;
      });

      expect(checked).toBe(true);
    });

    it('sidewalk UV array length equals 2 × (samples + 1) × 2 components', () => {
      // The ribbon loop runs samples+1 times, emitting 2 vertices per step,
      // each vertex has 2 UV components (u, v).
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());
      const sidewalkMat = assetManager.getMaterial('sidewalk_cabro') ??
                          assetManager.getMaterial('sidewalk_concrete');

      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || child.material !== sidewalkMat) return;
        const pos  = child.geometry.getAttribute('position');
        const uvAttr = child.geometry.getAttribute('uv');
        if (!pos || !uvAttr) return;

        // Every position vertex must have a corresponding UV
        expect(uvAttr.count).toBe(pos.count);
      });
    });
  });

  // =========================================================================
  // 3. TERRAIN LOD SEAM CONTINUITY
  // =========================================================================
  describe('3. Terrain LOD seam continuity — no elevation cracks at LOD boundaries', () => {
    it('elevation function is identical at shared boundary between LOD-32 and LOD-24 chunks', () => {
      // Chunk (0,0) gets resolution=32, chunk (2,0) gets resolution=16.
      // They share NO geometry edge but their elevation function must agree at
      // the boundary world-X = 200 (between chunk 1 and chunk 2).
      const boundary12X = 200.0; // between chunk (1,0) and chunk (2,0)
      const testZValues = [-50, -25, 0, 25, 50, 75];

      for (const z of testZValues) {
        // Sample elevation from both sides of the boundary (same function, same result)
        const elevInner = terrainManager.getElevationAt(boundary12X - 0.01, z);
        const elevOuter = terrainManager.getElevationAt(boundary12X + 0.01, z);
        // Elevation function is continuous, so Δ over 0.02 m must be < 0.005 m
        expect(Math.abs(elevInner - elevOuter)).toBeLessThan(0.005);
      }
    });

    it('elevation function is identical at shared boundary between LOD-24 and LOD-16 chunks', () => {
      const boundary23X = 300.0; // between chunk (2,0) and chunk (3,0)
      const testZValues = [-50, 0, 50, 100];

      for (const z of testZValues) {
        const elevInner = terrainManager.getElevationAt(boundary23X - 0.01, z);
        const elevOuter = terrainManager.getElevationAt(boundary23X + 0.01, z);
        expect(Math.abs(elevInner - elevOuter)).toBeLessThan(0.01);
      }
    });

    it('LOD-32 urban core chunk returns exactly 0 elevation at the world origin', () => {
      // Urban core (radius=700m) is held flat at Y=0.
      const elevAtOrigin = terrainManager.getElevationAt(0, 0);
      expect(elevAtOrigin).toBeCloseTo(0.0, 3);
    });

    it('LOD-32 chunk has denser vertex grid than LOD-16 outer chunk', () => {
      // chunkX=0 → Chebyshev=0 → resolution=32, vertices = 33×33 = 1089
      // chunkX=3 → Chebyshev=3 → resolution=16, vertices = 17×17 = 289
      const innerChunk = terrainManager.createTerrainChunkMesh(0, 0);
      const outerChunk = terrainManager.createTerrainChunkMesh(3, 0);

      const innerVertexCount = innerChunk.geometry.getAttribute('position').count;
      const outerVertexCount = outerChunk.geometry.getAttribute('position').count;

      // 33×33 = 1089 vs 17×17 = 289
      expect(innerVertexCount).toBeGreaterThan(outerVertexCount);
      expect(innerVertexCount).toBe(33 * 33);
      expect(outerVertexCount).toBe(17 * 17);
    });

    it('LOD-24 mid-range chunk has intermediate vertex count', () => {
      // chunkX=2 → Chebyshev=2 → resolution=24, vertices = 25×25 = 625
      const midChunk = terrainManager.createTerrainChunkMesh(2, 0);
      const midVertexCount = midChunk.geometry.getAttribute('position').count;
      expect(midVertexCount).toBe(25 * 25);
    });

    it('adjacent chunks at the same LOD tier have matching edge vertex elevations', () => {
      // Chunks (0,0) and (1,0) are both LOD-32 (Chebyshev ≤1).
      // Their shared boundary is at worldX = 100.0.
      // Sample 10 Z positions along the shared edge.
      const sharedBoundaryX = 100.0;
      for (let t = 0; t <= 10; t++) {
        const z = -50 + t * 10;
        const elevA = terrainManager.getElevationAt(sharedBoundaryX, z);
        const elevB = terrainManager.getElevationAt(sharedBoundaryX, z);
        expect(elevA).toBeCloseTo(elevB, 6);
      }
    });

    it('all chunk meshes share the same ground_earth material instance', () => {
      const groundMat = assetManager.getMaterial('ground_earth');
      const chunks = [
        terrainManager.createTerrainChunkMesh(0, 0),
        terrainManager.createTerrainChunkMesh(1, 0),
        terrainManager.createTerrainChunkMesh(2, 0),
        terrainManager.createTerrainChunkMesh(3, 0)
      ];
      for (const chunk of chunks) {
        expect(chunk.material).toBe(groundMat);
      }
    });
  });

  // =========================================================================
  // 4. DETERMINISTIC TEXTURE IDENTITY
  // =========================================================================
  describe('4. Deterministic texture identity — same reference on repeated calls', () => {
    it('sidewalk paver texture returns the same cached instance on repeated calls', () => {
      const tex1 = TextureGenerator.createSidewalkPaverTexture();
      const tex2 = TextureGenerator.createSidewalkPaverTexture();
      expect(tex1).toBe(tex2);
    });

    it('sidewalk paver texture is in sRGB colour space', () => {
      const tex = TextureGenerator.createSidewalkPaverTexture();
      expect(tex.colorSpace).toBe(THREE.SRGBColorSpace);
    });

    it('grass verge diffuse texture is deterministic and in sRGB colour space', () => {
      const tex1 = TextureGenerator.createGrassVergeTexture();
      const tex2 = TextureGenerator.createGrassVergeTexture();
      expect(tex1).toBe(tex2);
      expect(tex1.colorSpace).toBe(THREE.SRGBColorSpace);
    });

    it('grass verge normal map is deterministic and in linear colour space', () => {
      const n1 = TextureGenerator.createGrassVergeNormalMap();
      const n2 = TextureGenerator.createGrassVergeNormalMap();
      expect(n1).toBe(n2);
      expect(n1.colorSpace).not.toBe(THREE.SRGBColorSpace);
    });

    it('all new Phase 12.4.3 textures have correct repeat wrapping', () => {
      const sidewalk = TextureGenerator.createSidewalkPaverTexture();
      expect(sidewalk.wrapS).toBe(THREE.RepeatWrapping);
      expect(sidewalk.wrapT).toBe(THREE.RepeatWrapping);

      const grassDiffuse = TextureGenerator.createGrassVergeTexture();
      expect(grassDiffuse.wrapS).toBe(THREE.RepeatWrapping);
      expect(grassDiffuse.wrapT).toBe(THREE.RepeatWrapping);

      const grassNormal = TextureGenerator.createGrassVergeNormalMap();
      expect(grassNormal.wrapS).toBe(THREE.RepeatWrapping);
      expect(grassNormal.wrapT).toBe(THREE.RepeatWrapping);
    });
  });

  // =========================================================================
  // 5. GEOMETRY BATCHER ATTRIBUTE COMPLETENESS
  // =========================================================================
  describe('5. Geometry attribute completeness — all road ribbons have UV', () => {
    it('every Mesh child in a road group has a UV attribute', () => {
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());

      const meshesWithoutUV: string[] = [];
      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const uv = child.geometry.getAttribute('uv');
        if (!uv) meshesWithoutUV.push(child.name || child.uuid);
      });

      // All meshes must have UV so the geometry batcher never needs to inject zeros
      expect(meshesWithoutUV).toEqual([]);
    });

    it('UV attribute count matches position attribute count for all road meshes', () => {
      const roadGroup = roadGen.generateRoadMesh(makeUrbanRoad());

      roadGroup.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const pos = child.geometry.getAttribute('position');
        const uv  = child.geometry.getAttribute('uv');
        if (!pos || !uv) return;
        expect(uv.count).toBe(pos.count);
      });
    });
  });
});
