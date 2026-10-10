import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { ASSET_MANIFEST } from './AssetManifest';
import { TextureGenerator } from './TextureGenerator';
import { BuildingAssetKit } from './BuildingAssetKit';
import { VehicleAssetKit } from './VehicleAssetKit';
import { CharacterAssetKit } from './CharacterAssetKit';
import { EnvironmentAssetKit } from './EnvironmentAssetKit';
import { InteriorAssetKit } from './InteriorAssetKit';
import { BuildingData } from '../world/BuildingData';
import { VehicleCategory } from '../vehicles/VehicleTypes';
import { NPCArchetype } from '../npc/NPCTypes';

export type AssetState =
  | 'not-requested'
  | 'loading'
  | 'loaded'
  | 'fallback'
  | 'failed';

export type AssetLoadStatus =
  | { state: 'not-requested'; url?: string }
  | { state: 'loading'; url: string }
  | { state: 'loaded'; url: string; meshCount: number }
  | { state: 'fallback'; url: string; reason: string }
  | { state: 'failed'; url: string; reason: string };

export interface BuildingFitResult {
  assetId: string;
  scale: THREE.Vector3;
  rotationY: number;
  fitsFootprint: boolean;
}

export interface AssetPipelineStats {
  cachedTexturesCount: number;
  cachedGLBCount: number;
  activeInstancesCount: number;
  disposedInstancesCount: number;
  buildingKitsGenerated: number;
  vehicleKitsGenerated: number;
  characterKitsGenerated: number;
  cacheHitCount: number;
  cacheMissCount: number;
  assetLoadedCount: number;
  assetFallbacksCount: number;
  assetFailuresCount: number;
  assetLoadingCount: number;
}

export class AssetPipeline {
  private static instance: AssetPipeline;
  private gltfLoader: GLTFLoader;

  // Deduplication & Caching
  private loadingPromises: Map<string, Promise<THREE.Group>> = new Map();
  private glbCache: Map<string, THREE.Group> = new Map();
  private instanceMeshCache: Map<string, THREE.Group> = new Map();
  private animationCache: Map<string, THREE.AnimationClip[]> = new Map();

  // Diagnostics & Status Tracking
  private assetStatuses: Map<string, AssetLoadStatus> = new Map();

  // Telemetry & Tracking
  private activeInstances: Set<THREE.Object3D> = new Set();
  private disposedCount: number = 0;
  private buildingCount: number = 0;
  private vehicleCount: number = 0;
  private characterCount: number = 0;
  private cacheHitCount: number = 0;
  private cacheMissCount: number = 0;

  private constructor() {
    this.gltfLoader = new GLTFLoader();
  }

  public async preloadCoreAssets(): Promise<void> {
    // Preload pedestrian business model first so its animations are available for player retargeting
    await this.ensureAssetLoaded('char_pedestrian_business_01').catch(() => {});

    const coreAssetIds = [
      // First Real Vertical Slice (16 Core Assets)
      'bld_nairobi_shop_01', 'bld_modern_apartment_01', 'bld_commercial_tower_01',
      'veh_sedan_01', 'veh_suv_landcruiser_01', 'veh_matatu_ngong_01',
      'char_player_01',
      'env_acacia_tree_01', 'env_mpesa_kiosk_01', 'env_streetlight_01', 'env_mama_mboga_stall_01',
      'interior_sofa_01', 'interior_table_01', 'interior_chair_01', 'interior_dj_booth_rig_01',
      // Additional Secondary Core Assets
      'bld_mixed_use_01', 'bld_office_block_01', 'bld_residential_villa_01', 'bld_nightclub_01', 'bld_industrial_warehouse_01', 'bld_informal_kiosk_01',
      'veh_boda_boda_01', 'veh_truck_01', 'char_pedestrian_student_01', 'env_palm_tree_01', 'interior_vip_lounge_sofa_01'
    ];
    // Preload warms the template cache and does not allocate gameplay instances
    await Promise.all(coreAssetIds.map((id) => this.ensureAssetLoaded(id).catch(() => {})));
  }

