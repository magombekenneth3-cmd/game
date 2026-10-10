import * as THREE from 'three';
import { TextureGenerator } from '../assets/TextureGenerator';

export class AssetManager {
  private materials: Map<string, THREE.Material> = new Map();
  private geometries: Map<string, THREE.BufferGeometry> = new Map();

  constructor() {
    this.initProceduralAssets();
  }

  private initProceduralAssets(): void {
    // 1. Red Soil / Savanna Earth Texture (PBR laterite soil with aggregate & roughness)
    const soilTexture = TextureGenerator.createSoilTexture();
    soilTexture.wrapS = THREE.RepeatWrapping;
    soilTexture.wrapT = THREE.RepeatWrapping;
    soilTexture.repeat.set(8, 8);

    const soilNormal = TextureGenerator.createSoilNormalMap();
    soilNormal.wrapS = THREE.RepeatWrapping;
    soilNormal.wrapT = THREE.RepeatWrapping;
    soilNormal.repeat.set(8, 8);

    const soilRoughness = TextureGenerator.createSoilRoughnessMap();
    soilRoughness.wrapS = THREE.RepeatWrapping;
    soilRoughness.wrapT = THREE.RepeatWrapping;
    soilRoughness.repeat.set(8, 8);

    const earthMat = new THREE.MeshStandardMaterial({
      map: soilTexture,
      normalMap: soilNormal,
      normalScale: new THREE.Vector2(0.6, 0.6),
      roughnessMap: soilRoughness,
      roughness: 0.94,
      metalness: 0.01
    });
    this.materials.set('ground_earth', earthMat);

    // 2. High-Fidelity PBR Asphalt (Micro stone chips, wear paths & normal relief)
    const asphaltTexture = TextureGenerator.createAsphaltTexture();
    asphaltTexture.wrapS = THREE.RepeatWrapping;
    asphaltTexture.wrapT = THREE.RepeatWrapping;
    asphaltTexture.repeat.set(1, 10);

    const asphaltNormal = TextureGenerator.createAsphaltNormalMap();
    asphaltNormal.wrapS = THREE.RepeatWrapping;
    asphaltNormal.wrapT = THREE.RepeatWrapping;
    asphaltNormal.repeat.set(1, 10);

    const asphaltRoughness = TextureGenerator.createAsphaltRoughnessMap();
    asphaltRoughness.wrapS = THREE.RepeatWrapping;
    asphaltRoughness.wrapT = THREE.RepeatWrapping;
    asphaltRoughness.repeat.set(1, 10);

    const roadMat = new THREE.MeshStandardMaterial({
      map: asphaltTexture,
      normalMap: asphaltNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughnessMap: asphaltRoughness,
      roughness: 0.85,
      metalness: 0.02
    });
    this.materials.set('road_asphalt', roadMat);

    // 2b. Road-to-Terrain Transition Shoulder (Bitumen & gravel -> red laterite soil blend)
    const shoulderTexture = TextureGenerator.createRoadShoulderTexture();
    shoulderTexture.wrapS = THREE.ClampToEdgeWrapping;
    shoulderTexture.wrapT = THREE.RepeatWrapping;
    shoulderTexture.repeat.set(1, 10);

    const shoulderNormal = TextureGenerator.createRoadShoulderNormalMap();
    shoulderNormal.wrapS = THREE.ClampToEdgeWrapping;
    shoulderNormal.wrapT = THREE.RepeatWrapping;
    shoulderNormal.repeat.set(1, 10);

    const shoulderRoughness = TextureGenerator.createRoadShoulderRoughnessMap();
    shoulderRoughness.wrapS = THREE.ClampToEdgeWrapping;
    shoulderRoughness.wrapT = THREE.RepeatWrapping;
    shoulderRoughness.repeat.set(1, 10);

    const shoulderMat = new THREE.MeshStandardMaterial({
      map: shoulderTexture,
      normalMap: shoulderNormal,
      normalScale: new THREE.Vector2(0.5, 0.5),
      roughnessMap: shoulderRoughness,
      roughness: 0.90,
      metalness: 0.02
    });
    this.materials.set('road_shoulder_transition', shoulderMat);

    // 3. Sidewalk Concrete Paver Texture
    const sidewalkTexture = TextureGenerator.createSidewalkPaverTexture();
    sidewalkTexture.wrapS = THREE.RepeatWrapping;
    sidewalkTexture.wrapT = THREE.RepeatWrapping;
    sidewalkTexture.repeat.set(4, 20);

    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: sidewalkTexture,
      roughness: 0.75,
      metalness: 0.02
    });
    this.materials.set('sidewalk_concrete', sidewalkMat);

    // 4. Glass Window Material (Dielectric Architectural Glass)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      metalness: 0.0,
      roughness: 0.06,
      transparent: true,
      opacity: 0.45,
      reflectivity: 0.6,
      clearcoat: 0.9,
      clearcoatRoughness: 0.05
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
        roughness: 0.75,
        metalness: 0.02
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
    this.materials.set('foliage_green', new THREE.MeshStandardMaterial({ color: 0x2E7D32, roughness: 0.75, metalness: 0.0 }));
    this.materials.set('tree_wood', new THREE.MeshStandardMaterial({ color: 0x4E3629, roughness: 0.9, metalness: 0.0 }));

    // 8. Vehicle Materials (Matatu Yellow/White & Metallic Clearcoat)
    this.materials.set('matatu_yellow', new THREE.MeshStandardMaterial({ color: 0xFBC02D, metalness: 0.4, roughness: 0.25 }));
    this.materials.set('vehicle_metal', new THREE.MeshStandardMaterial({ color: 0x1A237E, metalness: 0.65, roughness: 0.2 }));
    this.materials.set('vehicle_tire', new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.92, metalness: 0.02 }));

    // 9. Shared Geometries
    this.geometries.set('box', new THREE.BoxGeometry(1, 1, 1));
    this.geometries.set('sphere', new THREE.SphereGeometry(1, 16, 16));
    this.geometries.set('cylinder', new THREE.CylinderGeometry(1, 1, 1, 16));
    this.geometries.set('capsule', new THREE.CapsuleGeometry(0.4, 1.2, 8, 16));
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
