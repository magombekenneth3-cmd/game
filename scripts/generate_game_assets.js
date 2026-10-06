/**
 * KINGMAKER: Rise of Africa — 3D Asset Pack Generator (ESM)
 * Constructs 45 genuine 3D GLB assets across Buildings, Vehicles, Characters,
 * Environment Props, and Interior Furniture, and exports them as production GLB files.
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
        console.log(`[GLB Export] Saved ${relativePath} (${buffer.length} bytes, ~${Math.round(polyCount)} polys)`);
        resolve({ path: relativePath, size: buffer.length, polys: Math.round(polyCount) });
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

const COLORS = {
  terracotta: 0x9a3412,
  warmBeige: 0xd97706,
  sandstone: 0xd4a373,
  concreteDark: 0x334155,
  concreteLight: 0x94a3b8,
  matatuYellow: 0xfacc15,
  matatuRed: 0xd97706,
  matatuBlue: 0x0284c7,
  mpesaGreen: 0x16a34a,
  glassBlue: 0x38bdf8,
  steelGray: 0x475569,
  woodBrown: 0x78350f,
  corrugatedRoof: 0x475569,
  skinTone: 0x5a3825,
  shirtBlue: 0x1e40af,
  pantsJeans: 0x1e3a8a,
  foliageGreen: 0x15803d,
  trunkBark: 0x451a03
};

// --- BUILDINGS ---
function buildNairobiShop01() {
  const root = new THREE.Group();
  root.name = 'bld_nairobi_shop_01';

  const slab = new THREE.Mesh(new THREE.BoxGeometry(10, 0.4, 12), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark }));
  slab.position.y = 0.2;
  root.add(slab);

  const body = new THREE.Mesh(new THREE.BoxGeometry(9.6, 6, 11.6), new THREE.MeshStandardMaterial({ color: COLORS.terracotta, roughness: 0.6 }));
  body.position.y = 3.4;
  root.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 2, 4), new THREE.MeshStandardMaterial({ color: COLORS.corrugatedRoof, roughness: 0.4 }));
  roof.position.y = 7.4;
  roof.rotation.y = Math.PI / 4;
  root.add(roof);

  const awning = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.3, 1.8), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  awning.position.set(0, 3.2, 5.8);
  root.add(awning);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(8, 0.8, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.mpesaGreen }));
  sign.position.set(0, 3.8, 5.9);
  root.add(sign);

  for (let i = -3; i <= 3; i += 3) {
    const door = new THREE.Mesh(new THREE.BoxGeometry(2, 2.4, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.woodBrown }));
    door.position.set(i, 1.4, 5.85);
    root.add(door);

    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.6, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue, metalness: 0.8 }));
    windowFrame.position.set(i, 4.8, 5.85);
    root.add(windowFrame);
  }

  const tankStand = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 1.5, 6), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  tankStand.position.set(-3, 7.2, -3);
  root.add(tankStand);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 1.8, 12), new THREE.MeshStandardMaterial({ color: COLORS.matatuBlue }));
  tank.position.set(-3, 8.8, -3);
  root.add(tank);

  return root;
}

function buildNairobiShop02() {
  const root = new THREE.Group();
  root.name = 'bld_nairobi_shop_02';

  const body = new THREE.Mesh(new THREE.BoxGeometry(12, 7, 10), new THREE.MeshStandardMaterial({ color: COLORS.sandstone }));
  body.position.y = 3.5;
  root.add(body);

  const balcony = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight }));
  balcony.position.set(0, 3.6, 5.2);
  root.add(balcony);

  const railing = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.8, 0.05), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  railing.position.set(0, 4.15, 5.95);
  root.add(railing);

  for (let x of [-4, 0, 4]) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue }));
    w.position.set(x, 5.2, 5.05);
    root.add(w);
  }
  return root;
}

function buildMixedUse01() {
  const root = new THREE.Group();
  root.name = 'bld_mixed_use_01';

  const height = 14;
  const body = new THREE.Mesh(new THREE.BoxGeometry(14, height, 14), new THREE.MeshStandardMaterial({ color: COLORS.warmBeige, roughness: 0.5 }));
  body.position.y = height / 2;
  root.add(body);

  const groundShops = new THREE.Mesh(new THREE.BoxGeometry(14.2, 3.5, 14.2), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark }));
  groundShops.position.y = 1.75;
  root.add(groundShops);

  for (let floor = 1; floor <= 3; floor++) {
    const y = floor * 3.5 + 1.2;
    const bal = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.3, 1.2), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight }));
    bal.position.set(0, y, 7.3);
    root.add(bal);
  }

  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(4, 0.1, 6), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue, metalness: 0.9 }));
  solarPanel.position.set(2, height + 0.5, 0);
  solarPanel.rotation.x = 0.2;
  root.add(solarPanel);

  return root;
}

function buildMixedUse02() {
  const root = new THREE.Group();
  root.name = 'bld_mixed_use_02';

  const height = 18;
  const body = new THREE.Mesh(new THREE.BoxGeometry(16, height, 14), new THREE.MeshStandardMaterial({ color: COLORS.terracotta }));
  body.position.y = height / 2;
  root.add(body);

  const roofTower = new THREE.Mesh(new THREE.BoxGeometry(5, 3, 5), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark }));
  roofTower.position.set(0, height + 1.5, 0);
  root.add(roofTower);

  return root;
}

function buildModernApartment01() {
  const root = new THREE.Group();
  root.name = 'bld_modern_apartment_01';

  const height = 22;
  const body = new THREE.Mesh(new THREE.BoxGeometry(18, height, 16), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight, roughness: 0.4 }));
  body.position.y = height / 2;
  root.add(body);

  for (let x of [-8.5, -3, 3, 8.5]) {
    const col = new THREE.Mesh(new THREE.BoxGeometry(0.8, height + 0.4, 0.8), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark }));
    col.position.set(x, height / 2, 8.1);
    root.add(col);
  }

  return root;
}

function buildModernApartment02() {
  const root = new THREE.Group();
  root.name = 'bld_modern_apartment_02';

  const height = 28;
  const body = new THREE.Mesh(new THREE.BoxGeometry(20, height, 18), new THREE.MeshStandardMaterial({ color: COLORS.sandstone }));
  body.position.y = height / 2;
  root.add(body);
  return root;
}

function buildResidentialVilla01() {
  const root = new THREE.Group();
  root.name = 'bld_residential_villa_01';

  const wall = new THREE.Mesh(new THREE.BoxGeometry(24, 2.5, 24), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight }));
  wall.position.y = 1.25;
  root.add(wall);

  const house = new THREE.Mesh(new THREE.BoxGeometry(14, 7, 12), new THREE.MeshStandardMaterial({ color: COLORS.warmBeige }));
  house.position.set(0, 3.5, -2);
  root.add(house);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(11, 3, 4), new THREE.MeshStandardMaterial({ color: COLORS.terracotta }));
  roof.position.set(0, 8.5, -2);
  roof.rotation.y = Math.PI / 4;
  root.add(roof);

  return root;
}

function buildOfficeBlock01() {
  const root = new THREE.Group();
  root.name = 'bld_office_block_01';

  const height = 26;
  const glassFacade = new THREE.Mesh(new THREE.BoxGeometry(22, height, 18), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue, metalness: 0.8, roughness: 0.2 }));
  glassFacade.position.y = height / 2;
  root.add(glassFacade);

  return root;
}

function buildCommercialTower01() {
  const root = new THREE.Group();
  root.name = 'bld_commercial_tower_01';

  const height = 42;
  const tower = new THREE.Mesh(new THREE.BoxGeometry(24, height, 24), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue, metalness: 0.85, roughness: 0.15 }));
  tower.position.y = height / 2;
  root.add(tower);

  const spire = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 1.2, 8, 8), new THREE.MeshStandardMaterial({ color: COLORS.steelGray, metalness: 0.9 }));
  spire.position.y = height + 4;
  root.add(spire);

  return root;
}

function buildInformalKiosk01() {
  const root = new THREE.Group();
  root.name = 'bld_informal_kiosk_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(3.5, 2.4, 3), new THREE.MeshStandardMaterial({ color: COLORS.woodBrown }));
  body.position.y = 1.2;
  root.add(body);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(4, 0.15, 3.5), new THREE.MeshStandardMaterial({ color: COLORS.corrugatedRoof }));
  roof.position.set(0, 2.45, 0.2);
  roof.rotation.x = 0.15;
  root.add(roof);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.mpesaGreen }));
  sign.position.set(0, 2.2, 1.55);
  root.add(sign);

  return root;
}

function buildIndustrialWarehouse01() {
  const root = new THREE.Group();
  root.name = 'bld_industrial_warehouse_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(26, 9, 32), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark }));
  body.position.y = 4.5;
  root.add(body);

  const roof = new THREE.Mesh(new THREE.ConeGeometry(20, 4, 4), new THREE.MeshStandardMaterial({ color: COLORS.corrugatedRoof }));
  roof.position.y = 11;
  roof.rotation.y = Math.PI / 4;
  root.add(roof);

  return root;
}

function buildNightclub01() {
  const root = new THREE.Group();
  root.name = 'bld_nightclub_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(18, 8, 20), new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 }));
  body.position.y = 4;
  root.add(body);

  const neonSign = new THREE.Mesh(new THREE.BoxGeometry(10, 1.8, 0.2), new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0xdb2777, emissiveIntensity: 0.8 }));
  neonSign.position.set(0, 6.5, 10.1);
  root.add(neonSign);

  return root;
}

function buildConstructionSite01() {
  const root = new THREE.Group();
  root.name = 'bld_construction_site_01';

  const frame = new THREE.Mesh(new THREE.BoxGeometry(16, 14, 14), new THREE.MeshStandardMaterial({ color: COLORS.concreteDark, wireframe: true }));
  frame.position.y = 7;
  root.add(frame);

  const cranePillar = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 24, 6), new THREE.MeshStandardMaterial({ color: COLORS.matatuYellow }));
  cranePillar.position.set(7, 12, -7);
  root.add(cranePillar);

  return root;
}

// --- VEHICLES ---
function buildSedan01() {
  const root = new THREE.Group();
  root.name = 'veh_sedan_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.8, 4.4), new THREE.MeshStandardMaterial({ color: COLORS.matatuBlue, roughness: 0.3 }));
  body.position.y = 0.7;
  root.add(body);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.75, 2.2), new THREE.MeshStandardMaterial({ color: COLORS.glassBlue, metalness: 0.8 }));
  cabin.position.set(0, 1.45, -0.2);
  root.add(cabin);

  for (let x of [-1.1, 1.1]) {
    for (let z of [-1.4, 1.4]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.28, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.35, z);
      root.add(wheel);
    }
  }
  return root;
}

function buildCompact01() {
  const root = new THREE.Group();
  root.name = 'veh_compact_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.85, 3.6), new THREE.MeshStandardMaterial({ color: COLORS.terracotta }));
  body.position.y = 0.7;
  root.add(body);
  return root;
}

function buildSUV01() {
  const root = new THREE.Group();
  root.name = 'veh_suv_landcruiser_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 4.8), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight }));
  body.position.y = 1.0;
  root.add(body);
  return root;
}

function buildPickup01() {
  const root = new THREE.Group();
  root.name = 'veh_pickup_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.9, 4.6), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  body.position.y = 0.8;
  root.add(body);
  return root;
}

function buildVan01() {
  const root = new THREE.Group();
  root.name = 'veh_van_01';
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.5, 4.8), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
  body.position.y = 1.15;
  root.add(body);
  return root;
}

function buildTruck01() {
  const root = new THREE.Group();
  root.name = 'veh_truck_01';
  const cab = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.2, 2.5), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  cab.position.set(0, 1.6, 2.5);
  root.add(cab);

  const container = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 6), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  container.position.set(0, 1.8, -1.8);
  root.add(container);
  return root;
}

function buildBodaBoda01() {
  const root = new THREE.Group();
  root.name = 'veh_boda_boda_01';

  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 8), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  frame.rotation.x = Math.PI / 2;
  frame.position.y = 0.6;
  root.add(frame);

  const tank = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.7), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  tank.position.set(0, 0.75, 0.2);
  root.add(tank);

  for (let z of [-0.7, 0.7]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16), new THREE.MeshStandardMaterial({ color: 0x000000 }));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(0, 0.3, z);
    root.add(wheel);
  }
  return root;
}

function buildMatatuNgong01() {
  const root = new THREE.Group();
  root.name = 'veh_matatu_ngong_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 5.4), new THREE.MeshStandardMaterial({ color: COLORS.matatuYellow, roughness: 0.3 }));
  body.position.y = 1.2;
  root.add(body);

  const artStripe = new THREE.Mesh(new THREE.BoxGeometry(2.32, 0.4, 5.42), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  artStripe.position.y = 1.1;
  root.add(artStripe);

  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.15, 0.6), new THREE.MeshStandardMaterial({ color: 0x111111 }));
  spoiler.position.set(0, 2.15, -2.4);
  root.add(spoiler);

  for (let x of [-1.2, 1.2]) {
    for (let z of [-1.8, 1.8]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16), new THREE.MeshStandardMaterial({ color: 0x111111 }));
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.4, z);
      root.add(wheel);
    }
  }
  return root;
}

function buildMatatuKibera02() {
  const root = new THREE.Group();
  root.name = 'veh_matatu_kibera_02';

  const body = new THREE.Mesh(new THREE.BoxGeometry(2.3, 1.7, 5.4), new THREE.MeshStandardMaterial({ color: COLORS.matatuBlue }));
  body.position.y = 1.2;
  root.add(body);
  return root;
}

// --- CHARACTERS ---
function buildHumanoid(name, shirtColor) {
  const root = new THREE.Group();
  root.name = name;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 12), new THREE.MeshStandardMaterial({ color: COLORS.skinTone }));
  head.position.y = 1.65;
  head.name = 'Head';
  root.add(head);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.6, 0.24), new THREE.MeshStandardMaterial({ color: shirtColor }));
  torso.position.y = 1.15;
  torso.name = 'Torso';
  root.add(torso);

  const hips = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.22), new THREE.MeshStandardMaterial({ color: COLORS.pantsJeans }));
  hips.position.y = 0.75;
  hips.name = 'Hips';
  root.add(hips);

  for (let side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.6, 0.16), new THREE.MeshStandardMaterial({ color: COLORS.pantsJeans }));
    leg.position.set(side * 0.12, 0.3, 0);
    leg.name = side === -1 ? 'LeftLeg' : 'RightLeg';
    root.add(leg);

    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.55, 0.12), new THREE.MeshStandardMaterial({ color: shirtColor }));
    arm.position.set(side * 0.27, 1.15, 0);
    arm.name = side === -1 ? 'LeftArm' : 'RightArm';
    root.add(arm);
  }
  return root;
}

// --- ENVIRONMENT ---
function buildAcaciaTree() {
  const root = new THREE.Group();
  root.name = 'env_acacia_tree_01';

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.45, 4.5, 8), new THREE.MeshStandardMaterial({ color: COLORS.trunkBark }));
  trunk.position.y = 2.25;
  trunk.rotation.z = 0.1;
  root.add(trunk);

  for (let i = 0; i < 3; i++) {
    const canopy = new THREE.Mesh(new THREE.CylinderGeometry(2.5 + i * 0.8, 1.0, 0.4, 12), new THREE.MeshStandardMaterial({ color: COLORS.foliageGreen, roughness: 0.8 }));
    canopy.position.set((i - 1) * 0.5, 4.2 + i * 0.4, (i - 1) * 0.3);
    root.add(canopy);
  }
  return root;
}

function buildPalmTree() {
  const root = new THREE.Group();
  root.name = 'env_palm_tree_01';

  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.3, 6, 8), new THREE.MeshStandardMaterial({ color: COLORS.trunkBark }));
  trunk.position.y = 3;
  root.add(trunk);

  for (let a = 0; a < 6; a++) {
    const frond = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 2.2), new THREE.MeshStandardMaterial({ color: COLORS.foliageGreen }));
    frond.position.set(0, 6, 0);
    frond.rotation.y = (a * Math.PI) / 3;
    frond.rotation.x = 0.4;
    root.add(frond);
  }
  return root;
}

function buildShrub() {
  const root = new THREE.Group();
  root.name = 'env_shrub_01';
  const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.8, 1), new THREE.MeshStandardMaterial({ color: COLORS.foliageGreen }));
  bush.position.y = 0.8;
  root.add(bush);
  return root;
}

function buildStreetlight() {
  const root = new THREE.Group();
  root.name = 'env_streetlight_01';

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 6, 8), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  pole.position.y = 3;
  root.add(pole);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.08), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  arm.position.set(0.6, 5.9, 0);
  root.add(arm);
  return root;
}

function buildUtilityPole() {
  const root = new THREE.Group();
  root.name = 'env_utility_pole_01';

  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 8, 8), new THREE.MeshStandardMaterial({ color: COLORS.trunkBark }));
  pole.position.y = 4;
  root.add(pole);

  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.12), new THREE.MeshStandardMaterial({ color: COLORS.trunkBark }));
  crossbar.position.set(0, 7.5, 0);
  root.add(crossbar);
  return root;
}

function buildMPesaKiosk() {
  const root = new THREE.Group();
  root.name = 'env_mpesa_kiosk_01';

  const body = new THREE.Mesh(new THREE.BoxGeometry(2, 2.2, 2), new THREE.MeshStandardMaterial({ color: COLORS.mpesaGreen }));
  body.position.y = 1.1;
  root.add(body);

  const sign = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.4, 0.05), new THREE.MeshStandardMaterial({ color: 0xffffff }));
  sign.position.set(0, 2.0, 1.03);
  root.add(sign);
  return root;
}

function buildMamaMbogaStall() {
  const root = new THREE.Group();
  root.name = 'env_mama_mboga_stall_01';

  const table = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.9, 1.2), new THREE.MeshStandardMaterial({ color: COLORS.woodBrown }));
  table.position.y = 0.45;
  root.add(table);

  const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 8), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  umbrella.position.y = 2.4;
  root.add(umbrella);
  return root;
}

function buildSecurityGate() {
  const root = new THREE.Group();
  root.name = 'env_security_gate_01';

  const wall = new THREE.Mesh(new THREE.BoxGeometry(8, 2.4, 0.4), new THREE.MeshStandardMaterial({ color: COLORS.concreteLight }));
  wall.position.y = 1.2;
  root.add(wall);

  const gate = new THREE.Mesh(new THREE.BoxGeometry(3, 2.0, 0.1), new THREE.MeshStandardMaterial({ color: COLORS.steelGray }));
  gate.position.set(0, 1.0, 0);
  root.add(gate);
  return root;
}

function buildRoadBarrier() {
  const root = new THREE.Group();
  root.name = 'env_road_barrier_01';

  const b = new THREE.Mesh(new THREE.BoxGeometry(2, 0.8, 0.5), new THREE.MeshStandardMaterial({ color: COLORS.matatuRed }));
  b.position.y = 0.4;
  root.add(b);
  return root;
}

function buildScaffolding() {
  const root = new THREE.Group();
  root.name = 'env_construction_scaffolding_01';

  const frame = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 1.5), new THREE.MeshStandardMaterial({ color: COLORS.matatuYellow, wireframe: true }));
  frame.position.y = 2;
  root.add(frame);
  return root;
}

// --- INTERIORS ---
function buildProp(name, geom, col) {
  const root = new THREE.Group();
  root.name = name;
  const m = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({ color: col }));
  m.position.y = geom.parameters.height ? geom.parameters.height / 2 : 0.5;
  root.add(m);
  return root;
}

async function generateAllAssets() {
  console.log('=== KINGMAKER: Generating 45 Authentic 3D GLB Assets ===\n');

  const assets = [
    // Buildings
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

    // Vehicles
    { builder: buildSedan01, file: 'vehicles/veh_sedan_01.glb' },
    { builder: buildCompact01, file: 'vehicles/veh_compact_01.glb' },
    { builder: buildSUV01, file: 'vehicles/veh_suv_landcruiser_01.glb' },
    { builder: buildPickup01, file: 'vehicles/veh_pickup_01.glb' },
    { builder: buildVan01, file: 'vehicles/veh_van_01.glb' },
    { builder: buildTruck01, file: 'vehicles/veh_truck_01.glb' },
    { builder: buildBodaBoda01, file: 'vehicles/veh_boda_boda_01.glb' },
    { builder: buildMatatuNgong01, file: 'vehicles/veh_matatu_ngong_01.glb' },
    { builder: buildMatatuKibera02, file: 'vehicles/veh_matatu_kibera_02.glb' },

    // Characters
    { builder: () => buildHumanoid('char_player_01', COLORS.shirtBlue), file: 'characters/char_player_01.glb' },
    { builder: () => buildHumanoid('char_pedestrian_business_01', COLORS.concreteDark), file: 'characters/char_pedestrian_business_01.glb' },
    { builder: () => buildHumanoid('char_pedestrian_student_01', COLORS.matatuRed), file: 'characters/char_pedestrian_student_01.glb' },

    // Environment
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

    // Interiors
    { builder: () => buildProp('interior_chair_01', new THREE.BoxGeometry(0.5, 0.9, 0.5), COLORS.woodBrown), file: 'interiors/interior_chair_01.glb' },
    { builder: () => buildProp('interior_table_01', new THREE.BoxGeometry(1.2, 0.75, 0.8), COLORS.woodBrown), file: 'interiors/interior_table_01.glb' },
    { builder: () => buildProp('interior_sofa_01', new THREE.BoxGeometry(2.0, 0.8, 0.9), COLORS.concreteDark), file: 'interiors/interior_sofa_01.glb' },
    { builder: () => buildProp('interior_bed_01', new THREE.BoxGeometry(1.8, 0.6, 2.0), COLORS.sandstone), file: 'interiors/interior_bed_01.glb' },
    { builder: () => buildProp('interior_shop_shelf_01', new THREE.BoxGeometry(1.5, 2.0, 0.5), COLORS.steelGray), file: 'interiors/interior_shop_shelf_01.glb' },
    { builder: () => buildProp('interior_office_desk_01', new THREE.BoxGeometry(1.6, 0.75, 0.9), COLORS.woodBrown), file: 'interiors/interior_office_desk_01.glb' },
    { builder: () => buildProp('interior_restaurant_table_01', new THREE.BoxGeometry(1.0, 0.75, 1.0), COLORS.terracotta), file: 'interiors/interior_restaurant_table_01.glb' },
    { builder: () => buildProp('interior_gym_treadmill_01', new THREE.BoxGeometry(0.9, 1.4, 1.8), COLORS.steelGray), file: 'interiors/interior_gym_treadmill_01.glb' },
    { builder: () => buildProp('interior_vip_lounge_sofa_01', new THREE.BoxGeometry(2.5, 0.85, 1.2), 0x9333ea), file: 'interiors/interior_vip_lounge_sofa_01.glb' },
    { builder: () => buildProp('interior_dj_booth_rig_01', new THREE.BoxGeometry(2.8, 1.6, 1.4), 0x0f172a), file: 'interiors/interior_dj_booth_rig_01.glb' }
  ];

  const results = [];
  for (const item of assets) {
    const grp = item.builder();
    const res = await exportGLB(grp, item.file);
    results.push(res);
  }

  console.log(`\nSuccessfully exported all ${results.length} GLB assets!`);
}

generateAllAssets().catch((err) => {
  console.error('Failed to generate GLB assets:', err);
  process.exit(1);
});
