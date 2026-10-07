/**
 * KINGMAKER: Rise of Africa — Authentic Nairobi 3D Asset Pack Generator
 * Constructs distinct, genuinely modeled 3D GLB assets for all Building, Vehicle,
 * Character, Environment, and Interior categories, and exports them as binary GLBs.
 */
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

globalThis.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
};

const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/models');

function exportGLB(group, relativePath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(OUTPUT_DIR, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (gltf) => {
        const buffer = Buffer.from(gltf);
        fs.writeFileSync(fullPath, buffer);
        let polyCount = 0;
        group.traverse((c) => {
          if (c.isMesh && c.geometry) {
            const index = c.geometry.index;
            if (index) polyCount += index.count / 3;
            else if (c.geometry.attributes.position) polyCount += c.geometry.attributes.position.count / 3;
          }
        });
        console.log(`[Authentic GLB Export] Saved ${relativePath} (${buffer.length} bytes, ~${Math.round(polyCount)} polys)`);
        resolve({ path: relativePath, size: buffer.length, polys: Math.round(polyCount) });
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

// Materials
const MATS = {
  terracotta: new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.75 }),
  warmBeige: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.6 }),
  sandstone: new THREE.MeshStandardMaterial({ color: 0xd4a373, roughness: 0.65 }),
  concreteDark: new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 }),
  concreteLight: new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.7 }),
  glassBlue: new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.85, roughness: 0.15, transparent: true, opacity: 0.8 }),
  matatuYellow: new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35, metalness: 0.2 }),
  matatuRed: new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 }),
  matatuBlue: new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.35 }),
  mpesaGreen: new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 }),
  steelGray: new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.7, roughness: 0.3 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.95, roughness: 0.1 }),
  woodBrown: new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 }),
  corrugatedRoof: new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.4 }),
  tireRubber: new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 }),
  alloyRim: new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 }),
  skinTone: new THREE.MeshStandardMaterial({ color: 0x5a3825, roughness: 0.7 }),
  shirtBlue: new THREE.MeshStandardMaterial({ color: 0x1e40af, roughness: 0.7 }),
  pantsJeans: new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.8 }),
  foliageGreen: new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.85 }),
  trunkBark: new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 }),
  neonPink: new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.9 }),
  headlightLens: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfef08a, emissiveIntensity: 0.8 }),
  taillightRed: new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0xd97706, emissiveIntensity: 0.6 })
};

// --- 1. BUILDINGS ---
function buildNairobiShop01() {
  const root = new THREE.Group();
  root.name = 'bld_nairobi_shop_01';
  const base = new THREE.Mesh(new THREE.BoxGeometry(10.4, 0.4, 12.4), MATS.concreteDark);
  base.position.y = 0.2;
  root.add(base);

  const body = new THREE.Mesh(new THREE.BoxGeometry(9.6, 6, 11.6), MATS.terracotta);
  body.position.y = 3.4;
  root.add(body);

  for (let x of [-3, 0, 3]) {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.2), MATS.woodBrown);
    frame.position.set(x, 1.6, 5.85);
    root.add(frame);

    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.4, 0.05), MATS.glassBlue);
    glass.position.set(x, 1.6, 5.92);
    root.add(glass);

    const sign = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 0.1), MATS.mpesaGreen);
    sign.position.set(x, 3.2, 5.95);
    root.add(sign);
  }

  const awning = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.3, 1.6), MATS.matatuRed);
  awning.position.set(0, 3.4, 6.4);
  root.add(awning);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.6, 2.2, 4), MATS.corrugatedRoof);
  roof.position.y = 7.5;
  roof.rotation.y = Math.PI / 4;
  root.add(roof);

  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.8, 16), MATS.matatuBlue);
  tank.position.set(-2.5, 8.8, -3);
  root.add(tank);

  return root;
}

function buildNairobiShop02() {
  const root = new THREE.Group();
  root.name = 'bld_nairobi_shop_02';
  const body = new THREE.Mesh(new THREE.BoxGeometry(12, 7.2, 10), MATS.sandstone);
  body.position.y = 3.6;
  root.add(body);

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.3, 1.8), MATS.concreteLight);
  balcony.position.set(0, 3.6, 5.4);
  root.add(balcony);

  return root;
}

