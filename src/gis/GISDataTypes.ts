export type LandUseZoneType =
  | 'cbd_commercial'       // High-rise glass & steel office towers
  | 'commercial_corridor'  // Mid-rise mixed-use storefronts & offices
  | 'residential_estate'  // Apartments, gated compounds, townhouses
  | 'informal_market'     // Low-rise kiosks, vibanda, corrugated metal stalls
  | 'industrial_zone'      // Warehouses, auto workshops, logistics
  | 'park_greenery';       // Parks, urban gardens, tree belts

export interface GeoPoint {
  x: number; // Easting (meters in game world)
  z: number; // Northing (meters in game world)
}

export interface GeoNode {
  id: string;
  position: GeoPoint;
  elevation?: number;
}

export interface RoadSegment {
  id: string;
  name: string;
  category: 'highway' | 'arterial' | 'secondary' | 'residential' | 'service';
  width: number;
  lanes: number;
  path: GeoPoint[];
  hasSidewalks: boolean;
}

export interface IntersectionNode {
  id: string;
  position: GeoPoint;
  connectedRoadIds: string[];
  type: 'roundabout' | 'signalized' | 'uncontrolled';
  radius?: number;
}

export interface BuildingFootprint {
  id: string;
  name?: string;
  polygon: GeoPoint[]; // 2D polygon vertices
  floors: number;
  height: number;
  zone: LandUseZoneType;
  architecturalStyle?: 'modern_glass' | 'terracotta_plaster' | 'ochre_brick' | 'concrete_brutalist' | 'sheet_metal_kiosk';
  hasGroundFloorShops: boolean;
  shopNames?: string[];
  rooftopEquipment?: Array<'water_tank' | 'solar_panel' | 'ac_unit' | 'antenna'>;
}

export interface DistrictData {
  id: string;
  fictionalName: string;
  nairobiInspiredName: string;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  roads: RoadSegment[];
  intersections: IntersectionNode[];
  buildings: BuildingFootprint[];
  landUseZones: Array<{ type: LandUseZoneType; polygon: GeoPoint[] }>;
}

export interface TerrainTileData {
  size: number;
  resolution: number;
  getElevation(x: number, z: number): number;
}
