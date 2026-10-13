import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9256;
const SCREENSHOTS_DIR = path.resolve('public/screenshots_vertical_slice');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function findActivePort() {
  const ports = [3000, 3001, 5173];
  for (const p of ports) {
    try {
      const res = await fetch(`http://localhost:${p}/`);
      if (res.ok) return p;
    } catch (e) {}
  }
  return 3000;
}

async function main() {
  console.log('=== KINGMAKER: Phase 12.3 Character Visual System Acceptance ===\n');
  const devPort = await findActivePort();
  const TARGET_URL = `http://localhost:${devPort}/`;
  console.log(`[CDP] Dev server at ${TARGET_URL}, launching Chrome Headless on port ${PORT}...`);

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--use-gl=angle',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-character-profile-' + Date.now(),
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--disable-background-timer-throttling',
    '--disable-renderer-backgrounding',
    '--disable-backgrounding-occluded-windows',
    '--disable-features=CalculateNativeWinOcclusion',
    '--window-size=1600,900',
    TARGET_URL
  ]);

  let isKilled = false;
  function cleanup() {
    if (!isKilled) {
      isKilled = true;
      try { chrome.kill('SIGTERM'); } catch (e) {}
    }
  }
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  let wsUrl = null;
  for (let i = 0; i < 35; i++) {
    await new Promise((r) => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const data = await res.json();
      const page = data.find((d) => d.type === 'page');
      if (page && page.webSocketDebuggerUrl) {
        wsUrl = page.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('Failed to connect to Chrome CDP WebSocket');
    cleanup();
    process.exit(1);
  }

  console.log('[CDP] Connected: ' + wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pending = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.on('message', (raw) => {
    const msg = JSON.parse(raw);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  });

  async function evaluateScript(expr) {
    const res = await sendCommand('Runtime.evaluate', { expression: expr, returnByValue: true });
    if (res.exceptionDetails) {
      console.error('[CDP Exception]', res.exceptionDetails.text, res.exceptionDetails.exception?.description);
    }
    return res.result?.value;
  }

  await new Promise((resolve) => ws.on('open', resolve));
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  // Start game
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await sendCommand('Runtime.evaluate', {
        expression: `
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
        `
      });
      if (res && res.result && res.result.value) {
        ready = true;
        console.log('[CDP] Game started on attempt ' + (attempt + 1));
        break;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
  }

  if (!ready) console.warn('[CDP] Warning: Could not detect game start');

  console.log('[CDP] Allowing 3D world to stream in...');
  await new Promise((r) => setTimeout(r, 5000));

  // Disable camera occluders for clean architectural shots
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return false;
      const cam = game.playerController.cameraManager;
      if (!cam.__origUpdate) {
        cam.__origUpdate = cam.update.bind(cam);
        cam.update = function(pos, dt, occluders) {
          return cam.__origUpdate(pos, dt, []);
        };
      }
      return true;
    })()
  `);

  async function captureShot(filename) {
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Captured: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // --- 1. CLOSE-UP: Player + 2 NPCs showing distinct outfits/skin ---
  console.log('\n--- 1. Player + Nearby NPCs: Character Variety Close-up ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';
      const hud = game.hudOverlay;
      if (hud) hud.closeModal();

      // Position near Kenyatta Ave where NPCs congregate
      game.playerController.motor.position.set(5.0, 0.20, 10.0);
      game.playerController.motor.rotationY = 0;
      game.playerController.cameraManager.setOrbit(0.0, 0.15, 5.0);
      return 'npc-closeup-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 2000));
  await captureShot('phase12_3_character_variety_closeup.png');

  // --- 2. STREET SCENE: Multiple NPCs on Kenyatta Avenue ---
  console.log('\n--- 2. Street Scene: Multiple NPCs on Kenyatta Avenue ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      game.playerController.motor.position.set(0.0, 0.20, 20.0);
      game.playerController.motor.rotationY = Math.PI;
      game.playerController.cameraManager.setOrbit(0.0, 0.20, 10.0);
      return 'street-scene-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 2000));
  await captureShot('phase12_3_character_street_scene.png');

  // --- 3. WIDE SHOT: Kilimani residential area with diverse NPC population ---
  console.log('\n--- 3. Wide Shot: Residential District Population Diversity ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      game.playerController.motor.position.set(-48.0, 0.20, 85.0);
      game.playerController.motor.rotationY = 0.3;
      game.playerController.cameraManager.setOrbit(0.3, 0.25, 18.0);
      return 'wide-population-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 2000));
  await captureShot('phase12_3_character_population_wide.png');

  console.log('\n=== All 3 Character Visual System Screenshots Captured! ===\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