  public static getInstance(): AssetPipeline {
    if (!AssetPipeline.instance) {
      AssetPipeline.instance = new AssetPipeline();
    }
    return AssetPipeline.instance;
  }

  /**
   * Resolves an asset URL respecting Vite's configured BASE_URL.
   */
  public resolveAssetUrl(sourceFile: string): string {
    const baseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
    if (sourceFile.startsWith('/')) {
      const sanitizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      return `${sanitizedBase}${sourceFile}`;
    }
    return sourceFile;
  }

  /**
   * Loads and caches the shared asset template.
   * Does NOT allocate an active scene instance.
   */
  public async ensureAssetLoaded(assetId: string): Promise<THREE.Group> {
    if (this.glbCache.has(assetId)) {
      this.cacheHitCount++;
      return this.glbCache.get(assetId)!;
    }

    if (this.loadingPromises.has(assetId)) {
      this.cacheHitCount++;
      return await this.loadingPromises.get(assetId)!;
    }

    this.cacheMissCount++;
    const entry = ASSET_MANIFEST[assetId];
    if (!entry) {
      const reason = `Asset ID '${assetId}' not found in AssetManifest`;
      console.warn(`[AssetPipeline] ${reason}. Using procedural fallback.`);
      this.assetStatuses.set(assetId, { state: 'failed', url: '', reason });
      const fallback = this.createFallbackMesh(assetId);
      this.glbCache.set(assetId, fallback);
      return fallback;
    }

    const resolvedUrl = this.resolveAssetUrl(entry.sourceFile);
    this.assetStatuses.set(assetId, { state: 'loading', url: resolvedUrl });

    const isNodeTest = typeof process !== 'undefined' && process.env?.NODE_ENV === 'test';
    const timeoutDuration = isNodeTest ? 50 : 15000;

    const loadPromise = new Promise<THREE.Group>((resolve) => {
      let resolved = false;
      const timeoutId = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          const reason = `GLB load for '${assetId}' timed out after ${timeoutDuration}ms`;
          console.warn(`[AssetPipeline] ${reason}. Using procedural fallback.`);
          this.assetStatuses.set(assetId, { state: 'fallback', url: resolvedUrl, reason });
          const fallback = this.createFallbackMesh(assetId);
          this.glbCache.set(assetId, fallback);
          this.loadingPromises.delete(assetId);
          resolve(fallback);
        }
      }, timeoutDuration);

