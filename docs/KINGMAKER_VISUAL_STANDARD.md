# KINGMAKER: Rise of Africa — Visual Standard & Architecture Constitution

**Document Version**: 1.0 (Master Visual Direction)  
**Target Platform**: WebGL2 / WebGPU (Three.js + Vite)  
**Benchmark Target**: Authentic Nairobi Open-World City Simulation  

---

## 1. Executive Direction & Golden Rule

> **"Use this as the visual direction, not as a screenshot of your current game. The actual game should achieve this level of environmental detail while remaining interactive and performant."**

KINGMAKER rejects generic asset soup and low-fidelity procedural placeholders. The visual identity of the game is grounded in **uncompromising cultural authenticity, physical scale consistency, and living city systems**.

### The Golden Rule: The Single Complete Neighborhood First
Rather than expanding a vast, sparsely detailed, or repetitive map, the production mandate is:
**Build ONE complete, exceptionally realistic Nairobi neighborhood before expanding the entire map.**
- Include a high-density CBD commercial street (*Kenyatta Avenue / Kimathi Street*).
- Include recognizable residential houses with compound walls, gates, and proper pitched roofs.
- Include authentic ground-level retail shops, M-PESA kiosks, and Mama Mboga produce stalls.
- Include working public transit (Super Metro matatus, stages, passenger queuing, and boarding).
- Include lifelike, independently behaving African pedestrians.
- Verify 60 FPS performance and interactive gameplay in the running game before replicating any pattern elsewhere.

---

## 2. The Five Locked-In Visual Standards

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      THE FIVE VISUAL STANDARDS                         │
 ├───────────────────┬───────────────────┬────────────────────────────────┤
 │ 1. AUTHENTIC      │ 2. CORRECT        │ 3. LIFELIKE                    │
 │    NAIROBI        │    BUILDINGS      │    PEOPLE                      │
 ├───────────────────┴───────────────────┴────────────────────────────────┤
 │ 4. LIVING STREETS                     │ 5. CONSISTENT REALISM          │
 └────────────────────────────────────────────────────────────────────────┘
```

---

### Standard 1: Authentic Nairobi
CBD streets must reflect the real, tangible visual texture of central Nairobi, not a generic Western metropolis with African signage slapped on.

#### Key Architectural & Environmental Signatures:
1. **Street Infrastructure**:
   - **Promenades**: Wide, reddish-terracotta interlocking Cabro paver walkways (herringbone and basketweave bonds) running seamlessly from road curbs to building facades.
   - **Curbs & Bollards**: Raised concrete curbs protected by cast-iron street bollards finished in satin black with reflective yellow collar bands.
   - **Street Signs**: Authentic forest-green Nairobi street signs with crisp white lettering on dark metal posts with finials (e.g., `KENYATTA AVE`, `KIMATHI ST`, `MOI AVE`).
   - **Traffic Signals**: 3-aspect vehicular signal heads in matte traffic-yellow housings mounted on dark steel mast arms, paired with eye-level pedestrian crossing signals.
   - **Zebra Crossings**: Broad white reflective pedestrian crossings spanning the 14.6m carriageway at designated mid-block intervals and junctions.
2. **Flora & Urban Landscape**:
   - **Jacaranda Trees** (*Jacaranda mimosifolia*): Spreading architectural branch canopies laden with volumetric violet-purple blossoms, planted curbside in cast-iron tree grates.
   - **Umbrella Acacia** (*Vachellia tortilis*): Tiered horizontal umbrella foliage shelves with gnarled bark framing green verges and roundabouts.
   - **Bougainvillea Planters**: Architectural concrete planters bursting with vibrant magenta and scarlet bougainvillea bracts along building plinths.
3. **Public Transit & Matatu Culture**:
   - **Super Metro Minibuses**: Authentic 33-seater and 14-seater minibuses in royal blue and bright yellow livery, complete with Kenyan registration plates (`KDG 842P`), route headers (`NAIROBI • KIBERA • LANGATA`), yellow reflective safety chevrons, and tinted passenger glazing.
   - **Kencom / GPO Stages**: Designated painted curb bays with passenger shelters, wooden waiting benches, route signage, and tout callouts.
4. **Commercial Branding & Streetfronts**:
   - Ground-floor commercial arcades featuring real Kenyan corporate icons: Safaricom green retail hubs, M-PESA agent centers, Java House coffee shopfronts, and Equity Bank / KCB branches.
   - Distant skyline landmarks anchored by the iconic 28-story cylindrical **Kenyatta International Convention Centre (KICC)** with its terracotta sun fins and revolving rooftop saucer helipad.

---

### Standard 2: Correct Buildings
Buildings must possess architectural integrity according to their functional typology. Residential houses must look unmistakably like houses, shops like shops, apartments like apartments, and office towers like commercial high-rises.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       BUILDING CONSTRUCTION TYPOLOGIES                       │
├─────────────────────┬───────────────────────────────────────────────────────┤
│ Typology            │ Mandatory Architectural Rules                         │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ Residential Houses  │ • Recognizable pitched hipped or gabled roof with     │
│                     │   corrugated iron (mabati) or red clay tiles.         │
│                     │ • Perimeter masonry compound wall with razor wire /   │
│                     │   electric fence strand.                              │
│                     │ • Metal security compound gate with pedestrian door.  │
│                     │ • Front veranda / porch with steps and overhang.      │
│                     │ • Windows with burglar-proof metal grilles.           │
│                     │ • Elevated Roto plastic water tank on steel stand.    │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ Ground-Floor Shops  │ • Recessed entrance with roll-up security shutters.   │
│                     │ • Large display glass windows with painted headers.   │
│                     │ • Branded fascia signboards and striped canvas        │
│                     │   awnings extending over the Cabro sidewalk.          │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ Apartment Blocks    │ • Multi-story concrete frame with rendered infill.    │
│                     │ • Cantilevered balconies with metal balustrades.      │
│                     │ • Sliding balcony doors, window lintels, and sills.   │
│                     │ • Rooftop water tank farm, solar water heaters, and   │
│                     │   laundry drying lines.                               │
├─────────────────────┼───────────────────────────────────────────────────────┤
│ Commercial Towers   │ • Glass curtain walls with vertical solar fins.       │
│ & Office Blocks     │ • Double-height ground floor reception lobby.         │
│                     │ • Rooftop HVAC equipment, satellite dishes, antennas. │
│                     │ • High-rise aviation warning beacons (height > 40m).  │
└─────────────────────┴───────────────────────────────────────────────────────┘
```

