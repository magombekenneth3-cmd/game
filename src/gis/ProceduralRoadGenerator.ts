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

    // Create Flanking Sidewalks
    if (road.hasSidewalks) {
      const sidewalkMat = this.assetManager.getMaterial('sidewalk_concrete');
      const sidewalkWidth = 3.0;

      const leftSidewalkGeo = this.createSidewalkRibbon(curvePoints, curve, samples, halfWidth, halfWidth + sidewalkWidth, 0.2);
      const rightSidewalkGeo = this.createSidewalkRibbon(curvePoints, curve, samples, -halfWidth - sidewalkWidth, -halfWidth, 0.2);

      const leftMesh = new THREE.Mesh(leftSidewalkGeo, sidewalkMat);
      const rightMesh = new THREE.Mesh(rightSidewalkGeo, sidewalkMat);

      leftMesh.receiveShadow = true;
      leftMesh.castShadow = true;
      rightMesh.receiveShadow = true;
      rightMesh.castShadow = true;

      roadGroup.add(leftMesh);
      roadGroup.add(rightMesh);
    }

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
}