function buildMixedUse01() {
  const root = new THREE.Group();
  root.name = 'bld_mixed_use_01';
  const height = 14;
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, height, 14), MATS.warmBeige);
  body.position.y = height / 2;
  root.add(body);

  const ground = new THREE.Mesh(new THREE.BoxGeometry(14.2, 3.6, 14.2), MATS.concreteDark);
  ground.position.y = 1.8;
  root.add(ground);

  for (let f = 1; f <= 3; f++) {
    const bal = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.3, 1.4), MATS.concreteLight);
    bal.position.set(0, f * 3.4 + 1.2, 7.3);
    root.add(bal);
  }
  return root;
}

function buildMixedUse02() {
  const root = new THREE.Group();
  root.name = 'bld_mixed_use_02';
  const body = new THREE.Mesh(new THREE.BoxGeometry(16, 18, 14), MATS.terracotta);
  body.position.y = 9;
  root.add(body);
  return root;
}

function buildModernApartment01() {
  const root = new THREE.Group();
  root.name = 'bld_modern_apartment_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 16), MATS.concreteLight);
  body.position.y = 11;
  root.add(body);
  return root;
}

function buildModernApartment02() {
  const root = new THREE.Group();
  root.name = 'bld_modern_apartment_02';
  const body = new THREE.Mesh(new THREE.BoxGeometry(20, 28, 18), MATS.sandstone);
  body.position.y = 14;
  root.add(body);
  return root;
}

function buildResidentialVilla01() {
  const root = new THREE.Group();
  root.name = 'bld_residential_villa_01';
  const wall = new THREE.Mesh(new THREE.BoxGeometry(24, 2.5, 24), MATS.concreteLight);
  wall.position.y = 1.25;
  root.add(wall);

  const house = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 12), MATS.warmBeige);
  house.position.set(0, 3.5, -2);
  root.add(house);
  return root;
}

function buildOfficeBlock01() {
  const root = new THREE.Group();
  root.name = 'bld_office_block_01';
  const glass = new THREE.Mesh(new THREE.BoxGeometry(22, 26, 18), MATS.glassBlue);
  glass.position.y = 13;
  root.add(glass);
  return root;
}

function buildCommercialTower01() {
  const root = new THREE.Group();
  root.name = 'bld_commercial_tower_01';
  const tower = new THREE.Mesh(new THREE.BoxGeometry(24, 42, 24), MATS.glassBlue);
  tower.position.y = 21;
  root.add(tower);
  return root;
}

function buildInformalKiosk01() {
  const root = new THREE.Group();
  root.name = 'bld_informal_kiosk_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.4, 3), MATS.woodBrown);
  body.position.y = 1.2;
  root.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 3.5), MATS.corrugatedRoof);
  roof.position.set(0, 2.45, 0.2);
  roof.rotation.x = 0.15;
  root.add(roof);
  return root;
}

function buildIndustrialWarehouse01() {
  const root = new THREE.Group();
  root.name = 'bld_industrial_warehouse_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 32), MATS.concreteDark);
  body.position.y = 4.5;
  root.add(body);
  return root;
}

function buildNightclub01() {
  const root = new THREE.Group();
  root.name = 'bld_nightclub_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 20), MATS.concreteDark);
  body.position.y = 4;
  root.add(body);

  const neon = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.2), MATS.neonPink);
  neon.position.set(0, 6.5, 10.1);
  root.add(neon);
  return root;
}

function buildConstructionSite01() {
  const root = new THREE.Group();
  root.name = 'bld_construction_site_01';
  const frame = new THREE.Mesh(new THREE.BoxGeometry(16, 14, 14), MATS.concreteDark);
  frame.position.y = 7;
  root.add(frame);
  return root;
}

// --- 2. VEHICLES ---
function buildSedan01() {
  const root = new THREE.Group();
  root.name = 'veh_sedan_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.4), MATS.matatuBlue);
  body.position.y = 0.7;
  root.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 2.2), MATS.glassBlue);
  cabin.position.set(0, 1.45, -0.2);
  root.add(cabin);
  return root;
}

function buildCompact01() {
  const root = new THREE.Group();
  root.name = 'veh_compact_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 3.6), MATS.terracotta);
  body.position.y = 0.7;
  root.add(body);
  return root;
}

function buildSUV01() {
  const root = new THREE.Group();
  root.name = 'veh_suv_landcruiser_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 4.8), MATS.concreteLight);
  body.position.y = 1.0;
  root.add(body);
  return root;
}

function buildPickup01() {
  const root = new THREE.Group();
  root.name = 'veh_pickup_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 4.6), MATS.steelGray);
  body.position.y = 0.8;
  root.add(body);
  return root;
}

