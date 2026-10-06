import { GeoPoint, BuildingFootprint, RoadSegment } from './GISDataTypes';

export interface ValidationIssue {
  featureId: string;
  type: 'error' | 'warning';
  message: string;
}

export interface ValidationReport {
  isValid: boolean;
  issues: ValidationIssue[];
  validBuildingCount: number;
  validRoadCount: number;
  rejectedBuildingCount: number;
  rejectedRoadCount: number;
}

export class GISValidator {
  /**
   * Calculates 2D polygon area in square meters using the Shoelace formula.
   */
  public calculatePolygonArea(polygon: GeoPoint[]): number {
    if (polygon.length < 3) return 0;
    let area = 0;
    const n = polygon.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += polygon[i].x * polygon[j].z;
      area -= polygon[j].x * polygon[i].z;
    }
    return Math.abs(area) / 2.0;
  }

  /**
   * Checks if a polygon is self-intersecting.
   */
  public isSelfIntersecting(polygon: GeoPoint[]): boolean {
    const n = polygon.length;
    if (n < 4) return false; // Triangles cannot self-intersect

    for (let i = 0; i < n; i++) {
      const a1 = polygon[i];
      const a2 = polygon[(i + 1) % n];

      for (let j = i + 2; j < n; j++) {
        if (i === 0 && j === n - 1) continue; // Skip adjacent first and last segment
        const b1 = polygon[j];
        const b2 = polygon[(j + 1) % n];

        if (this.linesIntersect(a1, a2, b1, b2)) {
          return true;
        }
      }
    }
    return false;
  }

  private linesIntersect(p1: GeoPoint, p2: GeoPoint, p3: GeoPoint, p4: GeoPoint): boolean {
    const ccw = (a: GeoPoint, b: GeoPoint, c: GeoPoint) => {
      return (c.z - a.z) * (b.x - a.x) > (b.z - a.z) * (c.x - a.x);
    };
    return (
      ccw(p1, p3, p4) !== ccw(p2, p3, p4) &&
      ccw(p1, p2, p3) !== ccw(p1, p2, p4)
    );
  }

  public validateBuildingFootprint(fp: BuildingFootprint): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!fp.polygon || fp.polygon.length < 3) {
      issues.push({ featureId: fp.id, type: 'error', message: 'Building footprint polygon has fewer than 3 vertices.' });
      return issues;
    }

    const area = this.calculatePolygonArea(fp.polygon);
    if (area < 4.0) {
      issues.push({ featureId: fp.id, type: 'error', message: `Building footprint area is too small (${area.toFixed(1)}m² < 4.0m²).` });
    }

    if (this.isSelfIntersecting(fp.polygon)) {
      issues.push({ featureId: fp.id, type: 'error', message: 'Building footprint polygon is self-intersecting.' });
    }

    if (fp.height <= 0 || fp.height > 250) {
      issues.push({ featureId: fp.id, type: 'error', message: `Building height is out of bounds (${fp.height}m).` });
    }

    if (fp.floors <= 0 || fp.floors > 70) {
      issues.push({ featureId: fp.id, type: 'error', message: `Building floor count is out of bounds (${fp.floors}).` });
    }

    return issues;
  }

  public validateRoadSegment(road: RoadSegment): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!road.path || road.path.length < 2) {
      issues.push({ featureId: road.id, type: 'error', message: 'Road path has fewer than 2 waypoints.' });
      return issues;
    }

    let length = 0;
    for (let i = 0; i < road.path.length - 1; i++) {
      const dx = road.path[i + 1].x - road.path[i].x;
      const dz = road.path[i + 1].z - road.path[i].z;
      length += Math.sqrt(dx * dx + dz * dz);
    }

    if (length < 1.0) {
      issues.push({ featureId: road.id, type: 'error', message: `Road segment is degenerate (length ${length.toFixed(1)}m).` });
    }

    return issues;
  }
}
