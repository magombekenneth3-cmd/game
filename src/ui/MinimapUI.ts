import * as THREE from 'three';

export class MinimapUI {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  private wrapper: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.wrapper = document.createElement('div');
    this.wrapper.id = 'minimap-wrapper';
    this.wrapper.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      z-index: 1000;
      pointer-events: none;
    `;

    this.container = document.createElement('div');
    this.container.id = 'minimap-container';
    this.container.style.cssText = `
      width: 170px;
      height: 170px;
      border-radius: 50%;
      border: 3px solid rgba(250, 204, 21, 0.85);
      box-shadow: 0 0 24px rgba(0, 0, 0, 0.7), inset 0 0 15px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      background: #0f172a;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 170;
    this.canvas.height = 170;
    this.container.appendChild(this.canvas);
    this.wrapper.appendChild(this.container);

    const locationPill = document.createElement('div');
    locationPill.className = 'minimap-location-pill';
    locationPill.innerHTML = `
      <span class="loc-pin">📍</span>
      <div class="loc-text">
        <div class="loc-primary">Kenyatta Avenue</div>
        <div class="loc-secondary">Nairobi CBD</div>
      </div>
    `;
    this.wrapper.appendChild(locationPill);
    parent.appendChild(this.wrapper);

    this.ctx = this.canvas.getContext('2d')!;
  }

  public update(
    playerPos: THREE.Vector3,
    playerYaw: number,
    vehicles: { position: THREE.Vector3; isMatatu?: boolean }[],
    npcs: THREE.Vector3[]
  ): void {
    if (!this.ctx || typeof this.ctx.moveTo !== 'function') {
      return;
    }
    const width = this.canvas.width;
    const height = this.canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const scale = 1.6; // 1 unit in 3D = 1.6 pixels on minimap

    // Clear background
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, width, height);

    // Draw Grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let x = (playerPos.x % 20) * scale; x < width; x += 20 * scale) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }
    for (let y = (playerPos.z % 20) * scale; y < height; y += 20 * scale) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Draw Kenyatta Avenue Corridor (X = 0, running North-South)
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    this.ctx.lineWidth = 16;
    const kenyattaScreenX = cx + (0 - playerPos.x) * scale;
    if (kenyattaScreenX >= -20 && kenyattaScreenX <= width + 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(kenyattaScreenX, 0);
      this.ctx.lineTo(kenyattaScreenX, height);
      this.ctx.stroke();
    }

    // Draw Kimathi Street Cross Corridor (Z = 12)
    const kimathiScreenY = cy + (12 - playerPos.z) * scale;
    if (kimathiScreenY >= -20 && kimathiScreenY <= height + 20) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, kimathiScreenY);
      this.ctx.lineTo(width, kimathiScreenY);
      this.ctx.stroke();
    }

    // Draw NPCs (Pink / Light Coral Dots)
    this.ctx.fillStyle = '#f472b6';
    npcs.forEach((npcPos) => {
      const dx = (npcPos.x - playerPos.x) * scale;
      const dz = (npcPos.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < cx - 8) {
        this.ctx.beginPath();
        this.ctx.arc(cx + dx, cy + dz, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw Vehicles (Yellow for cars, Cyan/Blue for Matatus)
    vehicles.forEach((veh) => {
      const dx = (veh.position.x - playerPos.x) * scale;
      const dz = (veh.position.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < cx - 8) {
        this.ctx.fillStyle = veh.isMatatu ? '#38bdf8' : '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(cx + dx, cy + dz, veh.isMatatu ? 4 : 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw Kenyatta Ave Matatu Stage POI (Green Icon at X = -11.5, Z = 26)
    const stageDx = (-11.5 - playerPos.x) * scale;
    const stageDz = (26.0 - playerPos.z) * scale;
    if (Math.hypot(stageDx, stageDz) < cx - 8) {
      this.ctx.fillStyle = '#22c55e';
      this.ctx.beginPath();
      this.ctx.arc(cx + stageDx, cy + stageDz, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Commercial Arcade / Shop POI (Gold Icon at X = 14.5, Z = 16)
    const shopDx = (14.5 - playerPos.x) * scale;
    const shopDz = (16.0 - playerPos.z) * scale;
    if (Math.hypot(shopDx, shopDz) < cx - 8) {
      this.ctx.fillStyle = '#facc15';
      this.ctx.beginPath();
      this.ctx.arc(cx + shopDx, cy + shopDz, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Player Arrow in Center (Cyan with Golden Border)
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(-playerYaw);

    this.ctx.fillStyle = '#0ea5e9';
    this.ctx.strokeStyle = '#facc15';
    this.ctx.lineWidth = 1.5;
    this.ctx.beginPath();
    this.ctx.moveTo(0, -9);
    this.ctx.lineTo(6, 6);
    this.ctx.lineTo(0, 3);
    this.ctx.lineTo(-6, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.restore();

    // Compass Ring N indicator
    this.ctx.fillStyle = '#facc15';
    this.ctx.font = 'bold 12px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('N', cx, 16);
  }
}