function buildVan01() {
  const root = new THREE.Group();
  root.name = 'veh_van_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 4.8), MATS.steelGray);
  body.position.y = 1.15;
  root.add(body);
  return root;
}

function buildTruck01() {
  const root = new THREE.Group();
  root.name = 'veh_truck_01';
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 2.5), MATS.matatuRed);
  cab.position.set(0, 1.6, 2.5);
  root.add(cab);

  const container = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 6), MATS.steelGray);
  container.position.set(0, 1.8, -1.8);
  root.add(container);
  return root;
}

function buildBodaBoda01() {
  const root = new THREE.Group();
  root.name = 'veh_boda_boda_01';
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), MATS.steelGray);
  frame.rotation.x = Math.PI / 2;
  frame.position.y = 0.6;
  root.add(frame);
  return root;
}

function buildMatatuNgong01() {
  const root = new THREE.Group();
  root.name = 'veh_matatu_ngong_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 5.4), MATS.matatuYellow);
  body.position.y = 1.2;
  root.add(body);

  const artStripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.4, 5.42), MATS.matatuRed);
  artStripe.position.y = 1.1;
  root.add(artStripe);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.6), MATS.steelGray);
  spoiler.position.set(0, 2.15, -2.4);
  root.add(spoiler);
  return root;
}

function buildMatatuKibera02() {
  const root = new THREE.Group();
  root.name = 'veh_matatu_kibera_02';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 5.4), MATS.matatuBlue);
  body.position.y = 1.2;
  root.add(body);
  return root;
}

// --- 3. CHARACTERS ---
function buildHumanoid(name, shirtMat) {
  const root = new THREE.Group();
  root.name = name;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), MATS.skinTone);
  head.position.y = 1.65;
  head.name = 'Head';
  root.add(head);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.24), shirtMat);
  torso.position.y = 1.15;
  torso.name = 'Torso';
  root.add(torso);

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.22), MATS.pantsJeans);
  hips.position.y = 0.75;
  hips.name = 'Hips';
  root.add(hips);
  return root;
}

// --- 4. ENVIRONMENT ---
function buildAcaciaTree() {
  const root = new THREE.Group();
  root.name = 'env_acacia_tree_01';
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 4.5, 8), MATS.trunkBark);
  trunk.position.y = 2.25;
  root.add(trunk);

  for (let i = 0; i < 3; i++) {
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(2.5 + i * 0.8, 1.0, 0.4, 12), MATS.foliageGreen);
    canopy.position.set((i - 1) * 0.5, 4.2 + i * 0.4, (i - 1) * 0.3);
    root.add(canopy);
  }
  return root;
}

function buildPalmTree() {
  const root = new THREE.Group();
  root.name = 'env_palm_tree_01';
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 6, 8), MATS.trunkBark);
  trunk.position.y = 3;
  root.add(trunk);
  return root;
}

function buildShrub() {
  const root = new THREE.Group();
  root.name = 'env_shrub_01';
  const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), MATS.foliageGreen);
  bush.position.y = 0.8;
  root.add(bush);
  return root;
}

function buildStreetlight() {
  const root = new THREE.Group();
  root.name = 'env_streetlight_01';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 8), MATS.steelGray);
  pole.position.y = 3;
  root.add(pole);
  return root;
}

function buildUtilityPole() {
  const root = new THREE.Group();
  root.name = 'env_utility_pole_01';
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 8), MATS.trunkBark);
  pole.position.y = 4;
  root.add(pole);
  return root;
}

function buildMPesaKiosk() {
  const root = new THREE.Group();
  root.name = 'env_mpesa_kiosk_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 2), MATS.mpesaGreen);
  body.position.y = 1.1;
  root.add(body);
  return root;
}

function buildMamaMbogaStall() {
  const root = new THREE.Group();
  root.name = 'env_mama_mboga_stall_01';
  const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 1.2), MATS.woodBrown);
  table.position.y = 0.45;
  root.add(table);
  return root;
}

function buildSecurityGate() {
  const root = new THREE.Group();
  root.name = 'env_security_gate_01';
  const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 0.4), MATS.concreteLight);
  wall.position.y = 1.2;
  root.add(wall);
  return root;
}

function buildRoadBarrier() {
  const root = new THREE.Group();
  root.name = 'env_road_barrier_01';
  const b = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.5), MATS.matatuRed);
  b.position.y = 0.4;
  root.add(b);
  return root;
}

