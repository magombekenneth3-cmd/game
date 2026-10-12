import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9244;
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
  console.log('=== KINGMAKER: Phase 12.1 Kenyan Residential Bungalow Acceptance ===\n');
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
    '--user-data-dir=/tmp/chrome-bungalow-profile-' + Date.now(),
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
    } catch (e) {
      // ignore
    }
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

  // --- 1. FRONT VIEW: ROOF, VERANDA, COLUMNS, BURGLAR GRILLES, AND DOORS ---
  console.log('\n--- 1. Front View: Kenyan Bungalow Veranda, Eaves, and Columns ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game) return 'no-game';
      if (hud) hud.closeModal();

      // Bungalow center is at X: -48, Z: 85. Front porch is around Z: 91.5.
      // Position player inside the compound yard looking directly at the veranda porch and door
      game.playerController.motor.position.set(-48.0, 0.20, 93.0);
      game.playerController.motor.rotationY = 0;
      game.playerController.cameraManager.setOrbit(0.0, 0.12, 5.5);
      game.playerController.cameraManager.snapToTarget(new THREE.Vector3(-48.0, 2.0, 89.0));
      return 'front-view-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_1_bungalow_front_view.png');

  // --- 2. THREE-QUARTER / SIDE VIEW: HIPPED ROOF, GUTTERS, DOWNSPOUT, ROOFTOP TANK ---
  console.log('\n--- 2. Three-Quarter View: Hipped Roof Pitch, Gutters, Water Tank Stand ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      // Position camera inside yard at three-quarter angle looking at West and South sides
      game.playerController.motor.position.set(-53.5, 0.20, 91.5);
      game.playerController.motor.rotationY = 0.55;
      game.playerController.cameraManager.setOrbit(0.55, 0.20, 8.5);
      game.playerController.cameraManager.snapToTarget(new THREE.Vector3(-47.5, 2.4, 85.0));
      return 'three-quarter-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_1_bungalow_three_quarter_view.png');

  // --- 3. GAMEPLAY-DISTANCE VIEW: FULL COMPOUND BOUNDARY WALL, GATE, STREETSCAPE ---
  console.log('\n--- 3. Gameplay Distance View: Residential Compound Wall, Gate, and Streetscape ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      if (!game) return 'no-game';

      // Position camera further out on the residential avenue looking at the compound perimeter
      game.playerController.motor.position.set(-48.0, 0.20, 112.0);
      game.playerController.motor.rotationY = 0.1;
      game.playerController.cameraManager.setOrbit(0.1, 0.28, 22.0);
      game.playerController.cameraManager.snapToTarget(new THREE.Vector3(-48.0, 1.5, 90.0));
      return 'gameplay-dist-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1500));
  await captureShot('phase12_1_bungalow_gameplay_distance_view.png');

  console.log('\n=== All 3 Acceptance Screenshots Successfully Captured! ===\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error in capture script:', err);
  process.exit(1);
});
