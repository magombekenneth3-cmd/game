import { GeoPoint, RoadSegment } from '../gis/GISDataTypes';
import { SeededRandom } from '../utils/SeededRandom';

/**
 * Pure (render-free) urban layout helpers used to make the street, kerb, sidewalk and
 * building-frontage geometry agree with each other. Everything here works in game-world
 * metres on the X/Z plane (+X east, +Z south) and is deterministic.
 *
 * Street typologies are inspired by how central Nairobi's streets differ:
 *  - avenue:          wide dual carriageway with a planted median and broad cabro walkways
 *                     (Kenyatta Avenue / Haile Selassie Avenue character)
 *  - retail_street:   busy shopping street with wide cabro pavements (Moi Avenue / Tom Mboya St)
 *  - commercial_road: narrower commercial road with moderate pavements
 *  - local_street:    residential / service street with narrow concrete footpaths
 * They are an approximation drawn from public descriptions, not a survey.
 */
export type StreetTypology = 'avenue' | 'retail_street' | 'commercial_road' | 'local_street';

export interface StreetProfile {
  typology: StreetTypology;
  sidewalkWidth: number;
  curbWidth: number;
  /** Width of the raised planted median that sits on the centreline (0 = none). */
  medianWidth: number;
  paving: 'cabro' | 'concrete';
  /** Gap between the back of the sidewalk and the building face. */
  buildingSetback: number;
}

export function getStreetProfile(road: Pick<RoadSegment, 'category'>): StreetProfile {
  switch (road.category) {
    case 'highway':
      return { typology: 'avenue', sidewalkWidth: 5.0, curbWidth: 0.3, medianWidth: 2.2, paving: 'cabro', buildingSetback: 0.6 };
    case 'arterial':
      return { typology: 'retail_street', sidewalkWidth: 4.5, curbWidth: 0.3, medianWidth: 0, paving: 'cabro', buildingSetback: 0.3 };
    case 'secondary':
      return { typology: 'commercial_road', sidewalkWidth: 3.5, curbWidth: 0.3, medianWidth: 0, paving: 'cabro', buildingSetback: 0.8 };
    default:
      return { typology: 'local_street', sidewalkWidth: 2.5, curbWidth: 0.25, medianWidth: 0, paving: 'concrete', buildingSetback: 2.0 };
  }
}

/** Distance from the road centreline to the outer edge of the sidewalk (0 sidewalk if road has none). */
export function corridorHalfWidth(road: Pick<RoadSegment, 'category' | 'width' | 'hasSidewalks'>): number {
  const p = getStreetProfile(road);
  return road.width / 2 + (road.hasSidewalks ? p.curbWidth + p.sidewalkWidth : 0);
}

// ---------------------------------------------------------------------------------------
// Polyline helpers
// ---------------------------------------------------------------------------------------

export interface PolylineHit {
  distance: number;
  point: GeoPoint;
  tangent: GeoPoint;
  segmentIndex: number;
  /** Arc length from path start to `point`. */
  arcLength: number;
}

export function polylineLength(path: GeoPoint[]): number {
  let total = 0;
  for (let i = 1; i < path.length; i++) total += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z);
  return total;
}

export function closestOnPolyline(p: GeoPoint, path: GeoPoint[]): PolylineHit {
  let best: PolylineHit = { distance: Infinity, point: path[0], tangent: { x: 1, z: 0 }, segmentIndex: 0, arcLength: 0 };
  let acc = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const len = Math.hypot(dx, dz) || 1e-6;
    let t = ((p.x - a.x) * dx + (p.z - a.z) * dz) / (len * len);
    t = Math.max(0, Math.min(1, t));
    const qx = a.x + dx * t;
    const qz = a.z + dz * t;
    const d = Math.hypot(p.x - qx, p.z - qz);
    if (d < best.distance) {
      best = { distance: d, point: { x: qx, z: qz }, tangent: { x: dx / len, z: dz / len }, segmentIndex: i, arcLength: acc + len * t };
    }
    acc += len;
  }
  return best;
}

export function pointAlongPolyline(path: GeoPoint[], s: number): { point: GeoPoint; tangent: GeoPoint } {
  let remaining = Math.max(0, s);
  for (let i = 0; i < path.length - 1; i++) {
    const a = path[i];
    const b = path[i + 1];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1e-6;
    if (remaining <= len || i === path.length - 2) {
      const t = Math.min(1, remaining / len);
      return { point: { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t }, tangent: { x: (b.x - a.x) / len, z: (b.z - a.z) / len } };
    }
    remaining -= len;
  }
  return { point: path[0], tangent: { x: 1, z: 0 } };
}

