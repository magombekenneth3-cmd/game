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
const BUILDINGS_DIR = path.join(ROOT, 'public/assets/models/buildings');

if (!fs.existsSync(BUILDINGS_DIR)) {
  fs.mkdirSync(BUILDINGS_DIR, { recursive: true });
}

console.log('=== KINGMAKER: Generating Production-Ready Kenyan Bungalow (bld_bungalow_01.glb) ===\n');

/**
 * Builds the authentic Kenyan Residential Bungalow.
 * Real-world dimensions: 12.0m (W) x 6.2m (H) x 14.0m (D)
 * Origin: Bottom-center (0, 0, 0) of the ground slab.
 */
function buildKenyanBungalow() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'bld_bungalow_01';

  // -------------------------------------------------------------
  // 1. PBR MATERIALS
  // -------------------------------------------------------------
  // Plastered masonry wall render (Nairobi warm off-white / light ochre)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf1efe7,
    roughness: 0.82,
    metalness: 0.02,
    name: 'Mat_Bungalow_PlasterWalls'
  });

  // Plinth foundation stone base / damp-proof course
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.88,
    metalness: 0.05,
    name: 'Mat_Bungalow_PlinthStone'
  });

  // Terracotta red hipped roof tiles (Kenyan clay tile)
  const roofTileMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Authentic Nairobi red clay tile
    roughness: 0.65,
    metalness: 0.08,
    name: 'Mat_Bungalow_ClayRoofTile'
  });

  // Dark timber fascia board & doors
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.72,
    metalness: 0.05,
    name: 'Mat_Bungalow_DarkTimber'
  });

  // Concrete floor slab, porch steps & pillars
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.80,
    metalness: 0.05,
    name: 'Mat_Bungalow_Concrete'
  });

  // Window glass (translucent dielectric)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x475569,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.45,
    clearcoat: 0.9,
    name: 'Mat_Bungalow_WindowGlass'
  });

  // Wrought iron burglar grilles & rain gutters (black painted steel / zinc)
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.85,
    name: 'Mat_Bungalow_WroughtIron'
  });

  // Gutter & downspout metal (charcoal galvanized sheet)
  const gutterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.40,
    metalness: 0.80,
    name: 'Mat_Bungalow_GalvanizedGutter'
  });

  // -------------------------------------------------------------
  // 2. GEO_LOD0 (FULL DETAIL GEOMETRY)
  // -------------------------------------------------------------
  const lod0Group = new THREE.Group();
  lod0Group.name = 'Geo_LOD0';

  // --- A. FOUNDATION SLAB & BASE PLINTH ---
  // Main building footprint: 12.0m wide (-6 to +6), 11.6m deep (-7 to +4.6), height: 0.25m
  const slabGeo = new THREE.BoxGeometry(12.2, 0.25, 12.0);
  const slabMesh = new THREE.Mesh(slabGeo, concreteMat);
  slabMesh.position.set(0, 0.125, -1.0);
  slabMesh.castShadow = true;
  slabMesh.receiveShadow = true;
  lod0Group.add(slabMesh);

  // Lower stone plinth perimeter course (Y: 0.25 to 0.70)
  const plinthGeo = new THREE.BoxGeometry(12.08, 0.45, 11.88);
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.set(0, 0.475, -1.0);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  lod0Group.add(plinthMesh);

  // --- B. MAIN EXTERIOR WALLS ---
  // Main house walls: 12.0m wide, 11.8m deep, 2.5m high (Y: 0.70 to 3.20)
  const wallGeo = new THREE.BoxGeometry(12.0, 2.5, 11.8);
  const wallMesh = new THREE.Mesh(wallGeo, wallMat);
  wallMesh.name = 'Bungalow_MainWalls';
  wallMesh.position.set(0, 1.95, -1.0);
  wallMesh.castShadow = true;
  wallMesh.receiveShadow = true;
  lod0Group.add(wallMesh);

  // --- C. AUTHENTIC HIPPED ROOF WITH RIDGE AND EAVES OVERHANG ---
  // Roof base at Y = 3.20m, Eaves extend 0.6m beyond walls:
  // Base footprint: 13.2m wide (-6.6 to +6.6), 13.0m deep (-7.5 to +5.5)
  // Ridge is along Z axis from Z = -3.5 to Z = +1.5 at Y = 6.20m (height 3.0m)
  const roofHeight = 3.0;
  const roofBaseY = 3.20;

  // Custom hipped roof geometry
  const roofGeo = new THREE.BufferGeometry();
  // 6 vertices defining hipped roof: 4 eaves corners + 2 ridge ends
  // 0: SW (-6.6, 3.20, +5.5)
  // 1: SE (+6.6, 3.20, +5.5)
  // 2: NE (+6.6, 3.20, -7.5)
  // 3: NW (-6.6, 3.20, -7.5)
  // 4: Ridge Front (0.0, 6.20, +1.8)
  // 5: Ridge Back (0.0, 6.20, -3.8)
  const rW = 6.6;
  const rZF = 5.5;
  const rZB = -7.5;
  const ridgeZF = 1.8;
  const ridgeZB = -3.8;
  const ridgeY = roofBaseY + roofHeight;

  const roofVertices = new Float32Array([
    // South Face (Front hip: 0, 1, 4)
    -rW, roofBaseY, rZF,
     rW, roofBaseY, rZF,
    0.0, ridgeY, ridgeZF,

    // East Face (Trapezoid: 1, 2, 5 and 1, 5, 4)
     rW, roofBaseY, rZF,
     rW, roofBaseY, rZB,
    0.0, ridgeY, ridgeZB,

     rW, roofBaseY, rZF,
    0.0, ridgeY, ridgeZB,
    0.0, ridgeY, ridgeZF,

    // North Face (Back hip: 2, 3, 5)
     rW, roofBaseY, rZB,
    -rW, roofBaseY, rZB,
    0.0, ridgeY, ridgeZB,

    // West Face (Trapezoid: 3, 0, 4 and 3, 4, 5)
    -rW, roofBaseY, rZB,
    -rW, roofBaseY, rZF,
    0.0, ridgeY, ridgeZF,

    -rW, roofBaseY, rZB,
    0.0, ridgeY, ridgeZF,
    0.0, ridgeY, ridgeZB
  ]);

  roofGeo.setAttribute('position', new THREE.BufferAttribute(roofVertices, 3));
  roofGeo.computeVertexNormals();

  const roofMesh = new THREE.Mesh(roofGeo, roofTileMat);
  roofMesh.name = 'Bungalow_HippedRoof';
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  lod0Group.add(roofMesh);

  // Roof Ridge Cap Roll
  const ridgeCapGeo = new THREE.CylinderGeometry(0.12, 0.12, ridgeZF - ridgeZB + 0.3, 8);
  ridgeCapGeo.rotateX(Math.PI / 2);
  const ridgeCap = new THREE.Mesh(ridgeCapGeo, roofTileMat);
  ridgeCap.position.set(0, ridgeY + 0.05, (ridgeZF + ridgeZB) / 2);
  lod0Group.add(ridgeCap);

  // --- D. TIMBER FASCIA BOARDS & EAVES TRIM ---
  // 4 perimeter fascia boards right under the roof eaves
  const fasciaDepth = 0.06;
  const fasciaHeight = 0.22;
  const fY = roofBaseY - fasciaHeight / 2;

  // Front & Back Fascia
  const fasciaFBGeo = new THREE.BoxGeometry(rW * 2 + 0.1, fasciaHeight, fasciaDepth);
  const fasciaFront = new THREE.Mesh(fasciaFBGeo, timberMat);
  fasciaFront.position.set(0, fY, rZF);
  lod0Group.add(fasciaFront);

  const fasciaBack = new THREE.Mesh(fasciaFBGeo, timberMat);
  fasciaBack.position.set(0, fY, rZB);
  lod0Group.add(fasciaBack);

  // Left & Right Fascia
  const fasciaLRGeo = new THREE.BoxGeometry(fasciaDepth, fasciaHeight, (rZF - rZB));
  const fasciaWest = new THREE.Mesh(fasciaLRGeo, timberMat);
  fasciaWest.position.set(-rW, fY, (rZF + rZB) / 2);
  lod0Group.add(fasciaWest);

  const fasciaEast = new THREE.Mesh(fasciaLRGeo, timberMat);
  fasciaEast.position.set(rW, fY, (rZF + rZB) / 2);
  lod0Group.add(fasciaEast);

  // --- E. RAINWATER GUTTERS & DOWNSPOUTS ---
  // Perimeter gutters running along the fascia boards
  const gutterRadius = 0.07;
  const gutterY = fY - 0.08;

  // Front & Back Gutters
  const gutterFBGeo = new THREE.CylinderGeometry(gutterRadius, gutterRadius, rW * 2 + 0.2, 8);
  gutterFBGeo.rotateZ(Math.PI / 2);
  const gutterFront = new THREE.Mesh(gutterFBGeo, gutterMat);
  gutterFront.position.set(0, gutterY, rZF + 0.08);
  lod0Group.add(gutterFront);

  const gutterBack = new THREE.Mesh(gutterFBGeo, gutterMat);
  gutterBack.position.set(0, gutterY, rZB - 0.08);
  lod0Group.add(gutterBack);

  // Left & Right Gutters
  const gutterLRGeo = new THREE.CylinderGeometry(gutterRadius, gutterRadius, (rZF - rZB), 8);
  gutterLRGeo.rotateX(Math.PI / 2);
  const gutterWest = new THREE.Mesh(gutterLRGeo, gutterMat);
  gutterWest.position.set(-rW - 0.08, gutterY, (rZF + rZB) / 2);
  lod0Group.add(gutterWest);

  const gutterEast = new THREE.Mesh(gutterLRGeo, gutterMat);
  gutterEast.position.set(rW + 0.08, gutterY, (rZF + rZB) / 2);
  lod0Group.add(gutterEast);

  // 4 Vertical Downspouts at corners with splash stones
  const downspoutCorners = [
    { x: -rW + 0.15, z: rZF - 0.15 },
    { x:  rW - 0.15, z: rZF - 0.15 },
    { x: -rW + 0.15, z: rZB + 0.15 },
    { x:  rW - 0.15, z: rZB + 0.15 }
  ];

  downspoutCorners.forEach((c, idx) => {
    const dsGeo = new THREE.CylinderGeometry(0.045, 0.045, gutterY - 0.1, 8);
    const dsMesh = new THREE.Mesh(dsGeo, gutterMat);
    dsMesh.name = `Bungalow_Downspout_${idx}`;
    dsMesh.position.set(c.x, (gutterY - 0.1) / 2 + 0.1, c.z);
    dsMesh.castShadow = true;
    lod0Group.add(dsMesh);

    // Splash stone shoe at base
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.10, 0.30);
    const shoe = new THREE.Mesh(shoeGeo, concreteMat);
    shoe.position.set(c.x, 0.05, c.z + (c.z > 0 ? 0.10 : -0.10));
    lod0Group.add(shoe);
  });

  // --- F. FRONT VERANDA / PORCH ---
  // Porch extends from front wall (Z = +4.9) forward to Z = +7.0, Width: 4.8m (-2.4 to +2.4)
  const porchFloorGeo = new THREE.BoxGeometry(5.0, 0.28, 2.4);
  const porchFloor = new THREE.Mesh(porchFloorGeo, concreteMat);
  porchFloor.position.set(0, 0.14, 6.0);
  porchFloor.castShadow = true;
  porchFloor.receiveShadow = true;
  lod0Group.add(porchFloor);

  // Porch Entrance Steps (2 concrete steps descending to ground at Z = +7.4)
  const step1Geo = new THREE.BoxGeometry(2.4, 0.14, 0.5);
  const step1 = new THREE.Mesh(step1Geo, concreteMat);
  step1.position.set(0, 0.07, 7.35);
  step1.receiveShadow = true;
  lod0Group.add(step1);

  // Porch Roof Canopy (pitched forward, supported by pillars)
  const porchRoofGeo = new THREE.BoxGeometry(5.4, 0.22, 2.6);
  const porchRoof = new THREE.Mesh(porchRoofGeo, roofTileMat);
  porchRoof.position.set(0, 3.35, 6.1);
  porchRoof.rotation.x = 0.08; // subtle slope forward
  porchRoof.castShadow = true;
  lod0Group.add(porchRoof);

  // 2 Plastered Concrete Porch Columns (Pillars)
  [-2.2, 2.2].forEach((px, idx) => {
    // Column base pedestal
    const pedGeo = new THREE.BoxGeometry(0.38, 0.50, 0.38);
    const ped = new THREE.Mesh(pedGeo, plinthMat);
    ped.position.set(px, 0.45, 6.95);
    ped.castShadow = true;
    lod0Group.add(ped);

    // Column shaft
    const colGeo = new THREE.BoxGeometry(0.26, 2.55, 0.26);
    const col = new THREE.Mesh(colGeo, concreteMat);
    col.name = `Bungalow_PorchColumn_${idx}`;
    col.position.set(px, 1.95, 6.95);
    col.castShadow = true;
    lod0Group.add(col);

    // Column capital
    const capGeo = new THREE.BoxGeometry(0.36, 0.15, 0.36);
    const cap = new THREE.Mesh(capGeo, concreteMat);
    cap.position.set(px, 3.25, 6.95);
    lod0Group.add(cap);
  });

  // --- G. FRONT ENTRANCE DOOR & TIMBER ARCHITRAVE ---
  // Entrance door at X = 0, Z = +4.92 (in front wall recess)
  const doorW = 1.15;
  const doorH = 2.30;
  const doorFrameGeo = new THREE.BoxGeometry(doorW + 0.16, doorH + 0.08, 0.12);
  const doorFrame = new THREE.Mesh(doorFrameGeo, timberMat);
  doorFrame.position.set(0, 0.25 + doorH / 2, 4.93);
  lod0Group.add(doorFrame);

  // Panelled hardwood door leaf
  const doorLeafGeo = new THREE.BoxGeometry(doorW, doorH, 0.06);
  const doorLeaf = new THREE.Mesh(doorLeafGeo, timberMat);
  doorLeaf.name = 'Bungalow_FrontDoor';
  doorLeaf.position.set(0, 0.25 + doorH / 2, 4.95);
  doorLeaf.castShadow = true;
  lod0Group.add(doorLeaf);

  // Door handle (brass / steel knob)
  const knobGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.set(0.42, 1.30, 5.0);
  lod0Group.add(knob);

  // --- H. PORCH WROUGHT-IRON SECURITY GATE ---
  // Security gate grille across front veranda between columns
  const gateW = 3.8;
  const gateH = 1.3;
  const gateFrameGeo = new THREE.BoxGeometry(gateW, 0.05, 0.05);
  const gateTop = new THREE.Mesh(gateFrameGeo, wroughtIronMat);
  gateTop.position.set(0, 1.45, 6.95);
  lod0Group.add(gateTop);

  const gateBottom = new THREE.Mesh(gateFrameGeo, wroughtIronMat);
  gateBottom.position.set(0, 0.35, 6.95);
  lod0Group.add(gateBottom);

  // Vertical security grille pickets
  for (let gx = -1.75; gx <= 1.75; gx += 0.25) {
    if (Math.abs(gx) < 0.5) continue; // Walkway gap in center
    const barGeo = new THREE.CylinderGeometry(0.015, 0.015, gateH, 6);
    const bar = new THREE.Mesh(barGeo, wroughtIronMat);
    bar.position.set(gx, 0.90, 6.95);
    lod0Group.add(bar);
  }

  // --- I. WINDOWS WITH 3D FRAMES & BURGLAR GRILLES ---
  // Window positions across the bungalow walls
  const windowSpecs = [
    // Front Wall (Z = +4.93)
    { x: -3.8, y: 1.85, z: 4.93, w: 1.6, h: 1.3, ry: 0 },
    { x:  3.8, y: 1.85, z: 4.93, w: 1.6, h: 1.3, ry: 0 },

    // Left Wall (X = -6.02)
    { x: -6.02, y: 1.85, z:  2.0, w: 1.5, h: 1.3, ry: Math.PI / 2 },
    { x: -6.02, y: 1.85, z: -1.8, w: 1.5, h: 1.3, ry: Math.PI / 2 },
    { x: -6.02, y: 1.85, z: -5.0, w: 1.2, h: 1.1, ry: Math.PI / 2 },

    // Right Wall (X = +6.02)
    { x: 6.02, y: 1.85, z:  2.0, w: 1.5, h: 1.3, ry: -Math.PI / 2 },
    { x: 6.02, y: 1.85, z: -1.8, w: 1.5, h: 1.3, ry: -Math.PI / 2 },
    { x: 6.02, y: 1.85, z: -5.0, w: 1.2, h: 1.1, ry: -Math.PI / 2 },

    // Back Wall (Z = -6.92)
    { x: -3.2, y: 1.85, z: -6.92, w: 1.5, h: 1.3, ry: Math.PI },
    { x:  3.2, y: 1.85, z: -6.92, w: 1.5, h: 1.3, ry: Math.PI }
  ];

  windowSpecs.forEach((spec, idx) => {
    const winGroup = new THREE.Group();
    winGroup.name = `Bungalow_Window_${idx}`;
    winGroup.position.set(spec.x, spec.y, spec.z);
    winGroup.rotation.y = spec.ry;

    // 1. Concrete / Timber Architrave Frame (3D protruding border)
    const frameGeo = new THREE.BoxGeometry(spec.w + 0.16, spec.h + 0.16, 0.14);
    const frameMesh = new THREE.Mesh(frameGeo, concreteMat);
    winGroup.add(frameMesh);

    // 2. Concrete Window Sill Ledge (protruding bottom shelf)
    const sillGeo = new THREE.BoxGeometry(spec.w + 0.28, 0.10, 0.24);
    const sillMesh = new THREE.Mesh(sillGeo, concreteMat);
    sillMesh.position.set(0, -spec.h / 2 - 0.05, 0.05);
    winGroup.add(sillMesh);

    // 3. Glazed Glass Pane (recessed in frame)
    const glassGeo = new THREE.BoxGeometry(spec.w, spec.h, 0.03);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = -0.01;
    winGroup.add(glassMesh);

    // 4. Central Window Mullion Bar
    const mullionGeo = new THREE.BoxGeometry(0.05, spec.h, 0.05);
    const mullion = new THREE.Mesh(mullionGeo, timberMat);
    winGroup.add(mullion);

    // 5. Authentic Kenyan Burglar Grille ("Grills") - Steel security bars welded over the opening
    // Outer grille frame
    const gTop = new THREE.Mesh(new THREE.BoxGeometry(spec.w - 0.04, 0.025, 0.025), wroughtIronMat);
    gTop.position.set(0, spec.h / 2 - 0.04, 0.06);
    winGroup.add(gTop);

    const gBottom = new THREE.Mesh(new THREE.BoxGeometry(spec.w - 0.04, 0.025, 0.025), wroughtIronMat);
    gBottom.position.set(0, -spec.h / 2 + 0.04, 0.06);
    winGroup.add(gBottom);

    // Vertical steel burglar grille bars (spaced 15cm apart)
    const barSpacing = 0.18;
    const numBars = Math.floor(spec.w / barSpacing);
    for (let b = -numBars / 2 + 0.5; b <= numBars / 2 - 0.5; b++) {
      const barGeo = new THREE.CylinderGeometry(0.012, 0.012, spec.h - 0.08, 6);
      const bar = new THREE.Mesh(barGeo, wroughtIronMat);
      bar.position.set(b * barSpacing, 0, 0.06);
      winGroup.add(bar);
    }

    lod0Group.add(winGroup);
  });

  // --- J. ROOFTOP BLACK ROTO WATER TANK ON REAR STAND ---
  const tankStandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.40, metalness: 0.1 }); // Classic Black Roto Tank

  const tankGroup = new THREE.Group();
  tankGroup.name = 'Bungalow_RooftopWaterTank';
  tankGroup.position.set(-3.5, roofBaseY + 0.4, -4.5);

  // Steel Stand
  const standBaseGeo = new THREE.BoxGeometry(1.6, 0.1, 1.6);
  const standBase = new THREE.Mesh(standBaseGeo, tankStandMat);
  standBase.position.y = 0.5;
  tankGroup.add(standBase);

  [-0.65, 0.65].forEach(sx => {
    [-0.65, 0.65].forEach(sz => {
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6);
      const leg = new THREE.Mesh(legGeo, tankStandMat);
      leg.position.set(sx, 0.25, sz);
      tankGroup.add(leg);
    });
  });

  // Cylindrical Ribbed Tank Body
  const tankBodyGeo = new THREE.CylinderGeometry(0.65, 0.65, 1.2, 14);
  const tankBody = new THREE.Mesh(tankBodyGeo, tankMat);
  tankBody.position.y = 1.15;
  tankBody.castShadow = true;
  tankGroup.add(tankBody);

  // Tank Lid
  const lidGeo = new THREE.CylinderGeometry(0.35, 0.45, 0.15, 12);
  const lid = new THREE.Mesh(lidGeo, tankMat);
  lid.position.y = 1.80;
  tankGroup.add(lid);

  lod0Group.add(tankGroup);

  rootGroup.add(lod0Group);

  // -------------------------------------------------------------
  // 3. GEO_LOD1 (OPTIMIZED SILHOUETTE FOR DISTANCE RENDERING)
  // -------------------------------------------------------------
  const lod1Group = new THREE.Group();
  lod1Group.name = 'Geo_LOD1';
  lod1Group.visible = false; // Initially hidden; switched on at distance by LOD system

  // Simplified combined walls & plinth
  const lod1WallGeo = new THREE.BoxGeometry(12.0, 3.2, 11.8);
  const lod1Wall = new THREE.Mesh(lod1WallGeo, wallMat);
  lod1Wall.name = 'Bungalow_LOD1_Walls';
  lod1Wall.position.set(0, 1.6, -1.0);
  lod1Group.add(lod1Wall);

  // Simplified hipped roof mesh
  const lod1Roof = new THREE.Mesh(roofGeo, roofTileMat);
  lod1Roof.name = 'Bungalow_LOD1_Roof';
  lod1Group.add(lod1Roof);

  // Simplified porch slab and roof
  const lod1PorchSlab = new THREE.Mesh(porchFloorGeo, concreteMat);
  lod1PorchSlab.position.set(0, 0.14, 6.0);
  lod1Group.add(lod1PorchSlab);

  const lod1PorchRoof = new THREE.Mesh(porchRoofGeo, roofTileMat);
  lod1PorchRoof.position.set(0, 3.35, 6.1);
  lod1PorchRoof.rotation.x = 0.08;
  lod1Group.add(lod1PorchRoof);

  rootGroup.add(lod1Group);

  // -------------------------------------------------------------
  // 4. COL_BUILDING (LOW-COST CONVEX COLLISION BOX)
  // -------------------------------------------------------------
  // Clean bounding collision box covering the solid house structure
  const colGeo = new THREE.BoxGeometry(12.4, 6.2, 14.4);
  const colMat = new THREE.MeshBasicMaterial({ wireframe: true });
  const colMesh = new THREE.Mesh(colGeo, colMat);
  colMesh.name = 'Col_Building';
  colMesh.position.set(0, 3.1, -0.2);
  rootGroup.add(colMesh);

  // -------------------------------------------------------------
  // 5. ATTACHMENT SOCKET LOCATORS
  // -------------------------------------------------------------
  const socketEntrance = new THREE.Object3D();
  socketEntrance.name = 'Socket_Entrance';
  socketEntrance.position.set(0, 0.25, 5.0);
  rootGroup.add(socketEntrance);

  const socketPorch = new THREE.Object3D();
  socketPorch.name = 'Socket_Porch';
  socketPorch.position.set(0, 0.0, 7.35);
  rootGroup.add(socketPorch);

  return rootGroup;
}