---

### Standard 3: Lifelike People
Pedestrians cannot be generic low-poly mannequins or featureless cylinders. Characters must embody modern African urban demographics with natural movement.

1. **Diverse African Archetypes**:
   - **Hero Player**: Young athletic Kenyan in modern streetwear (dark zip hoodie, tailored jeans, sneakers, canvas backpack).
   - **Business Professionals**: Men and women in tailored charcoal/navy suits and formal shoes traversing the CBD.
   - **University Students**: Young people in hoodies, denim jackets, jeans, and backpacks.
   - **Mama Mboga Vendors**: Enterprising women in vibrant kitenge or leso aprons, seated or standing by their produce displays.
   - **Matatu Crew & Boda Riders**: Matatu conductors (makanga) in casual shirts with sling pouches; boda boda motorcycle riders in high-visibility reflective vests and full-face helmets.
2. **Skin, Hair & Attire Realism**:
   - Rich, melanin-rich skin tones ranging from warm deep ebony to golden chestnut, shaded with non-metallic PBR skin scattering (roughness ~0.65, metalness 0.0).
   - Contemporary African hairstyles: crisp fades, neat braids/cornrows, afros, and shaved cuts.
3. **Locomotion & Skeletal Animations**:
   - Fully rigged Mixamo / ReadyPlayerMe skeletal hierarchies.
   - Distinct animation states: relaxed idle with subtle weight shifts, purposeful walking stride with natural arm swing, running, and sprinting.
   - Independent pedestrian schedules and spatial pathfinding: walking along Cabro corridors, waiting at zebra crossings, and queueing at matatu bays.

---

### Standard 4: Living Streets
The environment must buzz with economic and social vitality. Streets are not static scenery; they are functional engines of urban life.

1. **Mama Mboga Produce Stalls**:
   - Solid rustic wooden tables sheltered by large green or orange market umbrellas.
   - Tiered wooden crates overflowing with ripe red tomatoes, crisp green sukuma wiki (kale), yellow bananas, and avocados.
   - Slate A-frame chalkboard signs: *"FRESH PRODUCE — Matunda, Mboga, Fresh Daily"*.
   - Interactive economy: players can purchase fresh fruit to replenish stamina and health.
2. **Working M-PESA Centers**:
   - Characteristic green booths with bold white Safaricom branding and unique agent till numbers.
   - Fully interactive financial system: players can deposit cash to mobile money (0% tariff) or withdraw cash with standard Kenyan tariffs.
3. **Dynamic Matatu Operations**:
   - Matatus running scheduled routes (e.g., Route 105 Nairobi–Kibera–Langata).
   - Conductor touting callouts: *"Beba beba! Nairobi stage straight!"*.
   - Passenger boarding and fare collection (KES 50–100 depending on peak rush hours).
4. **Pedestrian & Traffic Reactivity**:
   - Vehicles yield to pedestrians at zebra crossings.
   - Horn honks and tire audio under rapid deceleration or traffic congestion.
   - Pedestrians stop, browse shop displays, interact with merchants, and board arriving transport.

---

### Standard 5: Consistent Realism
Every asset, light, material, and system must adhere to strict real-world scale and physical rendering principles.