/** Left-hand normal used consistently by the road generator: (-tz, tx). */
export function leftNormal(tangent: GeoPoint): GeoPoint {
  return { x: -tangent.z, z: tangent.x };
}

/** Resolve a point at arc-length `s`, lateral offset `lateral` (+ = left normal). */
export function roadFramePoint(road: Pick<RoadSegment, 'path'>, s: number, lateral: number): { x: number; z: number; tangent: GeoPoint } {
  const { point, tangent } = pointAlongPolyline(road.path, s);
  const n = leftNormal(tangent);
  return { x: point.x + n.x * lateral, z: point.z + n.z * lateral, tangent };
}

// ---------------------------------------------------------------------------------------
// Polygon helpers
// ---------------------------------------------------------------------------------------

export function polygonCenter(poly: GeoPoint[]): GeoPoint {
  let x = 0;
  let z = 0;
  poly.forEach((p) => { x += p.x; z += p.z; });
  return { x: x / poly.length, z: z / poly.length };
}

export function pointInPolygon(p: GeoPoint, poly: GeoPoint[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x, zi = poly[i].z, xj = poly[j].x, zj = poly[j].z;
    if ((zi > p.z) !== (zj > p.z) && p.x < ((xj - xi) * (p.z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonBounds(poly: GeoPoint[]): { minX: number; maxX: number; minZ: number; maxZ: number } {
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  poly.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.z < minZ) minZ = p.z;
    if (p.z > maxZ) maxZ = p.z;
  });
  return { minX, maxX, minZ, maxZ };
}

export function boundsOverlap(a: ReturnType<typeof polygonBounds>, b: ReturnType<typeof polygonBounds>, pad = 0): boolean {
  return a.minX - pad < b.maxX && a.maxX + pad > b.minX && a.minZ - pad < b.maxZ && a.maxZ + pad > b.minZ;
}

function sampleBoundary(poly: GeoPoint[], spacing: number): GeoPoint[] {
  const pts: GeoPoint[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / spacing));
    for (let k = 0; k < n; k++) pts.push({ x: a.x + ((b.x - a.x) * k) / n, z: a.z + ((b.z - a.z) * k) / n });
  }
  return pts;
}

/**
 * Minimum distance between a building outline and a road centreline.
 * Returns 0 and the road point nearest the polygon centre when the road passes through the building.
 */
export function distancePolygonToRoad(poly: GeoPoint[], road: Pick<RoadSegment, 'path'>): { distance: number; boundaryPoint: GeoPoint; roadPoint: GeoPoint } {
  const boundary = sampleBoundary(poly, 1.0);
  let best = { distance: Infinity, boundaryPoint: boundary[0], roadPoint: road.path[0] };
  boundary.forEach((q) => {
    const hit = closestOnPolyline(q, road.path);
    if (hit.distance < best.distance) best = { distance: hit.distance, boundaryPoint: q, roadPoint: hit.point };
  });
  const total = polylineLength(road.path);
  for (let s = 0; s <= total; s += 1.0) {
    const p = pointAlongPolyline(road.path, s).point;
    if (pointInPolygon(p, poly)) {
      const c = polygonCenter(poly);
      return { distance: 0, boundaryPoint: c, roadPoint: closestOnPolyline(c, road.path).point };
    }
  }
  return best;
}

// ---------------------------------------------------------------------------------------
// Setback + frontage
// ---------------------------------------------------------------------------------------

export interface SetbackResult {
  polygon: GeoPoint[];
  shifted: boolean;
  dx: number;
  dz: number;
}

/**
 * Push a footprint away from any road corridor (carriageway + kerb + sidewalk + margin) that it
 * overlaps. The GIS footprints in the vertical-slice dataset are hand-placed and several sat on the
 * carriageway, so building faces must be reconciled with the street before frontage geometry is made.
 */
