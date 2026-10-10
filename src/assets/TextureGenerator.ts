import * as THREE from 'three';
import { SeededRandom } from '../utils/SeededRandom';

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
   * Generates realistic PBR Asphalt texture with fine stone aggregate noise, bituminous binder,
   * double yellow center line, white edge lines & wear. Deterministically seeded.
   */
  public static createAsphaltTexture(): THREE.CanvasTexture {
    if (this.cache.has('asphalt')) return this.cache.get('asphalt')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('asphalt', tex);
      return tex;
    }

    const rng = new SeededRandom(42);

    // Dark asphalt bitumen base
    ctx.fillStyle = '#1c1c22';
    ctx.fillRect(0, 0, 512, 512);

    // Macro tonal variations (subtle rolling tire streaks)
    for (let i = 0; i < 20; i++) {
      const y = rng.nextFloat() * 512;
      const h = 10 + rng.nextFloat() * 30;
      const shade = Math.floor(26 + rng.nextFloat() * 10);
      ctx.fillStyle = `rgba(${shade},${shade},${shade + 4}, 0.25)`;
      ctx.fillRect(0, y, 512, h);
    }

    // Fine stone aggregate chips (Basalt, Granite, and Silica minerals)
    for (let i = 0; i < 16000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const roll = rng.nextFloat();

      if (roll < 0.45) {
        // Dark basalt chips
        const shade = Math.floor(18 + rng.nextFloat() * 10);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 2})`;
        ctx.fillRect(x, y, 2, 2);
      } else if (roll < 0.85) {
        // Mid-grey granite aggregate
        const shade = Math.floor(42 + rng.nextFloat() * 25);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 3})`;
        ctx.fillRect(x, y, 2, 2);
      } else {
        // Light quartz / silica flecks
        const shade = Math.floor(75 + rng.nextFloat() * 30);
        ctx.fillStyle = `rgb(${shade},${shade},${shade + 5})`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Traffic wear tire tracks & subtle oil weathering
    for (let i = 0; i < 24; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 8 + rng.nextFloat() * 24;
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, 'rgba(14, 14, 18, 0.45)');
      grad.addColorStop(1, 'rgba(14, 14, 18, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Double yellow center divider lines
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
   * Generates PBR Asphalt Normal Map for micro-surface aggregate stone relief.
   * Linear data texture (no sRGB color space).
   */
  public static createAsphaltNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('asphalt_normal')) return this.cache.get('asphalt_normal')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('asphalt_normal', tex);
      return tex;
    }

    const rng = new SeededRandom(42);

    // Base flat normal vector RGB(128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    // Fine stone aggregate bevel normal facets
    for (let i = 0; i < 16000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const roll = rng.nextFloat();
      const sz = roll > 0.8 ? 2 : 1;

      // Perturb normal left (-X) and right (+X)
      ctx.fillStyle = 'rgb(105, 128, 255)';
      ctx.fillRect(x, y, 1, sz);
      ctx.fillStyle = 'rgb(152, 128, 255)';
      ctx.fillRect(x + 1, y, 1, sz);

      // Perturb normal top (-Y) and bottom (+Y)
      if (sz > 1) {
        ctx.fillStyle = 'rgb(128, 105, 255)';
        ctx.fillRect(x, y, sz, 1);
        ctx.fillStyle = 'rgb(128, 152, 255)';
        ctx.fillRect(x, y + 1, sz, 1);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('asphalt_normal', texture);
    return texture;
  }

  /**
   * Generates PBR Asphalt Roughness Map (Bitumen binder = High ~0.88, Stone chips = Lower ~0.72).
   * Linear data texture (no sRGB color space).
   */
  public static createAsphaltRoughnessMap(): THREE.CanvasTexture {
    if (this.cache.has('asphalt_roughness')) return this.cache.get('asphalt_roughness')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('asphalt_roughness', tex);
      return tex;
    }

    const rng = new SeededRandom(42);

    // High roughness bitumen binder base (0.88 -> RGB 225)
    ctx.fillStyle = 'rgb(225, 225, 225)';
    ctx.fillRect(0, 0, 512, 512);

    // Stone aggregate chips: lower roughness (0.70-0.76 -> RGB 178-195)
    for (let i = 0; i < 16000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const roll = rng.nextFloat();

      const rVal = roll > 0.85
        ? Math.floor(165 + rng.nextFloat() * 20)
        : Math.floor(185 + rng.nextFloat() * 15);

      ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      ctx.fillRect(x, y, roll > 0.5 ? 2 : 1, roll > 0.5 ? 2 : 1);
    }

    // Worn tire paths: slightly smoother (0.80 -> RGB 204)
    ctx.fillStyle = 'rgba(200, 200, 200, 0.35)';
    ctx.fillRect(100, 0, 80, 512);
    ctx.fillRect(330, 0, 80, 512);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('asphalt_roughness', texture);
    return texture;
  }

  /**
   * Generates authentic Kenyan red-brown laterite soil texture with ochre patches,
   * fine volcanic gravel, quartz grains, and dry savanna moss clusters.
   * Deterministic seed: 1337.
   */
  public static createSoilTexture(): THREE.CanvasTexture {
    if (this.cache.has('soil_diffuse')) return this.cache.get('soil_diffuse')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('soil_diffuse', tex);
      return tex;
    }

    const rng = new SeededRandom(1337);

    // 1. Rich Kenyan laterite base coat (#7e321b)
    ctx.fillStyle = '#7e321b';
    ctx.fillRect(0, 0, 512, 512);

    // 2. Macro soil gradients & tonal warmth (ochre, sienna, deep umber)
    for (let i = 0; i < 60; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 25 + rng.nextFloat() * 50;
      const roll = rng.nextFloat();
      let color = 'rgba(164, 77, 40, 0.22)';
      if (roll > 0.65) color = 'rgba(89, 40, 21, 0.25)';
      else if (roll > 0.35) color = 'rgba(180, 106, 54, 0.20)';

      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Savanna grass & dry lichen/moss clusters
    for (let i = 0; i < 45; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 10 + rng.nextFloat() * 20;
      const roll = rng.nextFloat();
      const color = roll > 0.5 ? 'rgba(77, 89, 38, 0.25)' : 'rgba(96, 109, 45, 0.20)';

      const grad = ctx.createRadialGradient(cx, cy, 1, cx, cy, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Fine mineral particles and volcanic basalt chips
    for (let i = 0; i < 22000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const roll = rng.nextFloat();

      if (roll > 0.85) {
        ctx.fillStyle = 'rgba(38, 30, 26, 0.7)';
        ctx.fillRect(x, y, 1, 1);
      } else if (roll > 0.70) {
        ctx.fillStyle = 'rgba(203, 182, 152, 0.6)';
        ctx.fillRect(x, y, 1, 1);
      } else if (roll > 0.45) {
        ctx.fillStyle = 'rgba(186, 112, 56, 0.5)';
        ctx.fillRect(x, y, 1.5, 1.5);
      } else {
        ctx.fillStyle = 'rgba(92, 36, 17, 0.5)';
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // 5. Small roadside pebbles / gravel stones
    for (let i = 0; i < 350; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const sz = 1.5 + rng.nextFloat() * 2.5;
      const roll = rng.nextFloat();
      ctx.fillStyle = roll > 0.5 ? '#4a3f35' : '#8c7b6d';
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('soil_diffuse', texture);
    return texture;
  }

  /**
   * Generates PBR Soil Normal Map with pebble, gravel, and organic clump relief.
   * Linear data texture.
   */
  public static createSoilNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('soil_normal')) return this.cache.get('soil_normal')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('soil_normal', tex);
      return tex;
    }

    const rng = new SeededRandom(1337);

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 18000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const dx = (rng.nextFloat() - 0.5) * 35;
      const dy = (rng.nextFloat() - 0.5) * 35;

      ctx.fillStyle = `rgb(${Math.floor(128 + dx)}, ${Math.floor(128 + dy)}, 255)`;
      ctx.fillRect(x, y, 1, 1);
    }

    for (let i = 0; i < 350; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 2 + rng.nextFloat() * 3;

      ctx.fillStyle = 'rgb(105, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx - 0.7, cy, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgb(151, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx + 0.7, cy, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgb(128, 105, 255)';
      ctx.beginPath();
      ctx.arc(cx, cy - 0.7, r * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgb(128, 151, 255)';
      ctx.beginPath();
      ctx.arc(cx, cy + 0.7, r * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('soil_normal', texture);
    return texture;
  }

  /**
   * Generates PBR Soil Roughness Map (Matte porous earth ~0.95, compact dirt ~0.89, pebbles ~0.76).
   * Linear data texture.
   */
  public static createSoilRoughnessMap(): THREE.CanvasTexture {
    if (this.cache.has('soil_roughness')) return this.cache.get('soil_roughness')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('soil_roughness', tex);
      return tex;
    }

    const rng = new SeededRandom(1337);

    ctx.fillStyle = 'rgb(242, 242, 242)';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 40; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 20 + rng.nextFloat() * 40;

      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, 'rgba(227, 227, 227, 0.6)');
      grad.addColorStop(1, 'rgba(242, 242, 242, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 15000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const rVal = Math.floor(235 + rng.nextFloat() * 18);
      ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      ctx.fillRect(x, y, 1, 1);
    }

    for (let i = 0; i < 350; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 1.5 + rng.nextFloat() * 2.5;
      const rVal = Math.floor(185 + rng.nextFloat() * 15);
      ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('soil_roughness', texture);
    return texture;
  }

  /**
   * Generates Roadside Transition Shoulder Texture that smoothly blends across U from
   * road-edge weathered bitumen & gravel (U=0) into Kenyan red laterite soil (U=1).
   * Deterministic seed: 2024.
   */
  public static createRoadShoulderTexture(): THREE.CanvasTexture {
    if (this.cache.has('road_shoulder_diffuse')) return this.cache.get('road_shoulder_diffuse')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('road_shoulder_diffuse', tex);
      return tex;
    }

    const rng = new SeededRandom(2024);

    const baseGrad = ctx.createLinearGradient(0, 0, 512, 0);
    baseGrad.addColorStop(0.0, '#38393d');
    baseGrad.addColorStop(0.2, '#484441');
    baseGrad.addColorStop(0.5, '#6a4731');
    baseGrad.addColorStop(0.8, '#7e321b');
    baseGrad.addColorStop(1.0, '#8d3b20');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 20000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const u = x / 512;
      const roll = rng.nextFloat();

      if (u < 0.35) {
        ctx.fillStyle = roll > 0.5 ? 'rgba(30, 30, 32, 0.6)' : 'rgba(80, 80, 85, 0.5)';
        ctx.fillRect(x, y, 1.5, 1.5);
      } else if (u < 0.7) {
        ctx.fillStyle = roll > 0.5 ? 'rgba(120, 95, 75, 0.5)' : 'rgba(75, 45, 30, 0.5)';
        ctx.fillRect(x, y, 1.5, 1.5);
      } else {
        ctx.fillStyle = roll > 0.5 ? 'rgba(164, 77, 40, 0.4)' : 'rgba(60, 24, 12, 0.4)';
        ctx.fillRect(x, y, 1.5, 1.5);
      }
    }

    for (let i = 0; i < 400; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const sz = 1.0 + rng.nextFloat() * 2.5;
      ctx.fillStyle = rng.nextFloat() > 0.5 ? '#55483e' : '#736152';
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('road_shoulder_diffuse', texture);
    return texture;
  }

  /**
   * Generates Roadside Transition Shoulder Normal Map.
   * Linear data texture.
   */
  public static createRoadShoulderNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('road_shoulder_normal')) return this.cache.get('road_shoulder_normal')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('road_shoulder_normal', tex);
      return tex;
    }

    const rng = new SeededRandom(2024);

    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 16000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const dx = (rng.nextFloat() - 0.5) * 30;
      const dy = (rng.nextFloat() - 0.5) * 30;
      ctx.fillStyle = `rgb(${Math.floor(128 + dx)}, ${Math.floor(128 + dy)}, 255)`;
      ctx.fillRect(x, y, 1, 1);
    }

    for (let i = 0; i < 400; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 1.5 + rng.nextFloat() * 2.0;

      ctx.fillStyle = 'rgb(105, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx - 0.5, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgb(151, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx + 0.5, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('road_shoulder_normal', texture);
    return texture;
  }

  /**
   * Generates Roadside Transition Shoulder Roughness Map.
   * Linear data texture.
   */
  public static createRoadShoulderRoughnessMap(): THREE.CanvasTexture {
    if (this.cache.has('road_shoulder_roughness')) return this.cache.get('road_shoulder_roughness')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('road_shoulder_roughness', tex);
      return tex;
    }

    const rng = new SeededRandom(2024);

    const baseGrad = ctx.createLinearGradient(0, 0, 512, 0);
    baseGrad.addColorStop(0.0, 'rgb(217, 217, 217)');
    baseGrad.addColorStop(0.4, 'rgb(228, 228, 228)');
    baseGrad.addColorStop(1.0, 'rgb(242, 242, 242)');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 12000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const rVal = Math.floor(190 + rng.nextFloat() * 45);
      ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      ctx.fillRect(x, y, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('road_shoulder_roughness', texture);
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
