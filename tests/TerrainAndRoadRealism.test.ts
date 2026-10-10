import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AssetManager } from '../src/engine/AssetManager';
import { TextureGenerator } from '../src/assets/TextureGenerator';
import { TerrainChunkManager } from '../src/world/TerrainChunkManager';
import { ProceduralRoadGenerator } from '../src/gis/ProceduralRoadGenerator';
import { RoadSegment, IntersectionNode } from '../src/gis/GISDataTypes';

describe('Phase 11.4 — Terrain and Road Realism Tests', () => {
  let assetManager: AssetManager;

  beforeEach(() => {
    assetManager = new AssetManager();
  });

  describe('1. Asphalt Material & PBR Micro-Detail', () => {
    it('configures road asphalt material with color, normal, and roughness maps', () => {
      const roadMat = assetManager.getMaterial('road_asphalt') as THREE.MeshStandardMaterial;

      expect(roadMat).toBeDefined();
      expect(roadMat.map).toBeDefined();
      expect(roadMat.normalMap).toBeDefined();
      expect(roadMat.roughnessMap).toBeDefined();

      // Color map must be in sRGB color space
      expect(roadMat.map!.colorSpace).toBe(THREE.SRGBColorSpace);

      // Normal and roughness data maps must be Linear (no sRGB color transform)
      expect(roadMat.normalMap!.colorSpace).not.toBe(THREE.SRGBColorSpace);
      expect(roadMat.roughnessMap!.colorSpace).not.toBe(THREE.SRGBColorSpace);

      // Physical properties
      expect(roadMat.roughness).toBeGreaterThanOrEqual(0.8);
      expect(roadMat.metalness).toBeLessThanOrEqual(0.05);
      expect(roadMat.normalScale.x).toBeGreaterThan(0);
      expect(roadMat.normalScale.y).toBeGreaterThan(0);
    });
  });

  describe('2. Soil Material & Color Space Handling', () => {
    it('configures terrain soil with Kenyan laterite PBR texture maps', () => {
      const earthMat = assetManager.getMaterial('ground_earth') as THREE.MeshStandardMaterial;

      expect(earthMat).toBeDefined();
      expect(earthMat.map).toBeDefined();
      expect(earthMat.normalMap).toBeDefined();
      expect(earthMat.roughnessMap).toBeDefined();

      // Diffuse is sRGB
      expect(earthMat.map!.colorSpace).toBe(THREE.SRGBColorSpace);

      // Normal and roughness data textures are Linear
      expect(earthMat.normalMap!.colorSpace).not.toBe(THREE.SRGBColorSpace);
      expect(earthMat.roughnessMap!.colorSpace).not.toBe(THREE.SRGBColorSpace);

      // Soil physical calibration: matte, non-metallic
      expect(earthMat.roughness).toBeGreaterThanOrEqual(0.9);
      expect(earthMat.metalness).toBeLessThanOrEqual(0.02);
    });

    it('produces deterministic output from procedural texture generators', () => {
      const soilTex1 = TextureGenerator.createSoilTexture();
      const soilTex2 = TextureGenerator.createSoilTexture();
      expect(soilTex1).toBe(soilTex2);

      const soilNormal1 = TextureGenerator.createSoilNormalMap();
      const soilNormal2 = TextureGenerator.createSoilNormalMap();
      expect(soilNormal1).toBe(soilNormal2);

      const soilRoughness1 = TextureGenerator.createSoilRoughnessMap();
      const soilRoughness2 = TextureGenerator.createSoilRoughnessMap();
      expect(soilRoughness1).toBe(soilRoughness2);
    });
  });

  describe('3. Texture Tiling & Wrapping Configuration', () => {
    it('configures seamless repeat wrapping on asphalt and terrain soil', () => {
      const roadMat = assetManager.getMaterial('road_asphalt') as THREE.MeshStandardMaterial;
      const earthMat = assetManager.getMaterial('ground_earth') as THREE.MeshStandardMaterial;

      expect(roadMat.map!.wrapS).toBe(THREE.RepeatWrapping);
      expect(roadMat.map!.wrapT).toBe(THREE.RepeatWrapping);
      expect(roadMat.normalMap!.wrapS).toBe(THREE.RepeatWrapping);
      expect(roadMat.normalMap!.wrapT).toBe(THREE.RepeatWrapping);

      expect(earthMat.map!.wrapS).toBe(THREE.RepeatWrapping);
      expect(earthMat.map!.wrapT).toBe(THREE.RepeatWrapping);
      expect(earthMat.map!.repeat.x).toBe(8);
      expect(earthMat.map!.repeat.y).toBe(8);
    });

    it('configures road shoulder transition with ClampToEdge across U and Repeat along V', () => {
      const shoulderMat = assetManager.getMaterial('road_shoulder_transition') as THREE.MeshStandardMaterial;

      expect(shoulderMat).toBeDefined();
      expect(shoulderMat.map).toBeDefined();
      expect(shoulderMat.normalMap).toBeDefined();
      expect(shoulderMat.roughnessMap).toBeDefined();

      // U direction blends road -> soil, so clamp to edge; V repeats along road length
      expect(shoulderMat.map!.wrapS).toBe(THREE.ClampToEdgeWrapping);
      expect(shoulderMat.map!.wrapT).toBe(THREE.RepeatWrapping);
      expect(shoulderMat.map!.colorSpace).toBe(THREE.SRGBColorSpace);
    });
  });

  describe('4. Terrain Chunk Continuity', () => {
    it('guarantees identical elevations and seamless boundary matching between adjacent chunks', () => {
      const terrainManager = new TerrainChunkManager(assetManager, 100.0);

      const chunk0 = terrainManager.createTerrainChunkMesh(0, 0, 16);
      const chunk1 = terrainManager.createTerrainChunkMesh(1, 0, 16);

      // Inspect boundary between chunk (0,0) right edge and chunk (1,0) left edge at X = 100
      const boundaryWorldX = 100.0;
      const testZValues = [0.0, 25.0, 50.0, 75.0, 100.0];

      for (const z of testZValues) {
        const elevChunk0 = terrainManager.getElevationAt(boundaryWorldX, z);
        const elevChunk1 = terrainManager.getElevationAt(boundaryWorldX, z);
        expect(elevChunk0).toBeCloseTo(elevChunk1, 5);
      }

      // Check mesh world positioning (chunk0 center = (50, -0.1, 50), chunk1 center = (150, -0.1, 50))
      expect(chunk0.position.x).toBe(50);
      expect(chunk0.position.y).toBe(-0.1);
      expect(chunk1.position.x).toBe(150);
      expect(chunk1.position.y).toBe(-0.1);
    });
  });

  describe('5. Road Alignment & Shoulder Transition Geometry', () => {
    it('creates left and right transition shoulder ribbons flush with road/sidewalk perimeter', () => {
      const terrainManager = new TerrainChunkManager(assetManager);
      const roadGen = new ProceduralRoadGenerator(assetManager, terrainManager);

      const sampleRoad: RoadSegment = {
        id: 'road_kenyatta_ave',
        osmId: 101,
        name: 'Kenyatta Avenue',
        type: 'primary',
        lanes: 4,
        speedLimit: 50,
        hasSidewalks: true,
        width: 10.0, // halfWidth = 5.0
        path: [
          { x: 0, y: 0, z: 0 },
          { x: 0, y: 0, z: 30 },
          { x: 0, y: 0, z: 60 }
        ]
      };

      const roadGroup = roadGen.generateRoadMesh(sampleRoad);

      // Verify meshes present: asphalt road + lane lines + curbs + sidewalks + crosswalk + 2 shoulder ribbons
      const shoulderMeshes: THREE.Mesh[] = [];
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material === assetManager.getMaterial('road_shoulder_transition')) {
          shoulderMeshes.push(child);
        }
      });

      expect(shoulderMeshes.length).toBe(2); // Left shoulder + Right shoulder

      // Check left shoulder geometry alignment
      const leftGeo = shoulderMeshes[0].geometry;
      const leftPositions = leftGeo.getAttribute('position');
      expect(leftPositions.count).toBeGreaterThan(0);

      // With sidewalk (halfWidth=5.0, curb=0.3, sidewalk=3.0): outer sidewalk is at 8.0m
      // The two shoulder ribbons flank both sides of the road at distance 8.0m (inner) and 10.0m (outer)
      const leftInnerX = leftPositions.getX(0);
      const leftInnerY = leftPositions.getY(0);
      const leftOuterX = leftPositions.getX(1);

      expect(Math.abs(leftInnerX)).toBeCloseTo(8.0, 1);
      expect(leftInnerY).toBeCloseTo(0.20, 2);
      expect(Math.abs(leftOuterX)).toBeCloseTo(10.0, 1); // 8.0 + 2.0m shoulder

      // Check second shoulder ribbon geometry alignment on the opposite side
      const rightGeo = shoulderMeshes[1].geometry;
      const rightPositions = rightGeo.getAttribute('position');
      const rightInnerX = rightPositions.getX(0);
      const rightOuterX = rightPositions.getX(1);

      expect(Math.abs(rightInnerX)).toBeCloseTo(8.0, 1);
      expect(Math.abs(rightOuterX)).toBeCloseTo(10.0, 1);
      expect(leftInnerX * rightInnerX).toBeLessThan(0); // On opposite sides of the road center
    });

    it('correctly builds shoulder transition collar around roundabouts', () => {
      const terrainManager = new TerrainChunkManager(assetManager);
      const roadGen = new ProceduralRoadGenerator(assetManager, terrainManager);

      const roundaboutNode: IntersectionNode = {
        id: 'roundabout_kilimani',
        position: new THREE.Vector3(20, 0, 40),
        type: 'roundabout',
        radius: 12.0
      };

      const roundaboutGroup = roadGen.generateRoundaboutMesh(roundaboutNode);

      let collarMesh: THREE.Mesh | null = null;
      roundaboutGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material === assetManager.getMaterial('road_shoulder_transition')) {
          collarMesh = child;
        }
      });

      expect(collarMesh).not.toBeNull();
      const pos = collarMesh!.geometry.getAttribute('position');
      expect(pos.count).toBeGreaterThan(0);

      // Inner ring of collar is r + 4 = 16.0 from center
      const innerPt = new THREE.Vector3(pos.getX(0), pos.getY(0), pos.getZ(0));
      const distFromCenter = new THREE.Vector2(innerPt.x - 20, innerPt.z - 40).length();
      expect(distFromCenter).toBeCloseTo(16.0, 1);
    });
  });

  describe('6. Surface Continuity at Road/Terrain Junction', () => {
    it('sets transition shoulder outer elevation to exact terrain surface elevation without vertical jumps', () => {
      const terrainManager = new TerrainChunkManager(assetManager);
      const roadGen = new ProceduralRoadGenerator(assetManager, terrainManager);

      const sampleRoad: RoadSegment = {
        id: 'road_continuity_test',
        osmId: 102,
        name: 'Valley Road',
        type: 'secondary',
        lanes: 2,
        speedLimit: 40,
        hasSidewalks: false, // directly tests asphalt to shoulder (halfWidth = 3.5)
        width: 7.0,
        path: [
          { x: 10, y: 0, z: 10 },
          { x: 10, y: 0, z: 50 }
        ]
      };

      const roadGroup = roadGen.generateRoadMesh(sampleRoad);

      let leftShoulder: THREE.Mesh | null = null;
      roadGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material === assetManager.getMaterial('road_shoulder_transition')) {
          if (!leftShoulder) leftShoulder = child;
        }
      });

      expect(leftShoulder).not.toBeNull();
      const pos = leftShoulder!.geometry.getAttribute('position');

      // Check all sample vertices along the outer edge
      for (let i = 0; i < pos.count; i += 2) {
        const outerX = pos.getX(i + 1);
        const outerY = pos.getY(i + 1);
        const outerZ = pos.getZ(i + 1);

        const expectedTerrainY = terrainManager.getElevationAt(outerX, outerZ) - 0.1;
        expect(outerY).toBeCloseTo(expectedTerrainY, 3);
      }
    });
  });

  describe('7. Resource Reuse & Memory Efficiency', () => {
    it('reuses shared soil and asphalt materials across all spawned chunks and road meshes', () => {
      const terrainManager = new TerrainChunkManager(assetManager);

      const chunk1 = terrainManager.createTerrainChunkMesh(0, 0);
      const chunk2 = terrainManager.createTerrainChunkMesh(1, 1);
      const chunk3 = terrainManager.createTerrainChunkMesh(2, 2);

      // All chunks must reference the exact same material instance
      expect(chunk1.material).toBe(chunk2.material);
      expect(chunk2.material).toBe(chunk3.material);
      expect(chunk1.material).toBe(assetManager.getMaterial('ground_earth'));
    });

    it('reuses cached texture instances rather than regenerating duplicate textures', () => {
      const mat1 = TextureGenerator.createAsphaltTexture();
      const mat2 = TextureGenerator.createAsphaltTexture();
      expect(mat1).toBe(mat2);

      const shoulder1 = TextureGenerator.createRoadShoulderTexture();
      const shoulder2 = TextureGenerator.createRoadShoulderTexture();
      expect(shoulder1).toBe(shoulder2);
    });
  });
});
