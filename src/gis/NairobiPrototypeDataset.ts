import { DistrictData } from './GISDataTypes';

/**
 * PROTOTYPE DEVELOPMENT FIXTURE
 * Note: This file contains hand-authored representative sample data used during Phase 0.5 prototyping.
 * For authoritative real-world geographic data ingested via GIS, see `src/gis/data/nairobi_kilimani_real.geojson`
 * and `GeoJSONIngestionEngine.ts` (Phase 0.6).
 */
export const NAIROBI_PROTOTYPE_DATASET: DistrictData = {
  id: 'district_kilimani_prototype',
  fictionalName: 'Kilimani Prototype Grid',
  nairobiInspiredName: 'Kilimani / Upper Hill Corridor (Fixture)',
  bounds: { minX: -180, maxX: 180, minZ: -180, maxZ: 180 },

  roads: [
    {
      id: 'road_ngong_arterial',
      name: 'Ngong Corridor Highway (Fixture)',
      category: 'highway',
      width: 14,
      lanes: 4,
      path: [
        { x: -160, z: -140 },
        { x: -90,  z: -90 },
        { x: -20,  z: -30 },
        { x: 0,    z: 0 },
        { x: 40,   z: 35 },
        { x: 100,  z: 85 },
        { x: 160,  z: 135 }
      ],
      hasSidewalks: true
    }
  ],

  intersections: [
    {
      id: 'int_central_roundabout',
      position: { x: 0, z: 0 },
      connectedRoadIds: ['road_ngong_arterial'],
      type: 'roundabout',
      radius: 14
    }
  ],

  buildings: [
    {
      id: 'bld_towers_1',
      name: 'Apex Horizon Plaza (Fixture)',
      polygon: [
        { x: 25, z: 15 }, { x: 45, z: 15 }, { x: 45, z: 40 }, { x: 25, z: 40 }
      ],
      floors: 22,
      height: 72,
      zone: 'cbd_commercial',
      architecturalStyle: 'modern_glass',
      hasGroundFloorShops: true,
      shopNames: ['Equator Bank'],
      rooftopEquipment: ['antenna', 'water_tank']
    }
  ],

  landUseZones: []
};
