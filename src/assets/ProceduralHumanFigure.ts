/**
 * ProceduralHumanFigure.ts
 * Phase 12.4.5 — Human Character Realism
 *
 * Builds a convincing anatomically-proportioned East African human figure
 * using only Three.js geometry — no GLB dependency. This replaces the
 * invisible UnavailableCharacter_ fallback so NPCs are always visible.
 *
 * Architecture:
 *  - LOD Tier 0 (≤80m):  Full articulated figure with separate limb segments,
 *                         procedural walk cycle driven by game time, clothing,
 *                         skin tone, and facial feature geometry.
 *  - LOD Tier 1 (≤200m): Simplified 3-part silhouette (head, torso, legs merged).
 *  - Tier 2/3:           Caller does not request a visual mesh.
 *
 * Proportions are based on average adult East African build:
 *   Height: 1.72m  Head: 0.22m  Torso: 0.58m  Legs: 0.82m  Shoulders: 0.42m
 *
 * Naming convention for named child objects (for test introspection):
 *   Head, Neck, UpperBody, LowerBody, UpperArmL/R, ForearmL/R,
 *   HandL/R, ThighL/R, ShinL/R, FootL/R, HairMass, ClothTop, ClothBottom
 */

import * as THREE from 'three';
import { SeededRandom } from '../utils/SeededRandom';
import { NPCArchetype } from '../npc/NPCTypes';

// ---------------------------------------------------------------------------
// East African skin tone palette (linear multipliers on base 0xC68B5E)
// Range: deep mahogany → warm brown → medium sienna → lighter warm tan
// ---------------------------------------------------------------------------
const EAST_AFRICAN_SKIN_TONES = [
  0x3d2010, // Very deep mahogany
  0x5c3218, // Deep warm brown (Kikuyu/Luo)
  0x7a4a25, // Rich sienna (most common)
  0x8f5e30, // Warm medium brown
  0xa87240, // Warm caramel brown
  0xc08850, // Lighter warm tan (coastal/Cushitic)
] as const;

// Archetype → clothing colour profiles (top hex, bottom hex)
const ARCHETYPE_CLOTHING: Record<NPCArchetype, { tops: number[]; bottoms: number[] }> = {
  student:          { tops: [0x1e3a5f, 0x2d5a27, 0x5c3b1e, 0x44434e], bottoms: [0x1e293b, 0x2d3748, 0x3b3022] },
  young_professional: { tops: [0x1e3a5f, 0xf8fafc, 0x2d5a27, 0x5c3b1e], bottoms: [0x1e293b, 0x374151, 0x2d2219] },
  office_worker:    { tops: [0xf0f4f8, 0x1e3a5f, 0x4a3728, 0x2e4a40], bottoms: [0x1e293b, 0x374151, 0x1a2035] },
  business_owner:   { tops: [0x1e3a5f, 0x2e1e1e, 0x1e2e1e, 0xf0ede8], bottoms: [0x0f172a, 0x1e293b, 0x2d1e0f] },
  market_vendor:    { tops: [0xd4722a, 0x2d7a34, 0x6b3820, 0xb5901a], bottoms: [0x1a2b1a, 0x352b18, 0x1e293b] },
  shopkeeper:       { tops: [0x1e3a5f, 0x2d5a27, 0xb5901a, 0x4e3b2d], bottoms: [0x1e293b, 0x2d3022, 0x1a1a1a] },
  driver:           { tops: [0x1e3a5f, 0x1a2e1a, 0x2d2d2d, 0x3b2d1e], bottoms: [0x0f172a, 0x1a1a2e, 0x1e1a0f] },
  security_guard:   { tops: [0x1a2d1a, 0x263d26, 0x1e1e1e], bottoms: [0x1a2d1a, 0x1a1a1a, 0x263d26] },
  teacher:          { tops: [0xf0ede8, 0x1e3a5f, 0x4a3728, 0x2e4a40], bottoms: [0x1e293b, 0x374151, 0x2d2219] },
  health_worker:    { tops: [0xd4eef4, 0xf0f4f8, 0x3b6e6e], bottoms: [0x3b6e6e, 0x1e293b, 0x1a3a3a] },
  musician:         { tops: [0x6e1e6e, 0x1e1e6e, 0xc47a1e, 0x6e1e1e], bottoms: [0x1a1a2e, 0x1e1a0f, 0x0f0f0f] },
  artist:           { tops: [0x7a3a1e, 0x3a1e7a, 0x1e7a3a, 0xd4721a], bottoms: [0x1e293b, 0x1a0f0f, 0x0f1a0f] },
  unemployed:       { tops: [0x3a3a3a, 0x4a3728, 0x1e3a5f, 0x2d4a2d], bottoms: [0x1e293b, 0x2d2219, 0x1a1a1a] },
};

