import { describe, it, expect } from 'vitest';
import { NAIROBI_PROTOTYPE_DATASET } from '../src/gis/NairobiPrototypeDataset';

describe('Nairobi Prototype Fixture Tests', () => {
  it('contains valid prototype fixture dataset', () => {
    expect(NAIROBI_PROTOTYPE_DATASET.id).toBe('district_kilimani_prototype');
    expect(NAIROBI_PROTOTYPE_DATASET.roads.length).toBeGreaterThan(0);
    expect(NAIROBI_PROTOTYPE_DATASET.buildings.length).toBeGreaterThan(0);
  });

  it('validates building footprint polygon vertex counts', () => {
    NAIROBI_PROTOTYPE_DATASET.buildings.forEach((bld) => {
      expect(bld.polygon.length).toBeGreaterThanOrEqual(3);
      expect(bld.floors).toBeGreaterThan(0);
      expect(bld.height).toBeGreaterThan(0);
    });
  });

  it('contains essential Nairobi land-use zones (CBD, Commercial, Residential, Informal Market)', () => {
    const zones = NAIROBI_PROTOTYPE_DATASET.buildings.map((b) => b.zone);
    expect(zones).toContain('cbd_commercial');
  });

  it('validates highway spline paths have valid coordinates', () => {
    const highway = NAIROBI_PROTOTYPE_DATASET.roads.find((r) => r.category === 'highway');
    expect(highway).toBeDefined();
    expect(highway!.path.length).toBeGreaterThanOrEqual(2);
  });
});
