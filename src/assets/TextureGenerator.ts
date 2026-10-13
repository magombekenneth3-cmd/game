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
   * Phase 12.4.3: Upgraded to 512x512 with deterministic SeededRandom(99).
   * Each paver block is individually tinted with micro-cracking on joints.
   */
  public static createSidewalkPaverTexture(): THREE.CanvasTexture {
    if (this.cache.has('sidewalk')) return this.cache.get('sidewalk')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('sidewalk', tex);
      return tex;
    }

    const rng = new SeededRandom(99);

    // Base mid-grey concrete slab
    ctx.fillStyle = '#8a9bb0';
    ctx.fillRect(0, 0, 512, 512);

    // Individual paver tiles: 4 cols x 8 rows (each 128x64px)
    const cols = 4;
    const rows = 8;
    const tileW = Math.floor(512 / cols);
    const tileH = Math.floor(512 / rows);
    const jointPad = 3;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const tx = col * tileW + jointPad;
        const ty = row * tileH + jointPad;
        const tw = tileW - jointPad * 2;
        const th = tileH - jointPad * 2;

        // Per-paver colour jitter (aged weathered concrete)
        const baseL = Math.floor(138 + rng.nextFloat() * 18);
        const warm = Math.floor((rng.nextFloat() - 0.5) * 12);
        const pr = Math.min(255, baseL + warm);
        const pg = Math.min(255, baseL + Math.floor(warm * 0.4));
        const pb = Math.min(255, baseL - warm);
        ctx.fillStyle = `rgb(${pr},${pg},${pb})`;
        ctx.fillRect(tx, ty, tw, th);

        // Surface micro-speckle
        for (let k = 0; k < 100; k++) {
          const sx = tx + rng.nextFloat() * tw;
          const sy = ty + rng.nextFloat() * th;
          const shade = Math.floor(90 + rng.nextFloat() * 90);
          ctx.fillStyle = `rgba(${shade},${shade},${shade},0.16)`;
          ctx.fillRect(sx, sy, 1, 1);
        }

        // AO highlight bevel (top-left)
        ctx.fillStyle = 'rgba(255,255,255,0.13)';
        ctx.fillRect(tx, ty, tw, 2);
        ctx.fillRect(tx, ty, 2, th);

        // Shadow bevel (bottom-right)
        ctx.fillStyle = 'rgba(0,0,0,0.20)';
        ctx.fillRect(tx, ty + th - 2, tw, 2);
        ctx.fillRect(tx + tw - 2, ty, 2, th);
      }
    }

    // Dark sand-filled mortar joints
    ctx.fillStyle = '#393e47';
    for (let col = 1; col < cols; col++) {
      ctx.fillRect(col * tileW - 1, 0, jointPad, 512);
    }
    for (let row = 1; row < rows; row++) {
      ctx.fillRect(0, row * tileH - 1, 512, jointPad);
    }

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
    return this.createMatatuLiveryTexture('super_metro');
  }

  /**
   * Generates authentic Kenyan Cabro concrete paver texture (Herringbone pattern).
   * Popular on Kenyatta Avenue, Kimathi Street, and modern Nairobi pedestrian corridors.
   */
  public static createCabroTexture(pattern: 'herringbone' | 'basketweave' = 'herringbone'): THREE.CanvasTexture {
    const cacheKey = `cabro_${pattern}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    const rng = new SeededRandom(254);

    // Dark grey mortar / joint sand base
    ctx.fillStyle = '#26292e';
    ctx.fillRect(0, 0, 512, 512);

    // Kenyan Cabro Color Palette (laterite red, warm ochre, charcoal grey, buff stone)
    const palettes = [
      { r: 184, g: 74, b: 58 },   // Terracotta / red laterite paver
      { r: 198, g: 85, b: 68 },
      { r: 165, g: 62, b: 46 },
      { r: 75, g: 82, b: 92 },    // Charcoal grey paver
      { r: 60, g: 67, b: 76 },
      { r: 92, g: 100, b: 112 },
      { r: 210, g: 165, b: 115 }, // Warm buff / ochre paver
      { r: 195, g: 148, b: 100 }
    ];

    const paverW = 32;
    const paverL = 64;
    const gap = 3;

    // Draw interlocking herringbone grid
    for (let y = -64; y < 512 + 64; y += paverW + gap) {
      for (let x = -64; x < 512 + 64; x += paverL + gap) {
        const isRotated = ((Math.floor(x / (paverL + gap)) + Math.floor(y / (paverW + gap))) % 2) === 0;
        const col = palettes[Math.floor(rng.nextFloat() * palettes.length)];

        // Subtle color jitter per block
        const jitter = (rng.nextFloat() - 0.5) * 20;
        const cr = Math.min(255, Math.max(0, Math.floor(col.r + jitter)));
        const cg = Math.min(255, Math.max(0, Math.floor(col.g + jitter)));
        const cb = Math.min(255, Math.max(0, Math.floor(col.b + jitter)));

        const bx = x;
        const by = y;
        const bw = isRotated ? paverW : paverL;
        const bh = isRotated ? paverL : paverW;

        ctx.fillStyle = `rgb(${cr},${cg},${cb})`;
        ctx.fillRect(bx, by, bw, bh);

        // Chamfer bevel highlight on top/left
        ctx.fillStyle = `rgba(255,255,255,0.18)`;
        ctx.fillRect(bx, by, bw, 2);
        ctx.fillRect(bx, by, 2, bh);

        // Chamfer shadow on bottom/right
        ctx.fillStyle = `rgba(0,0,0,0.25)`;
        ctx.fillRect(bx, by + bh - 2, bw, 2);
        ctx.fillRect(bx + bw - 2, by, 2, bh);
      }
    }

    // Concrete aggregate speckle & micro-porosity
    for (let i = 0; i < 8000; i++) {
      const px = rng.nextFloat() * 512;
      const py = rng.nextFloat() * 512;
      const v = rng.nextFloat() > 0.5 ? 240 : 40;
      ctx.fillStyle = `rgba(${v},${v},${v},0.12)`;
      ctx.fillRect(px, py, 1, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates PBR Normal Map for Cabro pavers (recessed mortar joints & edge chamfers).
   */
  public static createCabroNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('cabro_normal')) return this.cache.get('cabro_normal')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('cabro_normal', tex);
      return tex;
    }

    // Base flat normal (128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    const paverW = 32;
    const paverL = 64;
    const gap = 3;

    for (let y = -64; y < 512 + 64; y += paverW + gap) {
      for (let x = -64; x < 512 + 64; x += paverL + gap) {
        const isRotated = ((Math.floor(x / (paverL + gap)) + Math.floor(y / (paverW + gap))) % 2) === 0;
        const bw = isRotated ? paverW : paverL;
        const bh = isRotated ? paverL : paverW;

        // Bevel normal slopes
        ctx.fillStyle = 'rgb(180, 128, 255)'; // Left (+X slope)
        ctx.fillRect(x, y, 2, bh);
        ctx.fillStyle = 'rgb(75, 128, 255)';  // Right (-X slope)
        ctx.fillRect(x + bw - 2, y, 2, bh);
        ctx.fillStyle = 'rgb(128, 180, 255)'; // Top (+Y slope)
        ctx.fillRect(x, y, bw, 2);
        ctx.fillStyle = 'rgb(128, 75, 255)';  // Bottom (-Y slope)
        ctx.fillRect(x, y + bh - 2, bw, 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('cabro_normal', texture);
    return texture;
  }

  /**
   * Generates PBR Roughness Map for Cabro pavers (high roughness concrete & porous sand joints).
   */
  public static createCabroRoughnessMap(): THREE.CanvasTexture {
    if (this.cache.has('cabro_roughness')) return this.cache.get('cabro_roughness')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('cabro_roughness', tex);
      return tex;
    }

    // Concrete surface roughness ~ 0.78 (RGB 200)
    ctx.fillStyle = 'rgb(200, 200, 200)';
    ctx.fillRect(0, 0, 512, 512);

    const rng = new SeededRandom(254);
    for (let i = 0; i < 6000; i++) {
      const px = rng.nextFloat() * 512;
      const py = rng.nextFloat() * 512;
      const v = Math.floor(180 + rng.nextFloat() * 50);
      ctx.fillStyle = `rgb(${v},${v},${v})`;
      ctx.fillRect(px, py, 2, 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set('cabro_roughness', texture);
    return texture;
  }

  /**
   * Generates authentic Nairobi CBD commercial building facades.
   * Multiple styles: modernist plastered render, brutalist concrete with louvers,
   * commercial face-brick, and reflective blue/bronze curtain-wall glass.
   */
  public static createCBDFacadeTexture(
    style: 'modernist_render' | 'brutalist_concrete' | 'commercial_brick' | 'curtain_glass' | 'art_deco_ochre'
  ): THREE.CanvasTexture {
    const cacheKey = `cbd_facade_${style}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    let wallBase = '#e5e0d8'; // Modernist warm off-white
    let frameColor = '#2c3338';
    let glassColor = '#1c2833';
    let louverColor = '#7a8288';

    if (style === 'brutalist_concrete') {
      wallBase = '#b0b5b3';
      frameColor = '#3a3f44';
      glassColor = '#15202b';
      louverColor = '#8a9094';
    } else if (style === 'commercial_brick') {
      wallBase = '#9c4132'; // Red-orange brick
      frameColor = '#222222';
      glassColor = '#1e293b';
      louverColor = '#e2e8f0'; // White concrete sills
    } else if (style === 'curtain_glass') {
      wallBase = '#1a365d'; // Deep steel-blue spandrel
      frameColor = '#0f172a';
      glassColor = '#2563eb'; // Reflective blue
      louverColor = '#38bdf8';
    } else if (style === 'art_deco_ochre') {
      wallBase = '#d49b42'; // Nairobi warm ochre
      frameColor = '#3e2723';
      glassColor = '#0f172a';
      louverColor = '#fff8e1';
    }

    ctx.fillStyle = wallBase;
    ctx.fillRect(0, 0, 512, 512);

    // Concrete floor bands (horizontal cornices)
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(0, 0, 512, 8);
    ctx.fillRect(0, 252, 512, 8);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 8, 512, 4);
    ctx.fillRect(0, 260, 512, 4);

    // 4 bays per floor, 2 floors in 512x512 tile
    const numCols = 4;
    const numRows = 2;
    const colW = 512 / numCols;
    const rowH = 512 / numRows;

    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const x = c * colW + 16;
        const y = r * rowH + 28;
        const w = colW - 32;
        const h = rowH - 64;

        // Window frame (dark bronze / aluminium)
        ctx.fillStyle = frameColor;
        ctx.fillRect(x, y, w, h);

        // Glass pane
        ctx.fillStyle = glassColor;
        ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

        // Reflection highlight diagonal
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.beginPath();
        ctx.moveTo(x + 4, y + 4);
        ctx.lineTo(x + w * 0.6, y + 4);
        ctx.lineTo(x + 4, y + h * 0.8);
        ctx.closePath();
        ctx.fill();

        // Horizontal sun louvers (brise-soleil) - quintessential Nairobi CBD feature
        ctx.fillStyle = louverColor;
        const louverCount = 4;
        for (let l = 0; l < louverCount; l++) {
          const ly = y + 8 + (l * (h * 0.45)) / louverCount;
          ctx.fillRect(x + 2, ly, w - 4, 3);
        }

        // Air conditioning unit bracket under window
        if ((c + r) % 2 === 0) {
          ctx.fillStyle = '#64748b';
          ctx.fillRect(x + w * 0.45, y + h + 2, 28, 16);
          ctx.fillStyle = '#1e293b'; // AC fan grille
          ctx.fillRect(x + w * 0.45 + 4, y + h + 5, 20, 10);
        }
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
   * Generates striped canvas awning canopy texture (green/white, orange/white, blue/white).
   * Shading sidewalks and storefronts across Nairobi CBD commercial blocks.
   */
  public static createAwningTexture(
    style: 'green_white' | 'orange_white' | 'blue_white' | 'red_gold' = 'green_white'
  ): THREE.CanvasTexture {
    const cacheKey = `awning_${style}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    let primaryColor = '#15803d'; // Green
    let secondaryColor = '#ffffff'; // White

    if (style === 'orange_white') {
      primaryColor = '#ea580c';
    } else if (style === 'blue_white') {
      primaryColor = '#1d4ed8';
    } else if (style === 'red_gold') {
      primaryColor = '#b91c1c';
      secondaryColor = '#facc15';
    }

    const stripeWidth = 32;
    for (let x = 0; x < 256; x += stripeWidth * 2) {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, 0, stripeWidth, 256);
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(x + stripeWidth, 0, stripeWidth, 256);
    }

    // Fabric weave texture shadow
    for (let y = 0; y < 256; y += 4) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(0, y, 256, 1);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates authentic East African Matatu Sacco liveries (Super Metro, City Hoppa, Forward Sacco, etc.).
   */
  public static createMatatuLiveryTexture(
    variant: 'super_metro' | 'city_hoppa' | 'forward_sacco' | 'kilimani_rider' = 'super_metro'
  ): THREE.CanvasTexture {
    const cacheKey = `matatu_livery_${variant}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    if (variant === 'super_metro') {
      // Navy Blue body with prominent Yellow Speed Stripes
      ctx.fillStyle = '#0f224a';
      ctx.fillRect(0, 0, 512, 256);

      // Bright yellow sweeping stripes
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(0, 80);
      ctx.lineTo(512, 50);
      ctx.lineTo(512, 110);
      ctx.lineTo(0, 140);
      ctx.fill();

      // White pinstripe
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 142, 512, 10);

      // Sacco branding typography
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText('SUPER METRO', 24, 70);

      ctx.font = 'bold 18px sans-serif';
      ctx.fillStyle = '#facc15';
      ctx.fillText('CBD ★ WAIYAKI WAY ★ KIKUYU', 26, 100);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('ROUTE 105', 360, 220);
    } else if (variant === 'city_hoppa') {
      // Fresh Forest Green body with Sunshine Yellow
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#fde047';
      ctx.fillRect(0, 100, 512, 45);

      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText('CITY HOPPA', 30, 134);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('KENYATTA AVE ★ NGONG RD ★ KAWANGWARE', 30, 80);
      ctx.fillText('ROUTE 46', 380, 220);
    } else if (variant === 'forward_sacco') {
      // Black with Metallic Gold & Red Speed Graphics
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, 512, 256);

      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.moveTo(0, 40);
      ctx.lineTo(340, 130);
      ctx.lineTo(0, 180);
      ctx.fill();

      ctx.fillStyle = '#dc2626';
      ctx.fillRect(0, 120, 512, 18);

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('FORWARD SACCO', 30, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('CBD ★ JOGOO ROAD ★ KAYOLE', 30, 110);
      ctx.fillText('ROUTE 19/60', 360, 220);
    } else {
      // Kilimani Rider with Kenya Flag Accents
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 512, 256);

      // Kenyan Flag Stripes: Black, Red, Green
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 85, 512, 14);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(0, 105, 512, 18);
      ctx.fillStyle = '#15803d';
      ctx.fillRect(0, 129, 512, 14);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 34px sans-serif';
      ctx.fillText('NAIROBI EXPRESS', 30, 65);

      ctx.fillStyle = '#475569';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('KILIMANI RIDER ★ UPPER HILL LINK', 30, 175);
      ctx.fillText('ROUTE 23', 380, 220);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates Nairobi CBD Street Name Plate Texture.
   */
  public static createStreetSignTexture(streetName: string, subText: string = 'NAIROBI CBD'): THREE.CanvasTexture {
    const cacheKey = `street_sign_${streetName}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Classic Nairobi dark green enamel plate
    ctx.fillStyle = '#064e3b';
    ctx.fillRect(0, 0, 512, 128);

    // Crisp white double border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 500, 116);
    ctx.lineWidth = 2;
    ctx.strokeRect(12, 12, 488, 104);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(streetName.toUpperCase(), 256, 64);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#a7f3d0';
    ctx.fillText(subText.toUpperCase(), 256, 96);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates organic tree bark texture with vertical fissures, fissures, and authentic melanin/lichen tones.
   */
  public static createBarkTexture(type: 'jacaranda' | 'acacia' | 'palm' = 'jacaranda'): THREE.CanvasTexture {
    const cacheKey = `bark_${type}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    const rng = new SeededRandom(type === 'jacaranda' ? 777 : type === 'acacia' ? 888 : 999);

    if (type === 'jacaranda') {
      // Charcoal-brown bark with ash grey crevices
      ctx.fillStyle = '#3a2e26';
      ctx.fillRect(0, 0, 512, 512);

      // Deep vertical fissures
      for (let x = 0; x < 512; x += 8) {
        const furrowW = 2 + rng.nextFloat() * 4;
        const shade = Math.floor(28 + rng.nextFloat() * 15);
        ctx.fillStyle = `rgb(${shade + 8},${shade},${shade - 4})`;
        ctx.fillRect(x + (rng.nextFloat() - 0.5) * 6, 0, furrowW, 512);
      }

      // Lichen specks & pale grey bark flakes
      for (let i = 0; i < 200; i++) {
        const px = rng.nextFloat() * 512;
        const py = rng.nextFloat() * 512;
        const pr = 1 + rng.nextFloat() * 3;
        ctx.fillStyle = 'rgba(120, 115, 105, 0.4)';
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'acacia') {
      // Rough reddish-brown fibrous umber bark
      ctx.fillStyle = '#422c1d';
      ctx.fillRect(0, 0, 512, 512);

      for (let x = 0; x < 512; x += 10) {
        const furrowW = 3 + rng.nextFloat() * 5;
        const shade = Math.floor(20 + rng.nextFloat() * 18);
        ctx.fillStyle = `rgb(${shade + 18},${shade + 8},${shade})`;
        ctx.fillRect(x + (rng.nextFloat() - 0.5) * 8, 0, furrowW, 512);
      }
    } else {
      // Ringed palm fibrous trunk
      ctx.fillStyle = '#5c4033';
      ctx.fillRect(0, 0, 512, 512);
      for (let y = 0; y < 512; y += 16) {
        ctx.fillStyle = 'rgba(35, 25, 20, 0.7)';
        ctx.fillRect(0, y, 512, 4);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates bark normal map for relief.
   */
  public static createBarkNormalMap(type: 'jacaranda' | 'acacia' = 'jacaranda'): THREE.CanvasTexture {
    const cacheKey = `bark_norm_${type}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(256, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Flat normal base (128, 128, 255)
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 256, 256);

    const rng = new SeededRandom(101);
    for (let x = 0; x < 256; x += 8) {
      const w = 2 + rng.nextFloat() * 4;
      const slope = rng.nextFloat() > 0.5 ? 90 : 165;
      ctx.fillStyle = `rgb(${slope}, 128, 235)`;
      ctx.fillRect(x, 0, w, 256);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 3);

    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates rich organic foliage textures for Jacaranda, Acacia, and Bougainvillea.
   */
  public static createFoliageTexture(
    type: 'jacaranda_blossom' | 'jacaranda_leaf' | 'acacia_umbrella' | 'bougainvillea_magenta' = 'jacaranda_blossom'
  ): THREE.CanvasTexture {
    const cacheKey = `foliage_${type}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    const rng = new SeededRandom(type.length * 42);

    if (type === 'jacaranda_blossom') {
      // Dense violet/purple blooming flowers with soft depth
      ctx.fillStyle = '#6d28d9';
      ctx.fillRect(0, 0, 512, 512);

      // Clusters of lavender tubular florets
      for (let i = 0; i < 600; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        const rad = 4 + rng.nextFloat() * 8;
        const roll = rng.nextFloat();
        ctx.fillStyle = roll < 0.4 ? '#8b5cf6' : roll < 0.75 ? '#a78bfa' : '#5b21b6';
        ctx.beginPath();
        ctx.ellipse(x, y, rad, rad * 0.7, rng.nextFloat() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      // Sporadic green leaflets peeking through
      for (let i = 0; i < 80; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 2.5, rng.nextFloat() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'jacaranda_leaf') {
      // Emerald green bipinnate fern leaflets
      ctx.fillStyle = '#14532d';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 800; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        const roll = rng.nextFloat();
        ctx.fillStyle = roll < 0.5 ? '#16a34a' : roll < 0.85 ? '#22c55e' : '#15803d';
        ctx.beginPath();
        ctx.ellipse(x, y, 6, 2.5, rng.nextFloat() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (type === 'acacia_umbrella') {
      // Layered horizontal bipinnate savanna acacia foliage
      ctx.fillStyle = '#1b5e20';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 900; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        const roll = rng.nextFloat();
        ctx.fillStyle = roll < 0.45 ? '#2e7d32' : roll < 0.8 ? '#388e3c' : '#14532d';
        ctx.beginPath();
        ctx.ellipse(x, y, 7, 2, rng.nextFloat() * 0.4 - 0.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Bougainvillea vibrant magenta/fuchsia bracts
      ctx.fillStyle = '#831843';
      ctx.fillRect(0, 0, 512, 512);

      for (let i = 0; i < 700; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        const rad = 4 + rng.nextFloat() * 7;
        const roll = rng.nextFloat();
        ctx.fillStyle = roll < 0.45 ? '#d946ef' : roll < 0.75 ? '#c026d3' : '#a21caf';
        ctx.beginPath();
        ctx.ellipse(x, y, rad, rad * 0.8, rng.nextFloat() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < 150; i++) {
        const x = rng.nextFloat() * 512;
        const y = rng.nextFloat() * 512;
        ctx.fillStyle = '#14532d';
        ctx.beginPath();
        ctx.ellipse(x, y, 5, 3, rng.nextFloat() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
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
   * Generates authentic Safaricom Storefront Signboard Texture.
   */
  public static createSafaricomSignTexture(): THREE.CanvasTexture {
    const cacheKey = 'sign_safaricom';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Safaricom Green base
    ctx.fillStyle = '#00a651';
    ctx.fillRect(0, 0, 512, 128);

    // Subtle white glow border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 120);

    // Iconic Safaricom green arc emblem
    ctx.beginPath();
    ctx.arc(80, 64, 38, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(80, 64, 20, -Math.PI * 0.6, Math.PI * 0.6);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#facc15';
    ctx.stroke();

    // Bold Safaricom Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 44px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('Safaricom', 140, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates authentic M-PESA Storefront Signboard Texture.
   */
  public static createMPesaSignTexture(): THREE.CanvasTexture {
    const cacheKey = 'sign_mpesa';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // M-PESA Vivid Green base
    ctx.fillStyle = '#00a651';
    ctx.fillRect(0, 0, 512, 128);

    // Clean white inner container
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, 496, 112);

    // M-PESA Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M-PESA', 256, 64);

    // Small red dot accent
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(388, 48, 8, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates authentic Java House Signboard Texture.
   */
  public static createJavaHouseSignTexture(): THREE.CanvasTexture {
    const cacheKey = 'sign_java_house';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Java House Crimson base
    ctx.fillStyle = '#7c1d1d';
    ctx.fillRect(0, 0, 512, 128);

    // Gold trim border
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);

    // White Java House cursive / serif typography
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic 700 42px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Java House', 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates authentic Equity Bank Signboard Texture.
   */
  public static createEquityBankSignTexture(): THREE.CanvasTexture {
    const cacheKey = 'sign_equity_bank';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 128);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Clean white panel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 128);

    // Terracotta brown frame
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, 500, 116);

    // Equity roof emblem
    ctx.fillStyle = '#991b1b';
    ctx.beginPath();
    ctx.moveTo(90, 80);
    ctx.lineTo(130, 42);
    ctx.lineTo(170, 80);
    ctx.closePath();
    ctx.fill();

    // Bold brown EQUITY lettering
    ctx.fillStyle = '#78350f';
    ctx.font = '900 46px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('EQUITY', 200, 64);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates Mama Mboga A-Frame Chalkboard Sign Texture.
   */
  public static createMamaMbogaChalkboardTexture(): THREE.CanvasTexture {
    const cacheKey = 'chalkboard_mama_mboga';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(256, 384);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Dark slate chalkboard base
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 256, 384);

    // Weathered chalk dust
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let i = 0; i < 20; i++) {
      ctx.fillRect(0, i * 20, 256, 8);
    }

    // White / yellow chalk lettering
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fef08a'; // Pale chalk yellow
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('FRESH PRODUCE', 128, 48);

    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 64);
    ctx.lineTo(216, 64);
    ctx.stroke();

    ctx.fillStyle = '#ffffff'; // White chalk
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Matunda', 128, 120);

    ctx.fillStyle = '#86efac'; // Green chalk for mboga
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Mboga', 128, 175);

    ctx.fillStyle = '#fde047';
    ctx.font = 'italic bold 22px serif';
    ctx.fillText('Fresh Daily', 128, 240);

    // Decorative chalk swirl
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(128, 290, 30, 0.2, Math.PI - 0.2);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates Kenya National Skyline Billboard Texture ("Kenya: Proud • United • Stronger").
   */
  public static createKenyaBillboardTexture(): THREE.CanvasTexture {
    const cacheKey = 'billboard_kenya_national';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 256);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Kenyan Flag 3 primary horizontal bands (Black, Red, Green) with white fimbriations
    // Black band (top)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 512, 72);

    // White upper stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 72, 512, 16);

    // Red middle band (Kenyan blood red)
    ctx.fillStyle = '#bb0000';
    ctx.fillRect(0, 88, 512, 80);

    // White lower stripe
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 168, 512, 16);

    // Green bottom band
    ctx.fillStyle = '#006600';
    ctx.fillRect(0, 184, 512, 72);

    // Maasai Shield in center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(100, 128, 26, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(100, 128, 22, 44, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#bb0000';
    ctx.beginPath();
    ctx.ellipse(100, 128, 12, 40, 0, 0, Math.PI * 2);
    ctx.fill();

    // Motivational Billboard Typography
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Kenya', 170, 110);

    ctx.font = 'bold 20px sans-serif';
    ctx.fillStyle = '#fde047';
    ctx.fillText('Proud • United • Stronger', 170, 145);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Generates authentic Super Metro Matatu Minibus Rear Decal Texture.
   */
  public static createSuperMetroRearTexture(): THREE.CanvasTexture {
    const cacheKey = 'matatu_super_metro_rear';
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey)!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set(cacheKey, tex);
      return tex;
    }

    // Super Metro Royal Blue base
    ctx.fillStyle = '#1d4ed8';
    ctx.fillRect(0, 0, 512, 512);

    // 1. Rear Tinted Window (Top half)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(32, 24, 448, 180);

    // Window white route header: NAIROBI • KIBERA • LANGATA
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('NAIROBI • KIBERA • LANGATA', 256, 75);

    // 2. Yellow Brand Stripe across middle
    ctx.fillStyle = '#facc15';
    ctx.fillRect(0, 220, 512, 90);

    // Bold "SUPER METRO" brand typography
    ctx.fillStyle = '#1e3a8a';
    ctx.font = '900 44px sans-serif';
    ctx.fillText('SUPER METRO', 256, 280);

    // 3. Lower Blue Boot with reflective chevrons
    ctx.fillStyle = '#1e40af';
    ctx.fillRect(0, 310, 512, 202);

    // Red & yellow reflective safety chevrons
    for (let c = 0; c < 512; c += 40) {
      ctx.fillStyle = (c / 40) % 2 === 0 ? '#ef4444' : '#facc15';
      ctx.fillRect(c, 440, 36, 18);
    }

    // 4. Kenyan Yellow Registration License Plate: KDG 842P
    ctx.fillStyle = '#facc15';
    ctx.fillRect(176, 350, 160, 44);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeRect(176, 350, 160, 44);

    ctx.fillStyle = '#000000';
    ctx.font = 'bold 26px monospace';
    ctx.fillText('KDG 842P', 256, 381);

    // 5. Taillights
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(16, 260, 32, 70);
    ctx.fillRect(464, 260, 32, 70);

    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(16, 335, 32, 35);
    ctx.fillRect(464, 335, 32, 35);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(cacheKey, texture);
    return texture;
  }

  /**
   * Phase 12.4.3: Nairobi roadside grass verge diffuse texture.
   * Short compacted savanna grass with red laterite soil patches and dry grass tips.
   * Seed: 7331.
   */
  public static createGrassVergeTexture(): THREE.CanvasTexture {
    if (this.cache.has('grass_verge')) return this.cache.get('grass_verge')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(true);
      this.cache.set('grass_verge', tex);
      return tex;
    }

    const rng = new SeededRandom(7331);

    // Base: compacted dry savanna grass (olive-khaki)
    ctx.fillStyle = '#5c6832';
    ctx.fillRect(0, 0, 512, 512);

    // Tonal macro variation patches (lighter/darker grass clumps)
    for (let i = 0; i < 80; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 15 + rng.nextFloat() * 40;
      const roll = rng.nextFloat();
      let color: string;
      if (roll < 0.25) {
        color = 'rgba(78, 90, 40, 0.35)'; // Darker clump
      } else if (roll < 0.55) {
        color = 'rgba(110, 124, 52, 0.30)'; // Mid grass
      } else if (roll < 0.78) {
        color = 'rgba(150, 140, 72, 0.30)'; // Dry/straw tips
      } else {
        color = 'rgba(126, 50, 27, 0.28)'; // Exposed laterite soil patch
      }
      const grad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      grad.addColorStop(0, color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Fine grass blade micro-texture
    for (let i = 0; i < 20000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const roll = rng.nextFloat();
      if (roll < 0.50) {
        // Green grass blade
        const shade = Math.floor(80 + rng.nextFloat() * 40);
        ctx.fillStyle = `rgba(${Math.floor(shade * 0.8)},${shade},${Math.floor(shade * 0.4)},0.55)`;
        ctx.fillRect(x, y, 1, 2);
      } else if (roll < 0.75) {
        // Dry straw tip
        const v = Math.floor(160 + rng.nextFloat() * 40);
        ctx.fillStyle = `rgba(${v},${Math.floor(v * 0.85)},${Math.floor(v * 0.5)},0.45)`;
        ctx.fillRect(x, y, 1, 1);
      } else {
        // Small laterite pebble / bare soil
        ctx.fillStyle = `rgba(152, 62, 34, 0.40)`;
        ctx.fillRect(x, y, 1, 1);
      }
    }

    // Scattered small roadside pebbles
    for (let i = 0; i < 200; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const sz = 1.0 + rng.nextFloat() * 2.5;
      ctx.fillStyle = rng.nextFloat() > 0.5 ? '#4a3f35' : '#6b5a4e';
      ctx.beginPath();
      ctx.arc(x, y, sz, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('grass_verge', texture);
    return texture;
  }

  /**
   * Phase 12.4.3: Grass verge normal map (coarse grass blade and pebble micro-relief).
   */
  public static createGrassVergeNormalMap(): THREE.CanvasTexture {
    if (this.cache.has('grass_verge_normal')) return this.cache.get('grass_verge_normal')!;

    const { canvas, ctx } = this.createCanvas(512, 512);
    if (!ctx.fillRect) {
      const tex = this.createFallbackTexture(false);
      this.cache.set('grass_verge_normal', tex);
      return tex;
    }

    const rng = new SeededRandom(7331);

    // Flat base normal
    ctx.fillStyle = 'rgb(128, 128, 255)';
    ctx.fillRect(0, 0, 512, 512);

    // Coarse grass blade normals (vertical micro-perturbation)
    for (let i = 0; i < 16000; i++) {
      const x = rng.nextFloat() * 512;
      const y = rng.nextFloat() * 512;
      const dx = (rng.nextFloat() - 0.5) * 28;
      const dy = (rng.nextFloat() - 0.5) * 28;
      ctx.fillStyle = `rgb(${Math.floor(128 + dx)},${Math.floor(128 + dy)},255)`;
      ctx.fillRect(x, y, 1, 2);
    }

    // Pebble normal bumps
    for (let i = 0; i < 200; i++) {
      const cx = rng.nextFloat() * 512;
      const cy = rng.nextFloat() * 512;
      const r = 1.5 + rng.nextFloat() * 2.5;
      ctx.fillStyle = 'rgb(100, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx - 0.6, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgb(156, 128, 255)';
      ctx.beginPath();
      ctx.arc(cx + 0.6, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.cache.set('grass_verge_normal', texture);
    return texture;
  }
}
