import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

export class EnvironmentAssetKit {
  // --- FOLIAGE ---

  /**
   * Authentic Kenyan Umbrella Acacia (Vachellia tortilis).
   * Features gnarled tapering trunk, spreading radial limbs, underside branch armature,
   * and 3 tiered horizontal flat umbrella canopy shelves.
   */
  public static createAcaciaTreeMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'AcaciaTreeMesh';

    const barkTex = TextureGenerator.createBarkTexture('acacia');
    const barkNorm = TextureGenerator.createBarkNormalMap('acacia');
    const trunkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: barkNorm,
      color: 0x4e3629,
      roughness: 0.90,
      metalness: 0.05
    });

    const foliageTex = TextureGenerator.createFoliageTexture('acacia_umbrella');
    const foliageMatTop = new THREE.MeshStandardMaterial({
      map: foliageTex,
      color: 0x2e7d32,
      roughness: 0.70,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const foliageMatMid = new THREE.MeshStandardMaterial({
      map: foliageTex,
      color: 0x1b5e20,
      roughness: 0.75,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const foliageMatUnderside = new THREE.MeshStandardMaterial({
      map: foliageTex,
      color: 0x14532d,
      roughness: 0.85,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // Lower trunk with organic taper and root flare
    const trunkBaseGeo = new THREE.CylinderGeometry(0.36, 0.48, 1.2, 10);
    const trunkBase = new THREE.Mesh(trunkBaseGeo, trunkMat);
    trunkBase.position.y = 0.6;
    trunkBase.castShadow = true;
    group.add(trunkBase);

    // Mid trunk with gnarled tilt
    const trunkMidGeo = new THREE.CylinderGeometry(0.28, 0.36, 1.6, 10);
    const trunkMid = new THREE.Mesh(trunkMidGeo, trunkMat);
    trunkMid.position.set(0.08, 1.9, 0.05);
    trunkMid.rotation.z = -0.09;
    trunkMid.rotation.x = 0.06;
    trunkMid.castShadow = true;
    group.add(trunkMid);

    // Upper trunk crotch
    const trunkUpperGeo = new THREE.CylinderGeometry(0.24, 0.28, 0.8, 10);
    const trunkUpper = new THREE.Mesh(trunkUpperGeo, trunkMat);
    trunkUpper.position.set(0.14, 3.0, 0.08);
    trunkUpper.castShadow = true;
    group.add(trunkUpper);

    // 6 Wide spreading radial branch arms forming the umbrella armature
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
      const armMesh = new THREE.Mesh(armGeo, trunkMat);
      armMesh.name = `Acacia_BranchArm_${idx}`;
      armMesh.position.set(0.14 + (cos * b.rad) / 2, (b.yBase + b.yEnd) / 2, 0.08 + (sin * b.rad) / 2);

      const dir = new THREE.Vector3(cos * b.rad, b.yEnd - b.yBase, sin * b.rad).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      armMesh.setRotationFromQuaternion(quat);
      armMesh.castShadow = true;
      group.add(armMesh);

      // Underside secondary twigs
      const twigGeo = new THREE.CylinderGeometry(0.04, 0.08, 1.2, 6);
      const twig = new THREE.Mesh(twigGeo, trunkMat);
      twig.position.set(0.14 + cos * (b.rad * 0.8), b.yEnd - 0.2, 0.08 + sin * (b.rad * 0.8));
      twig.rotation.set(0.3 * sin, b.angle + Math.PI / 4, 0.3 * cos);
      twig.castShadow = true;
      group.add(twig);
    });

    // 3 Tiered horizontal flat umbrella canopy shelves
    const lowerShelfGeo = new THREE.CylinderGeometry(2.4, 0.8, 0.45, 14);
    const lowerShelf = new THREE.Mesh(lowerShelfGeo, foliageMatUnderside);
    lowerShelf.position.set(-0.3, 4.3, 0.4);
    lowerShelf.castShadow = true;
    group.add(lowerShelf);

    const midShelfGeo = new THREE.CylinderGeometry(3.4, 1.6, 0.55, 16);
    const midShelf = new THREE.Mesh(midShelfGeo, foliageMatMid);
    midShelf.position.set(0.2, 5.0, 0.1);
    midShelf.castShadow = true;
    group.add(midShelf);

    const topShelfGeo = new THREE.CylinderGeometry(3.9, 2.2, 0.40, 16);
    const topShelf = new THREE.Mesh(topShelfGeo, foliageMatTop);
    topShelf.position.set(0.1, 5.5, -0.1);
    topShelf.castShadow = true;
    topShelf.receiveShadow = true;
    group.add(topShelf);

    const capGeo = new THREE.CylinderGeometry(2.8, 3.6, 0.25, 16);
    const cap = new THREE.Mesh(capGeo, foliageMatTop);
    cap.position.set(0.15, 5.75, -0.05);
    cap.castShadow = true;
    group.add(cap);

    return group;
  }

  /**
   * Authentic Nairobi Jacaranda Street Tree (Jacaranda mimosifolia).
   * Features sculptural spreading branches, root flare, and 14 volumetric
   * violet-purple floral canopy clusters with emerald green bipinnate foliage accents.
   */
  public static createJacarandaTreeMesh(flowering: boolean = true): THREE.Group {
    const group = new THREE.Group();
    group.name = 'JacarandaTreeMesh';

    const barkTex = TextureGenerator.createBarkTexture('jacaranda');
    const barkNorm = TextureGenerator.createBarkNormalMap('jacaranda');
    const barkMat = new THREE.MeshStandardMaterial({
      map: barkTex,
      normalMap: barkNorm,
      color: 0x3d322a,
      roughness: 0.88,
      metalness: 0.05
    });

    const blossomTex = TextureGenerator.createFoliageTexture('jacaranda_blossom');
    const leafTex = TextureGenerator.createFoliageTexture('jacaranda_leaf');

    const blossomMatViolet = new THREE.MeshStandardMaterial({
      map: blossomTex,
      color: flowering ? 0x7c3aed : 0x22c55e,
      roughness: 0.65,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const blossomMatDeep = new THREE.MeshStandardMaterial({
      map: blossomTex,
      color: flowering ? 0x6d28d9 : 0x15803d,
      roughness: 0.70,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const blossomMatLavender = new THREE.MeshStandardMaterial({
      map: blossomTex,
      color: flowering ? 0x9333ea : 0x16a34a,
      roughness: 0.60,
      metalness: 0.0,
      side: THREE.DoubleSide
    });
    const leafMatGreen = new THREE.MeshStandardMaterial({
      map: leafTex,
      color: 0x166534,
      roughness: 0.75,
      metalness: 0.0,
      side: THREE.DoubleSide
    });

    // Root flare
    const rootGeo = new THREE.CylinderGeometry(0.38, 0.52, 0.6, 10);
    const rootMesh = new THREE.Mesh(rootGeo, barkMat);
    rootMesh.position.y = 0.3;
    rootMesh.castShadow = true;
    group.add(rootMesh);

    // Lower main trunk
    const trunk1Geo = new THREE.CylinderGeometry(0.32, 0.38, 1.6, 10);
    const trunk1 = new THREE.Mesh(trunk1Geo, barkMat);
    trunk1.position.set(0.04, 1.3, -0.03);
    trunk1.rotation.z = -0.05;
    trunk1.castShadow = true;
    group.add(trunk1);

    // Upper trunk
    const trunk2Geo = new THREE.CylinderGeometry(0.25, 0.32, 1.4, 10);
    const trunk2 = new THREE.Mesh(trunk2Geo, barkMat);
    trunk2.position.set(0.12, 2.7, 0.02);
    trunk2.rotation.z = 0.08;
    trunk2.rotation.x = -0.04;
    trunk2.castShadow = true;
    group.add(trunk2);

    // 4 Primary spreading limbs
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
      group.add(limbMesh);
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
      group.add(subMesh);
    });

    // 14 Volumetric Canopy Clusters
    const canopyClusters = [
      { pos: [0.0, 5.8, 0.0], scale: [1.8, 1.2, 1.8], mat: blossomMatViolet },
      { pos: [0.3, 6.3, -0.2], scale: [1.4, 0.9, 1.4], mat: blossomMatLavender },
      { pos: [1.5, 5.2, 0.8], scale: [1.7, 1.1, 1.6], mat: blossomMatDeep },
      { pos: [2.1, 4.8, 0.4], scale: [1.3, 0.8, 1.3], mat: blossomMatViolet },
      { pos: [1.1, 4.5, 0.9], scale: [1.1, 0.8, 1.1], mat: leafMatGreen },
      { pos: [-1.4, 5.1, 0.9], scale: [1.8, 1.2, 1.6], mat: blossomMatViolet },
      { pos: [-2.0, 4.7, 0.5], scale: [1.2, 0.8, 1.2], mat: blossomMatLavender },
      { pos: [-1.0, 4.4, 0.7], scale: [1.1, 0.7, 1.1], mat: leafMatGreen },
      { pos: [1.3, 5.3, -1.1], scale: [1.6, 1.0, 1.6], mat: blossomMatViolet },
      { pos: [1.8, 4.9, -1.5], scale: [1.2, 0.7, 1.2], mat: blossomMatDeep },
      { pos: [-1.2, 5.4, -1.0], scale: [1.7, 1.1, 1.7], mat: blossomMatDeep },
      { pos: [-1.7, 5.0, -1.4], scale: [1.3, 0.8, 1.3], mat: blossomMatLavender },
      { pos: [-0.6, 4.6, -1.1], scale: [1.0, 0.7, 1.0], mat: leafMatGreen },
      { pos: [0.1, 4.3, 0.1], scale: [1.4, 0.8, 1.4], mat: leafMatGreen }
    ];

    canopyClusters.forEach((c, idx) => {
      const geo = new THREE.IcosahedronGeometry(1.0, 1);
      const posAttr = geo.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const vx = posAttr.getX(i);
        const vy = posAttr.getY(i);
        const vz = posAttr.getZ(i);
        const noise = 1.0 + Math.sin(vx * 3.5 + vy * 4.2) * 0.12 + Math.cos(vz * 3.1) * 0.08;
        posAttr.setXYZ(i, vx * noise, vy * noise, vz * noise);
      }
      geo.computeVertexNormals();

      const mesh = new THREE.Mesh(geo, c.mat);
      mesh.name = `Jacaranda_Canopy_${idx}`;
      mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
      mesh.scale.set(c.scale[0], c.scale[1], c.scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    return group;
  }

  /**
   * Nairobi Architectural Concrete Planter with Lush Flowering Bougainvillea.
   * Perfect for building perimeters, sidewalk plinths, and streetscapes.
   */
  public static createBougainvilleaPlanter(options: { width?: number; length?: number; color?: 'magenta' | 'red' } = {}): THREE.Group {
    const group = new THREE.Group();
    group.name = 'BougainvilleaPlanter';

    const pLength = options.length || 2.4;
    const pWidth = options.width || 0.9;
    const isMagenta = options.color !== 'red';

    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.65,
      metalness: 0.10
    });
    const soilMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.95
    });

    const flowerTex = TextureGenerator.createFoliageTexture(isMagenta ? 'bougainvillea_magenta' : 'bougainvillea_magenta');
    const flowerMatPrimary = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: isMagenta ? 0xd946ef : 0xe11d48,
      roughness: 0.55,
      side: THREE.DoubleSide
    });
    const flowerMatDeep = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: isMagenta ? 0xa21caf : 0x9f1239,
      roughness: 0.60,
      side: THREE.DoubleSide
    });
    const leafMat = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: 0x14532d,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    // Concrete Planter Box
    const boxGeo = new THREE.BoxGeometry(pLength, 0.45, pWidth);
    const boxMesh = new THREE.Mesh(boxGeo, concreteMat);
    boxMesh.position.y = 0.225;
    boxMesh.castShadow = true;
    boxMesh.receiveShadow = true;
    group.add(boxMesh);

    // Soil bed
    const soilGeo = new THREE.BoxGeometry(pLength - 0.2, 0.05, pWidth - 0.2);
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = 0.44;
    group.add(soilMesh);

    // Mounded bougainvillea clusters
    const clusters = [
      { x: 0.0, y: 0.85, z: 0.0, s: 0.60, mat: flowerMatPrimary },
      { x: 0.2, y: 1.00, z: -0.05, s: 0.48, mat: flowerMatDeep },
      { x: -0.3, y: 0.75, z: 0.1, s: 0.52, mat: leafMat },
      { x: -0.7, y: 0.80, z: 0.05, s: 0.58, mat: flowerMatPrimary },
      { x: -0.9, y: 0.95, z: -0.05, s: 0.46, mat: flowerMatDeep },
      { x: -1.05, y: 0.60, z: 0.15, s: 0.42, mat: flowerMatPrimary },
      { x: 0.7, y: 0.82, z: -0.05, s: 0.58, mat: flowerMatDeep },
      { x: 0.9, y: 0.96, z: 0.05, s: 0.48, mat: flowerMatPrimary },
      { x: 1.05, y: 0.60, z: -0.15, s: 0.42, mat: leafMat },
      { x: 0.1, y: 0.55, z: 0.35, s: 0.45, mat: flowerMatPrimary }
    ];

    clusters.forEach((c, idx) => {
      const geo = new THREE.IcosahedronGeometry(c.s, 1);
      const mesh = new THREE.Mesh(geo, c.mat);
      mesh.name = `Bougainvillea_Cluster_${idx}`;
      mesh.position.set(c.x, c.y, c.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);
    });

    return group;
  }

  /**
   * Free-standing flowering Bougainvillea shrub for circular roundabouts & park islands.
   */
  public static createBougainvilleaShrub(color: 'magenta' | 'red' = 'magenta'): THREE.Group {
    const group = new THREE.Group();
    group.name = 'BougainvilleaShrub';

    const isMagenta = color !== 'red';
    const flowerTex = TextureGenerator.createFoliageTexture('bougainvillea_magenta');
    const flowerMatPrimary = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: isMagenta ? 0xd946ef : 0xe11d48,
      roughness: 0.55,
      side: THREE.DoubleSide
    });
    const flowerMatDeep = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: isMagenta ? 0xa21caf : 0x9f1239,
      roughness: 0.60,
      side: THREE.DoubleSide
    });
    const leafMat = new THREE.MeshStandardMaterial({
      map: flowerTex,
      color: 0x14532d,
      roughness: 0.65,
      side: THREE.DoubleSide
    });

    // Soil mound base
    const moundMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.95 });
    const moundGeo = new THREE.CylinderGeometry(0.8, 1.2, 0.3, 12);
    const mound = new THREE.Mesh(moundGeo, moundMat);
    mound.position.y = 0.15;
    group.add(mound);

    const shrubPuffs = [
      { x: 0.0, y: 0.8, z: 0.0, r: 0.75, mat: flowerMatPrimary },
      { x: 0.4, y: 0.6, z: 0.3, r: 0.55, mat: flowerMatDeep },
      { x: -0.4, y: 0.65, z: 0.2, r: 0.55, mat: flowerMatPrimary },
      { x: 0.2, y: 0.55, z: -0.4, r: 0.50, mat: leafMat },
      { x: -0.3, y: 0.50, z: -0.3, r: 0.48, mat: flowerMatDeep }
    ];

    shrubPuffs.forEach((p, idx) => {
      const geo = new THREE.IcosahedronGeometry(p.r, 1);
      const mesh = new THREE.Mesh(geo, p.mat);
      mesh.name = `Shrub_Puff_${idx}`;
      mesh.position.set(p.x, p.y, p.z);
      mesh.castShadow = true;
      group.add(mesh);
    });

    return group;
  }

  public static createPalmTreeMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PalmTreeMesh';

    const trunkTex = TextureGenerator.createBarkTexture('palm');
    const trunkMat = new THREE.MeshStandardMaterial({ map: trunkTex, color: 0x654321, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.24, 0.36, 6.2, 10);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.1;
    trunk.rotation.x = 0.05;
    trunk.castShadow = true;
    group.add(trunk);

    // 12 Arching fronds arranged in natural drooping crown
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI) / 6;
      const frondGeo = new THREE.BoxGeometry(0.5, 0.04, 3.2);
      const frond = new THREE.Mesh(frondGeo, leafMat);
      frond.rotation.y = angle;
      frond.rotation.x = 0.35 + (i % 2) * 0.12;
      frond.position.set(Math.cos(angle) * 1.2, 6.0 - (i % 2) * 0.2, Math.sin(angle) * 1.2);
      frond.castShadow = true;
      group.add(frond);
    }

    return group;
  }


  // --- STREET FURNITURE & CLUTTER ---

  public static createStreetlightMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'StreetlightMesh';

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const poleGeo = new THREE.CylinderGeometry(0.08, 0.12, 6.0, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 3.0;
    pole.castShadow = true;
    group.add(pole);

    // Curved lamp arm
    const armGeo = new THREE.CylinderGeometry(0.05, 0.05, 1.4, 8);
    const arm = new THREE.Mesh(armGeo, poleMat);
    arm.rotation.z = Math.PI / 3;
    arm.position.set(0.6, 5.8, 0);
    group.add(arm);

    // Glass lantern fixture & emissive lamp bulb
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf59e0b, emissiveIntensity: 0.0 });
    lampMat.name = 'streetlight_emissive';
    const lampGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const lamp = new THREE.Mesh(lampGeo, lampMat);
    lamp.position.set(1.1, 6.0, 0);
    group.add(lamp);

    return group;
  }

  public static createMamaMbogaStallMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MamaMbogaStallMesh';

    // Wooden table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const tableGeo = new THREE.BoxGeometry(2.2, 0.85, 1.2);
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = 0.425;
    table.castShadow = true;
    group.add(table);

    // Colorful fruit crates (Tomatoes, Bananas, Mangoes)
    const produceColors = [0xef4444, 0xeab308, 0xf97316];
    produceColors.forEach((color, idx) => {
      const crateMat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
      const crateGeo = new THREE.BoxGeometry(0.5, 0.25, 0.4);
      const crate = new THREE.Mesh(crateGeo, crateMat);
      crate.position.set((idx - 1) * 0.6, 0.975, 0);
      group.add(crate);
    });

    // Market Umbrella
    const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 });
    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.4, 8);
    const pole = new THREE.Mesh(poleGeo, tableMat);
    pole.position.set(0, 1.2, 0);
    group.add(pole);

    const canopyGeo = new THREE.ConeGeometry(1.4, 0.6, 8);
    const canopy = new THREE.Mesh(canopyGeo, umbrellaMat);
    canopy.position.set(0, 2.4, 0);
    group.add(canopy);

    return group;
  }

  public static createMPesaKioskMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MPesaKioskMesh';

    // Green/Red wooden kiosk structure
    const kioskMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
    const bodyGeo = new THREE.BoxGeometry(1.6, 2.2, 1.4);
    const body = new THREE.Mesh(bodyGeo, kioskMat);
    body.position.y = 1.1;
    body.castShadow = true;
    group.add(body);

    // M-Pesa Signboard
    const signMat = new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x15803d, emissiveIntensity: 0.3 });
    const signGeo = new THREE.BoxGeometry(1.4, 0.35, 0.08);
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.set(0, 2.0, 0.72);
    group.add(sign);

    return group;
  }

  public static createRoadBarrierMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'RoadBarrierMesh';

    const barrierMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.8 });
    const barrierGeo = new THREE.BoxGeometry(2.0, 0.8, 0.5);
    const barrier = new THREE.Mesh(barrierGeo, barrierMat);
    barrier.position.y = 0.4;
    barrier.castShadow = true;
    group.add(barrier);

    return group;
  }

  public static createUtilityPoleMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'UtilityPoleMesh';

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9 });
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.14, 8.0, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 4.0;
    pole.castShadow = true;
    group.add(pole);

    const crossArmGeo = new THREE.BoxGeometry(2.0, 0.1, 0.1);
    const crossArm = new THREE.Mesh(crossArmGeo, poleMat);
    crossArm.position.y = 7.5;
    crossArm.castShadow = true;
    group.add(crossArm);

    return group;
  }

  // --- NAIROBI CBD STREETSCAPE & INFRASTRUCTURE ---

  /**
   * 3-Aspect Traffic Signal Post with Pedestrian Crossing Signals.
   * Standard on major Nairobi CBD junctions (Kenyatta Ave / Moi Ave).
   */
  public static createTrafficLightMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'TrafficLightMesh';

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });
    const mastGeo = new THREE.CylinderGeometry(0.12, 0.16, 6.2, 10);
    const mast = new THREE.Mesh(mastGeo, steelMat);
    mast.position.y = 3.1;
    mast.castShadow = true;
    group.add(mast);

    // Overhanging Mast Arm for Vehicular Signal
    const armGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.5, 8);
    const arm = new THREE.Mesh(armGeo, steelMat);
    arm.rotation.z = Math.PI / 2;
    arm.position.set(1.75, 5.8, 0);
    group.add(arm);

    // Overhead Vehicular Signal Head (Yellow housing)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.5 });
    const headGeo = new THREE.BoxGeometry(0.4, 1.2, 0.35);
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(3.2, 5.4, 0);
    head.castShadow = true;
    group.add(head);

    // 3 Lenses: Red (top), Amber (mid), Green (bottom)
    const redMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.9 });
    const amberMat = new THREE.MeshStandardMaterial({ color: 0x332200, roughness: 0.8 });
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x003311, roughness: 0.8 });

    const lensGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.08, 12);
    lensGeo.rotateX(Math.PI / 2);

    const redLens = new THREE.Mesh(lensGeo, redMat);
    redLens.position.set(3.2, 5.75, 0.16);
    group.add(redLens);

    const amberLens = new THREE.Mesh(lensGeo, amberMat);
    amberLens.position.set(3.2, 5.4, 0.16);
    group.add(amberLens);

    const greenLens = new THREE.Mesh(lensGeo, greenMat);
    greenLens.position.set(3.2, 5.05, 0.16);
    group.add(greenLens);

    // Pedestrian Signal at Post Side (eye level ~ 2.4m)
    const pedHeadGeo = new THREE.BoxGeometry(0.32, 0.7, 0.28);
    const pedHead = new THREE.Mesh(pedHeadGeo, steelMat);
    pedHead.position.set(0.3, 2.5, 0);
    group.add(pedHead);

    const pedWalkMat = new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x10b981, emissiveIntensity: 0.8 });
    const pedLens = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.05), pedWalkMat);
    pedLens.position.set(0.3, 2.35, 0.14);
    group.add(pedLens);

    return group;
  }

  /**
   * Nairobi CBD Street Name Signpost (e.g., "KENYATTA AVE / KIMATHI ST").
   */
  public static createStreetSignPostMesh(streetName: string, crossStreet: string = 'KIMATHI ST'): THREE.Group {
    const group = new THREE.Group();
    group.name = `StreetSign_${streetName}`;

    const poleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.75, roughness: 0.35 });
    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 3.8, 8);
    const pole = new THREE.Mesh(poleGeo, poleMat);
    pole.position.y = 1.9;
    pole.castShadow = true;
    group.add(pole);

    // Primary Street Plate
    const signTex1 = TextureGenerator.createStreetSignTexture(streetName, 'NAIROBI CBD');
    const plateMat1 = new THREE.MeshStandardMaterial({ map: signTex1, roughness: 0.4 });
    const plateGeo1 = new THREE.BoxGeometry(1.6, 0.4, 0.04);
    const plate1 = new THREE.Mesh(plateGeo1, plateMat1);
    plate1.position.set(0, 3.4, 0);
    plate1.castShadow = true;
    group.add(plate1);

    // Cross Street Plate (perpendicular angle)
    if (crossStreet) {
      const signTex2 = TextureGenerator.createStreetSignTexture(crossStreet, 'CBD CENTRAL');
      const plateMat2 = new THREE.MeshStandardMaterial({ map: signTex2, roughness: 0.4 });
      const plateGeo2 = new THREE.BoxGeometry(1.5, 0.38, 0.04);
      const plate2 = new THREE.Mesh(plateGeo2, plateMat2);
      plate2.rotation.y = Math.PI / 2;
      plate2.position.set(0, 3.0, 0);
      plate2.castShadow = true;
      group.add(plate2);
    }

    return group;
  }

  /**
   * Street tree embedded in square cast-iron tree pit grate within Cabro pavement.
   * Characteristic of Kenyatta Avenue and Mama Ngina Street promenades.
   */
  public static createTreeInPavingMesh(type: 'jacaranda' | 'acacia' | 'palm' = 'jacaranda'): THREE.Group {
    const group = new THREE.Group();
    group.name = `TreeInPaving_${type}`;

    // Square Cast-Iron Tree Grate (1.6m x 1.6m at pavement level y = 0.21)
    const grateMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.9, roughness: 0.4 });
    const grateGeo = new THREE.BoxGeometry(1.6, 0.04, 1.6);
    const grate = new THREE.Mesh(grateGeo, grateMat);
    grate.position.y = 0.21;
    grate.receiveShadow = true;
    group.add(grate);

    // Laterite soil inside inner circular hole
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x7c2d12, roughness: 0.95 });
    const soilGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.05, 12);
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.y = 0.22;
    group.add(soil);

    if (type === 'palm') {
      const palm = this.createPalmTreeMesh();
      palm.position.y = 0.2;
      group.add(palm);
    } else if (type === 'jacaranda') {
      const jacaranda = this.createJacarandaTreeMesh(true);
      jacaranda.position.y = 0.2;
      group.add(jacaranda);
    } else {
      const acacia = this.createAcaciaTreeMesh();
      acacia.position.y = 0.2;
      group.add(acacia);
    }

    return group;
  }

  /**
   * Commuter Matatu Stage Shelter with Bench & Destination Banner.
   */
  public static createMatatuStageShelterMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'MatatuStageShelter';

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.7, roughness: 0.3 });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x94a3b8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.0
    });

    // 4 Steel Support Posts
    const postGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.8, 8);
    [-2.2, 2.2].forEach((x) => {
      [-0.8, 0.8].forEach((z) => {
        const post = new THREE.Mesh(postGeo, steelMat);
        post.position.set(x, 1.4, z);
        post.castShadow = true;
        group.add(post);
      });
    });

    // Curved Polycarbonate Roof
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3 });
    const roofGeo = new THREE.BoxGeometry(5.0, 0.1, 2.0);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 2.85, 0);
    roof.castShadow = true;
    group.add(roof);

    // Rear Windbreak Glass Panel
    const glassGeo = new THREE.BoxGeometry(4.4, 2.0, 0.05);
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.set(0, 1.5, -0.8);
    group.add(glass);

    // Wooden Waiting Bench
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
    const benchGeo = new THREE.BoxGeometry(3.6, 0.1, 0.5);
    const bench = new THREE.Mesh(benchGeo, woodMat);
    bench.position.set(0, 0.5, -0.4);
    bench.castShadow = true;
    group.add(bench);

    // Yellow / Navy Stage Signboard Header
    const signMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 });
    const signBox = new THREE.BoxGeometry(4.8, 0.45, 0.08);
    const sign = new THREE.Mesh(signBox, signMat);
    sign.position.set(0, 2.65, 0.98);
    group.add(sign);

    return group;
  }

  /**
   * Pavement Curb Bollard (protects pedestrians from vehicular curb mounting).
   */
  public static createStreetBollardMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'StreetBollard';

    const steelMat = new THREE.MeshStandardMaterial({ color: 0x18181b, metalness: 0.8, roughness: 0.3 });
    const postGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.9, 12);
    const post = new THREE.Mesh(postGeo, steelMat);
    post.position.y = 0.45;
    post.castShadow = true;
    group.add(post);

    // Yellow reflective collar band
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xfacc15, emissiveIntensity: 0.2 });
    const bandGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.12, 12);
    const band = new THREE.Mesh(bandGeo, yellowMat);
    band.position.y = 0.7;
    group.add(band);

    return group;
  }
}
