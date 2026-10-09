import * as THREE from 'three';
import { RenderStats, RendererMode } from '../types';

export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private lastFpsUpdate = performance.now();
  private fps = 60;
  private frameTimeMs = 16.6;

  public update(): void {
    const now = performance.now();
    this.frameTimeMs = now - this.lastTime;
    this.lastTime = now;
    this.frameCount++;

    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  public getStats(
    renderer: THREE.WebGLRenderer | any,
    mode: RendererMode,
    webGpuSupported: boolean,
    scene: THREE.Scene,
    timeOfDayHours: number,
    activeChunks: number = 0,
    collisionProxies: number = 0,
    totalNPCs: number = 0,
    detailedNPCs: number = 0,
    abstractNPCs: number = 0,
    npcUpdatesPerFrame: number = 0,
    trafficVehiclesCount: number = 0,
    activeTrafficCount: number = 0,
    avgTrafficSpeedKph: number = 0,
    congestedRoadsCount: number = 0
  ): RenderStats {
    let drawCalls = 0;
    let triangles = 0;
    let geometries = 0;
    let textures = 0;

    const info = (renderer as THREE.WebGLRenderer).info;
    if (info && info.render) {
      drawCalls = info.render.calls || 0;
      triangles = info.render.triangles || 0;
      geometries = info.memory ? info.memory.geometries : 0;
      textures = info.memory ? info.memory.textures : 0;
    }

    let activeObjects = 0;
    let sceneMeshCount = 0;
    let terrainTileCount = 0;
    let roadMeshCount = 0;
    let buildingMeshCount = 0;
    let visibleNPCCount = 0;
    let visibleVehicleCount = 0;

    scene.traverse((obj) => {
      if (obj.visible) {
        activeObjects++;
        if ((obj as THREE.Mesh).isMesh) {
          sceneMeshCount++;
        }
        if (obj.name.startsWith('TerrainChunk_')) terrainTileCount++;
        if (obj.name.startsWith('Road_') || obj.name.includes('RoadSegment')) roadMeshCount++;
        if (obj.name.startsWith('BuildingGroup_')) buildingMeshCount++;
        if (obj.name.startsWith('NPCMesh_')) visibleNPCCount++;
        if (obj.name.startsWith('VehicleMesh_')) visibleVehicleCount++;
      }
    });

    return {
      fps: this.fps,
      frameTimeMs: parseFloat(this.frameTimeMs.toFixed(2)),
      rendererMode: mode,
      drawCalls,
      triangles,
      geometries,
      textures,
      activeObjects,
      activeChunks,
      collisionProxies,
      totalNPCs,
      detailedNPCs,
      abstractNPCs,
      npcUpdatesPerFrame,
      trafficVehiclesCount,
      activeTrafficCount,
      avgTrafficSpeedKph,
      congestedRoadsCount,
      webGpuSupported,
      timeOfDayHours: parseFloat(timeOfDayHours.toFixed(1)),
      sceneMeshCount,
      terrainTileCount,
      roadMeshCount,
      buildingMeshCount,
      visibleNPCCount,
      visibleVehicleCount
    };
  }
}
