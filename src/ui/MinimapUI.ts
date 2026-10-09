import * as THREE from 'three';

export class MinimapUI {
  private container: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(parent: HTMLElement) {
    this.container = document.createElement('div');
    this.container.id = 'minimap-container';
    this.container.style.cssText = `
      position: absolute;
      bottom: 24px;
      left: 24px;
      width: 170px;
      height: 170px;
      border-radius: 50%;
      border: 3px solid rgba(255, 193, 7, 0.7);
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.6), inset 0 0 15px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      background: #0f172a;
      z-index: 1000;
      pointer-events: none;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.width = 170;
    this.canvas.height = 170;
    this.container.appendChild(this.canvas);
    parent.appendChild(this.container);

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

    // Draw Major Road Corridors (Ngong Rd, Kilimani Rd)
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    this.ctx.lineWidth = 8;
    // Main Ngong Road (Z = 15)
    const ngongScreenY = cy + (15 - playerPos.z) * scale;
    if (ngongScreenY >= 0 && ngongScreenY <= height) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, ngongScreenY);
      this.ctx.lineTo(width, ngongScreenY);
      this.ctx.stroke();
    }

    // Draw NPCs (Green Dots)
    this.ctx.fillStyle = '#10b981';
    npcs.forEach((npcPos) => {
      const dx = (npcPos.x - playerPos.x) * scale;
      const dz = (npcPos.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < cx - 10) {
        this.ctx.beginPath();
        this.ctx.arc(cx + dx, cy + dz, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw Vehicles (Yellow for cars, Magenta for Matatus)
    vehicles.forEach((veh) => {
      const dx = (veh.position.x - playerPos.x) * scale;
      const dz = (veh.position.z - playerPos.z) * scale;
      if (Math.hypot(dx, dz) < cx - 10) {
        this.ctx.fillStyle = veh.isMatatu ? '#ec4899' : '#fbbf24';
        this.ctx.beginPath();
        this.ctx.arc(cx + dx, cy + dz, veh.isMatatu ? 4 : 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    });

    // Draw POIs (Club Velvet at X=45, Z=20)
    const clubDx = (45 - playerPos.x) * scale;
    const clubDz = (20 - playerPos.z) * scale;
    if (Math.hypot(clubDx, clubDz) < cx - 10) {
      this.ctx.fillStyle = '#a855f7';
      this.ctx.beginPath();
      this.ctx.arc(cx + clubDx, cy + clubDz, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw Player Arrow in Center
    this.ctx.save();
    this.ctx.translate(cx, cy);
    this.ctx.rotate(-playerYaw);

    this.ctx.fillStyle = '#ffc107';
    this.ctx.beginPath();
    this.ctx.moveTo(0, -8);
    this.ctx.lineTo(6, 6);
    this.ctx.lineTo(0, 3);
    this.ctx.lineTo(-6, 6);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // Compass Ring N badge
    this.ctx.fillStyle = '#ffc107';
    this.ctx.font = 'bold 11px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('N', cx, 16);
  }
}
