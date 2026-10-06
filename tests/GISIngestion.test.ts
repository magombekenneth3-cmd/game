import { describe, it, expect } from 'vitest';
import { CoordinateTransformer } from '../src/gis/CoordinateTransformer';
import { GISValidator } from '../src/gis/GISValidator';
import { GeoJSONIngestionEngine } from '../src/gis/GeoJSONIngestionEngine';
import { NAIROBI_REAL_GEOJSON } from '../src/gis/data/nairobi_kilimani_real';

describe('Phase 0.6 Real GIS Ingestion & Transformation Tests', () => {
  it('correctly transforms origin coordinate (-1.2975, 36.8050) to game origin (0, 0)', () => {
    const transformer = new CoordinateTransformer(-1.2975, 36.8050);
    const pos = transformer.toGameWorld(-1.2975, 36.8050);
    expect(pos.x).toBe(0);
    expect(pos.z).toBe(0);
  });

  it('performs accurate round-trip WGS84 <-> Game World conversion', () => {
    const transformer = new CoordinateTransformer(-1.2975, 36.8050);
    const testLat = -1.2965;
    const testLon = 36.8060;

    const gamePos = transformer.toGameWorld(testLat, testLon);
    const wgsPos = transformer.toWGS84(gamePos.x, gamePos.z);

    expect(wgsPos.latitude).toBeCloseTo(testLat, 4);
    expect(wgsPos.longitude).toBeCloseTo(testLon, 4);
  });

  it('calculates polygon area accurately using Shoelace formula', () => {
    const validator = new GISValidator();
    // 10m x 10m square = 100m²
    const square = [
      { x: 0, z: 0 },
      { x: 10, z: 0 },
      { x: 10, z: 10 },
      { x: 0, z: 10 }
    ];
    expect(validator.calculatePolygonArea(square)).toBe(100);
  });

  it('detects self-intersecting invalid polygons', () => {
    const validator = new GISValidator();
    // Bow-tie polygon (self-intersecting figure 8)
    const bowtie = [
      { x: 0, z: 0 },
      { x: 10, z: 10 },
      { x: 10, z: 0 },
      { x: 0, z: 10 }
    ];
    expect(validator.isSelfIntersecting(bowtie)).toBe(true);
  });

  it('ingests real Nairobi GeoJSON feature collection without validation errors', () => {
    const engine = new GeoJSONIngestionEngine();
    const { district, report } = engine.ingestGeoJSON(NAIROBI_REAL_GEOJSON);

    expect(report.isValid).toBe(true);
    expect(report.rejectedBuildingCount).toBe(0);
    expect(report.rejectedRoadCount).toBe(0);

    expect(district.roads.length).toBeGreaterThan(0);
    expect(district.buildings.length).toBeGreaterThan(0);

    // Verify Ngong Road primary highway features
    const ngongRoad = district.roads.find((r) => r.id === 'way_ngong_road');
    expect(ngongRoad).toBeDefined();
    expect(ngongRoad!.category).toBe('highway');
    expect(ngongRoad!.width).toBe(14);
  });
});
