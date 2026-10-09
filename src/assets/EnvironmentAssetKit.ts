import * as THREE from 'three';

export class EnvironmentAssetKit {
  // --- FOLIAGE ---

  public static createAcaciaTreeMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'AcaciaTreeMesh';

    // Trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x4e3629, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.45, 4.5, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 2.25;
    trunk.rotation.z = 0.08;
    trunk.castShadow = true;
    group.add(trunk);

    // Flat umbrella canopy foliage
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
    const canopyGeo = new THREE.CylinderGeometry(4.0, 1.2, 0.8, 12);
    const canopy = new THREE.Mesh(canopyGeo, foliageMat);
    canopy.position.set(0.3, 4.5, 0);
    canopy.castShadow = true;
    group.add(canopy);

    return group;
  }

  public static createPalmTreeMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'PalmTreeMesh';

    // Ringed trunk
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 6.0, 10);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3.0;
    trunk.rotation.x = 0.06;
    trunk.castShadow = true;
    group.add(trunk);

    // Arching fronds
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, side: THREE.DoubleSide });
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const frondGeo = new THREE.BoxGeometry(0.5, 0.04, 2.8);
      const frond = new THREE.Mesh(frondGeo, leafMat);
      frond.rotation.y = angle;
      frond.rotation.x = 0.35;
      frond.position.set(Math.cos(angle) * 1.1, 5.8, Math.sin(angle) * 1.1);
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
}
