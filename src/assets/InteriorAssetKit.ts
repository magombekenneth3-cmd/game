import * as THREE from 'three';

export class InteriorAssetKit {
  /**
   * Creates a detailed 3D Nightclub DJ Booth & Sound System Rig.
   */
  public static createDJBoothRig(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'DJBoothRigMesh';

    // Black acrylic desk
    const deskMat = new THREE.MeshStandardMaterial({ color: 0x09090b, roughness: 0.2, metalness: 0.9 });
    const deskGeo = new THREE.BoxGeometry(2.4, 1.1, 0.9);
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = 0.55;
    desk.castShadow = true;
    group.add(desk);

    // Pioneer DJ decks with glowing LED pads
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x0284c7, emissiveIntensity: 0.5 });
    const deckGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16);

    const deckLeft = new THREE.Mesh(deckGeo, deckMat);
    deckLeft.position.set(-0.65, 1.13, 0);
    group.add(deckLeft);

    const deckRight = new THREE.Mesh(deckGeo, deckMat);
    deckRight.position.set(0.65, 1.13, 0);
    group.add(deckRight);

    // Subwoofer speaker stacks flanking booth
    const speakerMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const speakerGeo = new THREE.BoxGeometry(0.8, 2.0, 0.8);

    const spkLeft = new THREE.Mesh(speakerGeo, speakerMat);
    spkLeft.position.set(-1.8, 1.0, 0);
    group.add(spkLeft);

    const spkRight = new THREE.Mesh(speakerGeo, speakerMat);
    spkRight.position.set(1.8, 1.0, 0);
    group.add(spkRight);

    // Overhead Disco Spotlight Truss Frame
    const trussMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.9 });
    const trussGeo = new THREE.BoxGeometry(4.4, 0.15, 0.15);
    const truss = new THREE.Mesh(trussGeo, trussMat);
    truss.position.set(0, 3.2, 0);
    group.add(truss);

    return group;
  }

  /**
   * Creates a detailed VIP Lounge Seating Set.
   */
  public static createVIPLoungeMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'VIPLoungeMesh';

    // Velvet Plush Couch (Deep Violet)
    const couchMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.7 });
    const seatGeo = new THREE.BoxGeometry(2.8, 0.5, 1.1);
    const seat = new THREE.Mesh(seatGeo, couchMat);
    seat.position.y = 0.25;
    seat.castShadow = true;
    group.add(seat);

    const backGeo = new THREE.BoxGeometry(2.8, 0.7, 0.25);
    const back = new THREE.Mesh(backGeo, couchMat);
    back.position.set(0, 0.75, -0.425);
    group.add(back);

    // Gold Rim Glass Table
    const tableMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.9, roughness: 0.1 });
    const tableGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.45, 16);
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.set(0, 0.225, 1.2);
    group.add(table);

    return group;
  }
}
