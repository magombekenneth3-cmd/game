import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// Setup Node FileReader polyfill for GLTFExporter
globalThis.FileReader = class FileReader {
  constructor() {
    this.readyState = 0;
    this.result = null;
  }
  readAsArrayBuffer(blob) {
    this.readyState = 1;
    blob.arrayBuffer().then(buf => {
      this.readyState = 2;
      this.result = buf;
      if (typeof this.onload === 'function') this.onload({ target: this });
      if (typeof this.onloadend === 'function') this.onloadend({ target: this });
    });
  }
};

const ROOT = process.cwd();
const ENV_DIR = path.join(ROOT, 'public/assets/models/environment');

console.log('=== KINGMAKER: Generating High-Fidelity Nairobi Vegetation Models ===\n');

/**
 * 1. HIGH-FIDELITY JACARANDA STREET TREE (env_jacaranda_tree_01.glb)
 * Characteristic Nairobi flowering purple avenue tree.
 * Features organic curved trunk, spreading limbs, secondary branchlets,
 * and multi-cluster lavender/violet blossom canopy clouds.
 */
function buildJacarandaTree() {
  const treeGroup = new THREE.Group();
  treeGroup.name = 'Jacaranda_Tree_HighFi';

  // Bark material
  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x3d322a,
    roughness: 0.88,
    metalness: 0.05,
    name: 'Jacaranda_Bark'
  });

  // Floral blossom materials (varying shades of Nairobi spring violet/purple)
  const blossomMat1 = new THREE.MeshStandardMaterial({
    color: 0x7c3aed, // Vibrant violet
    roughness: 0.65,
    metalness: 0.0,
    name: 'Jacaranda_Blossom_Violet'
  });
  const blossomMat2 = new THREE.MeshStandardMaterial({
    color: 0x6d28d9, // Deep purple
    roughness: 0.70,
    metalness: 0.0,
    name: 'Jacaranda_Blossom_Deep'
  });
  const blossomMat3 = new THREE.MeshStandardMaterial({
    color: 0x9333ea, // Bright lavender highlight
    roughness: 0.60,
    metalness: 0.0,
    name: 'Jacaranda_Blossom_Lavender'
  });

  // Green bipinnate foliage material
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x166534, // Dark forest emerald green
    roughness: 0.75,
    metalness: 0.0,
    name: 'Jacaranda_Leaf_Green'
  });

  // --- TRUNK & BRANCH SKELETON ---
  // Root flare
  const rootGeo = new THREE.CylinderGeometry(0.38, 0.52, 0.6, 10);
  const rootMesh = new THREE.Mesh(rootGeo, barkMat);
  rootMesh.position.y = 0.3;
  rootMesh.castShadow = true;
  treeGroup.add(rootMesh);

  // Lower main trunk
  const trunk1Geo = new THREE.CylinderGeometry(0.32, 0.38, 1.6, 10);
  const trunk1 = new THREE.Mesh(trunk1Geo, barkMat);
  trunk1.position.set(0.04, 1.3, -0.03);
  trunk1.rotation.z = -0.05;
  trunk1.castShadow = true;
  treeGroup.add(trunk1);

  // Upper main trunk (curves slightly before branching)
  const trunk2Geo = new THREE.CylinderGeometry(0.25, 0.32, 1.4, 10);
  const trunk2 = new THREE.Mesh(trunk2Geo, barkMat);
  trunk2.position.set(0.12, 2.7, 0.02);
  trunk2.rotation.z = 0.08;
  trunk2.rotation.x = -0.04;
  trunk2.castShadow = true;
  treeGroup.add(trunk2);

  // 4 Primary spreading limbs (radiating outward and upward)
  const primaryLimbs = [
    { x: -0.6, y: 3.6, z: 0.4, rotX: 0.25, rotY: 0.8, rotZ: -0.45, len: 1.8, r: 0.16 },
    { x: 0.7, y: 3.8, z: 0.3, rotX: 0.18, rotY: -0.9, rotZ: 0.48, len: 2.0, r: 0.17 },
    { x: 0.2, y: 3.9, z: -0.7, rotX: -0.45, rotY: 0.1, rotZ: 0.12, len: 1.9, r: 0.16 },
    { x: -0.4, y: 4.1, z: -0.5, rotX: -0.35, rotY: 2.4, rotZ: -0.38, len: 1.7, r: 0.15 }
  ];

  primaryLimbs.forEach((limb, idx) => {
    const limbGeo = new THREE.CylinderGeometry(limb.r * 0.75, limb.r, limb.len, 8);
    const limbMesh = new THREE.Mesh(limbGeo, barkMat);
    limbMesh.name = `Jacaranda_Limb_${idx}`;
    limbMesh.position.set(limb.x, limb.y, limb.z);
    limbMesh.rotation.set(limb.rotX, limb.rotY, limb.rotZ);
    limbMesh.castShadow = true;
    treeGroup.add(limbMesh);
  });

  // Secondary sub-branches
  const subBranches = [
    { x: -1.3, y: 4.5, z: 0.8, rx: 0.1, rz: -0.5, len: 1.3, r: 0.10 },
    { x: 1.4, y: 4.7, z: 0.6, rx: 0.2, rz: 0.55, len: 1.4, r: 0.11 },
    { x: 0.5, y: 4.8, z: -1.3, rx: -0.55, rz: 0.2, len: 1.3, r: 0.10 },
    { x: -0.9, y: 4.9, z: -1.0, rx: -0.4, rz: -0.45, len: 1.2, r: 0.09 },
    { x: 0.1, y: 4.8, z: 0.2, rx: 0.05, rz: 0.08, len: 1.5, r: 0.12 }
  ];

  subBranches.forEach((sub, idx) => {
    const subGeo = new THREE.CylinderGeometry(sub.r * 0.6, sub.r, sub.len, 6);
    const subMesh = new THREE.Mesh(subGeo, barkMat);
    subMesh.name = `Jacaranda_SubBranch_${idx}`;
    subMesh.position.set(sub.x, sub.y, sub.z);
    subMesh.rotation.set(sub.rx, 0, sub.rz);
    subMesh.castShadow = true;
    treeGroup.add(subMesh);
  });

  // --- NATURAL VOLUMETRIC CANOPY CLOUDS (14 clusters forming an organic spreading crown) ---
  const canopyClusters = [
    // Central peak
    { pos: [0.0, 5.8, 0.0], scale: [1.8, 1.2, 1.8], mat: blossomMat1, name: 'Canopy_Crown_Center' },
    { pos: [0.3, 6.3, -0.2], scale: [1.4, 0.9, 1.4], mat: blossomMat3, name: 'Canopy_Top_Highlight' },

    // North-East quadrant
    { pos: [1.5, 5.2, 0.8], scale: [1.7, 1.1, 1.6], mat: blossomMat2, name: 'Canopy_NE_Mid' },
    { pos: [2.1, 4.8, 0.4], scale: [1.3, 0.8, 1.3], mat: blossomMat1, name: 'Canopy_NE_Outer' },
    { pos: [1.1, 4.5, 0.9], scale: [1.1, 0.8, 1.1], mat: leafMat, name: 'Canopy_NE_GreenInterior' },

    // North-West quadrant
    { pos: [-1.4, 5.1, 0.9], scale: [1.8, 1.2, 1.6], mat: blossomMat1, name: 'Canopy_NW_Mid' },
    { pos: [-2.0, 4.7, 0.5], scale: [1.2, 0.8, 1.2], mat: blossomMat3, name: 'Canopy_NW_Outer' },
    { pos: [-1.0, 4.4, 0.7], scale: [1.1, 0.7, 1.1], mat: leafMat, name: 'Canopy_NW_GreenInterior' },

    // South-East quadrant
    { pos: [1.3, 5.3, -1.1], scale: [1.6, 1.0, 1.6], mat: blossomMat1, name: 'Canopy_SE_Mid' },
    { pos: [1.8, 4.9, -1.5], scale: [1.2, 0.7, 1.2], mat: blossomMat2, name: 'Canopy_SE_Outer' },

    // South-West quadrant
    { pos: [-1.2, 5.4, -1.0], scale: [1.7, 1.1, 1.7], mat: blossomMat2, name: 'Canopy_SW_Mid' },
    { pos: [-1.7, 5.0, -1.4], scale: [1.3, 0.8, 1.3], mat: blossomMat3, name: 'Canopy_SW_Outer' },
    { pos: [-0.6, 4.6, -1.1], scale: [1.0, 0.7, 1.0], mat: leafMat, name: 'Canopy_SW_GreenInterior' },

    // Underside foliage accent
    { pos: [0.1, 4.3, 0.1], scale: [1.4, 0.8, 1.4], mat: leafMat, name: 'Canopy_Underside_Foliage' }
  ];

  canopyClusters.forEach((c) => {
    // 14-sided geodesic canopy blob with sculpted deformation
    const geo = new THREE.IcosahedronGeometry(1.0, 1);
    const posAttr = geo.attributes.position;
    // Add subtle organic irregularity to canopy vertices
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const noise = 1.0 + Math.sin(vx * 3.5 + vy * 4.2) * 0.12 + Math.cos(vz * 3.1) * 0.08;
      posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, c.mat);
    mesh.name = c.name;
    mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
    mesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    treeGroup.add(mesh);
  });

  return treeGroup;
}