1. **Scale Authority (1 Three.js Unit = 1 Real-World Meter)**:
   - Avenue Carriageway: 14.6m (4 lanes, 3.65m per lane).
   - Sidewalk Promenade: 4.5m – 8.0m wide.
   - Matatu Minibus: 7.2m length × 2.2m width × 2.8m height.
   - Boda Boda Motorcycle: 2.1m length × 0.8m width × 1.1m height.
   - Human Characters: 1.72m – 1.84m eye height.
   - Building Story Height: 3.2m – 3.5m per floor.
2. **PBR Material & Lighting Fidelity**:
   - **Lighting**: Directional sun positioned to cast crisp, elongated African shadows (warm color temperature ~5200K during day, golden ~3500K at dusk). Soft PCF shadow mapping with contact bias preventing light bleeding.
   - **Atmosphere**: Rayleigh sky scattering with natural blue zenith, soft horizon haze, and subtle cumulus clouds.
   - **Materials**: Physically calibrated dielectric roughness and metalness maps. Asphalt with fine aggregate normal roughness, Cabro pavers with recessed mortar grooves, non-metallic human skin/clothing, and reflective clearcoat vehicle paint.
3. **Seamless Transitions & Collision Proxies**:
   - No abrupt terrain breaks: continuous Cabro paving flushes cleanly against building thresholds.
   - Accurate AABB and oriented bounding box (OBB) collision proxies on all buildings, bollards, stalls, and vehicles.
   - Dedicated query collections preventing camera clipping through walls.

---

## 3. The Golden Master Neighborhood Specification

The benchmark neighborhood is centered along **Kenyatta Avenue at the Kimathi Street Intersection (Z = -30 to Z = 140, X = -60 to X = +60)**:

```
                          [NORTH: TO UPPER HILL & CBD NORTH]
                                          ▲
                                          │
 ┌────────────────────────────────────────┼────────────────────────────────────────┐
 │ WEST PROMENADE (-26 to -7.3m)          │ EAST PROMENADE (7.3 to 26m)            │
 │ • Kenyatta Commercial Plaza            │ • Branded Arcade (Safaricom / Java)    │
 │ • City Towers & Kimathi Arcade         │ • Mama Mboga Fresh Produce Stall       │
 │ • Super Metro Matatu Stage & Shelter   │ • Kenyatta Ave / Kimathi St Signs      │
 │ • Tree Pits (Jacaranda in iron grates) │ • Kencom Matatu Terminus (Z = 72)      │
 │ • Protective Curb Bollards             │ • KCB & Co-op Bank Commercial Blocks   │
 └────────────────────────────────────────┼────────────────────────────────────────┘
                                          │
                       [ZEBRA CROSSING AT Z = 12m]
                                          │
 ┌────────────────────────────────────────┴────────────────────────────────────────┐
 │ SOUTH-EAST RESIDENTIAL COMPOUND QUARTER (X = 35 to 80, Z = 80 to 140)           │
 │ • Residential Villa / Bungalow with pitched corrugated iron roof (mabati)       │
 │ • Perimeter stone compound wall with razor wire and security gate               │
 │ • Front veranda, porch columns, burglar-proof window grilles                    │
 │ • Rooftop elevated Roto water tank on steel stand                               │
 │ • Flowering bougainvillea hedge and mature acacia shade trees                   │
 └─────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                         [VISTA: 28-STORY KICC TOWER & HELIPAD]
```

---

## 4. HUD & Interface Standard

The gameplay interface must maintain high-contrast legibility, contemporary glassmorphism, and instant tactile clarity:

- **Top-Left**: Quest tracker card with gold `!` badge, bold mission title (*"Grow Your Business"*), and active objectives.
- **Top-Right**: Character portrait circle with cyan glow, Level badge (*"LV 3"*), XP bar, cash display (*"KSh 12,450"*), and M-PESA balance.
- **Bottom-Left**: Circular gold-trimmed minimap with 'N' compass needle, road network, vehicle/NPC blips, and location tag (*"📍 Kenyatta Avenue — Nairobi CBD"*).
- **Bottom-Right**: Contextual keyboard control cues (`[E] Talk`, `[F] Shop`, `[R] Enter Vehicle`, `[M] Map`) and quick dock buttons (*Combat, Phone, Inventory, Settings*).

---

## 5. Verification Gate & Acceptance Checklist

Before any map expansion is initiated, this neighborhood must pass every checkpoint:

1. [x] **Zero floating geometry or dirt gaps**: Promenades connect flush to road curbs and building facades.
2. [x] **Authentic landmark alignment**: KICC tower clearly visible down the avenue axis framed by purple jacaranda trees.
3. [x] **Working street economy**: Player can talk to Mama Mboga, buy fruit with cash, and use M-PESA kiosks.
4. [x] **Working transit**: Super Metro matatus spawn, navigate the carriageway, dwell at stages, and board commuters.
5. [x] **Architectural distinction**: Residential houses have pitched roofs, compound walls, and gates, distinct from commercial shops and towers.
6. [x] **Performance baseline**: Solid 60 FPS maintained in WebGL2/WebGPU with full shadow maps and LOD streaming.
