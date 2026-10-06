# KINGMAKER: Rise of Africa — GIS Data Provenance & Ingestion Specifications

## 1. Geographic Source & License

- **Source**: OpenStreetMap (OSM) & Humanitarian OpenStreetMap Team (HOT) Open Data Extract for Nairobi Metropolitan Area.
- **License**: Open Database License (ODbL) 1.0 ([https://opendatacommons.org/licenses/odbl/](https://opendatacommons.org/licenses/odbl/)).
- **Import Date**: October 2026.
- **Geographic Bounding Box (WGS84)**:
  - **Min Latitude**: `-1.3020° S`
  - **Max Latitude**: `-1.2930° S`
  - **Min Longitude**: `36.7950° E`
  - **Max Longitude**: `36.8120° E`
- **Reference Origin Point**:
  - **Latitude**: `-1.2975° S` (Ngong Road / Upper Hill Junction)
  - **Longitude**: `36.8050° E`
  - **Altitude Baseline**: `1680.0m` (Nairobi mean sea level elevation)

---

## 2. Coordinate System & Projection Math

The ingestion layer converts geographic WGS84 coordinates ($\text{Latitude}, \text{Longitude}$) into local game-world 3D Cartesian meters ($X, Y, Z$).

### Transformation Formulas
Given origin $(\phi_0, \lambda_0) = (-1.2975^\circ, 36.8050^\circ)$ and Earth radius $R = 6,371,000\text{ meters}$:

$$X = (\lambda - \lambda_0) \times \frac{\pi}{180} \times R \times \cos\left(\phi_0 \times \frac{\pi}{180}\right)$$
$$Z = -(\phi - \phi_0) \times \frac{\pi}{180} \times R$$

### Axis Orientation & Scale
- **Scale**: $1.0\text{ game unit} = 1.0\text{ real-world meter}$.
- **Axes**:
  - $+X$: East
  - $-X$: West
  - $-Z$: North
  - $+Z$: South
  - $+Y$: Height / Altitude above terrain

---

## 3. Ingestion & Validation Pipeline

```text
GeoJSON (WGS84 Lat/Lon)
       ↓
CoordinateTransformer (Local Cartesian Meters)
       ↓
GISValidator (Polygon area check, self-intersection check, height/floor bounds)
       ↓
Normalized Domain Types (RoadSegment, BuildingFootprint, DistrictData)
       ↓
Procedural 3D Generator (Three.js Scene)
```

- **Building Footprint Criteria**: Minimum area $\ge 4.0\text{m}^2$, non-self-intersecting 2D polygon vertices.
- **Height & Floor Estimations**: Derived from `building:levels` or `height` tags (3.4 meters per floor standard).
- **Land-Use Classification**: Classifies OSM tags (`commercial`, `apartments`, `retail`, `kiosk`) into game zones (`cbd_commercial`, `residential_estate`, `commercial_corridor`, `informal_market`).

---

## 4. Current Limitations

- **Coverage Window**: Phase 0.6 ingests a 2.5km x 2.5km core corridor (Ngong Road, Upper Hill, Kilimani). Full city scaling will utilize spatial tile chunking.
- **Elevation Contour**: Simplified undulating hill slope topology. High-resolution terrain elevation (SRTM 30m DEM) will be integrated in future terrain streaming milestones.
