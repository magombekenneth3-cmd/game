import * as THREE from 'three';
import { TextureGenerator } from '../assets/TextureGenerator';

export class AssetManager {
  private materials: Map<string, THREE.Material> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();

  constructor() {
    this.initProceduralAssets();
  }

  private initProceduralAssets(): void {
    // 1. Red Soil / Savanna Earth Texture
    const earthCanvas = this.createCanvasTexture(256, (ctx) => {
      ctx.fillStyle = '#8B4513';
      ctx.fillRect(0, 0, 256, 256);
      // Speckle noise
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const r = Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.5 ? '#A0522D' : '#6B3E08';
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    const earthMat = new THREE.MeshStandardMaterial({
      map: earthCanvas,
      roughness: 0.9,
      metalness: 0.05
    });
    this.materials.set('ground_earth', earthMat);

    const asphaltTexture = TextureGenerator.createAsphaltTexture();
    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      roughness: 0.7,
      metalness: 0.1
    });
    this.materials.set('road_asphalt', roadMat);

    // 3. Sidewalk Concrete Paver Texture
    const sidewalkTexture = TextureGenerator.createSidewalkPaverTexture();
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTexture,
      roughness: 0.6,
      metalness: 0.1
    });
    this.materials.set('sidewalk_concrete', sidewalkMat);

    // 4. Glass Window Material
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x223344,
      metalness: 0.9,
      roughness: 0.1,
      transparent: true,
      opacity: 0.75,
      reflectivity: 0.9
    });
    this.materials.set('building_glass', glassMat);

    // 5. Building Facade Colors (Modern African Palette: Terracotta, Ochre, Sandstone, Crisp White, Teal)
    const facadeColors = [
      { id: 'facade_terracotta', color: 0xC85A32 },
      { id: 'facade_ochre', color: 0xD99B26 },
      { id: 'facade_sandstone', color: 0xE2C9A5 },
      { id: 'facade_white', color: 0xF0F2F5 },
      { id: 'facade_teal', color: 0x2B7A78 },
      { id: 'facade_charcoal', color: 0x2D3748 }
    ];

    facadeColors.forEach(({ id, color }) => {
      this.materials.set(id, new THREE.MeshStandardMaterial({
        color,
        roughness: 0.6,
        metalness: 0.1
      }));
    });

    // 6. Streetlight Emissive Material
    const streetlightEmissive = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffaa33,
      emissiveIntensity: 0.0,
      roughness: 0.2
    });
    this.materials.set('streetlight_emissive', streetlightEmissive);

    // 7. Tree Foliage & Trunk Materials
    this.materials.set('foliage_green', new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.7 }));
    this.materials.set('tree_wood', new THREE.MeshStandardMaterial({ color: 0x4E3629, roughness: 0.9 }));

    // 8. Vehicle Materials (Matatu Yellow/White & Metallic)
    this.materials.set('matatu_yellow', new THREE.MeshStandardMaterial({ color: 0xFBC02D, metalness: 0.5, roughness: 0.3 }));
    this.materials.set('vehicle_metal', new THREE.MeshStandardMaterial({ color: 0x1A237E, metalness: 0.7, roughness: 0.2 }));
    this.materials.set('vehicle_tire', new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 }));

    // 9. Shared Geometries
    this.geometries.set('box', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('sphere', new THREE.SphereGeometry(1, 16, 16));
    this.geometries.set('cylinder', new THREE.CylinderGeometry(1, 1, 1, 16));
    this.geometries.set('capsule', new THREE.CapsuleGeometry(0.4, 1.2, 8, 16));
  }

  private createCanvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
    if (typeof document === 'undefined') {
      return new THREE.CanvasTexture({} as any);
    }
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) draw(ctx);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  public getMaterial(id: string): THREE.Material {
    return this.materials.get(id) || new THREE.MeshStandardMaterial({ color: 0xff00ff });
  }

  public getGeometry(id: string): THREE.BufferGeometry {
    return this.geometries.get(id) || new THREE.BoxGeometry(1, 1, 1);
  }

  public updateStreetlightsEmissive(on: boolean): void {
    const mat = this.materials.get('streetlight_emissive') as THREE.MeshStandardMaterial;
    if (mat) {
      mat.emissiveIntensity = on ? 3.0 : 0.0;
    }
  }
}