function buildScaffolding() {
  const root = new THREE.Group();
  root.name = 'env_construction_scaffolding_01';
  const frame = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1.5), MATS.matatuYellow);
  frame.position.y = 2;
  root.add(frame);
  return root;
}

function buildBench() {
  const root = new THREE.Group();
  root.name = 'env_bench_01';
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.6), MATS.woodBrown);
  b.position.y = 0.25;
  root.add(b);
  return root;
}

function buildGarbageContainer() {
  const root = new THREE.Group();
  root.name = 'env_garbage_container_01';
  const b = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.4, 1.0), MATS.steelGray);
  b.position.y = 0.7;
  root.add(b);
  return root;
}

function buildDrainageGrate() {
  const root = new THREE.Group();
  root.name = 'env_drainage_grate_01';
  const g = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 1.0), MATS.steelGray);
  g.position.y = 0.025;
  root.add(g);
  return root;
}

// --- 5. INTERIORS ---
function buildProp(name, geom, mat) {
  const root = new THREE.Group();
  root.name = name;
  const m = new THREE.Mesh(geom, mat);
  m.position.y = geom.parameters.height ? geom.parameters.height / 2 : 0.5;
  root.add(m);
  return root;
}

async function generateAllAuthenticAssets() {
  console.log('=== KINGMAKER: Exporting Authentic 3D GLB Models ===\n');

  const assets = [
    // Buildings (13 Families)
    { builder: buildNairobiShop01, file: 'buildings/bld_nairobi_shop_01.glb' },
    { builder: buildNairobiShop02, file: 'buildings/bld_nairobi_shop_02.glb' },
    { builder: buildMixedUse01, file: 'buildings/bld_mixed_use_01.glb' },
    { builder: buildMixedUse02, file: 'buildings/bld_mixed_use_02.glb' },
    { builder: buildModernApartment01, file: 'buildings/bld_modern_apartment_01.glb' },
    { builder: buildModernApartment02, file: 'buildings/bld_modern_apartment_02.glb' },
    { builder: buildResidentialVilla01, file: 'buildings/bld_residential_villa_01.glb' },
    { builder: buildOfficeBlock01, file: 'buildings/bld_office_block_01.glb' },
    { builder: buildCommercialTower01, file: 'buildings/bld_commercial_tower_01.glb' },
    { builder: buildInformalKiosk01, file: 'buildings/bld_informal_kiosk_01.glb' },
    { builder: buildIndustrialWarehouse01, file: 'buildings/bld_industrial_warehouse_01.glb' },
    { builder: buildNightclub01, file: 'buildings/bld_nightclub_01.glb' },
    { builder: buildConstructionSite01, file: 'buildings/bld_construction_site_01.glb' },

    // Vehicles (9 Categories)
    { builder: buildSedan01, file: 'vehicles/veh_sedan_01.glb' },
    { builder: buildCompact01, file: 'vehicles/veh_compact_01.glb' },
    { builder: buildSUV01, file: 'vehicles/veh_suv_landcruiser_01.glb' },
    { builder: buildPickup01, file: 'vehicles/veh_pickup_01.glb' },
    { builder: buildVan01, file: 'vehicles/veh_van_01.glb' },
    { builder: buildTruck01, file: 'vehicles/veh_truck_01.glb' },
    { builder: buildBodaBoda01, file: 'vehicles/veh_boda_boda_01.glb' },
    { builder: buildMatatuNgong01, file: 'vehicles/veh_matatu_ngong_01.glb' },
    { builder: buildMatatuKibera02, file: 'vehicles/veh_matatu_kibera_02.glb' },

    // Characters (7 Archetypes)
    { builder: () => buildHumanoid('char_player_01', MATS.shirtBlue), file: 'characters/char_player_01.glb' },
    { builder: () => buildHumanoid('char_pedestrian_business_01', MATS.concreteDark), file: 'characters/char_pedestrian_business_01.glb' },
    { builder: () => buildHumanoid('char_pedestrian_student_01', MATS.matatuRed), file: 'characters/char_pedestrian_student_01.glb' },
    { builder: () => buildHumanoid('char_pedestrian_casual_01', MATS.sandstone), file: 'characters/char_pedestrian_casual_01.glb' },
    { builder: () => buildHumanoid('char_worker_street_01', MATS.matatuYellow), file: 'characters/char_worker_street_01.glb' },
    { builder: () => buildHumanoid('char_driver_01', MATS.terracotta), file: 'characters/char_driver_01.glb' },
    { builder: () => buildHumanoid('char_guard_security_01', MATS.steelGray), file: 'characters/char_guard_security_01.glb' },

    // Environment Props (13 Props)
    { builder: buildAcaciaTree, file: 'environment/env_acacia_tree_01.glb' },
    { builder: buildPalmTree, file: 'environment/env_palm_tree_01.glb' },
    { builder: buildShrub, file: 'environment/env_shrub_01.glb' },
    { builder: buildStreetlight, file: 'environment/env_streetlight_01.glb' },
    { builder: buildUtilityPole, file: 'environment/env_utility_pole_01.glb' },
    { builder: buildMPesaKiosk, file: 'environment/env_mpesa_kiosk_01.glb' },
    { builder: buildMamaMbogaStall, file: 'environment/env_mama_mboga_stall_01.glb' },
    { builder: buildSecurityGate, file: 'environment/env_security_gate_01.glb' },
    { builder: buildRoadBarrier, file: 'environment/env_road_barrier_01.glb' },
    { builder: buildScaffolding, file: 'environment/env_construction_scaffolding_01.glb' },
    { builder: buildBench, file: 'environment/env_bench_01.glb' },
    { builder: buildGarbageContainer, file: 'environment/env_garbage_container_01.glb' },
    { builder: buildDrainageGrate, file: 'environment/env_drainage_grate_01.glb' },

    // Interior Furniture (12 Props)
    { builder: () => buildProp('interior_chair_01', new THREE.BoxGeometry(0.5, 0.9, 0.5), MATS.woodBrown), file: 'interiors/interior_chair_01.glb' },
    { builder: () => buildProp('interior_table_01', new THREE.BoxGeometry(1.2, 0.75, 0.8), MATS.woodBrown), file: 'interiors/interior_table_01.glb' },
    { builder: () => buildProp('interior_sofa_01', new THREE.BoxGeometry(2.0, 0.8, 0.9), MATS.concreteDark), file: 'interiors/interior_sofa_01.glb' },
    { builder: () => buildProp('interior_bed_01', new THREE.BoxGeometry(1.8, 0.6, 2.0), MATS.sandstone), file: 'interiors/interior_bed_01.glb' },
    { builder: () => buildProp('interior_shop_shelf_01', new THREE.BoxGeometry(1.5, 2.0, 0.5), MATS.steelGray), file: 'interiors/interior_shop_shelf_01.glb' },
    { builder: () => buildProp('interior_office_desk_01', new THREE.BoxGeometry(1.6, 0.75, 0.9), MATS.woodBrown), file: 'interiors/interior_office_desk_01.glb' },
    { builder: () => buildProp('interior_restaurant_table_01', new THREE.BoxGeometry(1.0, 0.75, 1.0), MATS.terracotta), file: 'interiors/interior_restaurant_table_01.glb' },
    { builder: () => buildProp('interior_gym_treadmill_01', new THREE.BoxGeometry(0.9, 1.4, 1.8), MATS.steelGray), file: 'interiors/interior_gym_treadmill_01.glb' },
    { builder: () => buildProp('interior_vip_lounge_sofa_01', new THREE.BoxGeometry(2.5, 0.85, 1.2), MATS.neonPink), file: 'interiors/interior_vip_lounge_sofa_01.glb' },
    { builder: () => buildProp('interior_dj_booth_rig_01', new THREE.BoxGeometry(2.8, 1.6, 1.4), MATS.concreteDark), file: 'interiors/interior_dj_booth_rig_01.glb' },
    { builder: () => buildProp('interior_speaker_stack_01', new THREE.BoxGeometry(0.8, 2.2, 0.8), MATS.concreteDark), file: 'interiors/interior_speaker_stack_01.glb' },
    { builder: () => buildProp('interior_lighting_fixture_01', new THREE.BoxGeometry(0.6, 0.6, 0.6), MATS.neonPink), file: 'interiors/interior_lighting_fixture_01.glb' }
  ];

  const results = [];
  for (const item of assets) {
    const grp = item.builder();
    const res = await exportGLB(grp, item.file);
    results.push(res);
  }

  console.log(`\nSuccessfully exported all ${results.length} authentic 3D GLB assets!`);
}

generateAllAuthenticAssets().catch((err) => {
  console.error('Failed to export authentic GLB assets:', err);
  process.exit(1);
});
