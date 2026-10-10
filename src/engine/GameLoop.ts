import * as THREE from 'three';
import { RendererManager } from './RendererManager';
import { CameraManager } from './CameraManager';
import { SkyAtmosphere } from './SkyAtmosphere';
import { AssetManager } from './AssetManager';
import { AssetPipeline } from '../assets/AssetPipeline';
import { TimeOfDay } from '../utils/TimeOfDay';
import { PerformanceMonitor } from '../utils/PerformanceMonitor';
import { NairobiDistrictScene } from '../world/NairobiDistrictScene';
import { PlayerController } from '../player/PlayerController';
import { NPCManager } from '../npc/NPCManager';
import { NPCSpawner } from '../npc/NPCSpawner';
import { NPC } from '../npc/NPC';
import { NPCSimulation } from '../npc/NPCSimulation';
import { VehicleManager } from '../vehicles/VehicleManager';
import { TrafficManager } from '../traffic/TrafficManager';
import { EnvironmentManager } from '../environment/EnvironmentManager';
import { InteriorManager } from '../interior/InteriorManager';
import { InteractionManager } from '../interaction/InteractionManager';
import { ConversationUI } from '../ui/ConversationUI';
import { DebugOverlay } from '../ui/DebugOverlay';
import { HUDOverlay } from '../ui/HUDOverlay';

import { AudioManager } from '../audio/AudioManager';
import { MinimapUI } from '../ui/MinimapUI';
import { SpeedometerUI } from '../ui/SpeedometerUI';
import { MainMenuUI } from '../ui/MainMenuUI';
import { ParticleSystem } from './ParticleSystem';

export type BootStage =
  | 'INITIALIZING_RENDERER'
  | 'PRELOADING_ASSETS'
  | 'GENERATING_WORLD'
  | 'INITIALIZING_GAMEPLAY'
  | 'READY'
  | 'FAILED';

function inspectScene(scene: THREE.Scene) {
  let meshes = 0;
  scene.traverse((object) => {
    if ((object as THREE.Mesh).isMesh) {
      meshes++;
    }
  });
  return {
    topLevelObjects: scene.children.length,
    meshObjects: meshes,
  };
}

export class GameLoop {
  private rendererManager: RendererManager;
  private cameraManager: CameraManager;
  private skyAtmosphere: SkyAtmosphere;
  private assetManager: AssetManager;
  private timeOfDay: TimeOfDay;
  private perfMonitor: PerformanceMonitor;
  private sceneGenerator: NairobiDistrictScene;
  private playerController!: PlayerController;
  private npcManager!: NPCManager;
  private npcSimulation!: NPCSimulation;
  public vehicleManager!: VehicleManager;
  public trafficManager!: TrafficManager;
  public environmentManager!: EnvironmentManager;
  public interiorManager!: InteriorManager;
  public interactionManager!: InteractionManager;
  private conversationUI!: ConversationUI;
  private debugOverlay!: DebugOverlay;
  private hudOverlay!: HUDOverlay;

  private minimapUI!: MinimapUI;
  private speedometerUI!: SpeedometerUI;
  public mainMenuUI!: MainMenuUI;
  private particleSystem!: ParticleSystem;

  private scene: THREE.Scene;
  private isRunning: boolean = false;
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  public bootStage: BootStage = 'INITIALIZING_RENDERER';
  private bootStageStartTime: number = performance.now();
  private bootStageDurations: Map<BootStage, number> = new Map();

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();

