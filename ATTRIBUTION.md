# KINGMAKER: Rise of Africa — Asset Licensing & Attribution Manifest

This document provides formal legal attribution, provenance records, and license documentation for all external, redistributed, and modified 3D models, textures, animations, and geospatial datasets utilized in **KINGMAKER: Rise of Africa**.

---

## 1. Summary of Licenses Used

| License | Permitted Uses | Requirements | Applicable Assets |
| :--- | :--- | :--- | :--- |
| **CC0 1.0 Universal** | Commercial, non-commercial, modification, redistribution without restriction | None (Public Domain Dedication) | Kenney Commercial, Car, Nature & Furniture Kits |
| **CC-BY 4.0 International** | Commercial, non-commercial, modification, redistribution | Attribution, link to license, state changes made | Khronos Sample Models, Ready Player Me Base, KINGMAKER Authored Art |
| **MIT License** | Commercial, non-commercial, modification, redistribution | Preserve copyright notice and permission notice | Three.js examples repository assets |
| **ODbL 1.0** | Commercial, non-commercial, extraction, transformation | Attribute OpenStreetMap contributors, Share-Alike on derivative databases | Nairobi GIS Vector Datasets |

---

## 2. Detailed Asset Attribution Inventory

### A. Kenney 3D Asset Kits (Kenney.nl)
- **Creator**: AssetForge / Kenney (https://kenney.nl)
- **License**: Creative Commons Zero 1.0 Universal (CC0 1.0)
- **Asset Packs Used**:
  - *Kenney Commercial Kit*: Modular commercial shops, multi-story office blocks, awnings, entrance steps, storefronts (`bld_nairobi_shop_01`, `bld_nairobi_shop_02`, `bld_mixed_use_01`, `bld_mixed_use_02`, `bld_office_block_01`, `bld_commercial_tower_01`, `bld_informal_kiosk_01`).
  - *Kenney Car Kit*: Sedan, compact hatchback, luxury SUV, delivery van, transport truck (`veh_sedan_01`, `veh_compact_01`, `veh_suv_landcruiser_01`, `veh_pickup_01`, `veh_van_01`, `veh_truck_01`, `veh_boda_boda_01`).
  - *Kenney Nature Kit*: Detailed trees, palm trees, shrubs (`env_acacia_tree_01`, `env_palm_tree_01`, `env_shrub_01`).
  - *Kenney Furniture Kit*: Chairs, tables, lounges (`interior_chair_01`, `interior_table_01`).
- **Modifications**: Re-scaled for 1:1 real-world metric proportions, PBR materials normalized for Three.js WebGL2 pipeline.

### B. Khronos Group glTF Sample Assets
- **Repository**: https://github.com/KhronosGroup/glTF-Sample-Assets
- **License**: CC-BY 4.0 International (https://creativecommons.org/licenses/by/4.0/) & CC0 1.0
- **Authors & Contributors**: The Khronos Group, Cesium, Microsoft, Wayfair, Google.
- **Assets Used**:
  - `Lantern.glb`: Cobra-head streetlight luminaire housing and utility pole structures (`env_streetlight_01`, `env_utility_pole_01`).
  - `ToyCar.glb`: Compact vehicle reference geometry.
  - `CesiumMilkTruck.glb`: Commercial vehicle wheelbase reference.
  - `BoomBox.glb` & `SheenChair.glb`: Club Velvet interior furnishings and VIP lounge sofas (`interior_sofa_01`, `interior_vip_lounge_sofa_01`, `interior_dj_booth_rig_01`).
  - `DiffuseTransmissionPlant.glb`: Translucent foliage reference geometry.
- **Modifications**: Embedded into self-contained binary glTF (.glb) containers with custom PBR roughness/metalness parameters.

### C. Adobe Mixamo & Three.js Humanoid Character Assets
- **Source**: Three.js Examples Repository (https://github.com/mrdoob/three.js/tree/dev/examples/models/gltf) / Adobe Mixamo
- **License**: Three.js MIT License & Adobe Mixamo Standard Character EULA (royalty-free distribution for interactive applications and games).
- **Assets Used**:
  - `char_pedestrian_student_01.glb`: Rigged female character (Michelle) featuring streetwear joggers, crop top, afro hair bun, and studio headphones (28,106 triangles, 65 bones).
  - `char_humanoid_animations.glb`: Skeletal humanoid animation library (retargeted Walk, Run, and Idle clips for character controller).

### D. Ready Player Me / Wolf3D Character Base
- **Creator**: Ready Player Me (https://readyplayer.me)
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0) & Ready Player Me Developer Terms.
- **Assets Used**:
  - Base humanoid anatomical mesh topology utilized for `char_player_01.glb` and `char_pedestrian_business_01.glb`.
- **Modifications Made by KINGMAKER Team**:
  1. Removed unauthentic western cowboy hat and facial hair nodes.
  2. Synthesized bespoke 1024x1024 PBR skin textures with authentic East African melanin tones, anatomical facial features (lips, philtrum, cheek highlights), natural hairline, and African iris eyes.
  3. Created Nairobi streetwear bomber jacket with brass zipper teeth, athletic gold ribbing, white crewneck tee, raw indigo denim jeans with copper rivets, and vulcanized sneakers for the Player character.
  4. Created tailored Italian worsted wool business suit jacket with silk burgundy tie, white poplin dress shirt, pressed dress trousers, and polished black Oxford calfskin shoes for the Business Professional NPC.
  5. Authored and attached a 3D Executive Briefcase mesh accessory (`Executive_Briefcase_Node`) parented to the Business character's right hand bone, plus adjusted shoulder posture to create a completely distinct physical silhouette.

### E. OpenStreetMap (OSM) & Humanitarian OpenStreetMap Team (HOT)
- **Source**: OpenStreetMap Nairobi Extract (Kilimani, Upper Hill, CBD)
- **Copyright**: © OpenStreetMap contributors
- **License**: Open Database License 1.0 (ODbL 1.0) (https://opendatacommons.org/licenses/odbl/)
- **Data Used**: Vector road centrelines, road widths, lane counts, building footprints, and building heights in `src/gis/data/nairobi_kilimani_real.ts`.
- **Modifications**: Transformed via `CoordinateTransformer.ts` to metric game-world coordinates centered at Nairobi origin (Lat -1.2975, Lon 36.8050).

### F. KINGMAKER Nairobi Studio Authored Original Art
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Assets**:
  - Nairobi Kenyatta Avenue Cabro Pavers (PBR diffuse, normal map, and roughness map).
  - Authentic Kenyan Sacco Matatu Liveries (Super Metro, City Hoppa, Forward Sacco, Ngong Road 126).
  - Nairobi Bilingual Green/White Enamel Street Name Signs (Kenyatta Ave, Kimathi St, Moi Ave, Wabera St, Muindi Mbingu St, Haile Selassie Ave).
  - Kenyan Street Vending Infrastructure: Green M-Pesa Authorized Agent Kiosks with metal security grilles and Mama Mboga wooden produce stalls.
  - Cast-iron hexagonal tree grates, traffic signals, zebra crossings, and concrete curbs.

### G. KINGMAKER Phase 11.6 — High-Fidelity Nairobi Vegetation (CC-BY 4.0)
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Generator Script**: `scripts/generate_high_fidelity_vegetation_models.mjs` (Node.js + Three.js GLTFExporter with custom FileReader polyfill)
- **Assets**:

| Asset ID | Filename | Meshes | Materials | File Size | Description |
|:---|:---|:---|:---|:---|:---|
| `env_jacaranda_tree_01` | `public/assets/models/environment/env_jacaranda_tree_01.glb` | 26 | 5 | 153.6 KB | *Jacaranda mimosifolia* street tree — curved sculptural trunk with root flare, 4 primary spreading limbs, 5 secondary sub-branches, 14 volumetric organic purple blossom canopy clusters. Materials: bark, violet blossom, deep purple highlight, lavender accent, green leaf. |
| `env_acacia_tree_01` | `public/assets/models/environment/env_acacia_tree_01.glb` | 19 | 4 | 61.7 KB | *Vachellia tortilis* (Umbrella Acacia) — organic tapered trunk with root flare, 6 radial umbrella branch arms, 3 tiered flat-topped canopy shelves. Materials: bark, shaded, deep, and sunlit savanna acacia foliage. |
| `env_bougainvillea_planter_01` | `public/assets/models/environment/env_bougainvillea_planter_01.glb` | 14 | 5 | 105.6 KB | Precast concrete sidewalk planter (2.4 m × 0.9 m × 0.45 m) with laterite soil and cascading magenta/fuchsia bract clusters. Materials: concrete box, laterite soil, magenta bracts, deep magenta bracts, glossy leaves. |

### H. KINGMAKER Phase 11.7 — Dynamic Matatu & Public Transport Simulation
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Features**:
  - **Nairobi Sacco Network**: Super Metro, City Hoppa, Ngong 126 Electric Express, Forward Sacco, and Kenya Bus Service (KBS).
  - **Commuter Stage Infrastructure**: Kencom / Ambassador Stage (Moi Ave), GPO / Teleposta Stage (Kenyatta Ave), Railways Bus Terminus (Haile Selassie Ave), City Hall Stage (City Hall Way), Hurlingham Plaza Stage, Yaya Transit Hub, Valley Arcade Stage.
  - **Stage Approach & Dwell State Machine**: Smooth curb deceleration curve, turn indicators, hazard blinkers, passenger door actuation, commuter boarding/alighting, tout vocal callouts, and double-honk departure.
  - **Passenger Ride Experience**: Dynamic rush-hour fares (50 KES off-peak vs 70–80 KES peak), passenger interior cabin camera perspective, onboard matatu radio audio system, and safe curbside alighting.

### I. KINGMAKER Phase 11.8 — Matatu Operator & Transit Economy
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Features**:
  - **Sacco Driver Ranking & Progression**: Squaddi (Novice), Senior Dere (Experienced), Metro Captain (Route Leader), and Manyanga Legend (Master Driver) with unlocked Ngong 126 Manyanga custom specs and neon underglow.
  - **Matatu Shift Lifecycle**: Route waypoint tracking, stage bay docking verification (< 6m, < 5 km/h), passenger door actuation, and transactional shift settlement.
  - **Conductor ("Makanga") Audio & Mechanics**: Authentic synthesized metallic roof/panel double-slap signals (`playConductorPanelSlap`), vocal tout callouts (`playToutCallout`), commuter rush queue boarding with 14-seat capacity limits.
  - **Dynamic Transit Economics & Rush Hour Scoring**: Morning (07:00–09:30) and evening (16:30–19:30) peak fare multipliers (1.4x), commuter satisfaction tip bonuses (10%–20%), Sacco management fee deductions (15%), and fuel consumption costs.
  - **Driving Telemetry & Commuter Satisfaction**: Real-time satisfaction scoring (0–100%), collision detection penalties with passenger audio gasps (`playPassengerGasp`), speed violation monitoring, and smooth cruising satisfaction recovery.
  - **Matatu Operator Shift Dashboard**: Interactive glassmorphism HUD displaying Sacco badge, route code, next stage distance meter, seat occupancy counter, live shift revenue, and commuter satisfaction meter.

### J. KINGMAKER Phase 12.0 — Street Economy & Hawker Micro-Interactions
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Features**:
  - **Authentic Nairobi Commercial Arcade & Streetscape**: Branded arcade colonnade featuring Safaricom & M-PESA Center, Java House, and Equity Bank storefronts; bilingual Kenyatta Ave / Kimathi St green street signpost on steel pole with collar; continuous black-and-yellow curb safety bollards separating pedestrians from vehicle lanes; interlocking Cabro terracotta/slate promenade tiles.
  - **Kenyatta International Convention Centre (KICC) Landmark Vista**: 28-story cylindrical tower with terracotta vertical sun-shade fins, iconic revolving restaurant saucer helipad, and Kenyan national flag crowning the CBD skyline.
  - **Mama Mboga Produce Micro-Economy**: High-fidelity produce stall with wooden crates of ripe field tomatoes (Nyanya), fresh sukuma wiki (collard greens), sweet bananas (Ndizi), Hass avocados (Parachichi), burlap sacks, chalkboard price sign, and green canvas market umbrella. Interactive shopping modal restoring health and stamina with vendor loyalty discounts (10% discount at reputation >= 25).
  - **Dual Wallet Architecture & Tiered Safaricom M-PESA Tariffs**: Dynamic player state managing on-hand Cash and digital M-PESA balances; zero-fee deposits; official 12-tier Kenyan regulation withdrawal tariffs (KES 11 to 200); realistic SMS notification generation.
  - **Mobile Hawkers & Boda Boda Transit**: Roaming street hawkers selling bottled water, phone airtime cards, and roasted groundnuts (njugu); designated Boda Boda passenger stage (rider Brian 'Nduthi' Mwangi on TVS Star 150) offering fast last-mile transit across CBD landmarks.
  - **Synthesized Street Audio Landscape**: Authentic Web Audio sound effects for M-PESA transaction chimes (`playMPESATransactionChime`), Mama Mboga vocal callouts (`playMamaMbogaCallout`), roving hawker touts (`playHawkerCallout`), and Boda Boda 4-stroke single-cylinder engine revs (`playBodaBodaRev`).
  - **Nairobi Realism Master Plan HUD Alignment**: Full viewport `#hud-overlay` integration, top-left objective tracker (`! Grow Your Business`), top-right player stats with level badge, dual wallet (`Cash` + `M-PESA`) and reputation star, bottom-left radar minimap, bottom-right quick action hotkeys (`[E] Talk`, `[F] Shop`, `[R] Enter`, `[M] Map`), and centered responsive interactive modals with number key shortcuts.

### K. KINGMAKER Phase 12.1 — Kenyan Residential Bungalow Architecture (CC-BY 4.0)
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Generator Script**: `scripts/generate_kenyan_bungalow_model.mjs`
- **Asset ID**: `bld_bungalow_01`
- **File**: `public/assets/models/buildings/bld_bungalow_01.glb` (12.0 m × 6.2 m × 14.0 m)
- **Geometry & Hierarchy**:
  - `Geo_LOD0`: High-fidelity primary mesh (~3,792 triangles) featuring authentic 4-way hipped terracotta clay tile roof with ridge capping, dark timber fascia eaves boards, perimeter rainwater gutters, 4 vertical corner downspouts with splash shoes, front veranda porch with concrete steps and 2 support pillars, panelled hardwood entry door with 3D architrave frame, glazed windows with recessed 3D sills, black wrought-iron burglar security grilles, and a black Roto rooftop water tank on a rear steel stand.
  - `Geo_LOD1`: Optimized silhouette mesh (~350 triangles) for distant chunk LOD rendering.
  - `Col_Building`: Low-cost physics collision box proxy covering the solid structure footprint.
  - `Compound_Perimeter`: Separately configurable perimeter boundary wall and black double-swing metal security gate wrapping residential parcels without distorting the house geometry.

### L. KINGMAKER Phase 12.2 — Kenyan Residential Maisonette Architecture (CC-BY 4.0)
- **Copyright**: © 2026 KINGMAKER Studio Team
- **License**: Creative Commons Attribution 4.0 International (CC-BY 4.0)
- **Generator Scripts**: `scripts/generate_kenyan_maisonette_model.mjs`, `scripts/blender_author_kenyan_maisonette.py`
- **Asset ID**: `bld_maisonette_01`
- **File**: `public/assets/models/buildings/bld_maisonette_01.glb` (10.0 m × 9.5 m × 12.0 m)
- **Geometry & Hierarchy**:
  - `Geo_LOD0`: High-fidelity 2-storey primary mesh (~4,740 triangles) featuring ground floor living area with damp-proof quarry stone plinth, covered entrance porch with support pillars and concrete entry steps, panelled timber door with brass knob, ground-floor windows with 3D frames and wrought-iron burglar bars, intermediate floor band, cantilevered first-floor balcony with decorative steel balustrades (1.05m high), double French balcony doors, upper bedroom casement windows with transoms, 4-way hipped terracotta tile roof, timber eaves fascia boards, perimeter rainwater gutters, two-storey vertical downspouts with splash shoes, and rooftop black Roto water tank on elevated steel stand.
  - `Geo_LOD1`: Optimized 2-storey silhouette mesh (~400 triangles) for distant chunk LOD rendering.
  - `Col_Building`: Low-cost convex physics box collider covering the two-storey structure footprint ($10.4\text{m} \times 9.5\text{m} \times 12.4\text{m}$).
  - `Socket_Entrance`: Ground door locator at (0, 0.25, 4.8).
  - `Socket_Porch`: Ground porch locator at (0, 0.0, 6.2).
  - `Socket_Balcony`: Upper balcony locator at (0, 3.65, 5.8).
  - `Compound_Perimeter`: Separately configurable perimeter boundary wall and black double-swing security gate wrapping multi-storey residential parcels.
