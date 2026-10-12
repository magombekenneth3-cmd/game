import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9233;
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
  console.log('=== KINGMAKER: Phase 12.0 Street Economy & Hawker Micro-Interactions Acceptance ===\n');
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
    '--user-data-dir=/tmp/chrome-phase12-profile-' + Date.now(),
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
      // ignore context destroy on page reload
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

  // --- 1. Authentic Nairobi Reference View ---
  console.log('\n--- 1. Reference View: Kenyatta Ave / Kimathi Promenade with KICC & Mama Mboga ---');
  await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game) return 'no-game';
      if (hud) {
        hud.closeModal();
        hud.updateMatatuOperatorHUD(undefined);
      }
      game.playerController.motor.position.set(8.5, 0.20, 4.0);
      game.playerController.motor.rotationY = 0.25;
      game.playerController.cameraManager.setOrbit(0.25, 0.12, 6.5);
      game.playerController.cameraManager.snapToTarget(game.playerController.motor.position);
      return 'ref-view-ready';
    })()
  `);
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase12_street_economy_reference_view.png');

  // --- 2. Mama Mboga Stall Close-Up & Interactive Modal ---
  console.log('\n--- 2. Mama Mboga Produce Interaction & Shopping Modal ---');
  const step2Res = await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game || !hud) return 'no-game-or-hud';
      hud.updateMatatuOperatorHUD(undefined);
      game.playerController.motor.position.set(10.2, 0.20, 9.0);
      game.playerController.motor.rotationY = Math.PI * 0.45;
      game.playerController.cameraManager.setOrbit(Math.PI * 0.45, 0.15, 4.5);
      game.playerController.cameraManager.snapToTarget(game.playerController.motor.position);

      // Open Mama Mboga Shopping Modal
      hud.showStreetEconomyModal(
        "Mama Mary's Fresh Produce",
        "FRESH PRODUCE — Matunda, Mboga, Fresh Daily",
        [
          { key: '1', label: 'Sweet Bananas (Ndizi) +25 Stamina', priceText: 'KSh 50', onSelect: () => 'Bought Bananas! +25 Stamina' },
          { key: '2', label: 'Fresh Sukuma Wiki +20 Health', priceText: 'KSh 30', onSelect: () => 'Bought Sukuma Wiki! +20 Health' },
          { key: '3', label: 'Ripe Tomatoes (Nyanya) +15 Health', priceText: 'KSh 50', onSelect: () => 'Bought Tomatoes! +15 Health' },
          { key: '4', label: 'Hass Avocado (Parachichi) +30 Health', priceText: 'KSh 60', onSelect: () => 'Bought Avocado! +30 Health' }
        ]
      );
      const m = document.querySelector('#hud-street-modal');
      return { modalFound: !!m, display: m?.style.display, classes: m?.className, visible: window.getComputedStyle(m).display };
    })()
  `);
  console.log('[Step 2 Modal State]:', step2Res);
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase12_mama_mboga_interaction_modal.png');

  // --- 3. Safaricom M-PESA Center & Transaction Modal ---
  console.log('\n--- 3. Safaricom M-PESA Center & Transaction Modal ---');
  const step3Res = await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game || !hud) return 'no-game-or-hud';
      hud.updateMatatuOperatorHUD(undefined);
      game.playerController.motor.position.set(12.5, 0.20, 15.5);
      game.playerController.motor.rotationY = Math.PI * 0.5;
      game.playerController.cameraManager.setOrbit(Math.PI * 0.5, 0.12, 5.5);
      game.playerController.cameraManager.snapToTarget(game.playerController.motor.position);

      // Open M-PESA Transaction Modal
      hud.showStreetEconomyModal(
        "Safaricom Authorized M-PESA Center",
        "Till: 345890 — Kimathi Street Arcade",
        [
          { key: '1', label: 'Deposit KSh 500 to M-PESA (Tariff: FREE)', priceText: 'Free Fee', onSelect: () => 'Confirmed. KSh 500 deposited.' },
          { key: '2', label: 'Deposit KSh 2,000 to M-PESA (Tariff: FREE)', priceText: 'Free Fee', onSelect: () => 'Confirmed. KSh 2,000 deposited.' },
          { key: '3', label: 'Withdraw KSh 500 Cash (Fee: KSh 29)', priceText: 'Fee KSh 29', onSelect: () => 'Confirmed. Withdrawn KSh 500.' },
          { key: '4', label: 'Withdraw KSh 2,000 Cash (Fee: KSh 34)', priceText: 'Fee KSh 34', onSelect: () => 'Confirmed. Withdrawn KSh 2,000.' }
        ]
      );
      const m = document.querySelector('#hud-street-modal');
      return { modalFound: !!m, display: m?.style.display, classes: m?.className, visible: window.getComputedStyle(m).display };
    })()
  `);
  console.log('[Step 3 Modal State]:', step3Res);
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase12_mpesa_kiosk_transaction.png');

  // --- 4. Boda Boda Stage & Passenger Hailing ---
  console.log('\n--- 4. Boda Boda Passenger Stage & Rider ---');
  const step4Res = await evaluateScript(`
    (() => {
      const game = window.__KINGMAKER_GAME__;
      const hud = (game && game.hudOverlay) || window.__KINGMAKER_HUD__;
      if (!game || !hud) return 'no-game-or-hud';
      hud.closeModal();
      hud.updateMatatuOperatorHUD(undefined);
      game.playerController.motor.position.set(7.5, 0.20, 6.0);
      game.playerController.motor.rotationY = 0.1;
      game.playerController.cameraManager.setOrbit(0.1, 0.15, 4.5);
      game.playerController.cameraManager.snapToTarget(game.playerController.motor.position);

      hud.showStreetEconomyModal(
        "Boda Boda Passenger Stage",
        "Rider: Brian 'Nduthi' Mwangi (TVS Star 150)",
        [
          { key: '1', label: 'Ride to Kencom Stage (55m)', priceText: 'KSh 50', onSelect: () => 'Hailed Boda to Kencom Stage!' },
          { key: '2', label: 'Ride to GPO / Teleposta (110m)', priceText: 'KSh 70', onSelect: () => 'Hailed Boda to GPO!' },
          { key: '3', label: 'Ride to Railways Terminus (175m)', priceText: 'KSh 100', onSelect: () => 'Hailed Boda to Railways!' }
        ]
      );
      const m = document.querySelector('#hud-street-modal');
      return { modalFound: !!m, display: m?.style.display, classes: m?.className, visible: window.getComputedStyle(m).display };
    })()
  `);
  console.log('[Step 4 Modal State]:', step4Res);
  await new Promise((r) => setTimeout(r, 1200));
  await captureShot('phase12_boda_boda_stage.png');

  console.log('\n✅ All Phase 12.0 street economy visual acceptance screenshots captured successfully!\n');
  cleanup();
  process.exit(0);
}

main().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
