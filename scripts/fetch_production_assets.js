/**
 * KINGMAKER: Rise of Africa — Production 3D Asset Downloader & Builder
 * 
 * Invokes the genuine 3D GLB asset builder to produce authored 3D models.
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== KINGMAKER: Fetching & Building Production 3D GLB Assets ===\n');
  const builderScript = path.resolve(__dirname, 'build_production_3d_art.js');
  execSync(`node "${builderScript}"`, { stdio: 'inherit' });
  console.log('\nProduction 3D asset build finished successfully!');
}

main().catch(console.error);
