import * as THREE from 'three';
import { LandUseZoneType, GeoPoint } from '../gis/GISDataTypes';

export type BuildingCategory =
  | 'commercial_tower'
  | 'office_block'
  | 'apartment_block'
  | 'residential_house'
  | 'shop'
  | 'market_structure'
  | 'warehouse'
  | 'institution'
  | 'mixed_use';

export interface BuildingEntrance {
  id: string;
  position: THREE.Vector3;
  type: 'main' | 'service' | 'side';
}

export interface BuildingData {
  id: string;
  name?: string;
  footprintPolygon: GeoPoint[];
  center: THREE.Vector3;
  height: number;
  floors: number;
  zone: LandUseZoneType;
  districtId: string;
  buildingCategory: BuildingCategory;
  entrances: BuildingEntrance[];
  hasGroundFloorShops: boolean;
  shopNames?: string[];
  rooftopEquipment: Array<'water_tank' | 'solar_panel' | 'ac_unit' | 'antenna'>;
}

export class BuildingDataNormalizer {
  public static normalize(raw: {
    id: string;
    name?: string;
    polygon: GeoPoint[];
    floors: number;
    height: number;
    zone: LandUseZoneType;
    shopNames?: string[];
    rooftopEquipment?: Array<'water_tank' | 'solar_panel' | 'ac_unit' | 'antenna'>;
  }, districtId: string = 'district_nairobi'): BuildingData {
    let centerX = 0;
    let centerZ = 0;
    raw.polygon.forEach((pt) => {
      centerX += pt.x;
      centerZ += pt.z;
    });
    const count = raw.polygon.length || 1;
    const center = new THREE.Vector3(centerX / count, 0, centerZ / count);

    const buildingCategory = this.determineCategory(raw.zone, raw.floors);

    const entrances: BuildingEntrance[] = [
      {
        id: `${raw.id}_ent_1`,
        position: new THREE.Vector3(center.x, 0, center.z + 5.0),
        type: 'main'
      }
    ];

    return {
      id: raw.id,
      name: raw.name,
      footprintPolygon: raw.polygon,
      center,
      height: raw.height,
      floors: raw.floors,
      zone: raw.zone,
      districtId,
      buildingCategory,
      entrances,
      hasGroundFloorShops: raw.shopNames !== undefined || raw.zone === 'informal_market' || raw.floors > 3,
      shopNames: raw.shopNames,
      rooftopEquipment: raw.rooftopEquipment || (raw.floors > 10 ? ['antenna', 'water_tank', 'ac_unit'] : ['water_tank'])
    };
  }

  private static determineCategory(zone: LandUseZoneType, floors: number): BuildingCategory {
    if (zone === 'informal_market') return 'market_structure';
    if (zone === 'cbd_commercial') return floors > 12 ? 'commercial_tower' : 'office_block';
    if (zone === 'residential_estate') return floors > 3 ? 'apartment_block' : 'residential_house';
    if (zone === 'industrial_zone') return 'warehouse';
    return floors > 4 ? 'mixed_use' : 'shop';
  }
}
