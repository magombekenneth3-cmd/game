import * as THREE from 'three';
import { DistrictData, RoadSegment, LandUseZoneType } from './GISDataTypes';
import { GeoJSONFeatureCollection } from './data/nairobi_kilimani_real';
import { CoordinateTransformer } from './CoordinateTransformer';
import { GISValidator, ValidationReport, ValidationIssue } from './GISValidator';
import { BuildingData, BuildingDataNormalizer } from '../world/BuildingData';
import { RoadGraph, RoadGraphEdge } from '../world/RoadGraph';

export class GeoJSONIngestionEngine {
  private transformer: CoordinateTransformer;
  private validator: GISValidator;

  constructor(transformer?: CoordinateTransformer) {
    this.transformer = transformer || new CoordinateTransformer(-1.2975, 36.8050, 1680.0);
    this.validator = new GISValidator();
  }

  public ingestGeoJSON(geoJson: GeoJSONFeatureCollection): {
    district: DistrictData;
    normalizedBuildings: BuildingData[];
    roadGraph: RoadGraph;
    report: ValidationReport;
  } {
    const roads: RoadSegment[] = [];
    const rawBuildings: any[] = [];
    const normalizedBuildings: BuildingData[] = [];
    const roadGraph = new RoadGraph();

    const issues: ValidationIssue[] = [];
    let validBuildingCount = 0;
    let rejectedBuildingCount = 0;
    let validRoadCount = 0;
    let rejectedRoadCount = 0;

    geoJson.features.forEach((feature) => {
      const geomType = feature.geometry.type;

      if (geomType === 'LineString') {
        const rawCoords: [number, number][] = feature.geometry.coordinates;
        const path = rawCoords.map(([lon, lat]) => this.transformer.toGameWorld(lat, lon));

        const category = this.mapHighwayCategory(feature.properties.highway);
        const road: RoadSegment = {
          id: feature.id,
          name: feature.properties.name || 'Unnamed Street',
          category,
          width: category === 'highway' ? 14 : category === 'arterial' ? 10 : 8,
          lanes: feature.properties.lanes || (category === 'highway' ? 4 : 2),
          path,
          hasSidewalks: true
        };

        const roadIssues = this.validator.validateRoadSegment(road);
        if (roadIssues.length === 0) {
          roads.push(road);
          validRoadCount++;

          // Construct RoadGraph Nodes and Edges
          const startVec = new THREE.Vector3(path[0].x, 0, path[0].z);
          const endVec = new THREE.Vector3(path[path.length - 1].x, 0, path[path.length - 1].z);

          const startNodeId = `node_${road.id}_start`;
          const endNodeId = `node_${road.id}_end`;

          roadGraph.addNode(startNodeId, startVec);
          roadGraph.addNode(endNodeId, endVec);

          const edgeGeometry = path.map((pt) => new THREE.Vector3(pt.x, 0, pt.z));
          const roadEdge: RoadGraphEdge = {
            id: road.id,
            name: road.name,
            startNodeId,
            endNodeId,
            width: road.width,
            lanes: road.lanes,
            roadClass: category,
            oneWay: feature.properties.oneWay || false,
            speedLimit: feature.properties.speedLimit || (category === 'highway' ? 70 : 50),
            geometry: edgeGeometry
          };

          roadGraph.addEdge(roadEdge);
        } else {
          rejectedRoadCount++;
          issues.push(...roadIssues);
        }
      } else if (geomType === 'Polygon') {
        const rawRing: [number, number][] = feature.geometry.coordinates[0];
        const ringToUse = rawRing[0][0] === rawRing[rawRing.length - 1][0] && rawRing[0][1] === rawRing[rawRing.length - 1][1]
          ? rawRing.slice(0, -1)
          : rawRing;

        const polygon = ringToUse.map(([lon, lat]) => this.transformer.toGameWorld(lat, lon));

        const levels = typeof feature.properties['building:levels'] === 'number'
          ? feature.properties['building:levels']
          : parseInt(String(feature.properties['building:levels'] || 1), 10);

        const parsedHeight = typeof feature.properties.height === 'number'
          ? feature.properties.height
          : parseFloat(String(feature.properties.height || (levels * 3.4)));

        const zone = this.mapBuildingZone(feature.properties);
        const style = this.mapArchitecturalStyle(zone, levels);

        const rawBld = {
          id: feature.id,
          name: feature.properties.name,
          polygon,
          floors: levels,
          height: parsedHeight,
          zone,
          architecturalStyle: style,
          hasGroundFloorShops: feature.properties.shop !== undefined || zone === 'informal_market' || levels > 3,
          shopNames: feature.properties.name ? [feature.properties.name] : undefined,
          rooftopEquipment: levels > 10 ? ['antenna', 'water_tank', 'ac_unit'] as const : ['water_tank'] as const
        };

        const bldIssues = this.validator.validateBuildingFootprint(rawBld as any);
        if (bldIssues.length === 0) {
          rawBuildings.push(rawBld);
          validBuildingCount++;

          const normalized = BuildingDataNormalizer.normalize(rawBld as any);
          normalizedBuildings.push(normalized);
        } else {
          rejectedBuildingCount++;
          issues.push(...bldIssues);
        }
      }
    });

    const district: DistrictData = {
      id: 'district_nairobi_kilimani_real',
      fictionalName: 'Kilimani Crest & Upper Hill Corridor',
      nairobiInspiredName: 'Kilimani / Upper Hill OSM Vector Extract',
      bounds: { minX: -500, maxX: 500, minZ: -500, maxZ: 500 },
      roads,
      intersections: [
        {
          id: 'int_ngong_roundabout_osm',
          position: { x: 0, z: 0 },
          connectedRoadIds: ['way_ngong_road', 'way_argwings_kodhek'],
          type: 'roundabout',
          radius: 14
        }
      ],
      buildings: rawBuildings,
      landUseZones: []
    };

    const report: ValidationReport = {
      isValid: issues.filter((i) => i.type === 'error').length === 0,
      issues,
      validBuildingCount,
      validRoadCount,
      rejectedBuildingCount,
      rejectedRoadCount
    };

    return { district, normalizedBuildings, roadGraph, report };
  }

  private mapHighwayCategory(highway?: string): RoadSegment['category'] {
    switch (highway) {
      case 'primary':
      case 'motorway':
      case 'trunk':
        return 'highway';
      case 'secondary':
        return 'arterial';
      case 'tertiary':
        return 'secondary';
      case 'residential':
      default:
        return 'residential';
    }
  }

  private mapBuildingZone(props: Record<string, any>): LandUseZoneType {
    if (props.building === 'kiosk' || props.shop === 'greengrocer') return 'informal_market';
    if (props.building === 'commercial' || props.building === 'office' || props.landuse === 'commercial') return 'cbd_commercial';
    if (props.building === 'retail' || props.shop === 'mall') return 'commercial_corridor';
    if (props.building === 'apartments' || props.landuse === 'residential') return 'residential_estate';
    return 'commercial_corridor';
  }

  private mapArchitecturalStyle(zone: LandUseZoneType, levels: number): any {
    if (zone === 'informal_market') return 'sheet_metal_kiosk';
    if (zone === 'cbd_commercial' || levels > 12) return 'modern_glass';
    if (zone === 'residential_estate') return 'terracotta_plaster';
    return 'ochre_brick';
  }
}
