import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9232;
const SCREENSHOTS_DIR = path.resolve('public/screenshots_vertical_slice');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function findActivePort() {
  const ports = [3000, 3001];
  for (const p of ports) {
    try {
      const res = await fetch(`http://localhost:${p}/`);
      if (res.ok) return p;
    } catch (e) {}
  }
  return 3000;
}

async function main() {
  console.log('=== KINGMAKER: Phase 11.8 Matatu Operator & Transit Economy Visual Acceptance ===\n');
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
    '--user-data-dir=/tmp/chrome-phase11-8-profile-' + Date.now(),
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

  await new Promise((resolve) => ws.on('open', resolve));
  await sendCommand('Page.enable');
  await sendCommand('Runtime.enable');

  console.log('[CDP] Waiting for Boot Stage READY and clicking start game button...');

  await sendCommand('Runtime.evaluate', {
    expression: `
      new Promise((resolve) => {
        const interval = setInterval(() => {
          const btn = document.querySelector('#btn-start-game') || document.querySelector('button');
          const overlay = document.querySelector('#main-menu-overlay');
          const game = window.__KINGMAKER_GAME__;
          if (game && game.bootStage === 'READY' && btn) {
            clearInterval(interval);
            btn.click();
            if (overlay) {
              overlay.style.display = 'none';
              overlay.style.opacity = '0';
            }
            resolve(true);
          }
        }, 200);
        setTimeout(() => resolve(false), 20000);
      })
    `,
    awaitPromise: true
  });

  console.log('[CDP] Allowing 3D world assets to stream in...');
  await new Promise((r) => setTimeout(r, 4000));

  async function captureShot(filename) {
    const shot = await sendCommand('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const outPath = path.join(SCREENSHOTS_DIR, filename);
    fs.writeFileSync(outPath, buffer);
    console.log(`📸 Captured: ${filename} (${(buffer.length / 1024).toFixed(1)} KB)`);
  }

  // --- 1. Driver View: Sacco Minibus Approaching Kencom Bay ---
  console.log('\n--- 1. Driver Chase Perspective: Kencom Approach ---');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__KINGMAKER_GAME__;
        if (!game) return;
        const matatus = Array.from(game.vehicleManager.vehicles.values()).filter(v => v.definition.type === 'matatu');
        if (matatus.length > 0) {
          const matatu = matatus[0];
          matatu.state.position.set(6.0, 0.25, 58.0);
          matatu.state.rotationY = 0;
          game.vehicleManager.enterVehicle(matatu);
          game.playerController.state.setMode('IN_VEHICLE');
          game.playerController.motor.position.copy(matatu.state.position);
          game.vehicleManager.vehicleCamera.setCameraMode('CHASE');
          game.playerController.cameraManager.setYaw(0);
          game.playerController.cameraManager.setPitch(0.14);
          game.playerController.cameraManager.setDistance(8.0);
        }
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase11_8_driver_cockpit_kencom.png');

  // --- 2. Matatu Operator Shift Dashboard HUD in Action ---
  console.log('\n--- 2. Matatu Operator Shift Dashboard Active ---');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__KINGMAKER_GAME__;
        if (!game) return;
        const matatus = Array.from(game.vehicleManager.vehicles.values()).filter(v => v.definition.type === 'matatu');
        if (matatus.length > 0) {
          const matatu = matatus[0];
          matatu.state.position.set(5.5, 0.25, 71.5);
          game.playerController.motor.position.copy(matatu.state.position);
          game.vehicleManager.enterVehicle(matatu);
          game.playerController.state.setMode('IN_VEHICLE');
        }
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase11_8_operator_shift_dashboard.png');

  // --- 3. Stage Docked & Commuters Boarding ---
  console.log('\n--- 3. Stage Docked & Passenger Exchange View ---');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__KINGMAKER_GAME__;
        if (!game) return;
        game.playerController.motor.position.set(14.0, 0.20, 72.0);
        game.playerController.motor.rotationY = -Math.PI * 0.55;
        game.playerController.cameraManager.setYaw(-Math.PI * 0.55);
        game.playerController.cameraManager.setPitch(0.12);
        game.playerController.cameraManager.setDistance(6.5);
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase11_8_stage_docked_boarding.png');

  // --- 4. Ngong 126 Manyanga Express in Avenue Corridor ---
  console.log('\n--- 4. Ngong 126 Manyanga Express on Avenue ---');
  await sendCommand('Runtime.evaluate', {
    expression: `
      (() => {
        const game = window.__KINGMAKER_GAME__;
        if (!game) return;
        game.playerController.motor.position.set(-2.0, 0.25, 38.0);
        game.playerController.motor.rotationY = Math.PI * 0.85;
        game.playerController.cameraManager.setYaw(Math.PI * 0.85);
        game.playerController.cameraManager.setPitch(0.18);
        game.playerController.cameraManager.setDistance(10.0);
      })()
    `
  });
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase11_8_ngong_manyanga_express.png');

  console.log('\n✅ All Phase 11.8 operator visual acceptance screenshots captured successfully!\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
