import * as THREE from 'three';
import { TextureGenerator } from './TextureGenerator';

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
      // Purple / lavender flowering Jacaranda tree (famed Nairobi street tree)
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x443328, roughness: 0.85 });
      const trunkGeo = new THREE.CylinderGeometry(0.24, 0.35, 4.8, 8);
      const trunk = new THREE.Mesh(trunkGeo, trunkMat);
      trunk.position.y = 2.6;
      trunk.rotation.z = -0.05;
      trunk.castShadow = true;
      group.add(trunk);

      // Purple bloom canopy
      const blossomMat = new THREE.MeshStandardMaterial({ color: 0x6d28d9, roughness: 0.65 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1e3a1e, roughness: 0.7 });

      const mainCanopy = new THREE.Mesh(new THREE.DodecahedronGeometry(2.4), blossomMat);
      mainCanopy.position.set(0, 5.2, 0);
      mainCanopy.castShadow = true;
      group.add(mainCanopy);

      const subCanopy1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6), foliageMat);
      subCanopy1.position.set(-1.2, 4.6, 0.8);
      subCanopy1.castShadow = true;
      group.add(subCanopy1);

      const subCanopy2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.8), blossomMat);
      subCanopy2.position.set(1.1, 4.8, -0.6);
      subCanopy2.castShadow = true;
      group.add(subCanopy2);
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
