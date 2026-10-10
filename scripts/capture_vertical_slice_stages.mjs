import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9224;
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
  console.log('=== KINGMAKER: Realistic Nairobi Vertical Slice Verification ===\n');
  const devPort = await findActivePort();
  const TARGET_URL = `http://localhost:${devPort}/`;
  console.log(`[CDP] Connecting to target at ${TARGET_URL}...`);
  console.log('[CDP] Launching Chrome Headless on port ' + PORT + '...');

  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--use-gl=angle',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-slice-profile-' + Date.now(),
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
  for (let i = 0; i < 35; i++) {
    await new Promise(r => setTimeout(r, 400));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      const tab = tabs.find(t => t.url.includes(String(devPort)));
      if (tab && tab.webSocketDebuggerUrl) {
        wsUrl = tab.webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('[CDP] Failed to connect to Chrome on port ' + PORT);
    cleanup();
    process.exit(1);
  }

  console.log('[CDP] Connected via WebSocket to page:', wsUrl);
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
    }
  });

  await sendCommand('Runtime.enable');
  await sendCommand('Page.enable');

  console.log('[CDP] Waiting for Boot Stage READY and clicking start button...');
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 400));
    const clickRes = await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const btn = document.getElementById('btn-start-game');
        if (btn) {
          btn.click();
        }
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) {
          overlay.remove();
        }
        return window.__KINGMAKER_DEBUG__ ? 'Started' : 'Waiting';
      })()`,
      returnByValue: true
    });
    if (clickRes.result.value === 'Started') {
      console.log('[CDP] Game started and menu overlay removed.');
      break;
    }
  }

  // Settle time for textures, shadows, and models
  console.log('[CDP] Allowing 3D world assets to load and render...');
  await new Promise(r => setTimeout(r, 4500));

  async function captureShot(filename, scriptToRun) {
    // Ensure overlay is removed every shot
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) overlay.remove();
      })()`,
      returnByValue: true
    });

    if (scriptToRun) {
      await sendCommand('Runtime.evaluate', {
        expression: `(${scriptToRun.toString()})()`,
        returnByValue: true
      });
      await new Promise(r => setTimeout(r, 800));
    }

    const res = await sendCommand('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(fullPath, buf);
    console.log(`📸 Captured: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    return fullPath;
  }

  // --- SCENARIO 1: Street with Three Detailed Buildings ---
  console.log('\n--- Scenario 1: Nairobi Street & 3 Detailed Buildings ---');
  await captureShot('1_street_three_buildings.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;
    player.motor.position.set(0, 0.45, 10);
    player.cameraManager.setOrbit(Math.PI * 0.1, 0.18, 16.0);
  });

  // --- SCENARIO 2: Player & 2 Visible Rigged NPCs ---
  console.log('\n--- Scenario 2: Player & 2 Visible NPCs ---');
  await captureShot('2_player_and_two_npcs.png', () => {
    const THREE = window.THREE;
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const scene = debug.scene;
    const player = debug.player;
    const pipeline = debug.assetPipeline;

    player.motor.position.set(0, 0.45, 15);
    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }

    let npc1 = scene.getObjectByName('NPC_Inspection_Business');
    if (!npc1) {
      npc1 = pipeline.getCharacterMesh('office_worker');
      npc1.name = 'NPC_Inspection_Business';
      npc1.position.set(-1.2, 0.45, 12.8);
      npc1.rotation.y = Math.PI * 0.7;
      scene.add(npc1);
      const anims = npc1.userData.animations || pipeline.getAnimations('char_pedestrian_business_01');
      if (anims && anims.length > 0) {
        const mixer = new THREE.AnimationMixer(npc1);
        const clip = anims.find(c => c.name.toLowerCase().includes('idle')) || anims[0];
        mixer.clipAction(clip).play();
        mixer.update(0.1);
        npc1.userData.mixer = mixer;
      }
    }

    let npc2 = scene.getObjectByName('NPC_Inspection_Student');
    if (!npc2) {
      npc2 = pipeline.getCharacterMesh('student');
      npc2.name = 'NPC_Inspection_Student';
      npc2.position.set(1.2, 0.45, 12.5);
      npc2.rotation.y = -Math.PI * 0.6;
      scene.add(npc2);
      const anims = npc2.userData.animations || pipeline.getAnimations('char_pedestrian_student_01');
      if (anims && anims.length > 0) {
        const mixer = new THREE.AnimationMixer(npc2);
        const clip = anims.find(c => !c.name.toLowerCase().includes('tpose')) || anims[0];
        mixer.clipAction(clip).play();
        mixer.update(0.1);
        npc2.userData.mixer = mixer;
      }
    }

    player.cameraManager.setOrbit(0, 0.12, 3.8);
  });

  // --- SCENARIO 3: Sedan, SUV, and Nairobi Matatu Minibus ---
  console.log('\n--- Scenario 3: Sedan, SUV & Matatu ---');
  await captureShot('3_vehicles_sedan_suv_matatu.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const scene = debug.scene;
    const player = debug.player;
    const pipeline = debug.assetPipeline;

    player.motor.position.set(0, 0.45, 8.0);

    let matatu = scene.getObjectByName('Showcase_Matatu');
    if (!matatu) {
      matatu = pipeline.getVehicleMesh('matatu');
      matatu.name = 'Showcase_Matatu';
      matatu.position.set(-4.5, 0.4, 6);
      matatu.rotation.y = Math.PI;
      scene.add(matatu);
    }

    let suv = scene.getObjectByName('Showcase_SUV');
    if (!suv) {
      suv = pipeline.getVehicleMesh('suv');
      suv.name = 'Showcase_SUV';
      suv.position.set(4.5, 0.4, 10);
      suv.rotation.y = 0;
      scene.add(suv);
    }

    let sedan = scene.getObjectByName('Showcase_Sedan');
    if (!sedan) {
      sedan = pipeline.getVehicleMesh('sedan');
      sedan.name = 'Showcase_Sedan';
      sedan.position.set(-4.5, 0.4, -4);
      sedan.rotation.y = Math.PI;
      scene.add(sedan);
    }

    player.cameraManager.setOrbit(-Math.PI * 0.25, 0.2, 16.0);
  });

  // --- SCENARIO 4: Kiosk, Acacia Tree & Market Stall ---
  console.log('\n--- Scenario 4: Kiosk, Acacia Tree & Market Stall ---');
  await captureShot('4_kiosk_tree_market_stall.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;
    player.motor.position.set(-10, 0.45, 15);
    player.cameraManager.setOrbit(Math.PI * 0.25, 0.18, 9.0);
  });

  // --- SCENARIO 5: Club Velvet Nightclub Interior ---
  console.log('\n--- Scenario 5: Club Velvet Nightclub Interior ---');
  await captureShot('5_nightclub_interior.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    if (debug.interiorManager) {
      debug.interiorManager.enterBuilding('bld_bespoke_nightclub_kilimani', debug.player);
      debug.player.cameraManager.snapToTarget(debug.player.motor.position);
    }
    debug.player.cameraManager.setOrbit(Math.PI * 0.1, 0.15, 6.0);
  });

  // Reset player to exterior for distance and lighting checks
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const debug = window.__KINGMAKER_DEBUG__;
      if (debug && debug.interiorManager) {
        debug.interiorManager.exitBuilding(debug.player);
        debug.player.cameraManager.snapToTarget(debug.player.motor.position);
      }
    })()`,
    returnByValue: true
  });

  // --- SCENARIO 6: Day vs. Evening Lighting ---
  console.log('\n--- Scenario 6: Day vs. Evening Lighting ---');
  await captureShot('6a_day_lighting_14h.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    if (debug.timeOfDay) {
      debug.timeOfDay.setTime(14.0);
    }
    debug.player.cameraManager.setOrbit(0, 0.18, 12.0);
  });

  await captureShot('6b_evening_lighting_19h.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    if (debug.timeOfDay) {
      debug.timeOfDay.setTime(19.5);
    }
    debug.player.cameraManager.setOrbit(0, 0.18, 12.0);
  });

  // Reset time to 14:00 for distance checks
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const debug = window.__KINGMAKER_DEBUG__;
      if (debug && debug.timeOfDay) debug.timeOfDay.setTime(14.0);
    })()`,
    returnByValue: true
  });

  // --- DISTANCE CHECKS ---
  console.log('\n--- Distance Checks: 2m, 5m, 15m, 30m ---');
  await captureShot('distance_2m_player_close.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    debug.player.cameraManager.setOrbit(0, 0.1, 2.0);
  });

  await captureShot('distance_5m_player_and_street.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    debug.player.cameraManager.setOrbit(0, 0.15, 5.0);
  });

  await captureShot('distance_15m_block_framing.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    debug.player.cameraManager.setOrbit(0, 0.18, 15.0);
  });

  await captureShot('distance_30m_avenue_vista.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    debug.player.motor.position.set(0, 0.45, 15);
    debug.player.cameraManager.setOrbit(0, 0.22, 30.0);
  });

  console.log('\n=== Telemetry Verification Complete ===');
  ws.close();
  cleanup();
  console.log('✅ All vertical slice verification screenshots updated and captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
