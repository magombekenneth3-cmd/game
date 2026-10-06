import * as THREE from 'three';
import { NPCArchetype } from '../npc/NPCTypes';

export class CharacterAssetKit {
  /**
   * Builds an animation-ready detailed 3D humanoid character mesh.
   */
  public static createHumanoidMesh(
    archetype: NPCArchetype | 'player',
    skinTone: number = 0x4E3629,
    outfitColor?: number
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `HumanoidMesh_${archetype}`;

    const skinMat = new THREE.MeshStandardMaterial({ color: skinTone, roughness: 0.8 });
    const outfitMat = new THREE.MeshStandardMaterial({
      color: outfitColor || this.getOutfitColorForArchetype(archetype),
      roughness: 0.6
    });
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });

    // 1. Torso & Jacket / Shirt
    const torsoGeo = new THREE.CapsuleGeometry(0.35, 0.75, 8, 16);
    const torso = new THREE.Mesh(torsoGeo, outfitMat);
    torso.position.y = 1.05;
    torso.castShadow = true;
    group.add(torso);

    // 2. Head & Facial Geometry
    const headGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.68;
    head.castShadow = true;
    group.add(head);

    // 3. Hair Style (Afro / Braids / Cap based on archetype)
    const hairStyle = this.getHairStyleForArchetype(archetype);
    if (hairStyle === 'afro') {
      const afroGeo = new THREE.SphereGeometry(0.28, 12, 12);
      const hair = new THREE.Mesh(afroGeo, hairMat);
      hair.position.set(0, 1.74, -0.02);
      group.add(hair);
    } else if (hairStyle === 'cap') {
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.5 });
      const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.1, 16);
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.82, 0);

      const visorGeo = new THREE.BoxGeometry(0.24, 0.02, 0.2);
      const visor = new THREE.Mesh(visorGeo, capMat);
      visor.position.set(0, 1.79, 0.2);
      group.add(cap);
      group.add(visor);
    }

    // 4. Limbs (Animation-ready skeleton hierarchy)
    const legGeo = new THREE.CylinderGeometry(0.11, 0.09, 0.72, 8);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(-0.18, 0.36, 0);
    leftLeg.castShadow = true;
    group.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.name = 'RightLeg';
    rightLeg.position.set(0.18, 0.36, 0);
    rightLeg.castShadow = true;
    group.add(rightLeg);

    const armGeo = new THREE.CylinderGeometry(0.08, 0.07, 0.65, 8);
    const leftArm = new THREE.Mesh(armGeo, outfitMat);
    leftArm.name = 'LeftArm';
    leftArm.position.set(-0.42, 1.05, 0);
    leftArm.castShadow = true;
    group.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, outfitMat);
    rightArm.name = 'RightArm';
    rightArm.position.set(0.42, 1.05, 0);
    rightArm.castShadow = true;
    group.add(rightArm);

    return group;
  }

  private static getOutfitColorForArchetype(archetype: string): number {
    switch (archetype) {
      case 'player': return 0x0284c7;             // Bright Cyan Jacket
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
    if (archetype === 'student' || archetype === 'player') return 'cap';
    if (archetype === 'musician' || archetype === 'market_vendor') return 'afro';
    return 'crop';
  }
}
