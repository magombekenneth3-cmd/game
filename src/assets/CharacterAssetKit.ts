import * as THREE from 'three';
import { NPCArchetype } from '../npc/NPCTypes';

export class CharacterAssetKit {
  /**
   * Builds an animation-ready detailed 3D humanoid character mesh with authentic
   * African melanin tones, streetwear/hoodie, urban backpack, athletic sneakers, and hip/shoulder pivots.
   */
  public static createHumanoidMesh(
    archetype: NPCArchetype | 'player',
    skinTone: number = 0x4a2e1b,
    outfitColor?: number
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `HumanoidMesh_${archetype}`;

    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.75 });
    const outfitMat = new THREE.MeshStandardMaterial({
      color: outfitColor || this.getOutfitColorForArchetype(archetype),
      roughness: 0.65
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }); // Indigo denim
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.95 });

    // 1. Torso & Hoodie / Jacket
    const torsoGeo = new THREE.CapsuleGeometry(0.32, 0.65, 8, 16);
    const torso = new THREE.Mesh(torsoGeo, outfitMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // Hoodie collar cowl & back fold for player
    if (archetype === 'player') {
      const hoodMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.7 });
      const hoodCowl = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.12, 0.16), hoodMat);
      hoodCowl.position.set(0, 1.42, -0.16);
      group.add(hoodCowl);
    }

    // 2. Head, Ears & Facial Geometry
    const headGeo = new THREE.SphereGeometry(0.19, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.66;
    head.castShadow = true;
    group.add(head);

    // Ear lobes
    const earGeo = new THREE.SphereGeometry(0.04, 8, 8);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.20, 1.66, 0);
    group.add(leftEar);
    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.20, 1.66, 0);
    group.add(rightEar);

    // 3. Hair Style (Fade / Afro / Cap)
    const hairStyle = this.getHairStyleForArchetype(archetype);
    if (hairStyle === 'afro') {
      const afroGeo = new THREE.SphereGeometry(0.25, 14, 14);
      const hair = new THREE.Mesh(afroGeo, hairMat);
      hair.position.set(0, 1.72, -0.02);
      group.add(hair);
    } else if (hairStyle === 'cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
      const capGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.08, 16);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.78, 0);

      const visorGeo = new THREE.BoxGeometry(0.22, 0.02, 0.18);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 1.76, 0.18);
      group.add(cap);
      group.add(visor);
    } else {
      // Modern textured crop / taper fade crown
      const cropGeo = new THREE.SphereGeometry(0.195, 14, 14);
      cropGeo.scale(1.02, 1.05, 1.03);
      const hair = new THREE.Mesh(cropGeo, hairMat);
      hair.position.set(0, 1.68, -0.01);
      group.add(hair);
    }

    // 4. Urban Commuter Backpack (Mounted on back for Player and Students)
    if (archetype === 'player' || archetype === 'student') {
      const backpackGroup = new THREE.Group();
      backpackGroup.name = 'Backpack';

      const packMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.85 });
      const packMain = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.42, 0.18), packMat);
      packMain.position.set(0, 1.15, -0.24);
      packMain.castShadow = true;
      backpackGroup.add(packMain);

      // Zipper pouch
      const pouchMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.9 });
      const pouch = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.22, 0.08), pouchMat);
      pouch.position.set(0, 1.06, -0.34);
      backpackGroup.add(pouch);

      // Shoulder straps
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.9 });
      [-0.13, 0.13].forEach((sx) => {
        const strap = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.24), strapMat);
        strap.position.set(sx, 1.18, -0.07);
        backpackGroup.add(strap);
      });

      group.add(backpackGroup);
    }

    // 5. Limbs with hip / shoulder pivot points and footwear
    const sneakerMat = new THREE.MeshStandardMaterial({
      color: archetype === 'player' ? 0xf8fafc : 0x1e293b, // Crisp white sneakers for player
      roughness: 0.45
    });
    const soleMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.85 });

    // Leg geometry offset so (0,0,0) is hip joint
    const legGeo = new THREE.CylinderGeometry(0.10, 0.08, 0.64, 8);
    legGeo.translate(0, -0.32, 0);

    // Left Leg
    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(-0.17, 0.72, 0);
    leftLeg.castShadow = true;

    const leftShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), sneakerMat);
    leftShoe.position.set(0, -0.62, 0.04);
    leftShoe.castShadow = true;
    leftLeg.add(leftShoe);

    const leftSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.25), soleMat);
    leftSole.position.set(0, -0.665, 0.04);
    leftLeg.add(leftSole);

    group.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Mesh(legGeo.clone(), pantsMat);
    rightLeg.name = 'RightLeg';
    rightLeg.position.set(0.17, 0.72, 0);
    rightLeg.castShadow = true;

    const rightShoe = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.09, 0.24), sneakerMat);
    rightShoe.position.set(0, -0.62, 0.04);
    rightShoe.castShadow = true;
    rightLeg.add(rightShoe);

    const rightSole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.03, 0.25), soleMat);
    rightSole.position.set(0, -0.665, 0.04);
    rightLeg.add(rightSole);

    group.add(rightLeg);

    // Arm geometry offset so (0,0,0) is shoulder joint
    const armGeo = new THREE.CylinderGeometry(0.075, 0.065, 0.58, 8);
    armGeo.translate(0, -0.29, 0);

    const handGeo = new THREE.SphereGeometry(0.065, 8, 8);

    // Left Arm
    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.name = 'LeftArm';
    leftArm.position.set(-0.38, 1.35, 0);
    leftArm.castShadow = true;

    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(0, -0.58, 0);
    leftArm.add(leftHand);

    group.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Mesh(armGeo.clone(), outfitMat);
    rightArm.name = 'RightArm';
    rightArm.position.set(0.38, 1.35, 0);
    rightArm.castShadow = true;

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0, -0.58, 0);
    rightArm.add(rightHand);

    group.add(rightArm);

    return group;
  }

  private static getOutfitColorForArchetype(archetype: string): number {
    switch (archetype) {
      case 'player': return 0x27272a;             // Charcoal / Black Street Hoodie
      case 'student': return 0x2563eb;            // Royal Blue
      case 'young_professional': return 0x7c3aed; // Violet
      case 'office_worker': return 0x334155;     // Charcoal
      case 'musician': return 0xd97706;          // Amber
      case 'market_vendor': return 0xe11d48;     // Crimson
      case 'security_guard': return 0x15803d;    // Forest Green
      default: return 0x0d9488;                  // Teal
    }
  }

  private static getHairStyleForArchetype(archetype: string): 'afro' | 'cap' | 'crop' {
    if (archetype === 'player') return 'crop';
    if (archetype === 'student') return 'cap';
    if (archetype === 'musician' || archetype === 'market_vendor') return 'afro';
    return 'crop';
  }
}
