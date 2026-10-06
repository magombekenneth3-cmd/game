import * as THREE from 'three';
import { RoadSegment, IntersectionNode } from './GISDataTypes';
import { AssetManager } from '../engine/AssetManager';

export class ProceduralRoadGenerator {
  private assetManager: AssetManager;

  constructor(assetManager: AssetManager) {
    this.assetManager = assetManager;
  }

  public generateRoadMesh(road: RoadSegment): THREE.Group {
    const roadGroup = new THREE.Group();
    roadGroup.name = `Road_${road.id}`;

    if (road.path.length < 2) return roadGroup;

    // Convert GeoPoints to Vector3 curve path
    const points = road.path.map((pt) => new THREE.Vector3(pt.x, 0.05, pt.z));
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.2);

    // Create Road Ribbon Mesh
    const samples = points.length * 15;
    const curvePoints = curve.getPoints(samples);

    const roadGeo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const halfWidth = road.width / 2;

    for (let i = 0; i <= samples; i++) {
      const pt = curvePoints[i];
      const tangent = curve.getTangentAt(i / samples).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      // Left vertex
      const left = pt.clone().add(normal.clone().multiplyScalar(halfWidth));
      // Right vertex
      const right = pt.clone().add(normal.clone().multiplyScalar(-halfWidth));

      vertices.push(left.x, left.y, left.z);
      vertices.push(right.x, right.y, right.z);

      const v = (i / samples) * (road.path.length * 3);
      uvs.push(0, v);
      uvs.push(1, v);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    roadGeo.setIndex(indices);
    roadGeo.computeVertexNormals();

    const roadMat = this.assetManager.getMaterial('road_asphalt');
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.receiveShadow = true;
    roadGroup.add(roadMesh);

    // --- 1. 3D LANE MARKING GEOMETRY OVERLAYS ---
    const laneMarkingMatYellow = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.4 });
    const laneMarkingMatWhite = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });

    // Double Yellow Center Divider Lines
    const centerDoubleLineLeftGeo = this.createLaneLineRibbon(curvePoints, curve, samples, -0.15, -0.05, 0.07);
    const centerDoubleLineRightGeo = this.createLaneLineRibbon(curvePoints, curve, samples, 0.05, 0.15, 0.07);

    const centerLineLeftMesh = new THREE.Mesh(centerDoubleLineLeftGeo, laneMarkingMatYellow);
    const centerLineRightMesh = new THREE.Mesh(centerDoubleLineRightGeo, laneMarkingMatYellow);
    roadGroup.add(centerLineLeftMesh);
    roadGroup.add(centerLineRightMesh);

    // White Dashed Outer Lane Lines
    if (road.lanes > 2) {
      const laneOffset = halfWidth * 0.5;
      const dashedLeftGeo = this.createDashedLaneLineRibbon(curvePoints, curve, samples, -laneOffset, 0.07);
      const dashedRightGeo = this.createDashedLaneLineRibbon(curvePoints, curve, samples, laneOffset, 0.07);

      const dashedLeftMesh = new THREE.Mesh(dashedLeftGeo, laneMarkingMatWhite);
      const dashedRightMesh = new THREE.Mesh(dashedRightGeo, laneMarkingMatWhite);
      roadGroup.add(dashedLeftMesh);
      roadGroup.add(dashedRightMesh);
    }

    // --- 2. SEPARATE CURBS & SIDEWALKS ---
    if (road.hasSidewalks) {
      const sidewalkMat = this.assetManager.getMaterial('sidewalk_concrete');
      const curbMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.6 });
      const sidewalkWidth = 3.0;

      // Concrete Curb Edges
      const leftCurbGeo = this.createSidewalkRibbon(curvePoints, curve, samples, halfWidth, halfWidth + 0.3, 0.25);
      const rightCurbGeo = this.createSidewalkRibbon(curvePoints, curve, samples, -halfWidth - 0.3, -halfWidth, 0.25);
      const leftCurbMesh = new THREE.Mesh(leftCurbGeo, curbMat);
      const rightCurbMesh = new THREE.Mesh(rightCurbGeo, curbMat);
      roadGroup.add(leftCurbMesh);
      roadGroup.add(rightCurbMesh);

      // Flanking Sidewalk Pavers
      const leftSidewalkGeo = this.createSidewalkRibbon(curvePoints, curve, samples, halfWidth + 0.3, halfWidth + sidewalkWidth, 0.2);
      const rightSidewalkGeo = this.createSidewalkRibbon(curvePoints, curve, samples, -halfWidth - sidewalkWidth, -halfWidth - 0.3, 0.2);

      const leftMesh = new THREE.Mesh(leftSidewalkGeo, sidewalkMat);
      const rightMesh = new THREE.Mesh(rightSidewalkGeo, sidewalkMat);

      leftMesh.receiveShadow = true;
      leftMesh.castShadow = true;
      rightMesh.receiveShadow = true;
      rightMesh.castShadow = true;

      roadGroup.add(leftMesh);
      roadGroup.add(rightMesh);
    }

    // --- 3. 3D ZEBRA CROSSWALK GEOMETRY AT ROAD ENDS ---
    const crosswalkGeo = this.createZebraCrosswalk(curvePoints[0], curve.getTangentAt(0).normalize(), road.width);
    const crosswalkMesh = new THREE.Mesh(crosswalkGeo, laneMarkingMatWhite);
    roadGroup.add(crosswalkMesh);

    return roadGroup;
  }

  public generateRoundaboutMesh(intersection: IntersectionNode): THREE.Group {
    const group = new THREE.Group();
    if (intersection.type !== 'roundabout' || !intersection.radius) return group;

    const r = intersection.radius;
    // Central Green Island
    const islandGeo = new THREE.CylinderGeometry(r - 4, r - 4, 0.4, 32);
    const islandMat = this.assetManager.getMaterial('foliage_green');
    const island = new THREE.Mesh(islandGeo, islandMat);
    island.position.set(intersection.position.x, 0.2, intersection.position.z);
    island.receiveShadow = true;
    group.add(island);

    // Asphalt Ring Road
    const ringGeo = new THREE.RingGeometry(r - 4, r + 4, 32);
    const roadMat = this.assetManager.getMaterial('road_asphalt');
    const ring = new THREE.Mesh(ringGeo, roadMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(intersection.position.x, 0.06, intersection.position.z);
    ring.receiveShadow = true;
    group.add(ring);

    return group;
  }

  private createLaneLineRibbon(
    curvePoints: THREE.Vector3[],
    curve: THREE.CatmullRomCurve3,
    samples: number,
    offsetInner: number,
    offsetOuter: number,
    height: number
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const pt = curvePoints[i];
      const tangent = curve.getTangentAt(i / samples).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const inner = pt.clone().add(normal.clone().multiplyScalar(offsetInner));
      const outer = pt.clone().add(normal.clone().multiplyScalar(offsetOuter));

      vertices.push(inner.x, height, inner.z);
      vertices.push(outer.x, height, outer.z);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private createDashedLaneLineRibbon(
    curvePoints: THREE.Vector3[],
    curve: THREE.CatmullRomCurve3,
    samples: number,
    offset: number,
    height: number
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      if ((i % 6) < 3) continue; // Skip segments for dashed effect

      const pt = curvePoints[i];
      const tangent = curve.getTangentAt(i / samples).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const inner = pt.clone().add(normal.clone().multiplyScalar(offset - 0.06));
      const outer = pt.clone().add(normal.clone().multiplyScalar(offset + 0.06));

      vertices.push(inner.x, height, inner.z);
      vertices.push(outer.x, height, outer.z);

      if (i < samples && ((i + 1) % 6) >= 3) {
        const base = vertices.length / 3 - 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private createSidewalkRibbon(
    curvePoints: THREE.Vector3[],
    curve: THREE.CatmullRomCurve3,
    samples: number,
    offsetInner: number,
    offsetOuter: number,
    height: number
  ): THREE.BufferGeometry {
    const geo = new THREE.BufferGeometry();
    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i <= samples; i++) {
      const pt = curvePoints[i];
      const tangent = curve.getTangentAt(i / samples).normalize();
      const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      const inner = pt.clone().add(normal.clone().multiplyScalar(offsetInner));
      const outer = pt.clone().add(normal.clone().multiplyScalar(offsetOuter));

      vertices.push(inner.x, height, inner.z);
      vertices.push(outer.x, height, outer.z);

      if (i < samples) {
        const base = i * 2;
        indices.push(base, base + 1, base + 2);
        indices.push(base + 1, base + 3, base + 2);
      }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }

  private createZebraCrosswalk(center: THREE.Vector3, tangent: THREE.Vector3, roadWidth: number): THREE.BufferGeometry {
    const groupGeo = new THREE.BufferGeometry();
    const normal = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const vertices: number[] = [];
    const indices: number[] = [];

    const stripeWidth = 0.8;
    const stripeCount = Math.floor(roadWidth / (stripeWidth * 1.8));

    for (let s = 0; s < stripeCount; s++) {
      const offset = (s - stripeCount / 2) * (stripeWidth * 1.8);
      const stripeCenter = center.clone().add(normal.clone().multiplyScalar(offset));

      const p1 = stripeCenter.clone().add(tangent.clone().multiplyScalar(-1.5)).add(normal.clone().multiplyScalar(-stripeWidth / 2));
      const p2 = stripeCenter.clone().add(tangent.clone().multiplyScalar(-1.5)).add(normal.clone().multiplyScalar(stripeWidth / 2));
      const p3 = stripeCenter.clone().add(tangent.clone().multiplyScalar(1.5)).add(normal.clone().multiplyScalar(-stripeWidth / 2));
      const p4 = stripeCenter.clone().add(tangent.clone().multiplyScalar(1.5)).add(normal.clone().multiplyScalar(stripeWidth / 2));

      const base = vertices.length / 3;
      vertices.push(p1.x, 0.08, p1.z, p2.x, 0.08, p2.z, p3.x, 0.08, p3.z, p4.x, 0.08, p4.z);
      indices.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
    }

    groupGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    groupGeo.setIndex(indices);
    groupGeo.computeVertexNormals();
    return groupGeo;
  }
}
