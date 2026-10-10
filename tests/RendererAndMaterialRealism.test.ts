import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { RendererManager } from '../src/engine/RendererManager';
import { TextureGenerator } from '../src/assets/TextureGenerator';
import { AssetManager } from '../src/engine/AssetManager';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { SkyAtmosphere } from '../src/engine/SkyAtmosphere';
import { LightingSystem } from '../src/environment/LightingSystem';
import { TimeOfDay } from '../src/utils/TimeOfDay';
import { WeatherSystem } from '../src/environment/WeatherSystem';
import { InteriorManager } from '../src/interior/InteriorManager';
import { WorldChunkManager } from '../src/world/WorldChunkManager';

describe('Phase 11.3 — Renderer and Material Realism Verification', () => {
  describe('Task 1 & 2: Color Management & Tone Mapping Baseline', () => {
    it('initializes renderer with sRGB color space and ACES Filmic Tone Mapping', async () => {
      const dummyContainer = { appendChild: () => {} } as any;
      const rendererManager = new RendererManager(dummyContainer);
      await rendererManager.init();

      expect(rendererManager.renderer.outputColorSpace).toBe(THREE.SRGBColorSpace);
      expect(rendererManager.renderer.toneMapping).toBe(THREE.ACESFilmicToneMapping);
      expect(rendererManager.renderer.toneMappingExposure).toBe(1.0);
      expect(rendererManager.renderer.shadowMap.enabled).toBe(true);
      expect(rendererManager.renderer.shadowMap.type).toBe(THREE.PCFSoftShadowMap);
    });

    it('assigns SRGBColorSpace to color textures and keeps data maps linear', () => {
      const asphalt = TextureGenerator.createAsphaltTexture();
      const sidewalk = TextureGenerator.createSidewalkPaverTexture();
      const facade = TextureGenerator.createFacadePanelTexture('terracotta');
      const emissive = TextureGenerator.createEmissiveWindowMap();
      const matatuArt = TextureGenerator.createMatatuDecalTexture();
      const normalMap = TextureGenerator.createFacadeNormalMap();
      const roughnessMap = TextureGenerator.createFacadeRoughnessMap();

      // Color maps must be sRGB
      expect(asphalt.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(sidewalk.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(facade.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(emissive.colorSpace).toBe(THREE.SRGBColorSpace);
      expect(matatuArt.colorSpace).toBe(THREE.SRGBColorSpace);

      // Normal and roughness data maps must NOT be sRGB (Linear data)
      expect(normalMap.colorSpace).not.toBe(THREE.SRGBColorSpace);
      expect(roughnessMap.colorSpace).not.toBe(THREE.SRGBColorSpace);
    });
  });

  describe('Task 3: Physically Believable Materials & GLB Calibration', () => {
    let assetManager: AssetManager;

    beforeEach(() => {
      assetManager = new AssetManager();
    });

    it('calibrates procedural asphalt and concrete to matte, non-metallic surfaces', () => {
      const roadMat = assetManager.getMaterial('road_asphalt') as THREE.MeshStandardMaterial;
      const sidewalkMat = assetManager.getMaterial('sidewalk_concrete') as THREE.MeshStandardMaterial;
      const earthMat = assetManager.getMaterial('ground_earth') as THREE.MeshStandardMaterial;

      expect(roadMat.roughness).toBeGreaterThanOrEqual(0.8);
      expect(roadMat.metalness).toBeLessThanOrEqual(0.05);

      expect(sidewalkMat.roughness).toBeGreaterThanOrEqual(0.7);
      expect(sidewalkMat.metalness).toBeLessThanOrEqual(0.05);

      expect(earthMat.roughness).toBeGreaterThanOrEqual(0.9);
      expect(earthMat.metalness).toBeLessThanOrEqual(0.02);
    });

    it('calibrates glass to dielectric material without excessive metallic gloss', () => {
      const glassMat = assetManager.getMaterial('building_glass') as THREE.MeshPhysicalMaterial;

      expect(glassMat.metalness).toBe(0.0);
      expect(glassMat.roughness).toBeLessThanOrEqual(0.1);
      expect(glassMat.transparent).toBe(true);
      expect(glassMat.opacity).toBeLessThan(0.7);
      expect(glassMat.reflectivity).toBeGreaterThan(0.5);
    });

    it('calibrates vehicle paint and tires for believable automotive contrast', () => {
      const matatuMat = assetManager.getMaterial('matatu_yellow') as THREE.MeshStandardMaterial;
      const carMetalMat = assetManager.getMaterial('vehicle_metal') as THREE.MeshStandardMaterial;
      const tireMat = assetManager.getMaterial('vehicle_tire') as THREE.MeshStandardMaterial;

      // Car paint: smooth clearcoat sheen
      expect(matatuMat.roughness).toBeLessThanOrEqual(0.35);
      expect(matatuMat.metalness).toBeGreaterThanOrEqual(0.3);

      expect(carMetalMat.roughness).toBeLessThanOrEqual(0.25);
      expect(carMetalMat.metalness).toBeGreaterThanOrEqual(0.6);

      // Rubber tires: high roughness, zero metallic sheen
      expect(tireMat.roughness).toBeGreaterThanOrEqual(0.9);
      expect(tireMat.metalness).toBeLessThanOrEqual(0.05);
    });

    it('calibrates loaded GLB character clothing and skin to eliminate metallic defects', () => {
      const pipeline = AssetPipeline.getInstance();

      // Create a simulated loaded character group with raw ReadyPlayerMe materials
      const characterGroup = new THREE.Group();
      characterGroup.name = 'GLB_char_player_01';

      const outfitTopMat = new THREE.MeshStandardMaterial({ name: 'Wolf3D_Outfit_Top', metalness: 1.0, roughness: 0.5 });
      const skinMat = new THREE.MeshStandardMaterial({ name: 'Wolf3D_Skin', metalness: 1.0, roughness: 0.5 });
      const hairMat = new THREE.MeshStandardMaterial({ name: 'Wolf3D_Hair', metalness: 0.8, roughness: 0.5 });

      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(), outfitTopMat);
      bodyMesh.name = 'Wolf3D_Outfit_Top';
      const headMesh = new THREE.Mesh(new THREE.BoxGeometry(), skinMat);
      headMesh.name = 'Wolf3D_Head';
      const hairMesh = new THREE.Mesh(new THREE.BoxGeometry(), hairMat);
      hairMesh.name = 'Wolf3D_Hair';

      characterGroup.add(bodyMesh, headMesh, hairMesh);

      // Apply calibration
      pipeline.calibrateModelMaterials(characterGroup, 'char_player_01');

      // Assert shadows
      expect(bodyMesh.castShadow).toBe(true);
      expect(bodyMesh.receiveShadow).toBe(true);
      expect(headMesh.castShadow).toBe(true);
      expect(headMesh.receiveShadow).toBe(true);

      // Assert physical material calibration
      expect(outfitTopMat.metalness).toBe(0.0);
      expect(outfitTopMat.roughness).toBeGreaterThanOrEqual(0.8);

      expect(skinMat.metalness).toBe(0.0);
      expect(skinMat.roughness).toBeGreaterThanOrEqual(0.6);

      expect(hairMat.metalness).toBe(0.0);
    });

    it('calibrates loaded GLB vehicle materials to clearcoat paint, dielectric glass, and rubber', () => {
      const pipeline = AssetPipeline.getInstance();

      const vehicleGroup = new THREE.Group();
      vehicleGroup.name = 'GLB_veh_sedan_01';

      const paintMat = new THREE.MeshStandardMaterial({ name: 'paintRed', metalness: 0.0, roughness: 1.0 });
      const glassMat = new THREE.MeshStandardMaterial({ name: 'window_glass', metalness: 0.9, roughness: 0.1 });
      const tireMat = new THREE.MeshStandardMaterial({ name: 'tire_rubber', metalness: 0.5, roughness: 0.5 });

      const bodyMesh = new THREE.Mesh(new THREE.BoxGeometry(), paintMat);
      const glassMesh = new THREE.Mesh(new THREE.BoxGeometry(), glassMat);
      const wheelMesh = new THREE.Mesh(new THREE.BoxGeometry(), tireMat);

      vehicleGroup.add(bodyMesh, glassMesh, wheelMesh);

      pipeline.calibrateModelMaterials(vehicleGroup, 'veh_sedan_01');

      expect(bodyMesh.castShadow).toBe(true);
      expect(paintMat.metalness).toBeGreaterThanOrEqual(0.5);
      expect(paintMat.roughness).toBeLessThanOrEqual(0.3);

      expect(glassMat.metalness).toBe(0.0);
      expect(glassMat.transparent).toBe(true);
      expect(glassMat.opacity).toBeLessThan(0.7);

      expect(tireMat.metalness).toBeLessThanOrEqual(0.05);
      expect(tireMat.roughness).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('Task 4: Environmental Lighting & Shadows', () => {
    let scene: THREE.Scene;
    let skyAtmosphere: SkyAtmosphere;
    let lightingSystem: LightingSystem;

    beforeEach(() => {
      scene = new THREE.Scene();
      skyAtmosphere = new SkyAtmosphere(scene);
      lightingSystem = new LightingSystem(scene);
    });

    it('configures directional light with high-resolution shadow frustum and anti-acne bias', () => {
      expect(skyAtmosphere.sunLight.castShadow).toBe(true);
      expect(skyAtmosphere.sunLight.shadow.mapSize.width).toBe(4096);
      expect(skyAtmosphere.sunLight.shadow.mapSize.height).toBe(4096);
      expect(skyAtmosphere.sunLight.shadow.bias).toBe(-0.0001);
      expect(skyAtmosphere.sunLight.shadow.normalBias).toBe(0.04);
    });

    it('centers shadow camera dynamically on player camera without LightingSystem desync', () => {
      const timeOfDay = new TimeOfDay(14.0, 60.0);
      const todConfig = timeOfDay.getConfig();
      const weatherSystem = new WeatherSystem('CLEAR');

      const playerCam = new THREE.PerspectiveCamera();
      playerCam.position.set(50, 1.7, 75);

      // SkyAtmosphere centers on player camera
      skyAtmosphere.update(todConfig, playerCam);

      const cameraCenteredPos = skyAtmosphere.sunLight.position.clone();
      const cameraTargetPos = skyAtmosphere.sunLight.target.position.clone();

      expect(cameraTargetPos.x).toBeCloseTo(playerCam.position.x);
      expect(cameraTargetPos.z).toBeCloseTo(playerCam.position.z);

      // LightingSystem update must NOT overwrite sunLight.position with static world vector
      lightingSystem.update(todConfig, weatherSystem.getConfig());

      expect(skyAtmosphere.sunLight.position.x).toBeCloseTo(cameraCenteredPos.x);
      expect(skyAtmosphere.sunLight.position.y).toBeCloseTo(cameraCenteredPos.y);
      expect(skyAtmosphere.sunLight.position.z).toBeCloseTo(cameraCenteredPos.z);
    });

    it('differentiates 14:00 daylight and 19:30 evening lighting with proper streetlights state', () => {
      const timeOfDay = new TimeOfDay(14.0, 60.0);
      const dayConfig = timeOfDay.getConfig();

      expect(dayConfig.sunIntensity).toBeGreaterThan(1.5);
      expect(dayConfig.streetlightsOn).toBe(false);

      timeOfDay.setTime(19.5);
      const eveningConfig = timeOfDay.getConfig();

      expect(eveningConfig.sunIntensity).toBeLessThan(1.0);
      expect(eveningConfig.streetlightsOn).toBe(true);
      expect(eveningConfig.ambientIntensity).toBeLessThan(dayConfig.ambientIntensity);
    });

    it('dims environment reflection intensity on interior entry and restores on exit', () => {
      const assetManager = new AssetManager();
      const chunkManager = new WorldChunkManager(scene, assetManager);
      const interiorManager = new InteriorManager(scene, chunkManager, assetManager);

      const dummyPlayer = {
        getPosition: () => new THREE.Vector3(45, 0, 35),
        motor: { position: new THREE.Vector3(45, 0, 35) },
        interactionSystem: { registerInteractable: () => {} }
      } as any;

      // Enter Club Velvet
      const entered = interiorManager.enterBuilding('bld_bespoke_nightclub_kilimani', dummyPlayer);
      expect(entered).toBe(true);
      expect((scene as any).environmentIntensity).toBe(0.2);

      // Exit Club Velvet
      const exited = interiorManager.exitBuilding(dummyPlayer);
      expect(exited).toBe(true);
      expect((scene as any).environmentIntensity).toBe(0.85);
    });
  });
});
