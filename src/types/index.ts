import * as THREE from 'three';

export type RendererMode = 'WebGPU' | 'WebGL2';

export interface RenderStats {
  fps: number;
  frameTimeMs: number;
  rendererMode: RendererMode;
  drawCalls: number;
  triangles: number;
  geometries: number;
  textures: number;
  activeObjects: number;
  activeChunks: number;
  collisionProxies: number;
  totalNPCs: number;
  detailedNPCs: number;
  abstractNPCs: number;
  npcUpdatesPerFrame: number;
  trafficVehiclesCount?: number;
  activeTrafficCount?: number;
  avgTrafficSpeedKph?: number;
  congestedRoadsCount?: number;
  webGpuSupported: boolean;
  timeOfDayHours: number;
  sceneMeshCount?: number;
  terrainTileCount?: number;
  roadMeshCount?: number;
  buildingMeshCount?: number;
  visibleNPCCount?: number;
  visibleVehicleCount?: number;
  generatedChunkCount?: number;
  glbFailuresCount?: number;
  playerPosStr?: string;
  cameraPosStr?: string;
}

export interface TimeOfDayConfig {
  hours: number; // 0.0 to 24.0
  timeScale: number; // multiplier for real-time progression
  sunLightColor: THREE.Color;
  ambientLightColor: THREE.Color;
  sunPosition: THREE.Vector3;
  sunIntensity: number;
  ambientIntensity: number;
  skyColor: THREE.Color;
  groundColor: THREE.Color;
  fogColor: THREE.Color;
  streetlightsOn: boolean;
}

export interface IRendererManager {
  renderer: THREE.WebGLRenderer | any;
  mode: RendererMode;
  isWebGPU: boolean;
  domElement: HTMLCanvasElement;
  init(): Promise<void>;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  setSize(width: number, height: number): void;
  getStats(): Partial<RenderStats>;
}

export interface ISkyAtmosphere {
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.HemisphereLight;
  update(timeConfig: TimeOfDayConfig): void;
}

export interface ICameraManager {
  camera: THREE.PerspectiveCamera;
  update(aspect: number): void;
  setPosition(x: number, y: number, z: number): void;
  lookAt(target: THREE.Vector3): void;
}

export interface IGameSystem {
  id: string;
  init?(): Promise<void> | void;
  update(deltaTime: number, elapsedTime: number): void;
  dispose?(): void;
}
