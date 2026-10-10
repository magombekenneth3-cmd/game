import * as THREE from 'three';

export class TextureGenerator {
  private static cache: Map<string, THREE.CanvasTexture> = new Map();

  private static createCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
    if (typeof document === 'undefined') {
      return { canvas: {} as any, ctx: {} as any };
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;
    return { canvas, ctx };
  }

  private static createFallbackTexture(isColor: boolean): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture({} as any);
    if (isColor) {
      tex.colorSpace = THREE.SRGBColorSpace;
    }
    return tex;
  }

  /**
   * Generates realistic PBR Asphalt texture with aggregate noise, double yellow center line, white edge lines & wear.
   */
  public static createAsphaltTexture(): THREE.CanvasTexture {
    if (this.cache.has('asphalt')) return this.cache.get('asphalt')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('asphalt', tex);
      return tex;
    }

    // Dark asphalt base
    ctx.fillStyle = '#1e1e24';
    ctx.fillRect(0, 0, 512, 512);

    // Aggregate noise & gravel texture
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.floor(20 + Math.random() * 35);
      ctx.fillStyle = `rgb(${shade},${shade},${shade + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Oil stains & wear spots
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 512;
      const r = 10 + Math.random() * 30;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, 'rgba(10, 10, 12, 0.4)');
      grad.addColorStop(1, 'rgba(10, 10, 12, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Double yellow center lines
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(250, 0, 4, 512);
    ctx.fillRect(258, 0, 4, 512);

    // White outer edge lines
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(20, 0, 6, 512);
    ctx.fillRect(486, 0, 6, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('asphalt', texture);
    return texture;
  }

  /**
   * Generates realistic Concrete Paver Sidewalk texture.
   */
  public static createSidewalkPaverTexture(): THREE.CanvasTexture {
    if (this.cache.has('sidewalk')) return this.cache.get('sidewalk')!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('sidewalk', tex);
      return tex;
    }

    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(0, 0, 256, 256);

    // Paver noise
    for (let i = 0; i < 4000; i++) {
      const shade = 140 + Math.floor(Math.random() * 30);
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
    }

    // Grid paver lines
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 252, 252);
    ctx.strokeRect(2, 2, 126, 126);
    ctx.strokeRect(128, 128, 126, 126);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('sidewalk', texture);
    return texture;
  }

  /**
   * Generates Nairobi architectural building facade texture with windows & panel joints.
   */
  public static createFacadePanelTexture(style: 'terracotta' | 'ochre' | 'sandstone' | 'white' | 'teal' | 'charcoal'): THREE.CanvasTexture {
    const cacheKey = `facade_${style}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    let baseColor = '#e2c9a5'; // Sandstone
    if (style === 'terracotta') baseColor = '#c85a32';
    if (style === 'ochre') baseColor = '#d99b26';
    if (style === 'white') baseColor = '#f0f2f5';
    if (style === 'teal') baseColor = '#2b7a78';
    if (style === 'charcoal') baseColor = '#2d3748';

    ctx.fillStyle = baseColor;
    ctx.fillRect(0, 0, 256, 256);

    // Concrete joint lines & window grid shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;

    // Draw 4x4 window panel cutouts
    ctx.fillStyle = '#1e293b';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 20 + col * 55;
        const y = 20 + row * 55;
        ctx.fillRect(x, y, 40, 40);

        // Window glass tint
        ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.fillRect(x + 3, y + 3, 34, 34);

        ctx.fillStyle = '#1e293b'; // reset for loop
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates PBR Facade Normal Map for deep window recesses & panel relief.
   */
  public static createFacadeNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('facade_normal')) return this.cache.get('facade_normal')!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('facade_normal', tex);
      return tex;
    }

    // Flat normal vector RGB(128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    // Recessed window normal bevels
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 20 + col * 55;
        const y = 20 + row * 55;

        // Bevel edges
        ctx.fillStyle = 'rgb(60, 128, 255)'; // Left bevel (-X)
        ctx.fillRect(x, y, 4, 40);
        ctx.fillStyle = 'rgb(195, 128, 255)'; // Right bevel (+X)
        ctx.fillRect(x + 36, y, 4, 40);
        ctx.fillStyle = 'rgb(128, 60, 255)'; // Top bevel (-Y)
        ctx.fillRect(x, y, 40, 4);
        ctx.fillStyle = 'rgb(128, 195, 255)'; // Bottom bevel (+Y)
        ctx.fillRect(x, y + 36, 40, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('facade_normal', texture);
    return texture;
  }

  /**
   * Generates PBR Facade Roughness Map (Glass = Smooth/Low, Facade Concrete = High).
   */
  public static createFacadeRoughnessMap(): THREE.CanvasTexture {
    if (this.cache.has('facade_roughness')) return this.cache.get('facade_roughness')!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('facade_roughness', tex);
      return tex;
    }

    // Concrete facade high roughness (0.75 -> RGB 190)
    ctx.fillStyle = 'rgb(190, 190, 190)';
    ctx.fillRect(0, 0, 256, 256);

    // Glass low roughness (0.1 -> RGB 25)
    ctx.fillStyle = 'rgb(25, 25, 25)';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 23 + col * 55;
        const y = 23 + row * 55;
        ctx.fillRect(x, y, 34, 34);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('facade_roughness', texture);
    return texture;
  }

  /**
   * Generates Emissive Night Window Map with randomized lit vs dark windows.
   */
  public static createEmissiveWindowMap(): THREE.CanvasTexture {
    if (this.cache.has('facade_emissive')) return this.cache.get('facade_emissive')!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('facade_emissive', tex);
      return tex;
    }

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 256, 256);

    // Random warm window illumination
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        if ((row + col * 3) % 2 === 0) {
          const x = 23 + col * 55;
          const y = 23 + row * 55;
          ctx.fillStyle = (row + col) % 3 === 0 ? '#ffeaac' : '#dbeafe'; // Warm golden / cool white
          ctx.fillRect(x, y, 34, 34);
        }
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('facade_emissive', texture);
    return texture;
  }

  /**
   * Generates Commercial Storefront Banner Signboard texture.
   */
  public static createStorefrontSignTexture(shopName: string): THREE.CanvasTexture {
    const cacheKey = `sign_${shopName}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // M-Pesa Green or Brand colors
    let bg = '#10b981';
    let textCol = '#ffffff';
    if (shopName.includes('Equity')) { bg = '#991b1b'; }
    if (shopName.includes('Java')) { bg = '#78350f'; }
    if (shopName.includes('Naivas')) { bg = '#ea580c'; }
    if (shopName.includes('Velvet')) { bg = '#6b21a8'; }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 128);

    // Border highlight
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);

    ctx.fillStyle = textCol;
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(shopName.toUpperCase(), 256, 74);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates East African Matatu graphic art decal texture.
   */
  public static createMatatuDecalTexture(): THREE.CanvasTexture {
    if (this.cache.has('matatu_art')) return this.cache.get('matatu_art')!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('matatu_art', tex);
      return tex;
    }

    // Yellow base
    ctx.fillStyle = '#fbc02d';
    ctx.fillRect(0, 0, 512, 128);

    // Red & black diagonal speed stripes
    ctx.fillStyle = '#d32f2f';
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.lineTo(512, 40);
    ctx.lineTo(512, 75);
    ctx.lineTo(0, 75);
    ctx.fill();

    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 75, 512, 15);

    // Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('NAIROBI EXPRESS ★ KILIMANI RIDER', 40, 65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.cache.set('matatu_art', texture);
    return texture;
  }
}
