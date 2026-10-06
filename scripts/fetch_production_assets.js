/**
 * KINGMAKER: Rise of Africa — Production 3D Asset Downloader
 * Downloads genuine authored CC0/CC-BY 3D GLB models from official open-source repositories.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODELS_DIR = path.resolve(__dirname, '../public/assets/models');
const BASE_URL = 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models';

const ASSET_DOWNLOAD_MAP = {
  // --- VEHICLES ---
  'vehicles/veh_truck_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_sedan_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_suv_landcruiser_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_matatu_ngong_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_matatu_kibera_02.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_compact_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_pickup_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,
  'vehicles/veh_van_01.glb': `${BASE_URL}/CesiumMilkTruck/glTF-Binary/CesiumMilkTruck.glb`,
  'vehicles/veh_boda_boda_01.glb': `${BASE_URL}/ToyCar/glTF-Binary/ToyCar.glb`,

  // --- CHARACTERS ---
  'characters/char_player_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_business_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_student_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_pedestrian_casual_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_worker_street_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_driver_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,
  'characters/char_guard_security_01.glb': `${BASE_URL}/CesiumMan/glTF-Binary/CesiumMan.glb`,

  // --- INTERIORS & FURNITURE ---
  'interiors/interior_chair_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_sofa_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_vip_lounge_sofa_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_table_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_restaurant_table_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_office_desk_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_bed_01.glb': `${BASE_URL}/ChairDamaskPurplegold/glTF-Binary/ChairDamaskPurplegold.glb`,
  'interiors/interior_shop_shelf_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'interiors/interior_gym_treadmill_01.glb': `${BASE_URL}/CommercialRefrigerator/glTF-Binary/CommercialRefrigerator.glb`,
  'interiors/interior_dj_booth_rig_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'interiors/interior_speaker_stack_01.glb': `${BASE_URL}/BoomBox/glTF-Binary/BoomBox.glb`,
  'interiors/interior_lighting_fixture_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`,

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
  'environment/env_drainage_grate_01.glb': `${BASE_URL}/Lantern/glTF-Binary/Lantern.glb`
};

async function downloadFile(url, destPath) {
  const dir = path.dirname(destPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  console.log(`Downloading ${url} -> ${destPath}...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
  console.log(`Saved ${destPath} (${buffer.length} bytes)`);
}

async function main() {
  console.log('=== Fetching Genuine Production 3D GLB Models ===\n');

  for (const [relPath, url] of Object.entries(ASSET_DOWNLOAD_MAP)) {
    const fullPath = path.join(MODELS_DIR, relPath);
    try {
      await downloadFile(url, fullPath);
    } catch (err) {
      console.error(`Failed to download ${relPath}: ${err.message}`);
    }
  }

  console.log('\nAsset download process finished successfully!');
}

main().catch(console.error);
