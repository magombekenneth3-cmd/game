import * as THREE from 'three';
import {
  BuildingClassification,
  BuildingInteractionTier,
  InteriorLODState,
  InteriorRoom,
  InteriorDoor,
  InteriorSemanticLocation,
  InteriorPersistentState
} from './InteriorTypes';
import { InteriorNavigationGraph } from './InteriorNavigation';
import { InteriorLightingSystem } from './InteriorLighting';
import { InteriorFurnitureSystem } from './InteriorFurniture';
import { AssetManager } from '../engine/AssetManager';

export class InteriorInstance {
  public interiorId: string;
  public buildingId: string;
  public buildingName: string;
  public classification: BuildingClassification;
  public interactionTier: BuildingInteractionTier;

  public bounds: THREE.Box3;
  public rooms: InteriorRoom[] = [];
  public doors: InteriorDoor[] = [];
  public semanticLocations: InteriorSemanticLocation[] = [];
  public navGraph: InteriorNavigationGraph;

  public visualGroup: THREE.Group;
  public lodState: InteriorLODState = 'INTERIOR_INACTIVE';
  public persistentState: InteriorPersistentState;

  private furnitureCount: number = 0;

  constructor(
    interiorId: string,
    buildingId: string,
    buildingName: string,
    classification: BuildingClassification,
    interactionTier: BuildingInteractionTier,
    bounds: THREE.Box3
  ) {
    this.interiorId = interiorId;
    this.buildingId = buildingId;
    this.buildingName = buildingName;
    this.classification = classification;
    this.interactionTier = interactionTier;
    this.bounds = bounds;

    this.visualGroup = new THREE.Group();
    this.visualGroup.name = `Interior_${interiorId}`;
    this.navGraph = new InteriorNavigationGraph();

    this.persistentState = {
      interiorId,
      lastVisitTime: Date.now(),
      objectStates: {}
    };
  }

  public setLOD(newLOD: InteriorLODState, scene: THREE.Scene, assetManager?: AssetManager): void {
    if (this.lodState === newLOD) return;

    const prevLOD = this.lodState;
    this.lodState = newLOD;

    if (newLOD === 'INTERIOR_ACTIVE') {
      if (prevLOD !== 'INTERIOR_ACTIVE') {
        this.build3DInteriorMesh(assetManager);
        scene.add(this.visualGroup);
      }
    } else if (newLOD === 'INTERIOR_BACKGROUND') {
      if (prevLOD === 'INTERIOR_ACTIVE') {
        scene.remove(this.visualGroup);
        this.clear3DMeshes();
      }
    } else {
      // INTERIOR_INACTIVE
      if (prevLOD === 'INTERIOR_ACTIVE') {
        scene.remove(this.visualGroup);
        this.clear3DMeshes();
      }
    }
  }

  public build3DInteriorMesh(assetManager?: AssetManager): void {
    this.clear3DMeshes();

    const min = this.bounds.min;
    const max = this.bounds.max;
    const width = max.x - min.x;
    const height = max.y - min.y;
    const depth = max.z - min.z;
    const center = new THREE.Vector3();
    this.bounds.getCenter(center);

    // Floor Mesh
    const floorGeo = new THREE.PlaneGeometry(width, depth);
    const floorMat = new THREE.MeshStandardMaterial({
      color: this.getFloorColor(),
      roughness: 0.6
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(center.x, min.y, center.z);
    floorMesh.receiveShadow = true;
    this.visualGroup.add(floorMesh);

    // Ceiling Mesh
    const ceilMat = new THREE.MeshStandardMaterial({ color: 0xefefef, roughness: 0.9 });
    const ceilMesh = new THREE.Mesh(floorGeo, ceilMat);
    ceilMesh.rotation.x = Math.PI / 2;
    ceilMesh.position.set(center.x, max.y, center.z);
    this.visualGroup.add(ceilMesh);

    // Perimeter Wall Meshes
    const wallMat = new THREE.MeshStandardMaterial({
      color: this.getWallColor(),
      roughness: 0.8
    });

    // North Wall
    const wallNorthGeo = new THREE.BoxGeometry(width, height, 0.3);
    const wallNorth = new THREE.Mesh(wallNorthGeo, wallMat);
    wallNorth.position.set(center.x, min.y + height / 2, min.z);
    this.visualGroup.add(wallNorth);

    // South Wall
    const wallSouth = new THREE.Mesh(wallNorthGeo, wallMat);
    wallSouth.position.set(center.x, min.y + height / 2, max.z);
    this.visualGroup.add(wallSouth);

    // West Wall
    const wallSideGeo = new THREE.BoxGeometry(0.3, height, depth);
    const wallWest = new THREE.Mesh(wallSideGeo, wallMat);
    wallWest.position.set(min.x, min.y + height / 2, center.z);
    this.visualGroup.add(wallWest);

    // East Wall
    const wallEast = new THREE.Mesh(wallSideGeo, wallMat);
    wallEast.position.set(max.x, min.y + height / 2, center.z);
    this.visualGroup.add(wallEast);

    // Populate Interior Lighting
    InteriorLightingSystem.createLightingForInterior(
      this.visualGroup,
      this.classification,
      this.rooms,
      this.bounds
    );

    // Populate Furniture
    this.furnitureCount = InteriorFurnitureSystem.populateFurniture(
      this.visualGroup,
      this.classification,
      this.rooms,
      assetManager
    );
  }

  private clear3DMeshes(): void {
    while (this.visualGroup.children.length > 0) {
      const child = this.visualGroup.children.pop();
      if (child && child instanceof THREE.Mesh) {
        child.geometry?.dispose();
      }
    }
    this.furnitureCount = 0;
  }

  private getFloorColor(): number {
    switch (this.classification) {
      case 'NIGHTCLUB': return 0x111122;
      case 'APARTMENT': return 0x8d6e63;
      case 'RESTAURANT': return 0x4e3629;
      case 'RETAIL': return 0xe0e0e0;
      case 'OFFICE': return 0x78909c;
      case 'GARAGE':
      case 'WAREHOUSE': return 0x616161;
      default: return 0xd1c4e9;
    }
  }

  private getWallColor(): number {
    switch (this.classification) {
      case 'NIGHTCLUB': return 0x120024;
      case 'APARTMENT': return 0xf5f5f5;
      case 'RESTAURANT': return 0xffecb3;
      case 'RETAIL': return 0xffffff;
      case 'OFFICE': return 0xe0f2f1;
      default: return 0xe0e0e0;
    }
  }

  public getFurnitureCount(): number {
    return this.furnitureCount;
  }
}
