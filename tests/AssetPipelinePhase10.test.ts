import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { AssetPipeline } from '../src/assets/AssetPipeline';
import { TextureGenerator } from '../src/assets/TextureGenerator';
import { BuildingAssetKit } from '../src/assets/BuildingAssetKit';
import { VehicleAssetKit } from '../src/assets/VehicleAssetKit';
import { CharacterAssetKit } from '../src/assets/CharacterAssetKit';
import { EnvironmentAssetKit } from '../src/assets/EnvironmentAssetKit';
import { InteriorAssetKit } from '../src/assets/InteriorAssetKit';
import { BuildingData } from '../src/world/BuildingData';

describe('Phase 10 — Production 3D Asset Pipeline & Visual Fidelity Tests', () => {
  let pipeline: AssetPipeline;

  beforeEach(() => {
    pipeline = AssetPipeline.getInstance();
    pipeline.clearCache();
  });

  it('1. generates procedural canvas textures for asphalt, sidewalk, and facade panels', () => {
    const asphalt = TextureGenerator.createAsphaltTexture();
    const sidewalk = TextureGenerator.createSidewalkPaverTexture();
    const facade = TextureGenerator.createFacadePanelTexture('terracotta');

    expect(asphalt).toBeDefined();
    expect(sidewalk).toBeDefined();
    expect(facade).toBeDefined();
  });

  it('2. generates modular 3D building groups for GIS building footprints', () => {
    const sampleBld: BuildingData = {
      id: 'bld_apartment_1',
      name: 'Kilimani Crest Apartment',
      footprintPolygon: [
        { x: -10, z: -10 },
        { x: 10, z: -10 },
        { x: 10, z: 10 },
        { x: -10, z: 10 }
      ],
      center: new THREE.Vector3(0, 0, 0),
      height: 18.0,
      floors: 6,
      zone: 'residential_estate',
      districtId: 'district_nairobi',
      buildingCategory: 'apartment_block',
      entrances: [{ id: 'ent_1', position: new THREE.Vector3(0, 0, 10), type: 'main' }],
      hasGroundFloorShops: true,
      shopNames: ['Mama Mboga Grocery'],
      rooftopEquipment: ['water_tank', 'solar_panel', 'antenna']
    };

    const group = BuildingAssetKit.createBuildingGroup(sampleBld);

    expect(group).toBeDefined();
    expect(group.children.length).toBeGreaterThan(0);
    const body = group.getObjectByName(`BuildingBody_${sampleBld.id}`);
    expect(body).toBeDefined();
  });

  it('3. generates realistic 3D vehicle meshes for matatu, suv, sedan, boda boda, and truck', () => {
    const matatu = VehicleAssetKit.createVehicleMesh('matatu');
    const sedan = VehicleAssetKit.createVehicleMesh('sedan');
    const suv = VehicleAssetKit.createVehicleMesh('suv');
    const boda = VehicleAssetKit.createVehicleMesh('motorcycle');
    const truck = VehicleAssetKit.createVehicleMesh('truck');

    expect(matatu.children.length).toBeGreaterThan(0);
    expect(sedan.children.length).toBeGreaterThan(0);
    expect(suv.children.length).toBeGreaterThan(0);
    expect(boda.children.length).toBeGreaterThan(0);
    expect(truck.children.length).toBeGreaterThan(0);
  });

  it('4. generates detailed 3D character humanoid meshes for player and NPC archetypes', () => {
    const playerMesh = CharacterAssetKit.createHumanoidMesh('player');
    const studentMesh = CharacterAssetKit.createHumanoidMesh('student');
    const guardMesh = CharacterAssetKit.createHumanoidMesh('security_guard');

    expect(playerMesh.children.length).toBeGreaterThan(0);
    expect(studentMesh.children.length).toBeGreaterThan(0);
    expect(guardMesh.children.length).toBeGreaterThan(0);

    const leftLeg = playerMesh.getObjectByName('LeftLeg');
    expect(leftLeg).toBeDefined();
  });

  it('5. creates East African foliage and street furniture meshes', () => {
    const acacia = EnvironmentAssetKit.createAcaciaTreeMesh();
    const palm = EnvironmentAssetKit.createPalmTreeMesh();
    const streetlight = EnvironmentAssetKit.createStreetlightMesh();
    const mamaMboga = EnvironmentAssetKit.createMamaMbogaStallMesh();
    const mpesa = EnvironmentAssetKit.createMPesaKioskMesh();

    expect(acacia.children.length).toBeGreaterThan(0);
    expect(palm.children.length).toBeGreaterThan(0);
    expect(streetlight.children.length).toBeGreaterThan(0);
    expect(mamaMboga.children.length).toBeGreaterThan(0);
    expect(mpesa.children.length).toBeGreaterThan(0);
  });

  it('6. creates detailed 3D interior nightclub DJ booth rig and VIP lounge seating', () => {
    const djRig = InteriorAssetKit.createDJBoothRig();
    const vipLounge = InteriorAssetKit.createVIPLoungeMesh();

    expect(djRig.children.length).toBeGreaterThan(0);
    expect(vipLounge.children.length).toBeGreaterThan(0);
  });

  it('7. verifies AssetPipeline singleton caching and telemetry stats', () => {
    const vehicle = pipeline.getVehicleMesh('sedan');
    const player = pipeline.getCharacterMesh('player');
    const stats = pipeline.getStats();

    expect(vehicle).toBeDefined();
    expect(player).toBeDefined();
    expect(stats.vehicleKitsGenerated).toBe(1);
    expect(stats.characterKitsGenerated).toBe(1);

    pipeline.clearCache();
    expect(pipeline.getStats().vehicleKitsGenerated).toBe(0);
  });
});
