/**
 * Phase 12.4.1 — Rendering Performance Measurement Script
 * 
 * Captures renderer.info, material counts, mesh counts, and batching
 * stats from a running KINGMAKER instance via CDP.
 * 
 * Run: node scripts/measure_rendering_performance.mjs
 */
import puppeteer from 'puppeteer';

const URL = 'http://localhost:3000';
const WAIT_MS = 12000; // Allow scene to fully load and batch

async function main() {
  console.log('🎯 Phase 12.4.1 — Rendering Performance Measurement');
  console.log('====================================================\n');

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720 });

  console.log(`Navigating to ${URL}...`);
  await page.goto(URL, { waitUntil: 'networkidle2', timeout: 30000 });
  console.log(`Waiting ${WAIT_MS}ms for scene to stabilize...`);
  await new Promise(r => setTimeout(r, WAIT_MS));

  const metrics = await page.evaluate(() => {
    const gl = window.__gameLoop;
    if (!gl) {
      // Debug: list what's on window
      const keys = Object.keys(window).filter(k => k.startsWith('__') || k === 'game' || k === 'gameLoop');
      return { error: `No __gameLoop found. Window keys with __ prefix: ${keys.join(', ') || 'none'}` };
    }

    const scene = gl.scene;
    const rendererManager = gl.rendererManager;
    const renderer = rendererManager?.renderer;

    if (!scene) return { error: 'scene is null/undefined on __gameLoop' };

    // Renderer info
    const info = renderer?.info;
    const rendererStats = {
      drawCalls: info?.render?.calls ?? 'no-renderer',
      triangles: info?.render?.triangles ?? 'no-renderer',
      points: info?.render?.points ?? 'no-renderer',
      lines: info?.render?.lines ?? 'no-renderer',
      frame: info?.render?.frame ?? 'no-renderer',
      geometries: info?.memory?.geometries ?? 'no-renderer',
      textures: info?.memory?.textures ?? 'no-renderer',
      programs: info?.programs?.length ?? 'no-renderer'
    };

    // Scene traversal
    let totalMeshes = 0;
    let totalTriangles = 0;
    const materialSet = new Set();
    const materialTypeCount = {};
    let batchedMeshes = 0;
    let skinnedMeshes = 0;
    const categoryCount = {};

    scene.traverse((obj) => {
      if (obj.isMesh || obj.isSkinnedMesh) {
        totalMeshes++;
        if (obj.isSkinnedMesh) skinnedMeshes++;

        // Count triangles
        const geo = obj.geometry;
        if (geo) {
          const idx = geo.index;
          const pos = geo.getAttribute('position');
          if (idx) totalTriangles += idx.count / 3;
          else if (pos) totalTriangles += pos.count / 3;
        }

        // Track materials
        const mat = obj.material;
        if (mat) {
          materialSet.add(mat.uuid);
          const typeName = mat.type || 'unknown';
          materialTypeCount[typeName] = (materialTypeCount[typeName] || 0) + 1;
        }

        // Categorise by name
        const name = obj.name || '';
        if (name.startsWith('Batched_')) {
          batchedMeshes++;
          categoryCount['Batched'] = (categoryCount['Batched'] || 0) + 1;
        } else if (name.includes('Building') || name.includes('bld_')) {
          categoryCount['Building'] = (categoryCount['Building'] || 0) + 1;
        } else if (name.includes('Tree') || name.includes('Shrub') || name.includes('Palm') || name.includes('Acacia') || name.includes('Jacaranda') || name.includes('Bougainvillea') || name.includes('Puff')) {
          categoryCount['Vegetation'] = (categoryCount['Vegetation'] || 0) + 1;
        } else if (name.includes('Character') || name.includes('NPC') || name.includes('character')) {
          categoryCount['Character'] = (categoryCount['Character'] || 0) + 1;
        } else if (name.includes('Vehicle') || name.includes('veh_') || name.includes('Matatu') || name.includes('Boda')) {
          categoryCount['Vehicle'] = (categoryCount['Vehicle'] || 0) + 1;
        } else if (name.includes('Road') || name.includes('road') || name.includes('Sidewalk') || name.includes('Curb') || name.includes('Shoulder')) {
          categoryCount['Road'] = (categoryCount['Road'] || 0) + 1;
        } else if (name.includes('Terrain') || name.includes('terrain')) {
          categoryCount['Terrain'] = (categoryCount['Terrain'] || 0) + 1;
        } else {
          categoryCount['Other'] = (categoryCount['Other'] || 0) + 1;
        }
      }
    });

    // Chunk manager stats
    let chunkStats = null;
    const chunkManager = gl.sceneGenerator?.chunkManager;
    if (chunkManager) {
      chunkStats = {
        activeChunks: chunkManager.getActiveChunkCount?.() ?? 'unknown',
        batchingStats: chunkManager.getBatchingStats?.() ?? 'unknown',
        totalChunks: chunkManager.chunks?.size ?? 'unknown'
      };
    }

    // SharedMaterialLibrary stats
    let sharedMatCount = 'unknown';
    try {
      // Try to access the static count
      const smLib = window.__SharedMaterialLibrary_instanceCount;
      if (smLib !== undefined) sharedMatCount = smLib;
    } catch {}

    return {
      rendererStats,
      scene: {
        totalMeshes,
        totalTriangles: Math.round(totalTriangles),
        uniqueMaterials: materialSet.size,
        materialTypes: materialTypeCount,
        skinnedMeshes,
        batchedMeshes,
        categories: categoryCount
      },
      chunkStats
    };
  });

  console.log('\n📊 RENDERER INFO:');
  if (metrics.error) {
    console.log(`  ⚠️  ${metrics.error}`);
  } else {
    const r = metrics.rendererStats;
    console.log(`  Draw calls:     ${r.drawCalls}`);
    console.log(`  Triangles:      ${r.triangles}`);
    console.log(`  Shader programs: ${r.programs}`);
    console.log(`  GPU geometries: ${r.geometries}`);
    console.log(`  GPU textures:   ${r.textures}`);

    console.log('\n📐 SCENE GRAPH:');
    const s = metrics.scene;
    console.log(`  Total meshes:    ${s.totalMeshes}`);
    console.log(`  Total triangles: ${s.totalTriangles}`);
    console.log(`  Unique materials: ${s.uniqueMaterials}`);
    console.log(`  Skinned meshes:  ${s.skinnedMeshes}`);
    console.log(`  Batched meshes:  ${s.batchedMeshes}`);

    console.log('\n  Material types:');
    for (const [type, count] of Object.entries(s.materialTypes)) {
      console.log(`    ${type}: ${count}`);
    }

    console.log('\n  Mesh categories:');
    for (const [cat, count] of Object.entries(s.categories)) {
      console.log(`    ${cat}: ${count}`);
    }

    if (metrics.chunkStats) {
      console.log('\n🗺️  CHUNK MANAGER:');
      console.log(`  Active chunks: ${metrics.chunkStats.activeChunks}`);
      console.log(`  Total chunks:  ${metrics.chunkStats.totalChunks}`);
      if (typeof metrics.chunkStats.batchingStats === 'object') {
        console.log(`  Batched chunks: ${metrics.chunkStats.batchingStats.batchedChunks}`);
        console.log(`  Meshes removed: ${metrics.chunkStats.batchingStats.meshesRemoved}`);
      }
    }
  }

  // Take screenshot
  await page.screenshot({ path: 'public/screenshots_vertical_slice/phase12_4_1_performance.png', fullPage: false });
  console.log('\n📸 Screenshot saved.');

  await browser.close();
  console.log('\n✅ Measurement complete.');
}

main().catch(err => {
  console.error('❌ Measurement failed:', err.message);
  process.exit(1);
});