    this.rendererManager = new RendererManager(container);
    this.cameraManager = new CameraManager();
    this.skyAtmosphere = new SkyAtmosphere(this.scene);
    this.assetManager = new AssetManager();
    this.timeOfDay = new TimeOfDay(14.0, 360.0);
    this.perfMonitor = new PerformanceMonitor();
    this.sceneGenerator = new NairobiDistrictScene(this.scene, this.assetManager);
  }

  private setBootStage(stage: BootStage): void {
    const now = performance.now();
    const duration = now - this.bootStageStartTime;
    this.bootStageDurations.set(this.bootStage, duration);
    console.info(`[KINGMAKER Boot] ${this.bootStage} completed in ${duration.toFixed(1)}ms -> Entering ${stage}`);
    this.bootStage = stage;
    this.bootStageStartTime = now;
    if (typeof window !== 'undefined') {
      (window as any).__KINGMAKER_BOOT_STAGE__ = stage;
    }
  }

  public async start(): Promise<void> {
    try {
      console.info('[KINGMAKER] Build:', typeof __BUILD_REVISION__ !== 'undefined' ? __BUILD_REVISION__ : 'dev');

      // 1. Initialize Renderer
      this.setBootStage('INITIALIZING_RENDERER');
      await this.rendererManager.init();

      // 1b. Preload Core Authored 3D Assets
      this.setBootStage('PRELOADING_ASSETS');
      await AssetPipeline.getInstance().preloadCoreAssets();

      // 2. Generate Real GIS Nairobi District World
      this.setBootStage('GENERATING_WORLD');
      this.sceneGenerator.generate();

      // Collect actual scene data and assert world invariants in DEV
      const sceneStats = inspectScene(this.scene);
      const chunks = this.sceneGenerator.chunkManager;
      console.info('[World initialized]', {
        ...sceneStats,
        generatedChunks: chunks.chunks.size,
        activeChunks: chunks.getActiveChunkCount(),
        playerPosition: [0, 0.5, 15],
        cameraPosition: this.cameraManager.camera.position.toArray(),
      });

      if (import.meta.env.DEV) {
        console.assert(
          chunks.chunks.size > 0,
          'World initialization failed: no chunks were created',
        );
        console.assert(
          chunks.getActiveChunkCount() > 0,
          'World initialization failed: no chunks are active',
        );
      }

      // 3. Initialize Gameplay & Subsystems
      this.setBootStage('INITIALIZING_GAMEPLAY');

      // Particle System
      this.particleSystem = new ParticleSystem(this.scene);

      // Player Controller & Camera
      this.playerController = new PlayerController(
        this.scene,
        this.cameraManager.camera,
        this.rendererManager.domElement
      );

      // Vehicle Manager & Spawn Fleet
      this.vehicleManager = new VehicleManager(
        this.scene,
        this.cameraManager.camera,
        this.assetManager
      );
      this.vehicleManager.spawnDeterministicFleet(1337);
      this.playerController.vehicleManager = this.vehicleManager;

      // Autonomous Traffic Manager
      this.trafficManager = new TrafficManager(
        this.vehicleManager,
        this.sceneGenerator.chunkManager.roadGraph
      );
      this.trafficManager.init(1337);

      // Environment Manager
      this.environmentManager = new EnvironmentManager(
        this.scene,
        this.assetManager,
        this.sceneGenerator.chunkManager
      );

      // Interior Manager & Building Streaming
      this.interiorManager = new InteriorManager(
        this.scene,
        this.sceneGenerator.chunkManager,
        this.assetManager,
        1337
      );

      // NPC Manager, Spawner, & Destinations
      this.npcManager = new NPCManager();
      this.npcSimulation = new NPCSimulation(this.npcManager, this.sceneGenerator.chunkManager.roadGraph);

      this.initNPCPopulationAndDestinations();

      // Interaction Manager & Conversation UI
      this.interactionManager = new InteractionManager(
        this.playerController.interactionSystem,
        this.npcManager,
        1337
      );
      this.conversationUI = new ConversationUI(document.body);

      this.interactionManager.conversationSystem.setOnConversationChange((convState) => {
        this.conversationUI.update(convState);
      });

      this.conversationUI.setOnResponseSelected((respId) => {
        this.interactionManager.conversationSystem.selectResponse('player_1', respId);
      });

      // Register Sample Interactables for Acceptance Tests
      this.registerInteractables();

      // Attach UI Overlay, HUD, Speedometer & Minimap
      this.debugOverlay = new DebugOverlay(document.body);
      this.hudOverlay = new HUDOverlay(document.body);
      this.minimapUI = new MinimapUI(document.body);
      this.speedometerUI = new SpeedometerUI(document.body);

      this.mainMenuUI = new MainMenuUI(document.body, (mode) => {
        if (mode === 'matatu') {
          const matatus = Array.from(this.vehicleManager.vehicles.values()).filter(v => v.definition.type === 'matatu');
          if (matatus.length > 0) {
            this.vehicleManager.enterVehicle(matatus[0]);
            this.playerController.state.setMode('IN_VEHICLE');
            AudioManager.getInstance().setMatatuRadio(true);
          }
        } else if (mode === 'club') {
          this.playerController.motor.position.set(45, 0.5, 20);
        }
      });

      this.debugOverlay.setOnTimeChange((hours) => {
        this.timeOfDay.setTime(hours);
      });

      this.playerController.interactionSystem.setOnPromptChange((promptState) => {
        this.hudOverlay.updateInteractionPrompt(promptState);
      });

      // Attach Window Resize Listener
      window.addEventListener('resize', this.onWindowResize.bind(this));

      // Boot Stage -> READY
      this.setBootStage('READY');

      if (typeof window !== 'undefined') {
        (window as any).THREE = THREE;
        (window as any).__KINGMAKER_GAME__ = this;
        (window as any).__KINGMAKER_DEBUG__ = {
          scene: this.scene,
          camera: this.cameraManager.camera,
          cameraManager: this.cameraManager,
          player: this.playerController,
          vehicleManager: this.vehicleManager,
          npcManager: this.npcManager,
          timeOfDay: this.timeOfDay,
          rendererManager: this.rendererManager,
          assetPipeline: AssetPipeline.getInstance(),
          chunkManager: this.sceneGenerator.chunkManager,
          perfMonitor: this.perfMonitor
        };
      }

      // Start RAF Loop
      this.isRunning = true;
      this.lastFrameTime = performance.now();
      this.tick(this.lastFrameTime);

      console.log('🚀 KINGMAKER Rise of Africa — Production Game Experience Loaded!');
    } catch (err) {
      this.setBootStage('FAILED');
      console.error('🔴 Critical Engine Error during boot:', err);
      this.showBootErrorScreen(err);
    }
  }


  private initNPCPopulationAndDestinations(): void {
    const spawner = new NPCSpawner();

    // Register Activity Destinations
    this.npcManager.registerDestination({
      id: 'dest_club_kileleshwa',
      displayName: 'Kileleshwa Lounge & Nightclub',
      position: new THREE.Vector3(45, 0.3, 20),
      activities: ['CLUB', 'SOCIALIZE', 'EAT'],
      tags: ['nightlife', 'entertainment'],
      capacity: 150,
      currentOccupancy: 0
    });

    this.npcManager.registerDestination({
      id: 'dest_yaya_mall',
      displayName: 'Yaya Commercial Hub',
      position: new THREE.Vector3(-10, 0.3, -30),
      activities: ['SHOP', 'EAT', 'WORK'],
      tags: ['commercial', 'retail'],
      capacity: 300,
      currentOccupancy: 0
    });

    this.npcManager.registerDestination({
      id: 'dest_upperhill_towers',
      displayName: 'Upper Hill Financial Plaza',
      position: new THREE.Vector3(80, 0.3, -60),
      activities: ['WORK'],
      tags: ['office', 'financial'],
      capacity: 500,
      currentOccupancy: 0
    });

    // Populate 40 Deterministic NPCs from Seed 1337
    const initialSeed = 1337;
    for (let i = 0; i < 40; i++) {
      const npcSeed = initialSeed + i * 17;
      const homeX = (i % 8) * 35 - 120;
      const homeZ = Math.floor(i / 8) * 35 - 120;
      const homePos = new THREE.Vector3(homeX, 0.3, homeZ);

      const npcData = spawner.generateDeterministicNPC(`npc_${i}`, npcSeed, homePos);
      const npc = new NPC(npcData, this.scene);
      this.npcManager.registerNPC(npc);
    }
  }

  private registerInteractables(): void {
    // 1. Mama Njeri Electronics Shop
    this.playerController.interactionSystem.registerInteractable({
      id: 'shop_mama_njeri',
      displayName: 'Mama Njeri Electronics & M-Pesa Kiosk',
      interactionType: 'shop',
      position: new THREE.Vector3(10, 0.3, -20),
      interactionRadius: 5.0,
      canInteract: () => true,
      interact: () => {
        AudioManager.getInstance().playCoin();
        alert('🏪 Mama Njeri: "Jambo! Welcome to Mamboleo Electronics. M-Pesa services and tech goods available."');
        this.playerController.state.addCash(500);
      }
    });

    // 2. Sunrise Apartment Rental Property
    this.playerController.interactionSystem.registerInteractable({
      id: 'prop_sunrise_3b',
      displayName: 'Studio Flat 3B - Sunrise Heights',
      interactionType: 'property',
      position: new THREE.Vector3(-85, 0.3, 30),
      interactionRadius: 6.0,
      canInteract: () => true,
      interact: () => {
        AudioManager.getInstance().playCoin();
        alert('🏠 Property Manager: "Sunrise Flat 3B is available for rent at KSh 15,000 / month."');
        this.playerController.state.addReputation(5);
      }
    });
  }

  private tick(now: number): void {
    if (!this.isRunning) return;

    try {
      const deltaSeconds = Math.min((now - this.lastFrameTime) / 1000, 0.1);
      this.lastFrameTime = now;

      // 1. Update Time of Day & Lighting
      this.timeOfDay.update(deltaSeconds);
      const todConfig = this.timeOfDay.getConfig();
      const activeCamera = this.vehicleManager.driving
        ? this.vehicleManager.vehicleCamera.camera
        : this.cameraManager.camera;
      this.skyAtmosphere.update(todConfig, activeCamera);
      this.sceneGenerator.updateStreetlights(todConfig.streetlightsOn);

      // 2. Update World Chunk Streaming around Player Position
      const playerPos = this.playerController.getPosition();
      this.sceneGenerator.update(playerPos);

      // 3. Update Dense Environment Details, Weather, Lighting & LOD
      this.environmentManager.update(playerPos, todConfig, deltaSeconds);

      // 3b. Update Interactive Building Interiors, Streaming & Door Prompts
      this.interiorManager.update(playerPos, this.playerController);

      // 4. Obtain Dedicated Query Collections (Ground Meshes, Camera Occluders, Spatial Collision Proxies)
      const worldQueries = this.sceneGenerator.getWorldQueries(playerPos, 80.0);

      // 5. Update Player Controller & Vehicles with strictly isolated queries
      this.playerController.update(
        deltaSeconds,
        worldQueries.groundMeshes,
        worldQueries.staticCollisionProxies,
        worldQueries.cameraOccluders
      );
      this.vehicleManager.update(
        deltaSeconds,
        playerPos,
        worldQueries.groundMeshes,
        worldQueries.cameraOccluders
      );

      // 5b. Update Core Interaction & Social World System
      const inputState = this.playerController.input.getInput();
      this.interactionManager.update(playerPos, inputState.interact);

      // Audio & Particle Updates based on Player Driving / Foot State
      const isDriving = this.vehicleManager.driving;
      const vehTelemetry = this.vehicleManager.getTelemetry();

      if (isDriving && this.vehicleManager.activeVehicle) {
        AudioManager.getInstance().startEngine();
        AudioManager.getInstance().updateEngineRPM(vehTelemetry.speedKph, inputState.forward);
        this.speedometerUI.show();
        this.speedometerUI.update(vehTelemetry.speedKph, inputState.forward);

        if (inputState.horn) {
          AudioManager.getInstance().playHorn();
        }

        // Spawn tire dust particles when driving fast
        if (vehTelemetry.speedKph > 10 && this.vehicleManager.activeVehicle) {
          const vehPos = this.vehicleManager.activeVehicle.state.position;
          this.particleSystem.spawnDust(vehPos, new THREE.Vector3(0, 0.5, 0));
        }
      } else {
        AudioManager.getInstance().stopEngine();
        this.speedometerUI.hide();

        const speed = this.playerController.motor.getSpeed();
        if (speed > 0.5) {
          AudioManager.getInstance().playFootstep(speed);
        }
      }

      // 6. Update Autonomous Traffic Simulation
      const npcPositions = Array.from(this.npcManager.npcs.values()).map((npc) => npc.state.currentPosition);
      this.trafficManager.update(
        deltaSeconds,
        todConfig.hours,
        playerPos,
        this.vehicleManager.activeVehicle,
        npcPositions,
        worldQueries.groundMeshes
      );

      // Check vehicle proximity interaction prompt
      const vehPrompt = this.vehicleManager.checkPlayerInteraction(playerPos);
      if (vehPrompt.canEnter || vehPrompt.canExit) {
        this.hudOverlay.updateInteractionPrompt({
          hasTarget: true,
          displayName: vehPrompt.promptText,
          distanceMeters: 2.0
        });
      }

      // 7. Update Living NPC Population Simulation
      this.npcSimulation.update(playerPos, todConfig.hours, deltaSeconds);
      const npcTelemetry = this.npcManager.getTelemetry();
      const trafficStats = this.trafficManager.getTelemetryStats();

      // 8. Update HUD Overlay, Minimap UI & Player Telemetry
      this.hudOverlay.updatePlayerStats(
        this.playerController.state.getCash(),
        this.playerController.state.getReputation(),
        this.playerController.state.getMode(),
        this.playerController.state.getStamina()
      );
      this.hudOverlay.updateDrivingHUD(
        vehTelemetry.speedKph,
        vehTelemetry.drivingState,
        this.vehicleManager.driving
      );

      // Update Minimap UI
      const activeVehiclesList = Array.from(this.vehicleManager.vehicles.values()).map(v => ({
        position: v.state.position,
        isMatatu: v.definition.type === 'matatu'
      }));
      this.minimapUI.update(playerPos, this.playerController.motor.rotationY, activeVehiclesList, npcPositions);

      // 9. Render Scene with appropriate Camera & Particle System
      this.particleSystem.update(deltaSeconds, activeCamera);
      this.rendererManager.render(this.scene, activeCamera);

      // 10. Telemetry & Debug Overlay Update
      this.perfMonitor.update();
      const assetStats = AssetPipeline.getInstance().getStats();
      const stats = this.perfMonitor.getStats(
        this.rendererManager.renderer as any,
        this.rendererManager.mode,
        this.rendererManager.isWebGPU,
        this.scene,
        todConfig.hours,
        this.sceneGenerator.chunkManager.getActiveChunkCount(),
        worldQueries.staticCollisionProxies.length,
        npcTelemetry.totalNPCs,
        npcTelemetry.detailedNPCs,
        npcTelemetry.abstractNPCs,
        this.npcSimulation.lastUpdatesThisFrame,
        trafficStats.totalTrafficVehicles,
        trafficStats.activeTrafficVehicles,
        trafficStats.averageTrafficSpeedKph,
        trafficStats.congestedRoadsCount,
        {
          buildRevision: typeof __BUILD_REVISION__ !== 'undefined' ? __BUILD_REVISION__ : 'dev',
          bootStage: this.bootStage,
          generatedChunkCount: this.sceneGenerator.chunkManager.chunks.size,
          assetLoadedCount: assetStats.assetLoadedCount,
          assetFallbacksCount: assetStats.assetFallbacksCount,
          assetFailuresCount: assetStats.assetFailuresCount,
          glbFailuresCount: assetStats.assetFailuresCount
        }
      );

      this.debugOverlay.update(stats);


      // 11. Request Next Frame
      if (typeof requestAnimationFrame === 'function') {
        this.animationFrameId = requestAnimationFrame((t) => this.tick(t));
      }
    } catch (err) {
      console.error('🔴 Runtime Error in Game Loop execution:', err);
      this.stop();
    }
  }

  private onWindowResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.rendererManager.setSize(width, height);
    this.cameraManager.update(width / height);
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  private showBootErrorScreen(err: unknown): void {
    const errorBox = document.createElement('div');
    errorBox.className = 'error-box';
    errorBox.innerHTML = `
      <h2>🔴 Engine Boot Error</h2>
      <p>${err instanceof Error ? err.message : String(err)}</p>
    `;
    document.body.appendChild(errorBox);
  }
}