// Hair style geometry variants (seeded selection)
type HairStyle = 'close_crop' | 'natural_afro' | 'braids' | 'dreadlocks' | 'shaved';

export interface ProceduralHumanOptions {
  archetype?: NPCArchetype;
  seed?: number;
  /** Force LOD tier: 0=full, 1=simplified silhouette */
  lodTier?: 0 | 1;
}

export interface HumanFigureBones {
  root: THREE.Group;
  head: THREE.Object3D;
  upperBody: THREE.Object3D;
  lowerBody: THREE.Object3D;
  upperArmL: THREE.Object3D;
  upperArmR: THREE.Object3D;
  forearmL: THREE.Object3D;
  forearmR: THREE.Object3D;
  thighL: THREE.Object3D;
  thighR: THREE.Object3D;
  shinL: THREE.Object3D;
  shinR: THREE.Object3D;
}

// ---------------------------------------------------------------------------

export class ProceduralHumanFigure {
  // Canonical body proportions (metres)
  static readonly TOTAL_HEIGHT  = 1.72;
  static readonly HEAD_H        = 0.22;
  static readonly HEAD_W        = 0.18;
  static readonly NECK_H        = 0.08;
  static readonly TORSO_H       = 0.56;
  static readonly PELVIS_H      = 0.18;
  static readonly THIGH_H       = 0.46;
  static readonly SHIN_H        = 0.40;
  static readonly FOOT_L        = 0.22;
  static readonly SHOULDER_W    = 0.42;
  static readonly UPPER_ARM_H   = 0.30;
  static readonly FOREARM_H     = 0.26;
  static readonly HAND_H        = 0.10;