/**
 * 2. HIGH-FIDELITY KENYAN UMBRELLA ACACIA (env_acacia_tree_01.glb)
 * Authentic African highland umbrella acacia (Vachellia tortilis).
 * Features gnarled tapering trunk, wide radial limb arms, underside branch framework,
 * and tiered flat horizontal canopy layers.
 */
function buildAcaciaTree() {
  const treeGroup = new THREE.Group();
  treeGroup.name = 'Acacia_Umbrella_Tree_HighFi';

  const barkMat = new THREE.MeshStandardMaterial({
    color: 0x422f22, // Deep fibrous umber bark
    roughness: 0.90,
    metalness: 0.05,
    name: 'Acacia_Bark'
  });

  // Rich savanna acacia foliage materials
  const foliageMatTop = new THREE.MeshStandardMaterial({
    color: 0x2e7d32, // Sunlit savanna acacia foliage
    roughness: 0.70,
    metalness: 0.0,
    name: 'Acacia_Foliage_Sunlit'
  });
  const foliageMatMid = new THREE.MeshStandardMaterial({
    color: 0x1b5e20, // Deep canopy green
    roughness: 0.75,
    metalness: 0.0,
    name: 'Acacia_Foliage_Deep'
  });
  const foliageMatUnderside = new THREE.MeshStandardMaterial({
    color: 0x14532d, // Shaded under-canopy
    roughness: 0.85,
    metalness: 0.0,
    name: 'Acacia_Foliage_Shaded'
  });

  // --- TRUNK SKELETON ---
  const trunkBaseGeo = new THREE.CylinderGeometry(0.36, 0.48, 1.2, 10);
  const trunkBase = new THREE.Mesh(trunkBaseGeo, barkMat);
  trunkBase.position.y = 0.6;
  trunkBase.castShadow = true;
  treeGroup.add(trunkBase);

  // Gnarled mid-trunk with organic bend
  const trunkMidGeo = new THREE.CylinderGeometry(0.28, 0.36, 1.6, 10);
  const trunkMid = new THREE.Mesh(trunkMidGeo, barkMat);
  trunkMid.position.set(0.08, 1.9, 0.05);
  trunkMid.rotation.z = -0.09;
  trunkMid.rotation.x = 0.06;
  trunkMid.castShadow = true;
  treeGroup.add(trunkMid);

  // Upper trunk crotch where umbrella arms spread
  const trunkUpperGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.8, 10);
  const trunkUpper = new THREE.Mesh(trunkUpperGeo, barkMat);
  trunkUpper.position.set(0.14, 3.0, 0.08);
  trunkUpper.castShadow = true;
  treeGroup.add(trunkUpper);

  // 6 Wide spreading radial branch arms (creating authentic umbrella armature)
  const branchArms = [
    { angle: 0, rad: 2.8, yBase: 3.2, yEnd: 4.8, r: 0.16 },
    { angle: Math.PI / 3, rad: 3.2, yBase: 3.3, yEnd: 5.0, r: 0.17 },
    { angle: (2 * Math.PI) / 3, rad: 2.7, yBase: 3.2, yEnd: 4.7, r: 0.15 },
    { angle: Math.PI, rad: 3.0, yBase: 3.3, yEnd: 4.9, r: 0.16 },
    { angle: (4 * Math.PI) / 3, rad: 3.3, yBase: 3.4, yEnd: 5.1, r: 0.17 },
    { angle: (5 * Math.PI) / 3, rad: 2.9, yBase: 3.2, yEnd: 4.8, r: 0.15 }
  ];

  branchArms.forEach((b, idx) => {
    const cos = Math.cos(b.angle);
    const sin = Math.sin(b.angle);

    const armLen = Math.hypot(b.rad, b.yEnd - b.yBase);
    const armGeo = new THREE.CylinderGeometry(b.r * 0.5, b.r, armLen, 8);
    const armMesh = new THREE.Mesh(armGeo, barkMat);
    armMesh.name = `Acacia_BranchArm_${idx}`;

    armMesh.position.set(0.14 + (cos * b.rad) / 2, (b.yBase + b.yEnd) / 2, 0.08 + (sin * b.rad) / 2);
    // Orient along direction vector
    const dir = new THREE.Vector3(cos * b.rad, b.yEnd - b.yBase, sin * b.rad).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    armMesh.setRotationFromQuaternion(quat);
    armMesh.castShadow = true;
    treeGroup.add(armMesh);

    // Lateral secondary twigs under the canopy flat
    const twigGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.2, 6);
    const twig = new THREE.Mesh(twigGeo, barkMat);
    twig.position.set(0.14 + cos * (b.rad * 0.8), b.yEnd - 0.2, 0.08 + sin * (b.rad * 0.8));
    twig.rotation.set(0.3 * sin, b.angle + Math.PI / 4, 0.3 * cos);
    twig.castShadow = true;
    treeGroup.add(twig);
  });

  // --- TIERED FLAT-TOPPED UMBRELLA CANOPY SHELVES ---
  // Layer 1: Lower tier foliage shelf (Z = 4.2m)
  const lowerShelfGeo = new THREE.CylinderGeometry(2.4, 0.8, 0.45, 14);
  const lowerShelf = new THREE.Mesh(lowerShelfGeo, foliageMatUnderside);
  lowerShelf.position.set(-0.3, 4.3, 0.4);
  lowerShelf.castShadow = true;
  treeGroup.add(lowerShelf);

  // Layer 2: Main broad middle shelf (Z = 4.9m, diameter ~ 6.8m)
  const midShelfGeo = new THREE.CylinderGeometry(3.4, 1.6, 0.55, 16);
  const midShelf = new THREE.Mesh(midShelfGeo, foliageMatMid);
  midShelf.position.set(0.2, 5.0, 0.1);
  midShelf.castShadow = true;
  treeGroup.add(midShelf);

  // Layer 3: Upper flat umbrella crown (Z = 5.5m, diameter ~ 7.8m)
  const topShelfGeo = new THREE.CylinderGeometry(3.9, 2.2, 0.40, 16);
  const topShelf = new THREE.Mesh(topShelfGeo, foliageMatTop);
  topShelf.position.set(0.1, 5.5, -0.1);
  topShelf.castShadow = true;
  topShelf.receiveShadow = true;
  treeGroup.add(topShelf);

  // Top gentle crown cap (soft sunlit foliage)
  const capGeo = new THREE.CylinderGeometry(2.8, 3.6, 0.25, 16);
  const cap = new THREE.Mesh(capGeo, foliageMatTop);
  cap.position.set(0.15, 5.75, -0.05);
  cap.castShadow = true;
  treeGroup.add(cap);

  return treeGroup;
}