      try {
        this.gltfLoader.load(
          resolvedUrl,
          (gltf) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            const loadedGroup = gltf.scene || new THREE.Group();
            loadedGroup.name = `GLB_${assetId}`;
            loadedGroup.scale.copy(entry.intendedScale);

            const anims = gltf.animations || [];
            loadedGroup.userData.animations = anims;
            this.animationCache.set(assetId, anims);

            this.calibrateModelMaterials(loadedGroup, assetId);

            let meshCount = 0;
            loadedGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) meshCount++;
            });

            this.assetStatuses.set(assetId, { state: 'loaded', url: resolvedUrl, meshCount });
            this.glbCache.set(assetId, loadedGroup);
            this.loadingPromises.delete(assetId);
            resolve(loadedGroup);
          },
          undefined,
          (err) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            const reason = err instanceof Error ? err.message : String(err || 'Network error');
            console.warn(`[AssetPipeline] GLB load error for '${assetId}' (${resolvedUrl}): ${reason}. Using procedural fallback.`);
            this.assetStatuses.set(assetId, { state: 'fallback', url: resolvedUrl, reason });
            const fallback = this.createFallbackMesh(assetId);
            this.glbCache.set(assetId, fallback);
            this.loadingPromises.delete(assetId);
            resolve(fallback);
          }
        );
      } catch (e) {
        if (resolved) return;
        resolved = true;
        clearTimeout(timeoutId);
        const reason = e instanceof Error ? e.message : String(e || 'Exception');
        console.warn(`[AssetPipeline] Exception loading '${assetId}' (${resolvedUrl}): ${reason}. Using procedural fallback.`);
        this.assetStatuses.set(assetId, { state: 'fallback', url: resolvedUrl, reason });
        const fallback = this.createFallbackMesh(assetId);
        this.glbCache.set(assetId, fallback);
        this.loadingPromises.delete(assetId);
        resolve(fallback);
      }
    });

    this.loadingPromises.set(assetId, loadPromise);
    return await loadPromise;
  }

  public getAnimations(assetId: string): THREE.AnimationClip[] {
    const cached = this.animationCache.get(assetId);
    if (cached && cached.length > 0) return cached;

    const template = this.glbCache.get(assetId);
    if (template && template.userData?.animations && template.userData.animations.length > 0) {
      return template.userData.animations;
    }

    // Retarget fallback: if char_player_01 has 0 baked clips, share retargeted Mixamo clips from char_pedestrian_business_01
    if (assetId === 'char_player_01') {
      const sourceClips = this.getAnimations('char_pedestrian_business_01');
      if (sourceClips.length > 0) {
        const retargetedClips = this.retargetMixamoClipsToPlayer(sourceClips);
        this.animationCache.set(assetId, retargetedClips);
        return retargetedClips;
      }
    }

    // Mixamo humanoid models that only contain dance/tpose (student/casual/worker) share walking & idle from business pedestrian
    if (
      assetId === 'char_pedestrian_student_01' ||
      assetId === 'char_pedestrian_casual_01' ||
      assetId === 'char_worker_street_01'
    ) {
      const businessClips = this.getAnimations('char_pedestrian_business_01');
      if (businessClips.length > 0) return businessClips;
    }

    return [];
  }

  public getCharacterMeshAnimations(archetype: NPCArchetype | 'player'): THREE.AnimationClip[] {
    let assetId = 'char_player_01';
    switch (archetype) {
      case 'player': assetId = 'char_player_01'; break;
      case 'young_professional':
      case 'office_worker':
      case 'business_owner': assetId = 'char_pedestrian_business_01'; break;
      case 'student': assetId = 'char_pedestrian_student_01'; break;
      case 'driver': assetId = 'char_driver_01'; break;
      case 'security_guard': assetId = 'char_guard_security_01'; break;
      default: assetId = 'char_pedestrian_business_01'; break;
    }
    return this.getAnimations(assetId);
  }

  private retargetMixamoClipsToPlayer(clips: THREE.AnimationClip[]): THREE.AnimationClip[] {
    const playerRestHips = new THREE.Vector3(0, 1.019, 0.01);
    const mixamoRestHips = new THREE.Vector3(-0.160, 1.147, 106.13);

    return clips.map((clip) => {
      const retargetedTracks: THREE.KeyframeTrack[] = [];

      clip.tracks.forEach((track) => {
        // Strip mixamorig / mixamorig: prefix
        const cleanName = track.name.replace(/^mixamorig:?/, '');

        if (cleanName === 'Hips.position') {
          const values = new Float32Array(track.values.length);
          for (let i = 0; i < track.values.length; i += 3) {
            // Scale translation delta by 0.01 (Mixamo cm to ReadyPlayerMe meters)
            const dx = (track.values[i] - mixamoRestHips.x) * 0.01;
            const dy = (track.values[i + 1] - mixamoRestHips.y) * 0.01;
            const dz = (track.values[i + 2] - mixamoRestHips.z) * 0.01;
            values[i] = playerRestHips.x + dx;
            values[i + 1] = playerRestHips.y + dy;
            values[i + 2] = playerRestHips.z + dz;
          }
          retargetedTracks.push(new THREE.VectorKeyframeTrack('Hips.position', track.times, values));
        } else if (cleanName.endsWith('.quaternion')) {
          const clonedTrack = track.clone();
          clonedTrack.name = cleanName;
          retargetedTracks.push(clonedTrack);
        }
      });

      return new THREE.AnimationClip(clip.name, clip.duration, retargetedTracks);
    });
  }

  public cloneAssetTemplate(assetId: string, template: THREE.Group): THREE.Group {
    let hasSkinnedMesh = false;
    template.traverse((child) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh) {
        hasSkinnedMesh = true;
      }
    });

    const instance = hasSkinnedMesh
      ? (SkeletonUtils.clone(template) as THREE.Group)
      : template.clone(true);

    instance.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    const anims = this.getAnimations(assetId);
    instance.userData.animations = anims;
    return instance;
  }

  /**
   * Calibrates GLB mesh materials to physically believable PBR parameters.
   * Fixes raw asset defects like metallic character clothing/skin and chalky car bodies.
   */
  public calibrateModelMaterials(group: THREE.Group, assetId: string): void {
    const isCharacter = assetId.startsWith('char_');
    const isVehicle = assetId.startsWith('veh_');
    const isVegetation = assetId.startsWith('env_acacia_') || assetId.startsWith('env_palm_');
    const isBuilding = assetId.startsWith('bld_');

    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;

      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((mat) => {
        if (!mat) return;
        const stdMat = mat as THREE.MeshStandardMaterial;
        const name = (mat.name || mesh.name || '').toLowerCase();

        if (isCharacter) {
          // Characters: Skin, Hair, and Clothing must NOT be metallic
          if (name.includes('skin') || name.includes('face') || name.includes('body') || name.includes('head')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.65;
          } else if (name.includes('hair')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.8;
          } else if (name.includes('eye')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.1;
          } else {
            // Outfits, jackets, pants, shoes (ReadyPlayerMe Wolf3D_Outfit_Top / Bottom)
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.85;
          }
          stdMat.needsUpdate = true;
        } else if (isVehicle) {
          // Vehicles: Glass, Clearcoat Paint, Rubber, Chrome Trim
          if (name.includes('glass') || name.includes('window') || name.includes('windshield')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.05;
            stdMat.transparent = true;
            stdMat.opacity = 0.45;
          } else if (name.includes('tire') || name.includes('wheel') || name.includes('rubber')) {
            stdMat.metalness = 0.02;
            stdMat.roughness = 0.9;
          } else if (name.includes('bumper') || name.includes('grill') || name.includes('chrome') || name.includes('rim')) {
            stdMat.metalness = 0.85;
            stdMat.roughness = 0.18;
          } else {
            // Vehicle body car paint: smooth clearcoat sheen with realistic reflections
            stdMat.metalness = 0.55;
            stdMat.roughness = 0.22;
          }
          stdMat.needsUpdate = true;
        } else if (isVegetation) {
          // Trees & Foliage: nonmetallic
          if (name.includes('leaf') || name.includes('foliage') || name.includes('branch')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.75;
          } else {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.9;
          }
          stdMat.needsUpdate = true;
        } else if (isBuilding) {
          // Architectural structures: diffuse concrete/brick, dielectric windows
          if (name.includes('glass') || name.includes('window')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.05;
            stdMat.transparent = true;
            stdMat.opacity = 0.45;
          } else if (name.includes('metal') || name.includes('iron') || name.includes('steel')) {
            stdMat.metalness = 0.8;
            stdMat.roughness = 0.3;
          } else {
            stdMat.metalness = 0.02;
            stdMat.roughness = 0.8;
          }
          stdMat.needsUpdate = true;
        } else {
          // General props / furniture / kiosks
          if (name.includes('glass')) {
            stdMat.metalness = 0.0;
            stdMat.roughness = 0.05;
            stdMat.transparent = true;
            stdMat.opacity = 0.45;
          }
        }
      });
    });
  }

  /**
   * Creates an active scene instance for an asset. Tracks the allocated instance.
   */
  public createInstance(assetId: string): THREE.Group {
    if (this.glbCache.has(assetId)) {
      this.cacheHitCount++;
      const template = this.glbCache.get(assetId)!;
      const instance = this.cloneAssetTemplate(assetId, template);
      this.activeInstances.add(instance);
      return instance;
    }

    // Create a proxy group that will be populated once ensureAssetLoaded finishes
    const proxyGroup = new THREE.Group();
    proxyGroup.name = `ProxyGroup_${assetId}`;
    this.activeInstances.add(proxyGroup);

    this.ensureAssetLoaded(assetId).then((template) => {
      proxyGroup.clear();
      const instance = this.cloneAssetTemplate(assetId, template);
      proxyGroup.add(instance);
      proxyGroup.userData.animations = this.getAnimations(assetId);
    }).catch((_err) => {
      const fallback = this.createFallbackMesh(assetId);
      proxyGroup.clear();
      proxyGroup.add(fallback);
    });

    return proxyGroup;
  }

  /**
   * Asynchronously loads a GLB asset and returns a tracked active instance.
   */
  public async loadGLBAsset(assetId: string): Promise<THREE.Group> {
    await this.ensureAssetLoaded(assetId);
    return this.createInstance(assetId);
  }

  /**
   * Creates an explicit high-fidelity fallback mesh if a GLB model is absent.
   */
  public createFallbackMesh(assetId: string): THREE.Group {
    if (assetId.includes('matatu')) return VehicleAssetKit.createVehicleMesh('matatu');
    if (assetId.includes('veh_sedan')) return VehicleAssetKit.createVehicleMesh('sedan');
    if (assetId.includes('veh_suv')) return VehicleAssetKit.createVehicleMesh('suv');
    if (assetId.includes('veh_boda')) return VehicleAssetKit.createVehicleMesh('motorcycle');
    if (assetId.includes('veh_truck')) return VehicleAssetKit.createVehicleMesh('truck');
    if (assetId.includes('veh_van')) return VehicleAssetKit.createVehicleMesh('van');
    if (assetId.includes('veh_compact')) return VehicleAssetKit.createVehicleMesh('compact_car');
    if (assetId.includes('veh_pickup')) return VehicleAssetKit.createVehicleMesh('pickup');

    if (assetId.includes('char')) return CharacterAssetKit.createHumanoidMesh('young_professional');

    if (assetId.includes('acacia')) return EnvironmentAssetKit.createAcaciaTreeMesh();
    if (assetId.includes('palm')) return EnvironmentAssetKit.createPalmTreeMesh();
    if (assetId.includes('mpesa')) return EnvironmentAssetKit.createMPesaKioskMesh();
    if (assetId.includes('mama_mboga')) return EnvironmentAssetKit.createMamaMbogaStallMesh();
    if (assetId.includes('streetlight')) return EnvironmentAssetKit.createStreetlightMesh();
    if (assetId.includes('barrier')) return EnvironmentAssetKit.createRoadBarrierMesh();
    if (assetId.includes('pole')) return EnvironmentAssetKit.createUtilityPoleMesh();

    if (assetId.includes('interior_dj_booth')) return InteriorAssetKit.createDJBoothRig();
    if (assetId.includes('interior_vip_lounge')) return InteriorAssetKit.createVIPLoungeMesh();
    if (assetId.includes('interior_sofa')) return InteriorAssetKit.createVIPLoungeMesh();
    if (assetId.includes('interior_table')) return InteriorAssetKit.createDJBoothRig();
    if (assetId.includes('interior_chair')) return InteriorAssetKit.createVIPLoungeMesh();

    if (assetId.includes('bld_')) {
      const dummyBld: BuildingData = {
        id: `fallback_${assetId}`,
        name: 'Fallback Building',
        footprintPolygon: [
          { x: -5, z: -5 },
          { x: 5, z: -5 },
          { x: 5, z: 5 },
          { x: -5, z: 5 }
        ],
        center: new THREE.Vector3(0, 0, 0),
        height: 10,
        floors: 3,
        zone: 'commercial_corridor',
        districtId: 'district_nairobi',
        buildingCategory: assetId.includes('tower') ? 'commercial_tower' : (assetId.includes('mixed') ? 'mixed_use' : 'shop'),
        entrances: [{ id: 'ent1', position: new THREE.Vector3(0, 0, 5), type: 'main' }],
        hasGroundFloorShops: true,
        rooftopEquipment: ['water_tank']
      };
      return BuildingAssetKit.createBuildingGroup(dummyBld);
    }

    const fallbackGroup = new THREE.Group();
    fallbackGroup.name = `FallbackGroup_${assetId}`;
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 })
    );
    fallbackGroup.add(box);
    return fallbackGroup;
  }

  // --- HELPER TO RETRIEVE CACHED GLB OR ASYNC PROXY ---
  public getCachedGLB(assetId: string): THREE.Group {
    return this.createInstance(assetId);
  }

  // --- GIS FOOTPRINT FITTING RESOLVER (Phase E) ---
  public fitBuildingToFootprint(bld: BuildingData): BuildingFitResult {
    // 1. Select candidate architectural families compatible with category
    let candidateIds: string[] = ['bld_nairobi_shop_01'];
    switch (bld.buildingCategory) {
      case 'shop':
        candidateIds = ['bld_nairobi_shop_01', 'bld_nairobi_shop_02'];
        break;
      case 'mixed_use':
        candidateIds = ['bld_mixed_use_01', 'bld_mixed_use_02'];
        break;
      case 'apartment_block':
        candidateIds = ['bld_modern_apartment_01', 'bld_modern_apartment_02'];
        break;
      case 'office_block':
        candidateIds = ['bld_office_block_01'];
        break;
      case 'commercial_tower':
        candidateIds = ['bld_commercial_tower_01'];
        break;
      case 'residential_house':
        candidateIds = ['bld_residential_villa_01'];
        break;
      case 'warehouse':
        candidateIds = ['bld_industrial_warehouse_01'];
        break;
      case 'market_structure':
        candidateIds = ['bld_informal_kiosk_01'];
        break;
      default:
        candidateIds = ['bld_nairobi_shop_01'];
        break;
    }

    // 2. Compute GIS footprint dimensions
    let fpWidth = 12;
    let fpDepth = 12;
    if (bld.footprintPolygon && bld.footprintPolygon.length >= 3) {
      let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
      for (const pt of bld.footprintPolygon) {
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.z < minZ) minZ = pt.z;
        if (pt.z > maxZ) maxZ = pt.z;
      }
      fpWidth = Math.max(2, maxX - minX);
      fpDepth = Math.max(2, maxZ - minZ);
    }

    const targetHeight = bld.height && bld.height > 0 ? bld.height : Math.max(4, (bld.floors || 1) * 3.5);

    // Orientation alignment from GIS entrance where available
    let baseRotation = 0;
    if (bld.entrances && bld.entrances.length > 0) {
      const ent = bld.entrances[0].position;
      const dx = ent.x - bld.center.x;
      const dz = ent.z - bld.center.z;
      if (Math.abs(dx) > 0.1 || Math.abs(dz) > 0.1) {
        baseRotation = Math.atan2(dx, dz);
      }
    }

    // 3. Find best variant comparing native dimensions with footprint
    let bestCandidate = candidateIds[0];
    let bestScale = new THREE.Vector3(1, 1, 1);
    let bestRotation = baseRotation;
    let bestDistortion = Infinity;
    let fitsFootprint = false;

    for (const candId of candidateIds) {
      const manifestEntry = ASSET_MANIFEST[candId];
      if (!manifestEntry) continue;
      const nativeDim = manifestEntry.boundingDimensions;
      const nativeW = nativeDim.width || 10;
      const nativeH = nativeDim.height || 8;
      const nativeD = nativeDim.depth || 10;

      // Evaluate 0-degree and 90-degree orientations to see which aligns better with the footprint
      const orientations = [
        { rot: baseRotation, targetW: fpWidth, targetD: fpDepth },
        { rot: baseRotation + Math.PI / 2, targetW: fpDepth, targetD: fpWidth }
      ];

      for (const orient of orientations) {
        const sx = orient.targetW / nativeW;
        const sz = orient.targetD / nativeD;
        const sy = targetHeight / nativeH;

        // Scaling policy: permit flexible scaling between 0.3x and 5.0x for city architecture
        const isWithinScaleRange = sx >= 0.3 && sx <= 5.0 && sz >= 0.3 && sz <= 5.0 && sy >= 0.3 && sy <= 5.0;
        // Aspect ratio distortion factor
        const aspectDistortion = Math.max(sx / sz, sz / sx);

        if (isWithinScaleRange && aspectDistortion < 2.8) {
          const totalScore = aspectDistortion + Math.abs(sx - 1.0) * 0.15 + Math.abs(sz - 1.0) * 0.15;
          if (totalScore < bestDistortion) {
            bestDistortion = totalScore;
            bestCandidate = candId;
            bestScale = new THREE.Vector3(sx, sy, sz);
            bestRotation = orient.rot;
            fitsFootprint = true;
          }
        }
      }
    }

    if (!fitsFootprint) {
      bestScale = new THREE.Vector3(fpWidth / 10, targetHeight / 10, fpDepth / 10);
    }

    return {
      assetId: bestCandidate,
      scale: bestScale,
      rotationY: bestRotation,
      fitsFootprint: fitsFootprint
    };
  }

  // --- BUILDINGS ---
  public getBuildingMesh(bld: BuildingData): THREE.Group {
    this.buildingCount++;
    const fit = this.fitBuildingToFootprint(bld);

    const glbMesh = this.createInstance(fit.assetId);
    const wrapper = new THREE.Group();
    wrapper.name = `BuildingGroup_${bld.id}`;
    wrapper.position.copy(bld.center);
    wrapper.rotation.y = fit.rotationY;

    // Apply footprint-fitted scale
    glbMesh.scale.copy(fit.scale);
    wrapper.add(glbMesh);
    return wrapper;
  }

  // --- VEHICLES ---
  public getVehicleMesh(category: VehicleCategory, _paintColor: number = 0x1e3a8a): THREE.Group {
    this.vehicleCount++;
    let assetId = 'veh_sedan_01';
    switch (category) {
      case 'matatu': assetId = 'veh_matatu_ngong_01'; break;
      case 'sedan': assetId = 'veh_sedan_01'; break;
      case 'suv': assetId = 'veh_suv_landcruiser_01'; break;
      case 'motorcycle': assetId = 'veh_boda_boda_01'; break;
      case 'truck': assetId = 'veh_truck_01'; break;
      case 'van': assetId = 'veh_van_01'; break;
      case 'compact_car': assetId = 'veh_compact_01'; break;
      case 'pickup': assetId = 'veh_pickup_01'; break;
      default: assetId = 'veh_sedan_01'; break;
    }

    return this.getCachedGLB(assetId);
  }

  // --- CHARACTERS ---
  public getCharacterMesh(archetype: NPCArchetype | 'player', _skinTone?: number, _outfitColor?: number): THREE.Group {

    this.characterCount++;
    let assetId = 'char_player_01';
    switch (archetype) {
      case 'player': assetId = 'char_player_01'; break;
      case 'young_professional':
      case 'office_worker':
      case 'business_owner': assetId = 'char_pedestrian_business_01'; break;
      case 'student': assetId = 'char_pedestrian_student_01'; break;
      case 'driver': assetId = 'char_driver_01'; break;
      case 'security_guard': assetId = 'char_guard_security_01'; break;
      default: assetId = 'char_player_01'; break;
    }

    return this.getCachedGLB(assetId);
  }

  // --- ENVIRONMENT FOLIAGE & PROPS ---
  public getAcaciaTreeMesh(): THREE.Group {
    return this.getCachedGLB('env_acacia_tree_01');
  }

  public getPalmTreeMesh(): THREE.Group {
    return this.getCachedGLB('env_palm_tree_01');
  }

  public getStreetlightMesh(): THREE.Group {
    return this.getCachedGLB('env_streetlight_01');
  }

  public getMamaMbogaStallMesh(): THREE.Group {
    return this.getCachedGLB('env_mama_mboga_stall_01');
  }

  public getMPesaKioskMesh(): THREE.Group {
    return this.getCachedGLB('env_mpesa_kiosk_01');
  }

  // --- INTERIORS ---
  public getDJBoothRigMesh(): THREE.Group {
    return this.getCachedGLB('interior_dj_booth_rig_01');
  }

  public getVIPLoungeMesh(): THREE.Group {
    return this.getCachedGLB('interior_vip_lounge_sofa_01');
  }

  public getSofaMesh(): THREE.Group {
    return this.getCachedGLB('interior_sofa_01');
  }

  public getTableMesh(): THREE.Group {
    return this.getCachedGLB('interior_table_01');
  }

  public getChairMesh(): THREE.Group {
    return this.getCachedGLB('interior_chair_01');
  }

  // --- TEXTURES ---
  public getAsphaltTexture(): THREE.CanvasTexture {
    return TextureGenerator.createAsphaltTexture();
  }

  public getSidewalkTexture(): THREE.CanvasTexture {
    return TextureGenerator.createSidewalkPaverTexture();
  }

  // --- DISPOSAL & GPU MEMORY MANAGEMENT ---
  public disposeAssetInstance(object: THREE.Object3D): void {
    if (!object) return;
    this.activeInstances.delete(object);
    this.disposedCount++;

    if (object.parent) {
      object.parent.remove(object);
    }

    object.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.userData?.isStandaloneInstance) {
          if (mesh.geometry) mesh.geometry.dispose();
          if (mesh.material) {
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((mat) => mat.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        }
      }
    });
  }

  public async preloadChunkAssets(chunkX: number, chunkZ: number): Promise<void> {
    const buildingAssets = ['bld_nairobi_shop_01', 'bld_mixed_use_01', 'bld_modern_apartment_01'];
    const assetId = buildingAssets[Math.abs(chunkX + chunkZ) % buildingAssets.length];
    await this.ensureAssetLoaded(assetId);
  }

  public getAssetState(assetId: string): AssetState {
    const status = this.assetStatuses.get(assetId);
    return status ? status.state : 'not-requested';
  }

  public getAssetStatus(assetId: string): AssetLoadStatus | undefined {
    return this.assetStatuses.get(assetId);
  }

  public getAllAssetStatuses(): Map<string, AssetLoadStatus> {
    return new Map(this.assetStatuses);
  }

  public getStats(): AssetPipelineStats {
    let loaded = 0;
    let fallback = 0;
    let failed = 0;
    let loading = 0;

    this.assetStatuses.forEach((status) => {
      if (status.state === 'loaded') loaded++;
      else if (status.state === 'fallback') fallback++;
      else if (status.state === 'failed') failed++;
      else if (status.state === 'loading') loading++;
    });

    return {
      cachedTexturesCount: 6,
      cachedGLBCount: this.glbCache.size,
      activeInstancesCount: this.activeInstances.size,
      disposedInstancesCount: this.disposedCount,
      buildingKitsGenerated: this.buildingCount,
      vehicleKitsGenerated: this.vehicleCount,
      characterKitsGenerated: this.characterCount,
      cacheHitCount: this.cacheHitCount,
      cacheMissCount: this.cacheMissCount,
      assetLoadedCount: loaded,
      assetFallbacksCount: fallback,
      assetFailuresCount: failed,
      assetLoadingCount: loading
    };
  }

  public clearCache(): void {
    this.glbCache.clear();
    this.instanceMeshCache.clear();
    this.loadingPromises.clear();
    this.assetStatuses.clear();
    this.activeInstances.clear();
    this.disposedCount = 0;
    this.buildingCount = 0;
    this.vehicleCount = 0;
    this.characterCount = 0;
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }
}
