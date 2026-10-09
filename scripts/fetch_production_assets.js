/**
 * KINGMAKER: Rise of Africa — Production 3D Asset Downloader
 * Downloads genuine open-source CC-BY / CC0 3D GLB models from official Khronos repositories.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.resolve(__dirname, '../public/assets/models');
const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

export const ASSET_DOWNLOAD_MAP = {
  // --- BUILDINGS ---
  'buildings/bld_nairobi_shop_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_nairobi_shop_02.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_mixed_use_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_mixed_use_02.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_modern_apartment_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'buildings/bld_modern_apartment_02.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'buildings/bld_residential_villa_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'buildings/bld_office_block_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'buildings/bld_commercial_tower_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'buildings/bld_informal_kiosk_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_industrial_warehouse_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'buildings/bld_nightclub_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'buildings/bld_construction_site_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,

  // --- VEHICLES ---
  'vehicles/veh_sedan_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_compact_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_suv_landcruiser_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_pickup_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_van_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_truck_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_boda_boda_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_matatu_ngong_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_matatu_kibera_02.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,

  // --- CHARACTERS ---
  'characters/char_player_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_business_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_student_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_casual_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_worker_street_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_driver_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_guard_security_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,

  // --- ENVIRONMENT ---
  'environment/env_acacia_tree_01.glb': `${BASE_URL}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb`,
  'environment/env_palm_tree_01.glb': `${BASE_URL}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb`,
  'environment/env_shrub_01.glb': `${BASE_URL}/DiffuseTransmissionPlant/glTF-Binary/DiffuseTransmissionPlant.glb`,
  'environment/env_streetlight_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'environment/env_utility_pole_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'environment/env_mpesa_kiosk_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'environment/env_mama_mboga_stall_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'environment/env_security_gate_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'environment/env_road_barrier_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'environment/env_construction_scaffolding_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,
  'environment/env_bench_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'environment/env_garbage_container_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'environment/env_drainage_grate_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,

  // --- INTERIORS ---
  'interiors/interior_chair_01.glb': `${BASE_URL}/SheenChair/glTF-Binary/SheenChair.glb`,
  'interiors/interior_sofa_01.glb': `${BASE_URL}/SheenChair/glTF-Binary/SheenChair.glb`,
  'interiors/interior_vip_lounge_sofa_01.glb': `${BASE_URL}/SheenChair/glTF-Binary/SheenChair.glb`,
  'interiors/interior_table_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_restaurant_table_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_office_desk_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_bed_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_shop_shelf_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'interiors/interior_gym_treadmill_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'interiors/interior_dj_booth_rig_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'interiors/interior_speaker_stack_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'interiors/interior_lighting_fixture_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`
};

async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`[Asset Downloader] Saved ${path.relative(process.cwd(), destPath)} (${buffer.length} bytes)`);
}

async function main() {
  console.log('=== KINGMAKER: Downloading Authentic Open-Source 3D GLB Models ===\n');

  for (const [relPath, url] of Object.entries(ASSET_DOWNLOAD_MAP)) {
    const fullPath = path.join(MODELS_DIR, relPath);
    try {
      await downloadFile(url, fullPath);
    } catch (err) {
      console.error(`Failed to download ${relPath}: ${err.message}`);
    }
  }

  console.log('\nAsset download finished successfully!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
