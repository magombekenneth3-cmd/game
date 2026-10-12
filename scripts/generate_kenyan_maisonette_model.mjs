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

console.log('=== KINGMAKER: Generating Production-Ready Kenyan Maisonette (bld_maisonette_01.glb) ===\n');

/**
 * Builds the authentic Kenyan Residential Maisonette.
 * Real-world dimensions: 10.0m (W) x 9.5m (H) x 12.0m (D)
 * Origin: Bottom-center (0, 0, 0) of the ground slab.
 */
function buildKenyanMaisonette() {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'bld_maisonette_01';

  // -------------------------------------------------------------
  // 1. PBR MATERIALS
  // -------------------------------------------------------------
  // Plastered masonry wall render (Nairobi warm off-white / light cream)
  const wallMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.80,
    metalness: 0.02,
    name: 'Mat_Maisonette_PlasterWalls'
  });

  // Architectural accent band & mouldings (warm beige / light taupe)
  const accentMat = new THREE.MeshStandardMaterial({
    color: 0xe2d9cc,
    roughness: 0.75,
    metalness: 0.03,
    name: 'Mat_Maisonette_AccentStone'
  });

  // Plinth foundation stone base / damp-proof course (durable quarry stone grey)
  const plinthMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.88,
    metalness: 0.05,
    name: 'Mat_Maisonette_PlinthStone'
  });

  // Terracotta red hipped roof tiles (Kenyan clay tile)
  const roofTileMat = new THREE.MeshStandardMaterial({
    color: 0x991b1b, // Authentic Nairobi red clay tile
    roughness: 0.65,
    metalness: 0.08,
    name: 'Mat_Maisonette_ClayRoofTile'
  });

  // Dark timber fascia board & doors (hardwood teak/mahogany)
  const timberMat = new THREE.MeshStandardMaterial({
    color: 0x3d2817,
    roughness: 0.72,
    metalness: 0.05,
    name: 'Mat_Maisonette_DarkTimber'
  });

  // Concrete floor slabs, porch steps, columns, & balcony floor
  const concreteMat = new THREE.MeshStandardMaterial({
    color: 0xd4d4d8,
    roughness: 0.80,
    metalness: 0.05,
    name: 'Mat_Maisonette_Concrete'
  });

  // Window glass (translucent dielectric)
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x475569,
    roughness: 0.05,
    metalness: 0.0,
    transparent: true,
    opacity: 0.45,
    clearcoat: 0.9,
    name: 'Mat_Maisonette_WindowGlass'
  });

  // Wrought iron burglar grilles & balcony balustrades (black painted steel)
  const wroughtIronMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.35,
    metalness: 0.85,
    name: 'Mat_Maisonette_WroughtIron'
  });

  // Gutter & downspout metal (galvanized zinc sheet)
  const gutterMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.40,
    metalness: 0.80,
    name: 'Mat_Maisonette_GalvanizedGutter'
  });

  // -------------------------------------------------------------
  // 2. GEO_LOD0 (FULL DETAIL GEOMETRY)
  // -------------------------------------------------------------
  const lod0Group = new THREE.Group();
  lod0Group.name = 'Geo_LOD0';

  // --- A. FOUNDATION SLAB & BASE PLINTH ---
  // Main building footprint: 10.0m wide (-5 to +5), 11.2m deep (-5.8 to +5.4), height: 0.25m
  const slabGeo = new THREE.BoxGeometry(10.2, 0.25, 11.4);
  const slabMesh = new THREE.Mesh(slabGeo, concreteMat);
  slabMesh.position.set(0, 0.125, -0.2);
  slabMesh.castShadow = true;
  slabMesh.receiveShadow = true;
  lod0Group.add(slabMesh);

  // Lower stone plinth perimeter course (Y: 0.25 to 0.75)
  const plinthGeo = new THREE.BoxGeometry(10.08, 0.50, 11.28);
  const plinthMesh = new THREE.Mesh(plinthGeo, plinthMat);
  plinthMesh.position.set(0, 0.50, -0.2);
  plinthMesh.castShadow = true;
  plinthMesh.receiveShadow = true;
  lod0Group.add(plinthMesh);

  // --- B. GROUND FLOOR EXTERIOR WALLS (Y: 0.75 to 3.60) ---
  const groundWallGeo = new THREE.BoxGeometry(10.0, 2.85, 11.2);
  const groundWall = new THREE.Mesh(groundWallGeo, wallMat);
  groundWall.name = 'Maisonette_GroundFloorWalls';
  groundWall.position.set(0, 2.175, -0.2);
  groundWall.castShadow = true;
  groundWall.receiveShadow = true;
  lod0Group.add(groundWall);

  // --- C. INTERMEDIATE FLOOR SLAB & STRINGER BAND (Y: 3.55 to 3.75) ---
  // Horizontal architectural band defining the two distinct residential storeys
  const midBandGeo = new THREE.BoxGeometry(10.2, 0.20, 11.4);
  const midBand = new THREE.Mesh(midBandGeo, accentMat);
  midBand.position.set(0, 3.65, -0.2);
  midBand.castShadow = true;
  midBand.receiveShadow = true;
  lod0Group.add(midBand);

  // --- D. FIRST FLOOR (UPPER STOREY) EXTERIOR WALLS (Y: 3.75 to 6.80) ---
  const upperWallGeo = new THREE.BoxGeometry(10.0, 3.05, 11.2);
  const upperWall = new THREE.Mesh(upperWallGeo, wallMat);
  upperWall.name = 'Maisonette_FirstFloorWalls';
  upperWall.position.set(0, 5.275, -0.2);
  upperWall.castShadow = true;
  upperWall.receiveShadow = true;
  lod0Group.add(upperWall);

  // --- E. GROUND FLOOR COVERED ENTRANCE PORCH ---
  // Porch slab extending forward to Z: +6.2, Width: 4.6m (-2.3 to +2.3)
  const porchFloorGeo = new THREE.BoxGeometry(4.8, 0.28, 1.8);
  const porchFloor = new THREE.Mesh(porchFloorGeo, concreteMat);
  porchFloor.position.set(0, 0.14, 5.5);
  porchFloor.castShadow = true;
  porchFloor.receiveShadow = true;
  lod0Group.add(porchFloor);

  // 2 Porch Entrance Steps descending to ground at Z: +6.5
  const step1Geo = new THREE.BoxGeometry(2.4, 0.14, 0.45);
  const step1 = new THREE.Mesh(step1Geo, concreteMat);
  step1.position.set(0, 0.07, 6.5);
  step1.receiveShadow = true;
  lod0Group.add(step1);

  // 2 Square Concrete Columns supporting the first floor balcony
  [-2.1, 2.1].forEach((cx, idx) => {
    // Column base pedestal
    const pedGeo = new THREE.BoxGeometry(0.38, 0.50, 0.38);
    const ped = new THREE.Mesh(pedGeo, plinthMat);
    ped.position.set(cx, 0.45, 6.2);
    ped.castShadow = true;
    lod0Group.add(ped);

    // Column shaft (height 3.0m)
    const colGeo = new THREE.BoxGeometry(0.28, 3.0, 0.28);
    const col = new THREE.Mesh(colGeo, concreteMat);
    col.name = `Maisonette_PorchColumn_${idx}`;
    col.position.set(cx, 2.0, 6.2);
    col.castShadow = true;
    lod0Group.add(col);

    // Column capital
    const capGeo = new THREE.BoxGeometry(0.38, 0.15, 0.38);
    const cap = new THREE.Mesh(capGeo, accentMat);
    cap.position.set(cx, 3.525, 6.2);
    lod0Group.add(cap);
  });

  // --- F. GROUND FLOOR MAIN ENTRANCE DOOR & TIMBER ARCHITRAVE ---
  const doorW = 1.15;
  const doorH = 2.30;
  const doorFrameGeo = new THREE.BoxGeometry(doorW + 0.16, doorH + 0.08, 0.12);
  const doorFrame = new THREE.Mesh(doorFrameGeo, timberMat);
  doorFrame.position.set(0, 0.25 + doorH / 2, 5.39);
  lod0Group.add(doorFrame);

  // Panelled hardwood door leaf
  const doorLeafGeo = new THREE.BoxGeometry(doorW, doorH, 0.06);
  const doorLeaf = new THREE.Mesh(doorLeafGeo, timberMat);
  doorLeaf.name = 'Maisonette_FrontDoor';
  doorLeaf.position.set(0, 0.25 + doorH / 2, 5.41);
  doorLeaf.castShadow = true;
  lod0Group.add(doorLeaf);

  // Door handle knob
  const knobGeo = new THREE.SphereGeometry(0.04, 8, 8);
  const knobMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
  const knob = new THREE.Mesh(knobGeo, knobMat);
  knob.position.set(0.42, 1.30, 5.46);
  lod0Group.add(knob);

  // --- G. FIRST-FLOOR CANTILEVERED BALCONY (Distinct Maisonette Feature) ---
  // Balcony slab extends forward over the porch from Z: +5.3 to Z: +6.4, Width: 4.8m (-2.4 to +2.4)
  const balconySlabGeo = new THREE.BoxGeometry(4.8, 0.22, 1.4);
  const balconySlab = new THREE.Mesh(balconySlabGeo, concreteMat);
  balconySlab.name = 'Maisonette_BalconySlab';
  balconySlab.position.set(0, 3.65, 6.0);
  balconySlab.castShadow = true;
  balconySlab.receiveShadow = true;
  lod0Group.add(balconySlab);

  // Balcony perimeter balustrades / wrought-iron railings (1.05m high)
  const railH = 1.05;
  const railY = 3.76 + railH / 2;

  // Front railing (Width: 4.8m at Z: +6.65)
  const topRailFrontGeo = new THREE.BoxGeometry(4.8, 0.05, 0.05);
  const topRailFront = new THREE.Mesh(topRailFrontGeo, wroughtIronMat);
  topRailFront.position.set(0, 3.76 + railH, 6.65);
  lod0Group.add(topRailFront);

  const botRailFrontGeo = new THREE.BoxGeometry(4.8, 0.04, 0.04);
  const botRailFront = new THREE.Mesh(botRailFrontGeo, wroughtIronMat);
  botRailFront.position.set(0, 3.82, 6.65);
  lod0Group.add(botRailFront);

  // Vertical steel balusters across front (spaced 16cm apart)
  for (let rx = -2.25; rx <= 2.25; rx += 0.16) {
    const balusterGeo = new THREE.CylinderGeometry(0.012, 0.012, railH - 0.08, 6);
    const baluster = new THREE.Mesh(balusterGeo, wroughtIronMat);
    baluster.position.set(rx, railY, 6.65);
    lod0Group.add(baluster);
  }

  // Left & Right side balcony railings (Depth: 1.35m)
  [-2.35, 2.35].forEach((bx) => {
    const topSideGeo = new THREE.BoxGeometry(0.05, 0.05, 1.3);
    const topSide = new THREE.Mesh(topSideGeo, wroughtIronMat);
    topSide.position.set(bx, 3.76 + railH, 6.0);
    lod0Group.add(topSide);

    const botSideGeo = new THREE.BoxGeometry(0.04, 0.04, 1.3);
    const botSide = new THREE.Mesh(botSideGeo, wroughtIronMat);
    botSide.position.set(bx, 3.82, 6.0);
    lod0Group.add(botSide);

    for (let bz = 5.45; bz <= 6.55; bz += 0.18) {
      const balusterGeo = new THREE.CylinderGeometry(0.012, 0.012, railH - 0.08, 6);
      const baluster = new THREE.Mesh(balusterGeo, wroughtIronMat);
      baluster.position.set(bx, railY, bz);
      lod0Group.add(baluster);
    }
  });

  // Balcony Access Double French Doors on first floor
  const bDoorW = 1.60;
  const bDoorH = 2.20;
  const bDoorFrameGeo = new THREE.BoxGeometry(bDoorW + 0.16, bDoorH + 0.08, 0.12);
  const bDoorFrame = new THREE.Mesh(bDoorFrameGeo, timberMat);
  bDoorFrame.position.set(0, 3.76 + bDoorH / 2, 5.39);
  lod0Group.add(bDoorFrame);

  const bDoorLeafGeo = new THREE.BoxGeometry(bDoorW, bDoorH, 0.05);
  const bDoorLeaf = new THREE.Mesh(bDoorLeafGeo, timberMat);
  bDoorLeaf.name = 'Maisonette_BalconyDoors';
  bDoorLeaf.position.set(0, 3.76 + bDoorH / 2, 5.41);
  lod0Group.add(bDoorLeaf);

  // Double door glass panes
  [-0.42, 0.42].forEach((gx) => {
    const glassPaneGeo = new THREE.BoxGeometry(0.55, 1.5, 0.02);
    const glassPane = new THREE.Mesh(glassPaneGeo, glassMat);
    glassPane.position.set(gx, 3.76 + 1.25, 5.44);
    lod0Group.add(glassPane);
  });

  // --- H. WINDOWS: 2-STOREY HIERARCHY WITH GROUND BURGLAR GRILLES ---
  // Window positions: Ground Floor (with heavy burglar bars) & First Floor (with elegant sills/transoms)
  const windowSpecs = [
    // Ground Floor Front (Z = +5.39) - Living Room & Study
    { x: -3.4, y: 2.15, z: 5.39, w: 1.5, h: 1.3, ry: 0, level: 'ground' },
    { x:  3.4, y: 2.15, z: 5.39, w: 1.5, h: 1.3, ry: 0, level: 'ground' },

    // Ground Floor Left (X = -5.02)
    { x: -5.02, y: 2.15, z:  1.5, w: 1.4, h: 1.3, ry: Math.PI / 2, level: 'ground' },
    { x: -5.02, y: 2.15, z: -2.0, w: 1.4, h: 1.3, ry: Math.PI / 2, level: 'ground' },

    // Ground Floor Right (X = +5.02)
    { x: 5.02, y: 2.15, z:  1.5, w: 1.4, h: 1.3, ry: -Math.PI / 2, level: 'ground' },
    { x: 5.02, y: 2.15, z: -2.0, w: 1.4, h: 1.3, ry: -Math.PI / 2, level: 'ground' },

    // Ground Floor Back (Z = -5.79)
    { x: -2.5, y: 2.15, z: -5.79, w: 1.4, h: 1.3, ry: Math.PI, level: 'ground' },
    { x:  2.5, y: 2.15, z: -5.79, w: 1.4, h: 1.3, ry: Math.PI, level: 'ground' },

    // First Floor Front (Z = +5.39) - Master Bedroom Flank Windows
    { x: -3.4, y: 5.25, z: 5.39, w: 1.5, h: 1.3, ry: 0, level: 'upper' },
    { x:  3.4, y: 5.25, z: 5.39, w: 1.5, h: 1.3, ry: 0, level: 'upper' },

    // First Floor Left (X = -5.02)
    { x: -5.02, y: 5.25, z:  1.5, w: 1.4, h: 1.3, ry: Math.PI / 2, level: 'upper' },
    { x: -5.02, y: 5.25, z: -2.0, w: 1.4, h: 1.3, ry: Math.PI / 2, level: 'upper' },

    // First Floor Right (X = +5.02)
    { x: 5.02, y: 5.25, z:  1.5, w: 1.4, h: 1.3, ry: -Math.PI / 2, level: 'upper' },
    { x: 5.02, y: 5.25, z: -2.0, w: 1.4, h: 1.3, ry: -Math.PI / 2, level: 'upper' },

    // First Floor Back (Z = -5.79)
    { x: -2.5, y: 5.25, z: -5.79, w: 1.4, h: 1.3, ry: Math.PI, level: 'upper' },
    { x:  2.5, y: 5.25, z: -5.79, w: 1.4, h: 1.3, ry: Math.PI, level: 'upper' }
  ];

  windowSpecs.forEach((spec, idx) => {
    const winGroup = new THREE.Group();
    winGroup.name = `Maisonette_Window_${spec.level}_${idx}`;
    winGroup.position.set(spec.x, spec.y, spec.z);
    winGroup.rotation.y = spec.ry;

    // 1. Concrete Architrave Frame
    const frameGeo = new THREE.BoxGeometry(spec.w + 0.16, spec.h + 0.16, 0.14);
    const frameMesh = new THREE.Mesh(frameGeo, accentMat);
    winGroup.add(frameMesh);

    // 2. Concrete Window Sill Ledge
    const sillGeo = new THREE.BoxGeometry(spec.w + 0.28, 0.10, 0.24);
    const sillMesh = new THREE.Mesh(sillGeo, accentMat);
    sillMesh.position.set(0, -spec.h / 2 - 0.05, 0.05);
    winGroup.add(sillMesh);

    // 3. Glazed Glass Pane
    const glassGeo = new THREE.BoxGeometry(spec.w, spec.h, 0.03);
    const glassMesh = new THREE.Mesh(glassGeo, glassMat);
    glassMesh.position.z = -0.01;
    winGroup.add(glassMesh);

    // 4. Central Window Mullion
    const mullionGeo = new THREE.BoxGeometry(0.05, spec.h, 0.05);
    const mullion = new THREE.Mesh(mullionGeo, timberMat);
    winGroup.add(mullion);

    // 5. Authentic Kenyan Burglar Grilles on Ground Floor Windows
    if (spec.level === 'ground') {
      const gTop = new THREE.Mesh(new THREE.BoxGeometry(spec.w - 0.04, 0.025, 0.025), wroughtIronMat);
      gTop.position.set(0, spec.h / 2 - 0.04, 0.06);
      winGroup.add(gTop);

      const gBottom = new THREE.Mesh(new THREE.BoxGeometry(spec.w - 0.04, 0.025, 0.025), wroughtIronMat);
      gBottom.position.set(0, -spec.h / 2 + 0.04, 0.06);
      winGroup.add(gBottom);

      const barSpacing = 0.16;
      const numBars = Math.floor(spec.w / barSpacing);
      for (let b = -numBars / 2 + 0.5; b <= numBars / 2 - 0.5; b++) {
        const barGeo = new THREE.CylinderGeometry(0.012, 0.012, spec.h - 0.08, 6);
        const bar = new THREE.Mesh(barGeo, wroughtIronMat);
        bar.position.set(b * barSpacing, 0, 0.06);
        winGroup.add(bar);
      }
    } else {
      // Upper floor: horizontal transom accent bar
      const transomGeo = new THREE.BoxGeometry(spec.w, 0.04, 0.05);
      const transom = new THREE.Mesh(transomGeo, timberMat);
      transom.position.set(0, spec.h * 0.25, 0.02);
      winGroup.add(transom);
    }

    lod0Group.add(winGroup);
  });

  // --- I. AUTHENTIC HIPPED ROOF & EAVES (Y: 6.80 to 9.50) ---
  const roofHeight = 2.70;
  const roofBaseY = 6.80;
  const rW = 5.6;     // Half-width with 0.6m eaves overhang
  const rZF = 6.0;    // Front eaves at Z = +6.0
  const rZB = -6.4;   // Back eaves at Z = -6.4
  const ridgeZF = 1.6;
  const ridgeZB = -3.2;
  const ridgeY = roofBaseY + roofHeight; // 9.50m

  const roofGeo = new THREE.BufferGeometry();
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
  roofMesh.name = 'Maisonette_HippedRoof';
  roofMesh.castShadow = true;
  roofMesh.receiveShadow = true;
  lod0Group.add(roofMesh);

  // Roof Ridge Cap Roll
  const ridgeCapGeo = new THREE.CylinderGeometry(0.12, 0.12, ridgeZF - ridgeZB + 0.3, 8);
  ridgeCapGeo.rotateX(Math.PI / 2);
  const ridgeCap = new THREE.Mesh(ridgeCapGeo, roofTileMat);
  ridgeCap.position.set(0, ridgeY + 0.05, (ridgeZF + ridgeZB) / 2);
  lod0Group.add(ridgeCap);

  // --- J. TIMBER FASCIA BOARDS & EAVES TRIM ---
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

  // --- K. RAINWATER GUTTERS & TWO-STOREY DOWNSPOUTS ---
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

  // 4 Vertical Downspouts (Running full height 6.5m down both storeys)
  const downspoutCorners = [
    { x: -rW + 0.15, z: rZF - 0.15 },
    { x:  rW - 0.15, z: rZF - 0.15 },
    { x: -rW + 0.15, z: rZB + 0.15 },
    { x:  rW - 0.15, z: rZB + 0.15 }
  ];

  downspoutCorners.forEach((c, idx) => {
    const dsGeo = new THREE.CylinderGeometry(0.045, 0.045, gutterY - 0.1, 8);
    const dsMesh = new THREE.Mesh(dsGeo, gutterMat);
    dsMesh.name = `Maisonette_Downspout_${idx}`;
    dsMesh.position.set(c.x, (gutterY - 0.1) / 2 + 0.1, c.z);
    dsMesh.castShadow = true;
    lod0Group.add(dsMesh);

    // Concrete splash shoe stone at base
    const shoeGeo = new THREE.BoxGeometry(0.18, 0.10, 0.30);
    const shoe = new THREE.Mesh(shoeGeo, concreteMat);
    shoe.position.set(c.x, 0.05, c.z + (c.z > 0 ? 0.10 : -0.10));
    lod0Group.add(shoe);
  });

  // --- L. ROOFTOP BLACK ROTO WATER TANK ON REAR STEEL STAND ---
  const tankStandMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.35 });
  const tankMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.40, metalness: 0.1 });

  const tankGroup = new THREE.Group();
  tankGroup.name = 'Maisonette_RooftopWaterTank';
  tankGroup.position.set(-3.2, roofBaseY + 0.4, -3.8);

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

  // Ribbed Tank Body
  const tankBodyGeo = new THREE.CylinderGeometry(0.70, 0.70, 1.3, 14);
  const tankBody = new THREE.Mesh(tankBodyGeo, tankMat);
  tankBody.position.y = 1.20;
  tankBody.castShadow = true;
  tankGroup.add(tankBody);

  // Tank Lid
  const lidGeo = new THREE.CylinderGeometry(0.38, 0.48, 0.16, 12);
  const lid = new THREE.Mesh(lidGeo, tankMat);
  lid.position.y = 1.90;
  tankGroup.add(lid);

  lod0Group.add(tankGroup);

  rootGroup.add(lod0Group);

  // -------------------------------------------------------------
  // 3. GEO_LOD1 (OPTIMIZED SILHOUETTE FOR DISTANCE RENDERING)
  // -------------------------------------------------------------
  const lod1Group = new THREE.Group();
  lod1Group.name = 'Geo_LOD1';

  // Combined 2-storey massing
  const lod1BodyGeo = new THREE.BoxGeometry(10.0, 6.1, 11.2);
  const lod1Body = new THREE.Mesh(lod1BodyGeo, wallMat);
  lod1Body.name = 'Maisonette_LOD1_Body';
  lod1Body.position.set(0, 3.75, -0.2);
  lod1Group.add(lod1Body);

  // Balcony volume
  const lod1BalconyGeo = new THREE.BoxGeometry(4.8, 1.2, 1.4);
  const lod1Balcony = new THREE.Mesh(lod1BalconyGeo, concreteMat);
  lod1Balcony.position.set(0, 4.25, 6.0);
  lod1Group.add(lod1Balcony);

  // Simplified hipped roof mesh
  const lod1Roof = new THREE.Mesh(roofGeo, roofTileMat);
  lod1Roof.name = 'Maisonette_LOD1_Roof';
  lod1Group.add(lod1Roof);

  rootGroup.add(lod1Group);

  // -------------------------------------------------------------
  // 4. COL_BUILDING (LOW-COST CONVEX COLLISION BOX)
  // -------------------------------------------------------------
  const colGeo = new THREE.BoxGeometry(10.4, 9.5, 12.4);
  const colMat = new THREE.MeshBasicMaterial({ wireframe: true });
  const colMesh = new THREE.Mesh(colGeo, colMat);
  colMesh.name = 'Col_Building';
  colMesh.position.set(0, 4.75, 0.1);
  rootGroup.add(colMesh);

  // -------------------------------------------------------------
  // 5. ATTACHMENT SOCKET LOCATORS
  // -------------------------------------------------------------
  const socketEntrance = new THREE.Object3D();
  socketEntrance.name = 'Socket_Entrance';
  socketEntrance.position.set(0, 0.25, 4.8);
  rootGroup.add(socketEntrance);

  const socketPorch = new THREE.Object3D();
  socketPorch.name = 'Socket_Porch';
  socketPorch.position.set(0, 0.0, 6.2);
  rootGroup.add(socketPorch);

  const socketBalcony = new THREE.Object3D();
  socketBalcony.name = 'Socket_Balcony';
  socketBalcony.position.set(0, 3.65, 5.8);
  rootGroup.add(socketBalcony);

  return rootGroup;
}

async function exportToGLB(object, filename) {
  const exporter = new GLTFExporter();
  const filePath = path.join(BUILDINGS_DIR, filename);

  const glbBuffer = await exporter.parseAsync(object, { binary: true, onlyVisible: false });
  fs.writeFileSync(filePath, Buffer.from(glbBuffer));
  const szKb = (glbBuffer.byteLength / 1024).toFixed(1);
  console.log(`✅ Generated: ${filename} (${szKb} KB)`);
  return filePath;
}

async function main() {
  console.log('Building authentic Kenyan 2-storey maisonette 3D hierarchy...');
  const maisonette = buildKenyanMaisonette();

  let meshCount = 0;
  let triCount = 0;
  maisonette.traverse((child) => {
    if (child.isMesh) {
      meshCount++;
      const geo = child.geometry;
      if (geo) {
        triCount += geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
      }
    }
  });

  console.log(`Maisonette Stats: ${meshCount} meshes, ~${Math.round(triCount)} triangles`);
  await exportToGLB(maisonette, 'bld_maisonette_01.glb');
  console.log('\n=== Maisonette Model Successfully Exported to GLB! ===\n');
}

main().catch(console.error);
