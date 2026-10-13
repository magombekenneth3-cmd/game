/**
 * Phase 12.4 — Visual Realism Recovery: Deep Scene Audit
 * 
 * This script captures:
 * 1. Exact fallback asset IDs and reasons
 * 2. Draw call and triangle counts
 * 3. Every visible building, tree, NPC, and vehicle with their source type
 * 4. Material inventory (how many unique vs shared)
 * 5. Texture memory estimate
 * 6. Shadow configuration
 * 7. Active chunks and mesh counts per category
 */
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9257;
const REPORT_DIR = path.resolve('public/screenshots_vertical_slice');
if (!fs.existsSync(REPORT_DIR)) fs.mkdirSync(REPORT_DIR, { recursive: true });

async function findDevPort() {
  for (const p of [3000, 3001, 5173]) {
    try { const r = await fetch(`http://localhost:${p}/`); if (r.ok) return p; } catch {}
  }
  return 3000;
}

async function main() {
  console.log('=== KINGMAKER Phase 12.4: Deep Visual & Performance Audit ===\n');
  const devPort = await findDevPort();
  console.log(`[CDP] Dev server at http://localhost:${devPort}/`);

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--use-gl=angle', `--remote-debugging-port=${PORT}`,
    '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-audit-' + Date.now(),
    '--enable-webgl', '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--window-size=1600,900',
    `http://localhost:${devPort}/`
  ]);

  let killed = false;
  const cleanup = () => { if (!killed) { killed = true; try { chrome.kill('SIGTERM'); } catch {} } };
  process.on('exit', cleanup);

  let wsUrl = null;
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const data = await res.json();
      const page = data.find(d => d.type === 'page');
      if (page?.webSocketDebuggerUrl) { wsUrl = page.webSocketDebuggerUrl; break; }
    } catch {}
  }
  if (!wsUrl) { console.error('CDP connection failed'); cleanup(); process.exit(1); }

  console.log('[CDP] Connected\n');
  const ws = new WebSocket(wsUrl);
  let msgId = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('message', raw => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(msg.error) : resolve(msg.result);
    }
  });

  async function evaluate(expr) {
    const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: false });
    return res.result?.value;
  }

  await new Promise(r => ws.on('open', r));
  await send('Page.enable');
  await send('Runtime.enable');

  // Start game
  for (let i = 0; i < 50; i++) {
    const started = await evaluate(`
      (() => {
        const btn = document.querySelector('#btn-start-game') || document.querySelector('button');
        const overlay = document.querySelector('#main-menu-overlay');
        const game = window.__KINGMAKER_GAME__;
        if (game && game.bootStage === 'READY' && btn) {
          btn.click();
          if (overlay) { overlay.style.display = 'none'; overlay.style.opacity = '0'; }
          return true;
        }
        return false;
      })()
    `);
    if (started) { console.log(`[CDP] Game started (attempt ${i + 1})`); break; }
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('[CDP] Waiting for world to stream in...\n');
  await new Promise(r => setTimeout(r, 6000));

  // ─── 1. IDENTIFY ALL FALLBACK ASSETS ───
  console.log('═══════════════════════════════════════════════');
  console.log('  1. FALLBACK ASSET IDENTIFICATION');
  console.log('═══════════════════════════════════════════════');
  
  const fallbacks = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game || !game.assetPipeline) return 'no-pipeline';
      const statuses = game.assetPipeline.assetStatuses;
      const results = [];
      statuses.forEach((status, assetId) => {
        if (status.state === 'fallback') {
          results.push({ assetId, reason: status.reason, url: status.url });
        }
      });
      return JSON.stringify(results, null, 2);
    })()
  `);
  console.log(fallbacks);

  // ─── 2. ASSET LOADING SUMMARY ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  2. ASSET LOADING SUMMARY');
  console.log('═══════════════════════════════════════════════');

  const assetSummary = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game || !game.assetPipeline) return 'no-pipeline';
      const statuses = game.assetPipeline.assetStatuses;
      const byState = { loaded: [], fallback: [], failed: [], loading: [] };
      statuses.forEach((status, assetId) => {
        (byState[status.state] || byState.loading).push(assetId);
      });
      return JSON.stringify({
        loaded: byState.loaded.length,
        loadedIds: byState.loaded,
        fallback: byState.fallback.length,
        fallbackIds: byState.fallback,
        failed: byState.failed.length,
        failedIds: byState.failed
      }, null, 2);
    })()
  `);
  console.log(assetSummary);

  // ─── 3. SCENE OBJECT INVENTORY ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  3. SCENE OBJECT INVENTORY');
  console.log('═══════════════════════════════════════════════');

  const sceneInventory = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      const scene = game.scene;
      let totalMeshes = 0, totalTriangles = 0, totalVertices = 0;
      let materialCount = 0;
      const materialSet = new Set();
      const categories = {
        buildings: { count: 0, tris: 0, names: [] },
        vehicles: { count: 0, tris: 0, names: [] },
        characters: { count: 0, tris: 0, names: [] },
        environment: { count: 0, tris: 0, names: [] },
        terrain: { count: 0, tris: 0, names: [] },
        roads: { count: 0, tris: 0, names: [] },
        other: { count: 0, tris: 0, names: [] }
      };

      scene.traverse(obj => {
        if (obj.isMesh) {
          totalMeshes++;
          const geo = obj.geometry;
          const tris = geo.index ? geo.index.count / 3 : (geo.attributes.position ? geo.attributes.position.count / 3 : 0);
          const verts = geo.attributes.position ? geo.attributes.position.count : 0;
          totalTriangles += tris;
          totalVertices += verts;

          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach(m => { if (m) materialSet.add(m.uuid); });

          const name = (obj.name || obj.parent?.name || '').toLowerCase();
          const userData = obj.userData || {};
          const assetId = (userData.assetId || obj.parent?.userData?.assetId || '').toLowerCase();

          let cat = 'other';
          if (name.includes('bld_') || assetId.includes('bld_') || name.includes('building') || name.includes('bungalow') || name.includes('maisonette') || name.includes('shop')) cat = 'buildings';
          else if (name.includes('veh_') || assetId.includes('veh_') || name.includes('vehicle') || name.includes('matatu') || name.includes('sedan')) cat = 'vehicles';
          else if (name.includes('char_') || assetId.includes('char_') || name.includes('npc') || name.includes('player') || name.includes('humanoid') || name.includes('wolf3d') || name.includes('mixamo')) cat = 'characters';
          else if (name.includes('tree') || name.includes('jacaranda') || name.includes('palm') || name.includes('acacia') || name.includes('bougainvillea') || name.includes('vegetation') || name.includes('foliage') || name.includes('hedge') || name.includes('shrub')) cat = 'environment';
          else if (name.includes('terrain') || name.includes('ground') || name.includes('soil') || name.includes('chunk')) cat = 'terrain';
          else if (name.includes('road') || name.includes('lane') || name.includes('pavement') || name.includes('sidewalk') || name.includes('cabro') || name.includes('kerb') || name.includes('curb')) cat = 'roads';

          categories[cat].count++;
          categories[cat].tris += tris;
          if (categories[cat].names.length < 15) {
            categories[cat].names.push(obj.name || '(unnamed)');
          }
        }
      });

      return JSON.stringify({
        totalMeshes,
        totalTriangles: Math.round(totalTriangles),
        totalVertices,
        uniqueMaterials: materialSet.size,
        categories: Object.fromEntries(
          Object.entries(categories).map(([k, v]) => [k, {
            meshCount: v.count,
            triangles: Math.round(v.tris),
            sampleNames: v.names.slice(0, 8)
          }])
        )
      }, null, 2);
    })()
  `);
  console.log(sceneInventory);

  // ─── 4. RENDERER AND SHADOW DIAGNOSTICS ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  4. RENDERER & SHADOW DIAGNOSTICS');
  console.log('═══════════════════════════════════════════════');

  const renderInfo = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game || !game.renderer) return 'no-renderer';
      const r = game.renderer;
      const info = r.info;
      const shadow = r.shadowMap;
      return JSON.stringify({
        rendererType: r.constructor.name,
        capabilities: {
          maxTextures: r.capabilities?.maxTextures,
          maxVertexUniforms: r.capabilities?.maxVertexUniforms,
          precision: r.capabilities?.precision,
          logarithmicDepthBuffer: r.capabilities?.logarithmicDepthBuffer
        },
        renderInfo: {
          programs: info.programs?.length || 0,
          geometries: info.memory?.geometries || 0,
          textures: info.memory?.textures || 0,
          drawCalls: info.render?.calls || 0,
          triangles: info.render?.triangles || 0,
          points: info.render?.points || 0,
          lines: info.render?.lines || 0
        },
        shadow: {
          enabled: shadow?.enabled,
          type: shadow?.type,
          mapSize: r.shadowMap?.autoUpdate
        },
        pixelRatio: r.getPixelRatio(),
        outputSize: (() => { const s = new (game.THREE || THREE).Vector2(); r.getSize(s); return { w: s.x, h: s.y }; })()
      }, null, 2);
    })()
  `);
  console.log(renderInfo);

  // ─── 5. PROCEDURAL vs AUTHORED BUILDING AUDIT ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  5. BUILDING SOURCE TYPE AUDIT');
  console.log('═══════════════════════════════════════════════');

  const buildingAudit = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      const scene = game.scene;
      const buildings = [];

      scene.traverse(obj => {
        const name = (obj.name || '').toLowerCase();
        const assetId = (obj.userData?.assetId || '');
        if (name.includes('bld_') || name.includes('building') || name.includes('bungalow') || name.includes('maisonette') || name.includes('shop') || name.includes('warehouse') || name.includes('office') || name.includes('apartment') || name.includes('commercial') || name.includes('tower') || name.includes('nightclub') || name.includes('kiosk') || assetId.startsWith('bld_')) {
          if (obj.isGroup || obj.isMesh) {
            let meshCount = 0, tris = 0;
            const fn = c => { if (c.isMesh) { meshCount++; tris += c.geometry.index ? c.geometry.index.count / 3 : (c.geometry.attributes.position?.count / 3 || 0); } };
            if (obj.isGroup) obj.traverse(fn);
            else fn(obj);

            // Determine if it's a GLB or procedural
            let source = 'procedural';
            if (assetId && game.assetPipeline) {
              const status = game.assetPipeline.assetStatuses.get(assetId);
              if (status?.state === 'loaded') source = 'glb';
              else if (status?.state === 'fallback') source = 'fallback-procedural';
            }

            if (buildings.length < 50) {
              buildings.push({
                name: obj.name,
                assetId: assetId || '(none)',
                source,
                meshCount,
                triangles: Math.round(tris),
                position: obj.position ? [Math.round(obj.position.x), Math.round(obj.position.y), Math.round(obj.position.z)] : null,
                visible: obj.visible
              });
            }
          }
        }
      });

      return JSON.stringify(buildings, null, 2);
    })()
  `);
  console.log(buildingAudit);

  // ─── 6. VEGETATION AUDIT ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  6. VEGETATION AUDIT');
  console.log('═══════════════════════════════════════════════');

  const vegAudit = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      const trees = [];
      game.scene.traverse(obj => {
        const name = (obj.name || '').toLowerCase();
        if (name.includes('tree') || name.includes('jacaranda') || name.includes('palm') || name.includes('acacia') || name.includes('bougainvillea') || name.includes('hedge') || name.includes('shrub') || name.includes('foliage') || name.includes('planter')) {
          if ((obj.isGroup || obj.isMesh) && trees.length < 30) {
            let meshCount = 0, tris = 0;
            const fn = c => { if (c.isMesh) { meshCount++; const g = c.geometry; tris += g.index ? g.index.count / 3 : (g.attributes.position?.count / 3 || 0); } };
            if (obj.isGroup) obj.traverse(fn);
            else fn(obj);
            trees.push({
              name: obj.name,
              type: obj.isGroup ? 'Group' : 'Mesh',
              assetId: obj.userData?.assetId || '(procedural)',
              meshCount,
              triangles: Math.round(tris),
              position: obj.position ? [Math.round(obj.position.x), Math.round(obj.position.y), Math.round(obj.position.z)] : null
            });
          }
        }
      });
      return JSON.stringify(trees, null, 2);
    })()
  `);
  console.log(vegAudit);

  // ─── 7. TEXTURE MEMORY ESTIMATE ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  7. TEXTURE & MATERIAL DETAILS');
  console.log('═══════════════════════════════════════════════');

  const texInfo = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      const textures = new Map();
      const matDetails = [];
      const matSeen = new Set();

      game.scene.traverse(obj => {
        if (!obj.isMesh) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        mats.forEach(m => {
          if (!m || matSeen.has(m.uuid)) return;
          matSeen.add(m.uuid);
          const info = { name: m.name || '(unnamed)', type: m.type, metalness: m.metalness, roughness: m.roughness };
          if (m.map) {
            const t = m.map;
            const key = t.uuid;
            if (!textures.has(key)) {
              textures.set(key, {
                name: t.name || t.source?.data?.src || '(generated)',
                width: t.image?.width || t.source?.data?.width || 0,
                height: t.image?.height || t.source?.data?.height || 0
              });
            }
          }
          matDetails.push(info);
        });
      });

      return JSON.stringify({
        uniqueTextures: textures.size,
        textureSamples: Array.from(textures.values()).slice(0, 20),
        uniqueMaterials: matSeen.size,
        materialSamples: matDetails.slice(0, 20)
      }, null, 2);
    })()
  `);
  console.log(texInfo);

  // ─── 8. FRAME TIMING CAPTURE ───
  console.log('\n═══════════════════════════════════════════════');
  console.log('  8. FRAME TIMING (10 frames)');
  console.log('═══════════════════════════════════════════════');

  const frameTiming = await evaluate(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      return JSON.stringify({
        fps: game.fps || 0,
        frameTime: game.frameTime || 0,
        drawCalls: game.renderer?.info?.render?.calls || 0,
        triangles: game.renderer?.info?.render?.triangles || 0,
        activeChunks: game.worldChunking?.activeChunkCount || 0,
        totalChunks: game.worldChunking?.totalChunkCount || 0,
        npcDetailedCount: game.npcManager?.detailedNPCs?.length || 0,
        npcTotalCount: game.npcManager?.allNPCs?.length || 0
      }, null, 2);
    })()
  `);
  console.log(frameTiming);

  // ─── CAPTURE DIAGNOSTIC SCREENSHOT ───
  console.log('\n[CDP] Capturing diagnostic screenshot...');
  const shot = await send('Page.captureScreenshot', { format: 'png' });
  const buf = Buffer.from(shot.data, 'base64');
  const shotPath = path.join(REPORT_DIR, 'phase12_4_audit_diagnostic.png');
  fs.writeFileSync(shotPath, buf);
  console.log(`📸 Saved: ${shotPath} (${(buf.length / 1024).toFixed(1)} KB)`);

  // Save audit as JSON
  const auditPath = path.join(REPORT_DIR, 'phase12_4_scene_audit.json');
  fs.writeFileSync(auditPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    fallbacks: fallbacks,
    assetSummary: assetSummary,
    sceneInventory: sceneInventory,
    renderInfo: renderInfo,
    buildingAudit: buildingAudit,
    vegAudit: vegAudit,
    texInfo: texInfo,
    frameTiming: frameTiming
  }, null, 2));
  console.log(`📊 Audit JSON saved: ${auditPath}`);

  console.log('\n=== Phase 12.4 Audit Complete ===');
  cleanup();
  process.exit(0);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
