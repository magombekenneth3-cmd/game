import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9223;
const TARGET_URL = 'http://localhost:3001/';
const SCREENSHOT_PATH = process.argv[2] || 'browser_verified_screenshot.png';

async function main() {
  console.log(`[CDP] Launching Chrome headless to capture ${SCREENSHOT_PATH}...`);
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-test-profile-' + Date.now(),
    '--enable-webgl',
    '--ignore-gpu-blocklist',
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
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes('3001'));
      if (tab && tab.webSocketDebuggerUrl) {
        wsUrl = tab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('[CDP] Failed to find Chrome tab on port ' + PORT);
    cleanup();
    process.exit(1);
  }

  console.log('[CDP] Connected to Chrome tab WebSocket:', wsUrl);
  const ws = new WebSocket(wsUrl);

  let msgId = 1;
  const pendingRequests = new Map();

  function sendCommand(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve) => ws.on('open', resolve));

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    if (msg.id && pendingRequests.has(msg.id)) {
      const { resolve, reject } = pendingRequests.get(msg.id);
      pendingRequests.delete(msg.id);
      if (msg.error) reject(new Error(msg.error.message));
      else resolve(msg.result);
    } else if (msg.method === 'Runtime.consoleAPICalled') {
      const args = msg.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      console.log(`[BROWSER CONSOLE ${msg.params.type.toUpperCase()}]`, args);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      console.error('[BROWSER EXCEPTION]', msg.params.exceptionDetails);
    }
  });

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');
  await sendCommand('DOM.enable');

  console.log('[CDP] Waiting for game initialization and boot stage READY...');
  // Poll until #btn-start-game exists and click it
  let clicked = false;
  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 500));
    const clickRes = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-start-game');
        if (btn) {
          btn.click();
          const overlay = document.getElementById('main-menu-overlay');
          if (overlay) {
            overlay.style.display = 'none';
          }
          return 'Clicked and hid overlay';
        }
        return 'Waiting';
      })()`,
      returnByValue: true
    });
    if (clickRes.result.value && clickRes.result.value.includes('Clicked')) {
      console.log('[CDP] Successfully clicked #btn-start-game!');
      clicked = true;
      break;
    }
  }

  // Wait 4 seconds for chunks, shadows and render updates
  console.log('[CDP] Waiting for 3D world render settle...');
  await new Promise(r => setTimeout(r, 4000));

  // Evaluate scene status
  const evalResult = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const win = window;
      const debug = win.__KINGMAKER_DEBUG__ || {};
      const canvas = document.querySelector('canvas');
      const gl = canvas ? (canvas.getContext('webgl2') || canvas.getContext('webgl')) : null;
      const cam = debug.camera;
      const player = debug.player;
      const pipeline = debug.assetPipeline;
      return {
        canvasFound: !!canvas,
        webglVendor: gl ? gl.getParameter(gl.RENDERER) : 'NONE',
        engineBootStage: win.__KINGMAKER_BOOT_STAGE__ || 'UNKNOWN',
        camPosition: cam ? [cam.position.x.toFixed(2), cam.position.y.toFixed(2), cam.position.z.toFixed(2)] : null,
        playerPosition: player ? [player.motor.position.x.toFixed(2), player.motor.position.y.toFixed(2), player.motor.position.z.toFixed(2)] : null,
        camDistanceToPlayer: (cam && player) ? cam.position.distanceTo(player.motor.position).toFixed(2) : null,
        pipelineStats: pipeline ? pipeline.getStats() : null,
        location: window.location.href
      };
    })()`,
    returnByValue: true
  });

  console.log('[CDP] Browser State Evaluation:', JSON.stringify(evalResult.result.value, null, 2));

  // Take screenshot
  console.log('[CDP] Capturing screenshot...');
  const screenshotRes = await sendCommand('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true
  });

  const buffer = Buffer.from(screenshotRes.data, 'base64');
  fs.writeFileSync(SCREENSHOT_PATH, buffer);
  console.log(`[CDP] Successfully saved screenshot to ${SCREENSHOT_PATH} (${buffer.length} bytes)`);

  ws.close();
  cleanup();
  process.exit(0);
}

main().catch(err => {
  console.error('[CDP] Error:', err);
  process.exit(1);
});