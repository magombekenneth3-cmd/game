import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

/**
 * SharedMaterialLibrary — centralised cache of reusable Three.js materials.
 *
 * PROBLEM: EnvironmentAssetKit, BuildingAssetKit, VehicleAssetKit, and street-
 *          furniture generators each allocate fresh MeshStandardMaterial instances
 *          per call. With dozens of trees, shrubs, bollards, and buildings the
 *          scene accumulates ~900 unique materials, forcing separate shader
 *          compilations and preventing geometry batching.
 *
 * SOLUTION: Every procedural generator fetches materials from this library.
 *           Identical surface descriptions always return the *same* material
 *           instance, enabling Three.js to share shader programs and making
 *           BatchedMesh / merge operations possible.
 *
 * RULES:
 *  1. NEVER mutate a shared material per-instance. Use a variant key or
 *     vertex colours when visual variation is needed.
 *  2. Character materials are NOT shared here (they are cloned per-NPC by
 *     the CharacterVisualLibrary system).
 *  3. Materials with unique procedural textures (e.g. storefront signs)
 *     are cached by their texture key and still deduplicated.
 */
export class SharedMaterialLibrary {
  private static readonly materials = new Map<string, THREE.Material>();

  // ─── SURFACE MATERIALS (colour + PBR only, no textures) ─────────────

  /** Dark steel / painted metal (bollards, poles, railings). */
  static get steelDark(): THREE.MeshStandardMaterial {
    return this.getOrCreate('steel_dark', () => new THREE.MeshStandardMaterial({
      color: 0x18181b, metalness: 0.8, roughness: 0.3
    }));
  }

  /** Galvanised / light steel (utility poles, frames). */
  static get steelLight(): THREE.MeshStandardMaterial {
    return this.getOrCreate('steel_light', () => new THREE.MeshStandardMaterial({
      color: 0x334155, metalness: 0.8, roughness: 0.3
    }));
  }

  /** Blue-painted structural steel (shelters, bus stops). */
  static get steelBlue(): THREE.MeshStandardMaterial {
    return this.getOrCreate('steel_blue', () => new THREE.MeshStandardMaterial({
      color: 0x0284c7, metalness: 0.7, roughness: 0.3
    }));
  }

  /** Traffic signal housing yellow. */
  static get signalYellow(): THREE.MeshStandardMaterial {
    return this.getOrCreate('signal_yellow', () => new THREE.MeshStandardMaterial({
      color: 0xf59e0b, roughness: 0.5
    }));
  }

  /** Concrete grey (planters, kerbs, median strips). */
  static get concrete(): THREE.MeshStandardMaterial {
    return this.getOrCreate('concrete', () => new THREE.MeshStandardMaterial({
      color: 0x475569, roughness: 0.65, metalness: 0.10
    }));
  }

  /** Red-oxide corrugated iron roofing. */
  static get roofRedOxide(): THREE.MeshStandardMaterial {
    return this.getOrCreate('roof_red_oxide', () => new THREE.MeshStandardMaterial({
      color: 0x8b1a1a, roughness: 0.6, metalness: 0.3
    }));
  }

  /** Timber / dark-brown wood (market tables, benches, fences). */
  static get woodDark(): THREE.MeshStandardMaterial {
    return this.getOrCreate('wood_dark', () => new THREE.MeshStandardMaterial({
      color: 0x78350f, roughness: 0.9
    }));
  }

  /** Red-brown laterite soil. */
  static get soilLaterite(): THREE.MeshStandardMaterial {
    return this.getOrCreate('soil_laterite', () => new THREE.MeshStandardMaterial({
      color: 0x7c2d12, roughness: 0.95
    }));
  }

  /** Soil used for planters & around trees. */
  static get soilPlanter(): THREE.MeshStandardMaterial {
    return this.getOrCreate('soil_planter', () => new THREE.MeshStandardMaterial({
      color: 0x78350f, roughness: 0.95
    }));
  }

  /** Cast-iron tree grate / drain cover. */
  static get castIronDark(): THREE.MeshStandardMaterial {
    return this.getOrCreate('cast_iron_dark', () => new THREE.MeshStandardMaterial({
      color: 0x1f2937, metalness: 0.9, roughness: 0.4
    }));
  }

  /** M-Pesa green kiosk body. */
  static get kioskGreen(): THREE.MeshStandardMaterial {
    return this.getOrCreate('kiosk_green', () => new THREE.MeshStandardMaterial({
      color: 0x16a34a, roughness: 0.5
    }));
  }

  /** Warm emissive sign (M-Pesa / stage sign). */
  static get signEmissiveOrange(): THREE.MeshStandardMaterial {
    return this.getOrCreate('sign_emissive_orange', () => new THREE.MeshStandardMaterial({
      color: 0xd97706, emissive: new THREE.Color(0x15803d), emissiveIntensity: 0.3
    }));
  }

