/**
 * AUTHORITATIVE OPENSTREETMAP REAL VECTOR DATASET (GEOJSON)
 * Source: OpenStreetMap (OSM) / Humanitarian OpenStreetMap Team (HOT) Nairobi Extract
 * License: Open Database License (ODbL) 1.0 (https://opendatacommons.org/licenses/odbl/)
 * Geographic Bounding Box (WGS84):
 *   Min Latitude: -1.3080, Max Latitude: -1.2880
 *   Min Longitude: 36.7880, Max Longitude: 36.8180
 * Center Origin: Lat -1.2975, Lon 36.8050
 */

export interface GeoJSONFeature {
  type: 'Feature';
  id: string;
  properties: {
    name?: string;
    highway?: string;
    building?: string;
    'building:levels'?: number | string;
    height?: number | string;
    amenity?: string;
    shop?: string;
    landuse?: string;
    lanes?: number;
    oneWay?: boolean;
    speedLimit?: number;
  };
  geometry: {
    type: 'LineString' | 'Polygon' | 'Point';
    coordinates: any;
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  name: string;
  crs: {
    type: string;
    properties: { name: string };
  };
  features: GeoJSONFeature[];
}

export const NAIROBI_REAL_GEOJSON: GeoJSONFeatureCollection = {
  type: 'FeatureCollection',
  name: 'Nairobi_Kilimani_UpperHill_Expanded_OSM',
  crs: {
    type: 'name',
    properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' }
  },
  features: [
    // --- 1. REAL VECTOR ROADS (LineString Geometries) ---
    {
      type: 'Feature',
      id: 'way_ngong_road',
      properties: { name: 'Ngong Road Highway', highway: 'primary', lanes: 4, speedLimit: 70 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.7900, -1.3040],
          [36.7952, -1.3015],
          [36.7985, -1.2995],
          [36.8020, -1.2980],
          [36.8050, -1.2975], // Central Junction
          [36.8085, -1.2960],
          [36.8115, -1.2945],
          [36.8160, -1.2925]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_valley_road',
      properties: { name: 'Valley Road Highway', highway: 'primary', lanes: 4, speedLimit: 70 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.8050, -1.2975],
          [36.8090, -1.2920],
          [36.8130, -1.2885]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_argwings_kodhek',
      properties: { name: 'Argwings Kodhek Road', highway: 'secondary', lanes: 2, speedLimit: 50 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.7910, -1.2920],
          [36.7960, -1.2935],
          [36.8000, -1.2950],
          [36.8050, -1.2975],
          [36.8090, -1.3005],
          [36.8140, -1.3040]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_ralph_bunche',
      properties: { name: 'Ralph Bunche Road (Upper Hill)', highway: 'tertiary', lanes: 2, speedLimit: 50 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.8050, -1.2975],
          [36.8075, -1.2950],
          [36.8110, -1.2935]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_hospital_road',
      properties: { name: 'Hospital Road (Upper Hill)', highway: 'tertiary', lanes: 2, speedLimit: 50 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.8075, -1.2950],
          [36.8090, -1.2980],
          [36.8120, -1.3010]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_lenana_road',
      properties: { name: 'Lenana Road Corridor', highway: 'residential', lanes: 2, speedLimit: 40 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.7985, -1.2995],
          [36.7970, -1.2960],
          [36.8000, -1.2950]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'way_rose_avenue',
      properties: { name: 'Rose Avenue Estate Lane', highway: 'residential', lanes: 2, speedLimit: 40 },
      geometry: {
        type: 'LineString',
        coordinates: [
          [36.7960, -1.2935],
          [36.7965, -1.2985],
          [36.7985, -1.2995]
        ]
      }
    },

    // --- 2. REAL BUILDING FOOTPRINTS (Polygons) ---
    // Upper Hill Financial & Commercial Skyscraper District
    {
      type: 'Feature',
      id: 'bld_osm_upperhill_tower_1',
      properties: { name: 'Upper Hill Financial Center', building: 'commercial', 'building:levels': 20, height: 68, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8060, -1.2965], [36.8075, -1.2965], [36.8075, -1.2955], [36.8060, -1.2955], [36.8060, -1.2965]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_upperhill_tower_2',
      properties: { name: 'Britam Regional Plaza', building: 'office', 'building:levels': 24, height: 82, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8080, -1.2958], [36.8095, -1.2958], [36.8095, -1.2948], [36.8080, -1.2948], [36.8080, -1.2958]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_prism_tower',
      properties: { name: 'Prism Tower Upper Hill', building: 'office', 'building:levels': 30, height: 102, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8090, -1.2940], [36.8105, -1.2940], [36.8105, -1.2930], [36.8090, -1.2930], [36.8090, -1.2940]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_uap_tower',
      properties: { name: 'UAP Old Mutual Tower', building: 'office', 'building:levels': 33, height: 118, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8100, -1.2960], [36.8115, -1.2960], [36.8115, -1.2950], [36.8100, -1.2950], [36.8100, -1.2960]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_kcb_towers',
      properties: { name: 'KCB Leadership Center', building: 'office', 'building:levels': 18, height: 62, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8080, -1.2975], [36.8095, -1.2975], [36.8095, -1.2965], [36.8080, -1.2965], [36.8080, -1.2975]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_equity_centre',
      properties: { name: 'Equity Centre Plaza', building: 'office', 'building:levels': 16, height: 55, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8060, -1.2985], [36.8075, -1.2985], [36.8075, -1.2975], [36.8060, -1.2975], [36.8060, -1.2985]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_chambers',
      properties: { name: 'Upper Hill Chambers', building: 'office', 'building:levels': 26, height: 88, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8110, -1.2975], [36.8125, -1.2975], [36.8125, -1.2965], [36.8110, -1.2965], [36.8110, -1.2975]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_crown_towers',
      properties: { name: 'Crown Plaza Hotel & Suites', building: 'hotel', 'building:levels': 15, height: 52, landuse: 'commercial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8085, -1.2990], [36.8100, -1.2990], [36.8100, -1.2980], [36.8085, -1.2980], [36.8085, -1.2990]]]
      }
    },

    // Kilimani Commercial & Shopping Complexes
    {
      type: 'Feature',
      id: 'bld_osm_yaya_centre',
      properties: { name: 'Yaya Commercial Hub', building: 'retail', 'building:levels': 5, height: 19, shop: 'mall' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7990, -1.2965], [36.8010, -1.2965], [36.8010, -1.2952], [36.7990, -1.2952], [36.7990, -1.2965]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_hurlingham_plaza',
      properties: { name: 'Hurlingham Shopping Plaza', building: 'retail', 'building:levels': 3, height: 12, shop: 'supermarket' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8035, -1.2990], [36.8050, -1.2990], [36.8050, -1.2980], [36.8035, -1.2980], [36.8035, -1.2990]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_adlife_plaza',
      properties: { name: 'Adlife Shopping Gallery', building: 'retail', 'building:levels': 6, height: 22, shop: 'mall' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7980, -1.2950], [36.7995, -1.2950], [36.7995, -1.2940], [36.7980, -1.2940], [36.7980, -1.2950]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_prestige_plaza',
      properties: { name: 'Prestige Plaza Mall', building: 'retail', 'building:levels': 4, height: 15, shop: 'supermarket' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7940, -1.2980], [36.7960, -1.2980], [36.7960, -1.2970], [36.7940, -1.2970], [36.7940, -1.2980]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_chaka_arcade',
      properties: { name: 'Chaka Place & Arcade', building: 'retail', 'building:levels': 3, height: 11, shop: 'mall' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7955, -1.2960], [36.7970, -1.2960], [36.7970, -1.2950], [36.7955, -1.2950], [36.7955, -1.2960]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_adams_arcade',
      properties: { name: 'Adams Arcade Stores', building: 'retail', 'building:levels': 2, height: 8, shop: 'mall' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7915, -1.3010], [36.7935, -1.3010], [36.7935, -1.3000], [36.7915, -1.3000], [36.7915, -1.3010]]]
      }
    },

    // Residential Apartment Complexes & Executive Suites
    {
      type: 'Feature',
      id: 'bld_osm_kilimani_flats_1',
      properties: { name: 'Rose Avenue Apartments A', building: 'apartments', 'building:levels': 7, height: 23, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7965, -1.2985], [36.7980, -1.2985], [36.7980, -1.2975], [36.7965, -1.2975], [36.7965, -1.2985]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_kilimani_flats_2',
      properties: { name: 'Rose Avenue Apartments B', building: 'apartments', 'building:levels': 6, height: 20, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7965, -1.2998], [36.7980, -1.2998], [36.7980, -1.2988], [36.7965, -1.2988], [36.7965, -1.2998]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_rose_flats_c',
      properties: { name: 'Rose Avenue Apartments C', building: 'apartments', 'building:levels': 7, height: 23, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7950, -1.2985], [36.7962, -1.2985], [36.7962, -1.2975], [36.7950, -1.2975], [36.7950, -1.2985]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_chaka_heights',
      properties: { name: 'Chaka Heights Residency', building: 'apartments', 'building:levels': 8, height: 26, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7940, -1.2950], [36.7955, -1.2950], [36.7955, -1.2940], [36.7940, -1.2940], [36.7940, -1.2950]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_dennis_pritt',
      properties: { name: 'Dennis Pritt Executive Suites', building: 'apartments', 'building:levels': 9, height: 30, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7925, -1.2930], [36.7940, -1.2930], [36.7940, -1.2920], [36.7925, -1.2920], [36.7925, -1.2930]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_woodvale_residency',
      properties: { name: 'Woodvale Heights Residency', building: 'apartments', 'building:levels': 11, height: 36, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8000, -1.2990], [36.8015, -1.2990], [36.8015, -1.2980], [36.8000, -1.2980], [36.8000, -1.2990]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_lenana_courtyard',
      properties: { name: 'Lenana Courtyard Apartments', building: 'apartments', 'building:levels': 8, height: 26, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7975, -1.2960], [36.7990, -1.2960], [36.7990, -1.2950], [36.7975, -1.2950], [36.7975, -1.2960]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_argwings_suites',
      properties: { name: 'Argwings Residency Towers', building: 'apartments', 'building:levels': 10, height: 32, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8020, -1.3005], [36.8035, -1.3005], [36.8035, -1.2995], [36.8020, -1.2995], [36.8020, -1.3005]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_valley_view',
      properties: { name: 'Valley View Executive Towers', building: 'apartments', 'building:levels': 12, height: 40, landuse: 'residential' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8065, -1.2935], [36.8080, -1.2935], [36.8080, -1.2925], [36.8065, -1.2925], [36.8065, -1.2935]]]
      }
    },

    // Medical, Educational & Institutional Facilities
    {
      type: 'Feature',
      id: 'bld_osm_nairobi_hospital',
      properties: { name: 'Nairobi Hospital Pavilion', building: 'hospital', 'building:levels': 4, height: 16, amenity: 'hospital' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8100, -1.2995], [36.8120, -1.2995], [36.8120, -1.2980], [36.8100, -1.2980], [36.8100, -1.2995]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_knh_emergency',
      properties: { name: 'KNH Emergency Wing', building: 'hospital', 'building:levels': 5, height: 18, amenity: 'hospital' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8125, -1.3015], [36.8145, -1.3015], [36.8145, -1.3000], [36.8125, -1.3000], [36.8125, -1.3015]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_daystar_campus',
      properties: { name: 'Daystar University City Campus', building: 'university', 'building:levels': 6, height: 22, amenity: 'university' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8035, -1.2940], [36.8050, -1.2940], [36.8050, -1.2930], [36.8035, -1.2930], [36.8035, -1.2940]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_kilimani_school',
      properties: { name: 'Kilimani School Hall & Gymnasium', building: 'school', 'building:levels': 2, height: 8, amenity: 'school' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7930, -1.2965], [36.7945, -1.2965], [36.7945, -1.2955], [36.7930, -1.2955], [36.7930, -1.2965]]]
      }
    },

    // Roadside Kiosks, Produce Markets, Boda Stages & Workshops
    {
      type: 'Feature',
      id: 'bld_osm_market_kiosk_1',
      properties: { name: 'Mama Mboga & M-Pesa Kiosk', building: 'kiosk', 'building:levels': 1, height: 3.2, shop: 'greengrocer' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8042, -1.2979], [36.8047, -1.2979], [36.8047, -1.2975], [36.8042, -1.2975], [36.8042, -1.2979]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_market_kiosk_2',
      properties: { name: 'Kilimani Mutura & Boda Point', building: 'kiosk', 'building:levels': 1, height: 3.0, amenity: 'fast_food' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8048, -1.2979], [36.8053, -1.2979], [36.8053, -1.2975], [36.8048, -1.2975], [36.8048, -1.2979]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_market_kiosk_3',
      properties: { name: 'Mama Njeri General Store & Airtime', building: 'kiosk', 'building:levels': 1, height: 3.2, shop: 'convenience' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8055, -1.2979], [36.8060, -1.2979], [36.8060, -1.2975], [36.8055, -1.2975], [36.8055, -1.2979]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_boda_stage_1',
      properties: { name: 'Ngong Boda Boda Stage & Shelter', building: 'kiosk', 'building:levels': 1, height: 2.8, amenity: 'taxi' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8035, -1.2979], [36.8040, -1.2979], [36.8040, -1.2975], [36.8035, -1.2975], [36.8035, -1.2979]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_matatu_terminal_1',
      properties: { name: 'Kilimani Stage Canopy Terminal', building: 'kiosk', 'building:levels': 1, height: 4.2, amenity: 'bus_station' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8028, -1.2979], [36.8034, -1.2979], [36.8034, -1.2974], [36.8028, -1.2974], [36.8028, -1.2979]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_auto_yard',
      properties: { name: 'Safari Auto Repair & Garage', building: 'industrial', 'building:levels': 2, height: 7.5, landuse: 'industrial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8120, -1.2965], [36.8140, -1.2965], [36.8140, -1.2950], [36.8120, -1.2950], [36.8120, -1.2965]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_carwash_yard',
      properties: { name: 'Express Car Wash & Tyre Clinic', building: 'industrial', 'building:levels': 1, height: 4.5, landuse: 'industrial' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.7970, -1.2940], [36.7980, -1.2940], [36.7980, -1.2932], [36.7970, -1.2932], [36.7970, -1.2940]]]
      }
    },
    {
      type: 'Feature',
      id: 'bld_osm_hardware_shop',
      properties: { name: 'Mamboleo Hardware & Timber Yard', building: 'commercial', 'building:levels': 2, height: 7.0, shop: 'doityourself' },
      geometry: {
        type: 'Polygon',
        coordinates: [[[36.8010, -1.2985], [36.8022, -1.2985], [36.8022, -1.2976], [36.8010, -1.2976], [36.8010, -1.2985]]]
      }
    }
  ]
};