/**
 * 3. HIGH-FIDELITY BOUGAINVILLEA SIDEWALK PLANTER (env_bougainvillea_planter_01.glb)
 * Modern Nairobi architectural concrete planter with rich overflowing bougainvillea shrub.
 * Features cast concrete box, rich dark soil, dense foliage, and vibrant magenta/fuchsia flower bracts.
 */
function buildBougainvilleaPlanter() {
  const planterGroup = new THREE.Group();
  planterGroup.name = 'Bougainvillea_Planter_HighFi';

  // Architectural precast concrete planter box material
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0x475569, // Slate architectural concrete
    roughness: 0.65,
    metalness: 0.10,
    name: 'Planter_Concrete'
  });

  const soilMat = new THREE.MeshStandardMaterial({
    color: 0x78350f, // Reddish Nairobi laterite soil
    roughness: 0.95,
    metalness: 0.0,
    name: 'Planter_Soil'
  });

  // Bougainvillea vibrant floral materials
  const magentaMat = new THREE.MeshStandardMaterial({
    color: 0xd946ef, // Vivid fuchsia-magenta bracts
    roughness: 0.55,
    metalness: 0.0,
    name: 'Bougainvillea_Magenta'
  });
  const darkMagentaMat = new THREE.MeshStandardMaterial({
    color: 0xa21caf, // Deep violet-magenta bracts
    roughness: 0.60,
    metalness: 0.0,
    name: 'Bougainvillea_DeepMagenta'
  });
  const leafMat = new THREE.MeshStandardMaterial({
    color: 0x14532d, // Glossy deep green foliage
    roughness: 0.65,
    metalness: 0.0,
    name: 'Bougainvillea_Leaves'
  });

  // Concrete Planter Box (2.4m length x 0.9m width x 0.45m height)
  const boxGeo = new THREE.BoxGeometry(2.4, 0.45, 0.9);
  const boxMesh = new THREE.Mesh(boxGeo, concreteMat);
  boxMesh.position.y = 0.225;
  boxMesh.castShadow = true;
  boxMesh.receiveShadow = true;
  planterGroup.add(boxMesh);

  // Top soil bed
  const soilGeo = new THREE.BoxGeometry(2.2, 0.05, 0.7);
  const soilMesh = new THREE.Mesh(soilGeo, soilMat);
  soilMesh.position.y = 0.44;
  planterGroup.add(soilMesh);

  // Dense mounded shrubbery with overflowing edges (12 floral/leaf puffs)
  const shrubClusters = [
    // Center mound
    { pos: [0.0, 0.85, 0.0], scale: [0.75, 0.50, 0.65], mat: magentaMat },
    { pos: [0.2, 1.05, -0.05], scale: [0.55, 0.40, 0.50], mat: darkMagentaMat },
    { pos: [-0.3, 0.75, 0.1], scale: [0.60, 0.45, 0.55], mat: leafMat },

    // Left mound
    { pos: [-0.7, 0.80, 0.05], scale: [0.70, 0.48, 0.60], mat: magentaMat },
    { pos: [-0.9, 0.95, -0.05], scale: [0.50, 0.38, 0.45], mat: darkMagentaMat },
    { pos: [-1.15, 0.65, 0.15], scale: [0.50, 0.40, 0.45], mat: leafMat }, // Overflowing lip left
    { pos: [-1.05, 0.55, -0.2], scale: [0.45, 0.35, 0.40], mat: magentaMat },

    // Right mound
    { pos: [0.7, 0.82, -0.05], scale: [0.70, 0.48, 0.60], mat: darkMagentaMat },
    { pos: [0.9, 0.98, 0.05], scale: [0.55, 0.40, 0.50], mat: magentaMat },
    { pos: [1.15, 0.65, -0.15], scale: [0.50, 0.40, 0.45], mat: leafMat }, // Overflowing lip right
    { pos: [1.05, 0.55, 0.2], scale: [0.45, 0.35, 0.40], mat: magentaMat },

    // Front cascading drape
    { pos: [0.1, 0.55, 0.42], scale: [0.60, 0.35, 0.35], mat: magentaMat }
  ];

  shrubClusters.forEach((sc, idx) => {
    const geo = new THREE.IcosahedronGeometry(0.7, 1);
    const posAttr = geo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const vx = posAttr.getX(i);
      const vy = posAttr.getY(i);
      const vz = posAttr.getZ(i);
      const noise = 1.0 + Math.sin(vx * 4.0 + vy * 5.0) * 0.15;
      posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
    }
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, sc.mat);
    mesh.name = `Bougainvillea_Cluster_${idx}`;
    mesh.position.set(sc.pos[0], sc.pos[1], sc.pos[2]);
    mesh.scale.set(sc.scale[0], sc.scale[1], sc.scale[2]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    planterGroup.add(mesh);
  });

  return planterGroup;
}

// Export functions to GLB
async function exportToGLB(object, filename) {
  const exporter = new GLTFExporter();
  const filePath = path.join(ENV_DIR, filename);

  const glbBuffer = await exporter.parseAsync(object, { binary: true });
  fs.writeFileSync(filePath, Buffer.from(glbBuffer));
  console.log(`✅ Generated: ${filename} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

async function main() {
  console.log('1. Building and exporting env_jacaranda_tree_01.glb...');
  const jacaranda = buildJacarandaTree();
  await exportToGLB(jacaranda, 'env_jacaranda_tree_01.glb');

  console.log('2. Building and exporting env_acacia_tree_01.glb...');
  const acacia = buildAcaciaTree();
  await exportToGLB(acacia, 'env_acacia_tree_01.glb');

  console.log('3. Building and exporting env_bougainvillea_planter_01.glb...');
  const bougainvillea = buildBougainvilleaPlanter();
  await exportToGLB(bougainvillea, 'env_bougainvillea_planter_01.glb');

  console.log('\n=== All High-Fidelity Nairobi Vegetation Models Generated Successfully! ===\n');
}

main().catch(console.error);
