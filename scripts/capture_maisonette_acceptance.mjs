import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9255;
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
  console.log('=== KINGMAKER: Phase 12.2 Kenyan Residential Maisonette Acceptance ===\n');
  const devPort = await findActivePort();
  const TARGET_URL = `http://localhost:${devPort}/`;
  console.log(`[CDP] Connecting to target dev server at ${TARGET_URL}...`);
  console.log('[CDP] Launching Chrome Headless on remote debugging port ' + PORT + '...');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--use-gl=angle',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-maisonette-profile-' + Date.now(),
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

  // Poll for debugger URL
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

  console.log('[CDP] Connected via WebSocket to page: ' + wsUrl);
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
      console.error('[CDP Runtime Exception]', res.exceptionDetails.text, res.exceptionDetails.exception?.description);
    }
    return res.result?.value;
  }

  await new Promise((resolve) => ws.on('open', resolve));
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  console.log('[CDP] Waiting for Boot Stage READY and clicking start game button...');

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
              if (overlay) {
                overlay.style.display = 'none';
                overlay.style.opacity = '0';
              }
              return true;
            }
            return false;
          })()
        `
      });
      if (res && res.result && res.result.value) {
        ready = true;
        console.log('[CDP] Game started successfully on attempt ' + (attempt + 1));
        break;
      }
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 600));
  }

  if (!ready) {
    console.warn('[CDP] Warning: Could not detect start game button click, continuing...');
  }

  console.log('[CDP] Allowing 3D world assets to stream in...');
  await new Promise((r) => setTimeout(r, 4500));

  async function captureShot(filename) {
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Captured: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // Ensure camera occluder raycasting does not constrain deliberate architectural inspection angles
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

  // --- 1. FRONT VIEW: TWO-STOREY FAÇADE, FIRST-FLOOR BALCONY, PORCH COLUMNS, BURGLAR GRILLES ---
  console.log('\n--- 1. Front View: Kenyan Maisonette 2-Storey Façade, Balcony, and Veranda ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game) return 'no-game';
      if (hud) hud.closeModal();

      // Maisonette center is at X: -78, Z: 85. Front entrance is at Z: 91. Front gate at Z: 94.
      // Player stands in driveway facing the house
      game.playerController.motor.position.set(-78.0, 0.20, 93.0);
      game.playerController.motor.rotationY = Math.PI;
      game.playerController.cameraManager.setOrbit(0.0, 0.22, 13.0);
      return 'front-view-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_2_maisonette_front_view.png');

  // --- 2. THREE-QUARTER VIEW: BALCONY PROJECTION, HIPPED ROOF, TWO-STOREY DOWNSPOUT, TANK ---
  console.log('\n--- 2. Three-Quarter View: Balcony Projection, Roof Pitch, Downspout, Water Tank ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      // Position camera southeast of compound looking northwest at the front balcony, roof, and side
      // Free of any acacia trees
      game.playerController.motor.position.set(-78.0, 0.20, 87.0);
      game.playerController.motor.rotationY = -0.65;
      game.playerController.cameraManager.setOrbit(0.65, 0.22, 17.0);
      return 'three-quarter-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_2_maisonette_three_quarter_view.png');

  // --- 3. SIDE VIEW: TWO-STOREY WINDOW HIERARCHY, STRINGER BAND, PLINTH ---
  console.log('\n--- 3. Side View: Two-Storey Windows, Architectural Stringer Band, Plinth ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      // Position camera west of compound looking directly east at side elevation
      game.playerController.motor.position.set(-78.0, 0.20, 85.0);
      game.playerController.motor.rotationY = Math.PI / 2;
      game.playerController.cameraManager.setOrbit(-Math.PI / 2, 0.18, 17.0);
      return 'side-view-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_2_maisonette_side_view.png');

  // --- 4. GAMEPLAY-DISTANCE STREETSCAPE: SIDE-BY-SIDE BUNGALOW & MAISONETTE IN KILIMANI ---
  console.log('\n--- 4. Gameplay-Distance View: Maisonette & Bungalow Side-by-Side Streetscape ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      // Position camera southeast of both compounds looking northwest down the avenue
      // Camera is at X: -38.4, Z: 102.8, Y: 8.25m — completely clear of Dennis Pritt Townhouses (which ends at X: -50)
      // Perfectly frames both the 1-storey Bungalow (X: -48) and 2-storey Maisonette (X: -78)
      game.playerController.motor.position.set(-63.0, 0.20, 87.0);
      game.playerController.motor.rotationY = -1.0;
      game.playerController.cameraManager.setOrbit(1.0, 0.22, 30.0);
      return 'streetscape-view-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_2_maisonette_gameplay_distance_view.png');

  console.log('\n=== All 4 Acceptance Screenshots Successfully Captured! ===\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error in capture script:', err);
  process.exit(1);
});