  /** Yellow signage (matatu stage headers). */
  static get signYellow(): THREE.MeshStandardMaterial {
    return this.getOrCreate('sign_yellow', () => new THREE.MeshStandardMaterial({
      color: 0xfacc15, roughness: 0.4
    }));
  }

  /** Polycarbonate roof (bus shelter). */
  static get polycarbonateBlue(): THREE.MeshStandardMaterial {
    return this.getOrCreate('polycarb_blue', () => new THREE.MeshStandardMaterial({
      color: 0x38bdf8, roughness: 0.3
    }));
  }

  /** Tinted glass / windbreak. */
  static get glassPanel(): THREE.MeshPhysicalMaterial {
    return this.getOrCreate('glass_panel', () => new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8, transparent: true, opacity: 0.45, roughness: 0.1, metalness: 0.0
    })) as THREE.MeshPhysicalMaterial;
  }

  /** Barrier / guardrail concrete white. */
  static get barrierWhite(): THREE.MeshStandardMaterial {
    return this.getOrCreate('barrier_white', () => new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, roughness: 0.8
    }));
  }

  /** Market produce colours — tomato red. */
  static get produceTomato(): THREE.MeshStandardMaterial {
    return this.getOrCreate('produce_tomato', () => new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.6 }));
  }
  /** Market produce — banana yellow. */
  static get produceBanana(): THREE.MeshStandardMaterial {
    return this.getOrCreate('produce_banana', () => new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.6 }));
  }
  /** Market produce — mango orange. */
  static get produceMango(): THREE.MeshStandardMaterial {
    return this.getOrCreate('produce_mango', () => new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.6 }));
  }

  /** Market umbrella / parasol. */
  static get umbrellaOrange(): THREE.MeshStandardMaterial {
    return this.getOrCreate('umbrella_orange', () => new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 }));
  }

  /** Utility pole brown. */
  static get woodPole(): THREE.MeshStandardMaterial {
    return this.getOrCreate('wood_pole', () => new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 }));
  }

  // ─── TRAFFIC LIGHT LENSES ──────────────────────────────────────────

  static get trafficRed(): THREE.MeshStandardMaterial {
    return this.getOrCreate('traffic_red', () => new THREE.MeshStandardMaterial({
      color: 0xef4444, emissive: new THREE.Color(0xef4444), emissiveIntensity: 0.9
    }));
  }
  static get trafficAmberOff(): THREE.MeshStandardMaterial {
    return this.getOrCreate('traffic_amber_off', () => new THREE.MeshStandardMaterial({
      color: 0x332200, roughness: 0.8
    }));
  }
  static get trafficGreenOff(): THREE.MeshStandardMaterial {
    return this.getOrCreate('traffic_green_off', () => new THREE.MeshStandardMaterial({
      color: 0x003311, roughness: 0.8
    }));
  }
  static get pedestrianWalk(): THREE.MeshStandardMaterial {
    return this.getOrCreate('ped_walk', () => new THREE.MeshStandardMaterial({
      color: 0x10b981, emissive: new THREE.Color(0x10b981), emissiveIntensity: 0.8
    }));
  }

  /** Streetlight bulb (starts unlit). */
  static get streetlightEmissive(): THREE.MeshStandardMaterial {
    return this.getOrCreate('streetlight_emissive', () => {
      const m = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: new THREE.Color(0xf59e0b), emissiveIntensity: 0.0
      });
      m.name = 'streetlight_emissive';
      return m;
    });
  }

  // ─── VEGETATION MATERIALS (textured) ──────────────────────────────

  /** Acacia bark with PBR textures. */
  static get barkAcacia(): THREE.MeshStandardMaterial {
    return this.getOrCreate('bark_acacia', () => {
      const map = TextureGenerator.createBarkTexture('acacia');
      const normalMap = TextureGenerator.createBarkNormalMap('acacia');
      return new THREE.MeshStandardMaterial({ map, normalMap, color: 0x4e3629, roughness: 0.90, metalness: 0.05 });
    });
  }

  static get foliageAcaciaTop(): THREE.MeshStandardMaterial {
    return this.getOrCreate('foliage_acacia_top', () => {
      const map = TextureGenerator.createFoliageTexture('acacia_umbrella');
      return new THREE.MeshStandardMaterial({ map, color: 0x2e7d32, roughness: 0.70, side: THREE.DoubleSide });
    });
  }
  static get foliageAcaciaMid(): THREE.MeshStandardMaterial {
    return this.getOrCreate('foliage_acacia_mid', () => {
      const map = TextureGenerator.createFoliageTexture('acacia_umbrella');
      return new THREE.MeshStandardMaterial({ map, color: 0x1b5e20, roughness: 0.75, side: THREE.DoubleSide });
    });
  }
  static get foliageAcaciaUnder(): THREE.MeshStandardMaterial {
    return this.getOrCreate('foliage_acacia_under', () => {
      const map = TextureGenerator.createFoliageTexture('acacia_umbrella');
      return new THREE.MeshStandardMaterial({ map, color: 0x14532d, roughness: 0.85, side: THREE.DoubleSide });
    });
  }

  /** Jacaranda bark. */
  static get barkJacaranda(): THREE.MeshStandardMaterial {
    return this.getOrCreate('bark_jacaranda', () => {
      const map = TextureGenerator.createBarkTexture('jacaranda');
      const normalMap = TextureGenerator.createBarkNormalMap('jacaranda');
      return new THREE.MeshStandardMaterial({ map, normalMap, color: 0x3d322a, roughness: 0.88, metalness: 0.05 });
    });
  }

  /** Jacaranda blossom (violet). */
  static get blossomViolet(): THREE.MeshStandardMaterial {
    return this.getOrCreate('blossom_violet', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x7c3aed, roughness: 0.65, side: THREE.DoubleSide });
    });
  }
  static get blossomDeep(): THREE.MeshStandardMaterial {
    return this.getOrCreate('blossom_deep', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x6d28d9, roughness: 0.70, side: THREE.DoubleSide });
    });
  }
  static get blossomLavender(): THREE.MeshStandardMaterial {
    return this.getOrCreate('blossom_lavender', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x9333ea, roughness: 0.60, side: THREE.DoubleSide });
    });
  }
  static get jacarandaLeaf(): THREE.MeshStandardMaterial {
    return this.getOrCreate('jacaranda_leaf', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_leaf');
      return new THREE.MeshStandardMaterial({ map, color: 0x166534, roughness: 0.75, side: THREE.DoubleSide });
    });
  }
  /** Non-flowering Jacaranda canopy shades (green variants of blossom). */
  static get jacarandaGreenLight(): THREE.MeshStandardMaterial {
    return this.getOrCreate('jacaranda_green_light', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x22c55e, roughness: 0.65, side: THREE.DoubleSide });
    });
  }
  static get jacarandaGreenMid(): THREE.MeshStandardMaterial {
    return this.getOrCreate('jacaranda_green_mid', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x15803d, roughness: 0.70, side: THREE.DoubleSide });
    });
  }
  static get jacarandaGreenDark(): THREE.MeshStandardMaterial {
    return this.getOrCreate('jacaranda_green_dark', () => {
      const map = TextureGenerator.createFoliageTexture('jacaranda_blossom');
      return new THREE.MeshStandardMaterial({ map, color: 0x16a34a, roughness: 0.60, side: THREE.DoubleSide });
    });
  }

  /** Palm trunk. */
  static get barkPalm(): THREE.MeshStandardMaterial {
    return this.getOrCreate('bark_palm', () => {
      const map = TextureGenerator.createBarkTexture('palm');
      return new THREE.MeshStandardMaterial({ map, color: 0x654321, roughness: 0.9 });
    });
  }
  /** Palm frond green. */
  static get palmLeaf(): THREE.MeshStandardMaterial {
    return this.getOrCreate('palm_leaf', () =>
      new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, side: THREE.DoubleSide })
    );
  }

  /** Bougainvillea flower materials. */
  static bougainvilleaPrimary(isMagenta: boolean): THREE.MeshStandardMaterial {
    const key = `bougainvillea_primary_${isMagenta ? 'mag' : 'red'}`;
    return this.getOrCreate(key, () => {
      const map = TextureGenerator.createFoliageTexture('bougainvillea_magenta');
      return new THREE.MeshStandardMaterial({
        map, color: isMagenta ? 0xd946ef : 0xe11d48, roughness: 0.55, side: THREE.DoubleSide
      });
    });
  }
  static bougainvilleaDeep(isMagenta: boolean): THREE.MeshStandardMaterial {
    const key = `bougainvillea_deep_${isMagenta ? 'mag' : 'red'}`;
    return this.getOrCreate(key, () => {
      const map = TextureGenerator.createFoliageTexture('bougainvillea_magenta');
      return new THREE.MeshStandardMaterial({
        map, color: isMagenta ? 0xa21caf : 0x9f1239, roughness: 0.60, side: THREE.DoubleSide
      });
    });
  }
  static bougainvilleaLeaf(isMagenta: boolean): THREE.MeshStandardMaterial {
    const key = `bougainvillea_leaf_${isMagenta ? 'mag' : 'red'}`;
    return this.getOrCreate(key, () => {
      const map = TextureGenerator.createFoliageTexture('bougainvillea_magenta');
      return new THREE.MeshStandardMaterial({
        map, color: 0x14532d, roughness: 0.65, side: THREE.DoubleSide
      });
    });
  }

  // ─── ROAD / SIDEWALK SURFACE MATERIALS (PBR textured) ─────────────

  /** Full PBR asphalt road surface. */
  static get asphalt(): THREE.MeshStandardMaterial {
    return this.getOrCreate('asphalt_pbr', () => {
      const map = TextureGenerator.createAsphaltTexture();
      const normalMap = TextureGenerator.createAsphaltNormalMap();
      const roughnessMap = TextureGenerator.createAsphaltRoughnessMap();
      return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, roughness: 0.88, metalness: 0.01 });
    });
  }

  /** Sidewalk / paver surface. */
  static get sidewalkPaver(): THREE.MeshStandardMaterial {
    return this.getOrCreate('sidewalk_paver', () => {
      const map = TextureGenerator.createSidewalkPaverTexture();
      return new THREE.MeshStandardMaterial({ map, roughness: 0.82, metalness: 0.02 });
    });
  }

  /** Road shoulder transition surface. */
  static get roadShoulder(): THREE.MeshStandardMaterial {
    return this.getOrCreate('road_shoulder_pbr', () => {
      const map = TextureGenerator.createRoadShoulderTexture();
      const normalMap = TextureGenerator.createRoadShoulderNormalMap();
      const roughnessMap = TextureGenerator.createRoadShoulderRoughnessMap();
      return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, roughness: 0.90, metalness: 0.02 });
    });
  }

  /** Full PBR soil surface. */
  static get soilPBR(): THREE.MeshStandardMaterial {
    return this.getOrCreate('soil_pbr', () => {
      const map = TextureGenerator.createSoilTexture();
      const normalMap = TextureGenerator.createSoilNormalMap();
      const roughnessMap = TextureGenerator.createSoilRoughnessMap();
      return new THREE.MeshStandardMaterial({ map, normalMap, roughnessMap, roughness: 0.94, metalness: 0.01 });
    });
  }

  // ─── BUILDING FACADE MATERIALS (per style variant) ────────────────

  static facadeMaterial(style: string, bldData?: { height?: number; floors?: number }): THREE.MeshStandardMaterial {
    const key = `facade_${style}_${bldData?.height ?? 0}_${bldData?.floors ?? 0}`;
    return this.getOrCreate(key, () => {
      const isCBD = style === 'curtain_glass' || style === 'brutalist_concrete' || style === 'commercial_brick' || style === 'modernist_render';
      const facadeTexture = isCBD
        ? TextureGenerator.createCBDFacadeTexture(style as any)
        : TextureGenerator.createFacadePanelTexture(style as any);
      const facadeNormalMap = TextureGenerator.createFacadeNormalMap();
      const facadeRoughnessMap = TextureGenerator.createFacadeRoughnessMap();
      const facadeEmissiveMap = TextureGenerator.createEmissiveWindowMap();

      const tileU = Math.max(1, Math.floor((bldData?.height ?? 12) / 6));
      const tileV = Math.max(1, bldData?.floors ?? 3);

      facadeTexture.repeat.set(tileU, tileV);
      facadeNormalMap.repeat.set(tileU, tileV);
      facadeRoughnessMap.repeat.set(tileU, tileV);
      facadeEmissiveMap.repeat.set(tileU, tileV);

      return new THREE.MeshStandardMaterial({
        map: facadeTexture, normalMap: facadeNormalMap,
        normalScale: new THREE.Vector2(0.8, 0.8),
        roughnessMap: facadeRoughnessMap,
        emissiveMap: facadeEmissiveMap, emissive: new THREE.Color(0xfff0dd), emissiveIntensity: 0.35,
        roughness: 0.75, metalness: 0.02
      });
    });
  }

  // ─── BOLLARD ACCENT BANDS ─────────────────────────────────────────

  static get bollardBandYellow(): THREE.MeshStandardMaterial {
    return this.getOrCreate('bollard_band_yellow', () =>
      new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.4, roughness: 0.4 })
    );
  }

  static get bollardBandWhite(): THREE.MeshStandardMaterial {
    return this.getOrCreate('bollard_band_white', () =>
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, metalness: 0.3, roughness: 0.5 })
    );
  }

  // ─── METRICS ──────────────────────────────────────────────────────

  /** Returns the number of unique shared material instances. */
  static get instanceCount(): number {
    return this.materials.size;
  }

  /** Clears the entire cache (for hot-reload / dispose). */
  static dispose(): void {
    this.materials.forEach(m => m.dispose());
    this.materials.clear();
  }

  // ─── INTERNAL HELPER ──────────────────────────────────────────────

  private static getOrCreate<T extends THREE.Material>(key: string, factory: () => T): T {
    let mat = this.materials.get(key);
    if (!mat) {
      mat = factory();
      mat.name = key;
      this.materials.set(key, mat);
    }
    return mat as T;
  }
}
