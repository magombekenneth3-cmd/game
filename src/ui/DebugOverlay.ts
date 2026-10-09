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

    this.statsContent = this.container.querySelector('#debug-stats')!;
    this.timeSlider = this.container.querySelector('#time-slider') as HTMLInputElement;
    this.timeLabel = this.container.querySelector('#time-display')!;

    this.timeSlider.addEventListener('input', () => {
      const val = parseFloat(this.timeSlider.value);
      this.updateTimeLabel(val);
      if (this.onTimeChangeCallback) {
        this.onTimeChangeCallback(val);
      }
    });
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
    this.timeLabel.textContent = timeStr;
    
    // Sync slider position if not being dragged
    if (document.activeElement !== this.timeSlider) {
      this.timeSlider.value = stats.timeOfDayHours.toString();
    }

    const isWorldEmpty = (stats.activeChunks === 0) || (stats.sceneMeshCount === 0);

    this.statsContent.innerHTML = `
      <div class="stat-row"><span class="label">FPS / Frame Time:</span> <span class="val ${stats.fps >= 55 ? 'good' : 'warn'}">${stats.fps} FPS (${stats.frameTimeMs} ms)</span></div>
      <div class="stat-row"><span class="label">Renderer:</span> <span class="val highlight">${stats.rendererMode}</span></div>
      <div class="stat-row"><span class="label">Active Chunks:</span> <span class="val ${stats.activeChunks > 0 ? 'good' : 'warn'}">${stats.activeChunks}</span></div>
      <div class="stat-row"><span class="label">Scene Meshes:</span> <span class="val highlight">${stats.sceneMeshCount || 0}</span></div>
      <div class="stat-row"><span class="label">Buildings / Terrain / Roads:</span> <span class="val">${stats.buildingMeshCount || 0} blds / ${stats.terrainTileCount || 0} tiles / ${stats.roadMeshCount || 0} roads</span></div>
      <div class="stat-row"><span class="label">Collision Proxies:</span> <span class="val">${stats.collisionProxies}</span></div>
      <div class="stat-row"><span class="label">NPC Population (Detailed/Total):</span> <span class="val highlight">${stats.detailedNPCs} / ${stats.totalNPCs}</span></div>
      <div class="stat-row"><span class="label">Autonomous Traffic:</span> <span class="val highlight">${stats.trafficVehiclesCount || 0} Vehicles (${stats.avgTrafficSpeedKph || 0} KPH)</span></div>
      <div class="stat-row"><span class="label">Draw Calls / Triangles:</span> <span class="val">${stats.drawCalls} / ${stats.triangles.toLocaleString()}</span></div>
      ${isWorldEmpty ? '<div class="stat-row warn" style="color:#ff5555;font-weight:bold;">⚠️ DIAGNOSTIC: WORLD GEOMETRY INACTIVE!</div>' : ''}
    `;
  }

  private updateTimeLabel(val: number): void {
    const hours = Math.floor(val);
    const mins = Math.floor((val % 1) * 60);
    this.timeLabel.textContent = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  }
}