export function resolveSetback(polygon: GeoPoint[], roads: RoadSegment[], margin = 0.6): SetbackResult {
  let poly = polygon.map((p) => ({ ...p }));
  let totalDx = 0;
  let totalDz = 0;
  for (let iter = 0; iter < 10; iter++) {
    let moved = false;
    for (const road of roads) {
      const need = corridorHalfWidth(road) + Math.max(margin, getStreetProfile(road).buildingSetback);
      const { distance, boundaryPoint, roadPoint } = distancePolygonToRoad(poly, road);
      if (distance < need) {
        let dx = boundaryPoint.x - roadPoint.x;
        let dz = boundaryPoint.z - roadPoint.z;
        let len = Math.hypot(dx, dz);
        if (len < 1e-3) {
          const c = polygonCenter(poly);
          dx = c.x - roadPoint.x;
          dz = c.z - roadPoint.z;
          len = Math.hypot(dx, dz) || 1;
        }
        const push = need - distance + 0.05;
        const sx = (dx / len) * push;
        const sz = (dz / len) * push;
        poly = poly.map((p) => ({ x: p.x + sx, z: p.z + sz }));
        totalDx += sx;
        totalDz += sz;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return { polygon: poly, shifted: totalDx !== 0 || totalDz !== 0, dx: totalDx, dz: totalDz };
}

export interface BuildingFrontage {
  a: GeoPoint;
  b: GeoPoint;
  /** Unit outward normal of the frontage edge (points toward the street). */
  normal: GeoPoint;
  length: number;
  roadId: string;
  typology: StreetTypology;
}

export function computeFrontage(polygon: GeoPoint[], roads: RoadSegment[], maxDistance = 40): BuildingFrontage | null {
  const c = polygonCenter(polygon);
  let bestRoad: RoadSegment | null = null;
  let bestHit: PolylineHit | null = null;
  roads.forEach((road) => {
    const hit = closestOnPolyline(c, road.path);
    if (!bestHit || hit.distance < bestHit.distance) {
      bestHit = hit;
      bestRoad = road;
    }
  });
  if (!bestRoad || !bestHit) return null;
  const road: RoadSegment = bestRoad;

  let best: BuildingFrontage | null = null;
  let bestScore = Infinity;
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 3) continue;
    const mid = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 };
    const hit = closestOnPolyline(mid, road.path);
    if (hit.distance < bestScore) {
      let nx = -(b.z - a.z) / len;
      let nz = (b.x - a.x) / len;
      if ((hit.point.x - mid.x) * nx + (hit.point.z - mid.z) * nz < 0) {
        nx = -nx;
        nz = -nz;
      }
      bestScore = hit.distance;
      best = { a, b, normal: { x: nx, z: nz }, length: len, roadId: road.id, typology: getStreetProfile(road).typology };
    }
  }
  return best && bestScore <= maxDistance ? best : null;
}

// ---------------------------------------------------------------------------------------
// Frontage rows (continuous street walls)
// ---------------------------------------------------------------------------------------

export interface RowSlot {
  polygon: GeoPoint[];
  center: GeoPoint;
  width: number;
  depth: number;
  side: 1 | -1;
  roadId: string;
  /** Arc-length along the road where this slot starts. */
  s: number;
}

export interface RowOptions {
  sMin: number;
  sMax: number;
  side: 1 | -1;
  minWidth: number;
  maxWidth: number;
  depth: number;
  /** Probability that a slot boundary becomes a narrow alley instead of a party wall. */
  alleyChance?: number;
  /** Circular exclusion zones (junctions, roundabouts). */
  avoid?: Array<{ x: number; z: number; r: number }>;
}

export function generateFrontageRow(road: RoadSegment, rng: SeededRandom, opts: RowOptions): RowSlot[] {
  const profile = getStreetProfile(road);
  const lateral = opts.side * (corridorHalfWidth(road) + profile.buildingSetback + opts.depth / 2);
  const slots: RowSlot[] = [];
  let s = opts.sMin;
  while (s < opts.sMax) {
    const width = Math.round((opts.minWidth + rng.nextFloat() * (opts.maxWidth - opts.minWidth)) * 2) / 2;
    const mid = roadFramePoint(road, s + width / 2, lateral);
    const t = mid.tangent;
    const n = leftNormal(t);
    const hw = width / 2;
    const hd = opts.depth / 2;
    const polygon: GeoPoint[] = [
      { x: mid.x - t.x * hw - n.x * hd, z: mid.z - t.z * hw - n.z * hd },
      { x: mid.x + t.x * hw - n.x * hd, z: mid.z + t.z * hw - n.z * hd },
      { x: mid.x + t.x * hw + n.x * hd, z: mid.z + t.z * hw + n.z * hd },
      { x: mid.x - t.x * hw + n.x * hd, z: mid.z - t.z * hw + n.z * hd }
    ];
    const blocked = (opts.avoid || []).some((z) => polygon.some((p) => Math.hypot(p.x - z.x, p.z - z.z) < z.r) || Math.hypot(mid.x - z.x, mid.z - z.z) < z.r);
    if (!blocked) slots.push({ polygon, center: { x: mid.x, z: mid.z }, width, depth: opts.depth, side: opts.side, roadId: road.id, s });
    s += width + (rng.nextFloat() < (opts.alleyChance ?? 0.14) ? 3.5 : 0.15);
  }
  return slots;
}