async function exportToGLB(object, filename) {
  const exporter = new GLTFExporter();
  const filePath = path.join(BUILDINGS_DIR, filename);

  const glbBuffer = await exporter.parseAsync(object, { binary: true, onlyVisible: false });
  fs.writeFileSync(filePath, Buffer.from(glbBuffer));
  const szKb = (glbBuffer.byteLength / 1024).toFixed(1);
  console.log(`✅ Generated: ${filename} (${szKb} KB)`);

  // Mirror to legacy alias bld_residential_villa_01.glb
  const legacyPath = path.join(BUILDINGS_DIR, 'bld_residential_villa_01.glb');
  fs.writeFileSync(legacyPath, Buffer.from(glbBuffer));
  console.log(`✅ Mirrored to: bld_residential_villa_01.glb`);

  return filePath;
}

async function main() {
  console.log('Building authentic Kenyan bungalow 3D hierarchy...');
  const bungalow = buildKenyanBungalow();

  let meshCount = 0;
  let triCount = 0;
  bungalow.traverse((child) => {
    if (child.isMesh) {
      meshCount++;
      const geo = child.geometry;
      if (geo) {
        triCount += geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
      }
    }
  });

  console.log(`Bungalow Stats: ${meshCount} meshes, ~${Math.round(triCount)} triangles`);
  await exportToGLB(bungalow, 'bld_bungalow_01.glb');
  console.log('\n=== Bungalow Model Successfully Exported to GLB! ===\n');
}

main().catch(console.error);
