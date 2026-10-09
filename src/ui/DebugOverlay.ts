import { RenderStats } from '../types';

export class DebugOverlay {
  private container: HTMLDivElement;
  private statsContent: HTMLDivElement;
  private timeSlider: HTMLInputElement;
  private timeLabel: HTMLSpanElement;
  private onTimeChangeCallback?: (hours: number) => void;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'debug-overlay';

    this.container.innerHTML = `
      <div class="debug-panel">
        <div class="debug-header">
          <span class="debug-title">👑 KINGMAKER ENGINE v0.1</span>
          <span id="gpu-badge" class="badge">WebGPU</span>
        </div>
        <div id="debug-stats" class="debug-stats">
          Loading performance telemetry...
        </div>
        <div class="debug-control-group">
          <div class="control-label">
            <span>Time of Day: <strong id="time-display">14:00</strong></span>
          </div>
          <input type="range" id="time-slider" min="0" max="24" step="0.1" value="14">
        </div>
      </div>
    `;

    parent.appendChild(this.container);

    this.statsContent = (this.container.querySelector('#debug-stats') || document.createElement('div')) as HTMLDivElement;
    this.timeSlider = (this.container.querySelector('#time-slider') || document.createElement('input')) as HTMLInputElement;
    this.timeLabel = (this.container.querySelector('#time-display') || document.createElement('span')) as HTMLSpanElement;

    if (this.timeSlider && this.timeSlider.addEventListener) {
      this.timeSlider.addEventListener('input', () => {
        const val = parseFloat(this.timeSlider.value);
        this.updateTimeLabel(val);
        if (this.onTimeChangeCallback) {
          this.onTimeChangeCallback(val);
        }
      });
    }
  }

  public setOnTimeChange(callback: (hours: number) => void): void {
    this.onTimeChangeCallback = callback;
  }

  public update(stats: RenderStats): void {
    const gpuBadge = this.container.querySelector('#gpu-badge');
    if (gpuBadge) {
      if (stats.rendererMode === 'WebGPU') {
        gpuBadge.textContent = '⚡ WebGPU Active';
        gpuBadge.className = 'badge webgpu';
      } else {
        gpuBadge.textContent = '🔄 WebGL2 Fallback';
        gpuBadge.className = 'badge webgl2';
      }
    }

    const hours = Math.floor(stats.timeOfDayHours);
    const mins = Math.floor((stats.timeOfDayHours % 1) * 60);
    const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    if (this.timeLabel) {
      this.timeLabel.textContent = timeStr;
    }
    
    // Sync slider position if not being dragged
    if (this.timeSlider && typeof document !== 'undefined' && document.activeElement !== this.timeSlider) {
      this.timeSlider.value = stats.timeOfDayHours.toString();
    }

    const buildRev = stats.buildRevision || (typeof __BUILD_REVISION__ !== 'undefined' ? __BUILD_REVISION__ : 'dev');
    const isWorldEmpty = (stats.activeChunks === 0) || (stats.sceneMeshCount === 0);
    const assetFailures = stats.assetFailuresCount || 0;
    const assetFallbacks = stats.assetFallbacksCount || 0;

    if (this.statsContent) {
      this.statsContent.innerHTML = `
      <div class="stat-row"><span class="label">Build:</span> <span class="val highlight">${buildRev}</span></div>
      <div class="stat-row"><span class="label">World Status:</span> <span class="val ${stats.bootStage === 'FAILED' ? 'warn' : 'good'}">${stats.bootStage || 'READY'}</span></div>
      <div class="stat-row"><span class="label">FPS / Frame Time:</span> <span class="val ${stats.fps >= 55 ? 'good' : 'warn'}">${stats.fps} FPS (${stats.frameTimeMs} ms)</span></div>
      <div class="stat-row"><span class="label">Renderer:</span> <span class="val highlight">${stats.rendererMode}</span></div>
      <div class="stat-row"><span class="label">Chunks (Active/Total):</span> <span class="val ${stats.activeChunks > 0 ? 'good' : 'warn'}">${stats.activeChunks} active / ${stats.generatedChunkCount || 49} total</span></div>
      <div class="stat-row"><span class="label">Scene Meshes:</span> <span class="val highlight">${stats.activeMeshCount ?? stats.sceneMeshCount ?? 0} active (${stats.registeredMeshCount ?? stats.sceneMeshCount ?? 0} in graph)</span></div>
      <div class="stat-row"><span class="label">Buildings / Terrain / Roads:</span> <span class="val">${stats.buildingMeshCount || 0} blds / ${stats.terrainTileCount || 0} tiles / ${stats.roadMeshCount || 0} roads</span></div>
      <div class="stat-row"><span class="label">Asset Loading:</span> <span class="val ${assetFailures > 0 ? 'warn' : 'good'}">${stats.assetLoadedCount || 0} loaded | ${assetFallbacks} fallbacks | ${assetFailures} failed</span></div>
      <div class="stat-row"><span class="label">Collision Proxies:</span> <span class="val">${stats.collisionProxies}</span></div>
      <div class="stat-row"><span class="label">NPC Population (Detailed/Total):</span> <span class="val highlight">${stats.detailedNPCs} / ${stats.totalNPCs}</span></div>
      <div class="stat-row"><span class="label">Autonomous Traffic:</span> <span class="val highlight">${stats.trafficVehiclesCount || 0} Vehicles (${stats.avgTrafficSpeedKph || 0} KPH)</span></div>
      <div class="stat-row"><span class="label">Draw Calls / Triangles:</span> <span class="val">${stats.drawCalls} / ${stats.triangles.toLocaleString()}</span></div>
      ${isWorldEmpty ? '<div class="stat-row warn" style="color:#ff5555;font-weight:bold;">⚠️ DIAGNOSTIC: WORLD GEOMETRY INACTIVE!</div>' : ''}
    `;
    }
  }

  private updateTimeLabel(val: number): void {
    const hours = Math.floor(val);
    const mins = Math.floor((val % 1) * 60);
    if (this.timeLabel) {
      this.timeLabel.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }
  }
}
