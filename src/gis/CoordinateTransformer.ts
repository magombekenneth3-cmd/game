import { GeoPoint } from './GISDataTypes';

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  altitude?: number;
}

export interface ProjectionOrigin {
  originLat: number;
  originLon: number;
  originAlt: number;
}

export class CoordinateTransformer {
  private originLat: number;
  private originLon: number;
  private originAlt: number;
  private static readonly EARTH_RADIUS = 6371000.0; // Earth radius in meters

  constructor(originLat: number = -1.2975, originLon: number = 36.8050, originAlt: number = 1680.0) {
    this.originLat = originLat;
    this.originLon = originLon;
    this.originAlt = originAlt;
  }

  /**
   * Transforms WGS84 (Lat, Lon) to local projected Cartesian Game World meters (X, Z).
   * +X = East, -X = West, -Z = North, +Z = South.
   */
  public toGameWorld(lat: number, lon: number): GeoPoint {
    const originLatRad = (this.originLat * Math.PI) / 180.0;

    const deltaLonRad = ((lon - this.originLon) * Math.PI) / 180.0;
    const deltaLatRad = ((lat - this.originLat) * Math.PI) / 180.0;

    const x = deltaLonRad * CoordinateTransformer.EARTH_RADIUS * Math.cos(originLatRad);
    const z = -deltaLatRad * CoordinateTransformer.EARTH_RADIUS; // -Z is North, +Z is South

    return {
      x: parseFloat(x.toFixed(3)),
      z: parseFloat(z.toFixed(3))
    };
  }

  /**
   * Transforms local game world meters (X, Z) back to WGS84 (Lat, Lon).
   */
  public toWGS84(x: number, z: number): GeoCoordinate {
    const originLatRad = (this.originLat * Math.PI) / 180.0;

    const deltaLatRad = -z / CoordinateTransformer.EARTH_RADIUS;
    const deltaLonRad = x / (CoordinateTransformer.EARTH_RADIUS * Math.cos(originLatRad));

    const lat = this.originLat + (deltaLatRad * 180.0) / Math.PI;
    const lon = this.originLon + (deltaLonRad * 180.0) / Math.PI;

    return {
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lon.toFixed(6)),
      altitude: this.originAlt
    };
  }

  public getOrigin(): ProjectionOrigin {
    return {
      originLat: this.originLat,
      originLon: this.originLon,
      originAlt: this.originAlt
    };
  }
}