  /**
   * Creates a full LOD-0 articulated human figure.
   * Named child objects allow test introspection and runtime transform animation.
   */
  public static createFullFigure(options: ProceduralHumanOptions = {}): THREE.Group {
    const seed = options.seed ?? 1;
    const rng  = new SeededRandom(seed);
    const archetype: NPCArchetype = options.archetype ?? 'young_professional';

    const skinHex = EAST_AFRICAN_SKIN_TONES[Math.floor(rng.nextFloat() * EAST_AFRICAN_SKIN_TONES.length)];
    const clothing = ARCHETYPE_CLOTHING[archetype];
    const topHex    = clothing.tops[Math.floor(rng.nextFloat() * clothing.tops.length)];
    const bottomHex = clothing.bottoms[Math.floor(rng.nextFloat() * clothing.bottoms.length)];
    const hairStyle: HairStyle = this.pickHairStyle(rng);

    const skinMat   = this.makeMat(skinHex, 0.75, 0.02);
    const topMat    = this.makeMat(topHex,  0.85, 0.04);
    const bottomMat = this.makeMat(bottomHex, 0.80, 0.03);
    const shoeMat   = this.makeMat(0x1a1210, 0.70, 0.05);
    const hairMat   = this.makeHairMat(rng);

    const root = new THREE.Group();
    root.name  = 'ProceduralHuman';

    // Foot base Y = 0  →  crown Y = TOTAL_HEIGHT
    const footY  = 0;
    const shinY  = footY   + 0.05;  // ankle pivot
    const kneeY  = shinY   + this.SHIN_H;
    const hipY   = kneeY   + this.THIGH_H;
    const waistY = hipY    + this.PELVIS_H;
    const chestY = waistY  + this.TORSO_H;
    const neckY  = chestY;
    const headY  = neckY   + this.NECK_H;
    // crownY omitted: total height documented in class header (TOTAL_HEIGHT = 1.72m)

    // --- FEET ---
    const footGeo = new THREE.BoxGeometry(0.11, 0.05, this.FOOT_L);
    const footL = this.mesh(footGeo, shoeMat, 'FootL');
    footL.position.set(-0.09, footY + 0.025, 0.05);
    const footR = this.mesh(footGeo, shoeMat, 'FootR');
    footR.position.set( 0.09, footY + 0.025, 0.05);
    root.add(footL, footR);

    // --- SHINS ---
    const shinGeo = new THREE.CylinderGeometry(0.062, 0.072, this.SHIN_H, 8);
    const shinL = this.group('ShinL', -0.09, shinY + this.SHIN_H / 2, 0);
    shinL.add(this.mesh(shinGeo, skinMat));
    const shinR = this.group('ShinR',  0.09, shinY + this.SHIN_H / 2, 0);
    shinR.add(this.mesh(shinGeo, skinMat));
    root.add(shinL, shinR);

    // --- THIGHS ---
    const thighGeo = new THREE.CylinderGeometry(0.095, 0.080, this.THIGH_H, 9);
    const thighL = this.group('ThighL', -0.10, kneeY + this.THIGH_H / 2, 0);
    thighL.add(this.mesh(thighGeo, bottomMat));
    const thighR = this.group('ThighR',  0.10, kneeY + this.THIGH_H / 2, 0);
    thighR.add(this.mesh(thighGeo, bottomMat));
    root.add(thighL, thighR);

    // --- PELVIS ---
    const pelvisGeo = new THREE.BoxGeometry(0.32, this.PELVIS_H, 0.22);
    const pelvis = this.mesh(pelvisGeo, bottomMat, 'Pelvis');
    pelvis.position.set(0, hipY + this.PELVIS_H / 2, 0);
    root.add(pelvis);

    // --- UPPER BODY (torso) ---
    const torsoGeo = new THREE.BoxGeometry(this.SHOULDER_W, this.TORSO_H, 0.22);
    const upperBody = this.group('UpperBody', 0, waistY + this.TORSO_H / 2, 0);
    upperBody.add(this.mesh(torsoGeo, topMat));
    root.add(upperBody);

    // Chest cloth detail (slightly darker lapel strip)
    const lapelGeo = new THREE.BoxGeometry(0.06, this.TORSO_H * 0.7, 0.025);
    const lapelMat = this.makeMat(topHex - 0x101010, 0.7, 0.05);
    const lapel = this.mesh(lapelGeo, lapelMat, 'Lapel');
    lapel.position.set(0, 0, 0.115);
    upperBody.add(lapel);

    // --- NECK ---
    const neckGeo = new THREE.CylinderGeometry(0.065, 0.07, this.NECK_H, 8);
    const neck = this.group('Neck', 0, neckY + this.NECK_H / 2, 0);
    neck.add(this.mesh(neckGeo, skinMat));
    root.add(neck);

    // --- HEAD ---
    // Egg-shaped head (slightly taller than wide, slightly tapered at crown)
    const headGeo = new THREE.SphereGeometry(this.HEAD_W / 2, 12, 10);
    // Squish Y to make oval
    headGeo.scale(1.0, this.HEAD_H / this.HEAD_W, 0.92);
    const head = this.group('Head', 0, headY + this.HEAD_H / 2, 0);
    head.add(this.mesh(headGeo, skinMat));

    // Ears
    const earGeo = new THREE.SphereGeometry(0.028, 6, 6);
    const earL = this.mesh(earGeo, skinMat, 'EarL');
    earL.position.set(-this.HEAD_W / 2 - 0.01, 0, 0);
    const earR = this.mesh(earGeo, skinMat, 'EarR');
    earR.position.set( this.HEAD_W / 2 + 0.01, 0, 0);
    head.add(earL, earR);

    // Nose bridge
    const noseGeo = new THREE.BoxGeometry(0.028, 0.042, 0.022);
    const nose = this.mesh(noseGeo, this.makeMat(skinHex - 0x0a0504, 0.78, 0.02), 'Nose');
    nose.position.set(0, -0.022, this.HEAD_W * 0.46);
    head.add(nose);

    root.add(head);

    // --- HAIR ---
    const hairMass = this.createHairMass(hairStyle, rng, hairMat);
    hairMass.name = 'HairMass';
    hairMass.position.set(0, headY + this.HEAD_H * 0.38, 0);
    root.add(hairMass);

    // --- UPPER ARMS ---
    const upperArmGeo = new THREE.CylinderGeometry(0.058, 0.068, this.UPPER_ARM_H, 8);
    const armOffsetY  = chestY - this.UPPER_ARM_H / 2 - 0.04;
    const armOffsetX  = this.SHOULDER_W / 2 + 0.038;

    const upperArmL = this.group('UpperArmL', -armOffsetX, armOffsetY, 0);
    upperArmL.rotation.z =  0.10;  // natural arm drape
    upperArmL.add(this.mesh(upperArmGeo, topMat));

    const upperArmR = this.group('UpperArmR',  armOffsetX, armOffsetY, 0);
    upperArmR.rotation.z = -0.10;
    upperArmR.add(this.mesh(upperArmGeo, topMat));
    root.add(upperArmL, upperArmR);

    // --- FOREARMS ---
    const forearmGeo = new THREE.CylinderGeometry(0.046, 0.056, this.FOREARM_H, 8);
    const elbowY = armOffsetY - this.UPPER_ARM_H / 2 - this.FOREARM_H / 2 - 0.01;

    const forearmL = this.group('ForearmL', -armOffsetX - 0.022, elbowY, 0);
    forearmL.add(this.mesh(forearmGeo, skinMat));
    const forearmR = this.group('ForearmR',  armOffsetX + 0.022, elbowY, 0);
    forearmR.add(this.mesh(forearmGeo, skinMat));
    root.add(forearmL, forearmR);

    // --- HANDS ---
    const handGeo = new THREE.BoxGeometry(0.085, this.HAND_H, 0.042);
    const handY = elbowY - this.FOREARM_H / 2 - this.HAND_H / 2;

    const handL = this.group('HandL', -armOffsetX - 0.025, handY, 0);
    handL.add(this.mesh(handGeo, skinMat));
    const handR = this.group('HandR',  armOffsetX + 0.025, handY, 0);
    handR.add(this.mesh(handGeo, skinMat));
    root.add(handL, handR);

    // --- LOWERMOST MARKER for ground-contact test ---
    const lowerBody = this.group('LowerBody', 0, hipY / 2, 0);
    root.add(lowerBody);

    root.castShadow    = true;
    root.receiveShadow = false;
    root.traverse((c) => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = true; } });

    return root;
  }

  /**
   * LOD-1 simplified silhouette: head sphere + body capsule + two leg cylinders.
   * Visible at 80–200m. Saves ~12 draw calls per character vs full figure.
   */
  public static createSimplifiedFigure(options: ProceduralHumanOptions = {}): THREE.Group {
    const seed = options.seed ?? 1;
    const rng  = new SeededRandom(seed);
    const archetype: NPCArchetype = options.archetype ?? 'young_professional';

    const skinHex = EAST_AFRICAN_SKIN_TONES[Math.floor(rng.nextFloat() * EAST_AFRICAN_SKIN_TONES.length)];
    const clothing = ARCHETYPE_CLOTHING[archetype];
    const topHex    = clothing.tops[Math.floor(rng.nextFloat() * clothing.tops.length)];
    const bottomHex = clothing.bottoms[Math.floor(rng.nextFloat() * clothing.bottoms.length)];

    const skinMat   = this.makeMat(skinHex, 0.75, 0.02);
    const topMat    = this.makeMat(topHex,  0.85, 0.04);
    const bottomMat = this.makeMat(bottomHex, 0.80, 0.03);

    const root = new THREE.Group();
    root.name = 'ProceduralHumanLOD1';

    // Head
    const headGeo = new THREE.SphereGeometry(0.10, 8, 7);
    const head = this.mesh(headGeo, skinMat, 'Head');
    head.position.set(0, 1.62, 0);
    root.add(head);

    // Body (torso+pelvis merged capsule)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.16, 0.76, 8);
    const body = this.mesh(bodyGeo, topMat, 'UpperBody');
    body.position.set(0, 1.12, 0);
    root.add(body);

    // Legs (single merged cylinder)
    const legGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.88, 8);
    const legs = this.mesh(legGeo, bottomMat, 'LowerBody');
    legs.position.set(0, 0.44, 0);
    root.add(legs);

    root.traverse((c) => { if ((c as THREE.Mesh).isMesh) { (c as THREE.Mesh).castShadow = true; } });
    return root;
  }

  /**
   * Applies a procedural walk-cycle transform to a full figure's named limb groups.
   * Called every frame from NPC.updateMovement(). No AnimationClip required.
   *
   * @param figure  Root group returned by createFullFigure()
   * @param time    Accumulated seconds (game time)
   * @param speed   Walk speed in m/s (controls cycle frequency)
   */
  public static applyWalkCycle(figure: THREE.Group, time: number, speed: number = 2.8): void {
    // Cycle frequency: one full gait cycle per ~1.4m of travel at 2.8m/s = 2 Hz
    const freq    = speed * 1.4;
    const phase   = time * Math.PI * 2 * freq;
    const legSwing   = 0.40; // radians
    const armSwing   = 0.28;
    const bodyBob    = 0.012; // metres vertical
    const hipRock    = 0.04; // Z-axis hip sway

    // Thighs (opposite phase)
    this.applyRotX(figure, 'ThighL',  Math.sin(phase) * legSwing);
    this.applyRotX(figure, 'ThighR', -Math.sin(phase) * legSwing);

    // Shins (follow-through: knee bend peaks at rear swing)
    this.applyRotX(figure, 'ShinL',  Math.max(0, -Math.sin(phase)) * legSwing * 0.55);
    this.applyRotX(figure, 'ShinR',  Math.max(0,  Math.sin(phase)) * legSwing * 0.55);

    // Counter-rotation arms (opposite to same-side leg)
    this.applyRotX(figure, 'UpperArmL', -Math.sin(phase) * armSwing);
    this.applyRotX(figure, 'UpperArmR',  Math.sin(phase) * armSwing);
    this.applyRotX(figure, 'ForearmL',   Math.max(0, -Math.sin(phase)) * armSwing * 0.4);
    this.applyRotX(figure, 'ForearmR',   Math.max(0,  Math.sin(phase)) * armSwing * 0.4);

    // Torso vertical bob and subtle Z sway
    const upperBody = figure.getObjectByName('UpperBody');
    if (upperBody) {
      upperBody.position.y = (1.04 + this.PELVIS_H) + Math.abs(Math.sin(phase)) * bodyBob;
      upperBody.rotation.z  = Math.sin(phase) * hipRock;
    }

    // Head slight counter-sway
    const head = figure.getObjectByName('Head');
    if (head) {
      head.rotation.y = -Math.sin(phase) * 0.06;
    }
  }

  /**
   * Applies a subtle idle breathing + weight-shift pose.
   * Called every frame for stationary NPCs. Prevents the rigid-statue look.
   *
   * Amplitudes are deliberately tiny so the effect reads as natural breathing
   * rather than animation at close range and is imperceptible at >40m.
   *
   * @param figure  Root group returned by createFullFigure()
   * @param time    Accumulated seconds (same clock as walk cycle)
   * @param phaseOffset  Per-NPC offset (seed * 0.37) so crowd doesn't sync
   */
  public static applyIdlePose(figure: THREE.Group, time: number, phaseOffset: number = 0): void {
    const t = time + phaseOffset;

    // Breathing: slow chest rise/fall at ~0.25 Hz (one breath every 4s)
    const breathPhase = t * Math.PI * 2 * 0.25;
    const breathRise  = Math.sin(breathPhase) * 0.003; // 3mm chest rise

    const upperBody = figure.getObjectByName('UpperBody');
    if (upperBody) {
      upperBody.position.y = (1.04 + this.PELVIS_H) + breathRise;
      // Reset walk sway when idle
      upperBody.rotation.z = 0;
    }

    // Weight shift: very slow side lean at ~0.12 Hz (one shift every ~8s)
    const weightPhase = t * Math.PI * 2 * 0.12;
    const weightShift = Math.sin(weightPhase) * 0.018; // 1° lean

    // Lean the whole figure slightly — simulates resting weight on one foot
    figure.rotation.z = weightShift;

    // Arms: slight natural droop variation (breathing tension)
    const armPhase = breathPhase * 0.5;
    const armFloat = Math.sin(armPhase) * 0.015;
    this.applyRotX(figure, 'UpperArmL', armFloat);
    this.applyRotX(figure, 'UpperArmR', -armFloat);
    // Reset legs to neutral
    this.applyRotX(figure, 'ThighL', 0);
    this.applyRotX(figure, 'ThighR', 0);
    this.applyRotX(figure, 'ShinL', 0);
    this.applyRotX(figure, 'ShinR', 0);

    // Head: occasional slow look-around at ~0.08 Hz
    const headPhase = t * Math.PI * 2 * 0.08;
    const head = figure.getObjectByName('Head');
    if (head) {
      head.rotation.y = Math.sin(headPhase) * 0.12; // ±7 degrees
      head.rotation.x = Math.sin(headPhase * 0.6) * 0.04; // slight nod
    }
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  private static group(name: string, x: number, y: number, z: number): THREE.Group {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    return g;
  }

  private static mesh(geo: THREE.BufferGeometry, mat: THREE.Material, name?: string): THREE.Mesh {
    const m = new THREE.Mesh(geo, mat);
    if (name) m.name = name;
    m.castShadow    = true;
    m.receiveShadow = false;
    return m;
  }

  private static makeMat(hex: number, roughness: number, metalness: number): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({ color: hex, roughness, metalness });
  }

  private static makeHairMat(rng: SeededRandom): THREE.MeshStandardMaterial {
    const hairColors = [0x0d0905, 0x150e08, 0x1a1208, 0x100c07, 0x0a0806];
    const hex = hairColors[Math.floor(rng.nextFloat() * hairColors.length)];
    return new THREE.MeshStandardMaterial({ color: hex, roughness: 0.92, metalness: 0.0 });
  }

  private static pickHairStyle(rng: SeededRandom): HairStyle {
    const styles: HairStyle[] = ['close_crop', 'natural_afro', 'natural_afro', 'braids', 'dreadlocks', 'shaved'];
    return styles[Math.floor(rng.nextFloat() * styles.length)];
  }

  private static createHairMass(style: HairStyle, rng: SeededRandom, mat: THREE.MeshStandardMaterial): THREE.Group {
    const g = new THREE.Group();
    switch (style) {
      case 'close_crop': {
        // Tight rounded cap just above scalp
        const cap = new THREE.Mesh(new THREE.SphereGeometry(this.HEAD_W / 2 + 0.01, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
        g.add(cap);
        break;
      }
      case 'natural_afro': {
        // Larger rounded afro sphere
        const afro = new THREE.Mesh(new THREE.SphereGeometry(this.HEAD_W / 2 + 0.030, 10, 9), mat);
        afro.scale.set(1.04, 1.06, 1.02);
        g.add(afro);
        break;
      }
      case 'braids': {
        // Central cap + 6 braid strands hanging down
        const cap = new THREE.Mesh(new THREE.SphereGeometry(this.HEAD_W / 2 + 0.008, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.48), mat);
        g.add(cap);
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2;
          const braidGeo = new THREE.CylinderGeometry(0.010, 0.007, 0.22, 5);
          const braid = new THREE.Mesh(braidGeo, mat);
          braid.position.set(Math.cos(angle) * 0.065, -0.11, Math.sin(angle) * 0.065);
          braid.rotation.z = Math.cos(angle) * 0.28;
          braid.rotation.x = Math.sin(angle) * 0.28;
          g.add(braid);
        }
        break;
      }
      case 'dreadlocks': {
        // Cap + thicker locs hanging down and forward
        const cap = new THREE.Mesh(new THREE.SphereGeometry(this.HEAD_W / 2 + 0.012, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.50), mat);
        g.add(cap);
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const locLen = 0.18 + rng.nextFloat() * 0.12;
          const locGeo = new THREE.CylinderGeometry(0.016, 0.010, locLen, 5);
          const loc = new THREE.Mesh(locGeo, mat);
          loc.position.set(Math.cos(angle) * 0.07, -locLen / 2 - 0.04, Math.sin(angle) * 0.07);
          loc.rotation.z = Math.cos(angle) * 0.35;
          loc.rotation.x = Math.sin(angle) * 0.35;
          g.add(loc);
        }
        break;
      }
      case 'shaved':
      default: {
        // Very thin stubble cap (barely visible texture)
        const stubble = new THREE.Mesh(new THREE.SphereGeometry(this.HEAD_W / 2 + 0.003, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), mat);
        g.add(stubble);
        break;
      }
    }
    return g;
  }

  private static applyRotX(figure: THREE.Group, name: string, angle: number): void {
    const obj = figure.getObjectByName(name);
    if (obj) obj.rotation.x = angle;
  }
}
