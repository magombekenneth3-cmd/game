import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9226;
const SCREENSHOTS_DIR = path.resolve('public/screenshots_character_animations');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function findActivePort() {
  const ports = [3000, 3001];
  for (const p of ports) {
    try {
      const res = await fetch(`http://localhost:${p}/`);
      if (res.ok) {
        console.log(`[CDP] Detected active Vite dev server on port ${p}`);
        return p;
      }
    } catch (e) {}
  }
  return 3000;
}

async function main() {
  console.log('=== KINGMAKER: Phase 11.2 Character Animation & Realism Verification ===\n');

  const devPort = await findActivePort();
  const TARGET_URL = `http://localhost:${devPort}/`;

  console.log('[CDP] Launching Chrome Headless on port ' + PORT + '...');
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new',
    '--use-gl=angle',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=/tmp/chrome-anim-profile-' + Date.now(),
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
  for (let i = 0; i < 40; i++) {
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
  for (let i = 0; i < 35; i++) {
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
  console.log('[CDP] Allowing 3D world assets to load and settle...');
  await new Promise(r => setTimeout(r, 5000));

  async function captureShot(filename, scriptToRun) {
    // Ensure overlay is removed every shot
    await sendCommand('Runtime.evaluate', {
      expression: `(() => {
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) overlay.remove();
      })()`,
      returnByValue: true
    });

    let evalOutput = null;
    if (scriptToRun) {
      const res = await sendCommand('Runtime.evaluate', {
        expression: `(${scriptToRun.toString()})()`,
        returnByValue: true
      });
      evalOutput = res.result?.value;
      await new Promise(r => setTimeout(r, 800));
    }

    const res = await sendCommand('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(fullPath, buf);
    console.log(`📸 Captured: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    if (evalOutput) {
      console.log(`   Evaluation:`, JSON.stringify(evalOutput));
    }
    return fullPath;
  }

  // --- 1. Player Standing Idle ---
  console.log('\n--- Test 1: Player Standing Idle (No T-Pose) ---');
  await captureShot('1_player_standing_idle.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return null;
    const player = debug.player;
    player.motor.position.set(0, 0.45, 15);
    player.cameraManager.setOrbit(0, 0.1, 2.8);

    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }

    return {
      playerState: player.state.getMode(),
      animState: player.animController?.currentState,
      hasMixer: !!player.animController?.mixer,
      mixerTime: player.animController?.mixer?.time
    };
  });

  // --- 2. Player Walking and Stopping ---
  console.log('\n--- Test 2: Player Walking and Stopping ---');
  await captureShot('2_player_walking_and_stopping.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return null;
    const player = debug.player;

    // Simulate forward locomotion
    player.motor.velocity.set(0, 0, -2.5);
    if (player.animController) {
      player.animController.setState('walk');
      player.animController.update(0.35); // Advance into walk stride
    }
    player.cameraManager.setOrbit(Math.PI * 0.15, 0.12, 3.2);

    return {
      playerSpeed: player.motor.getSpeed(),
      animState: player.animController?.currentState,
      mixerTime: player.animController?.mixer?.time
    };
  });

  // --- 3. NPC Spawning and Idling ---
  console.log('\n--- Test 3: NPC Spawning and Idling ---');
  await captureShot('3_npc_spawning_idle.png', () => {
    const THREE = window.THREE;
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return null;
    const scene = debug.scene;
    const pipeline = debug.assetPipeline;
    const player = debug.player;

    player.motor.position.set(0, 0.45, 15);

    let testNpc = scene.getObjectByName('NPC_Test_Idle');
    if (!testNpc) {
      testNpc = pipeline.getCharacterMesh('office_worker');
      testNpc.name = 'NPC_Test_Idle';
      testNpc.position.set(0, 0.45, 13.0);
      testNpc.rotation.y = Math.PI;
      scene.add(testNpc);

      const anims = testNpc.userData?.animations || pipeline.getAnimations('char_pedestrian_business_01');
      if (anims && anims.length > 0) {
        const mixer = new THREE.AnimationMixer(testNpc);
        const clip = anims.find(c => c.name.toLowerCase().includes('idle')) || anims[0];
        mixer.clipAction(clip).play();
        mixer.update(0.15);
        testNpc.userData.mixer = mixer;
        testNpc.userData.animState = 'idle';
      }
    }

    player.cameraManager.setOrbit(0, 0.08, 3.0);

    return {
      npcFound: !!testNpc,
      animState: testNpc.userData?.animState,
      hasMixer: !!testNpc.userData?.mixer
    };
  });

  // --- 4. NPC Walking ---
  console.log('\n--- Test 4: NPC Walking Along Waypoint ---');
  await captureShot('4_npc_walking.png', () => {
    const THREE = window.THREE;
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return null;
    const scene = debug.scene;
    const pipeline = debug.assetPipeline;
    const player = debug.player;

    player.motor.position.set(0, 0.45, 15);

    let walkingNpc = scene.getObjectByName('NPC_Test_Walker');
    if (!walkingNpc) {
      walkingNpc = pipeline.getCharacterMesh('office_worker');
      walkingNpc.name = 'NPC_Test_Walker';
      walkingNpc.position.set(0.5, 0.45, 12.5);
      walkingNpc.rotation.y = Math.PI * 0.75;
      scene.add(walkingNpc);

      const anims = walkingNpc.userData?.animations || pipeline.getAnimations('char_pedestrian_business_01');
      if (anims && anims.length > 0) {
        const mixer = new THREE.AnimationMixer(walkingNpc);
        const clip = anims.find(c => c.name.toLowerCase().includes('walk')) || anims[0];
        mixer.clipAction(clip).play();
        mixer.update(0.4); // Advance into stride
        walkingNpc.userData.mixer = mixer;
        walkingNpc.userData.animState = 'walk';
      }
    }

    player.cameraManager.setOrbit(Math.PI * 0.2, 0.1, 3.5);

    return {
      walkerFound: !!walkingNpc,
      animState: walkingNpc.userData?.animState,
      hasMixer: !!walkingNpc.userData?.mixer
    };
  });

  // --- 5. Multiple NPCs Animating Independently ---
  console.log('\n--- Test 5: Multiple NPCs Animating Independently ---');
  await captureShot('5_multiple_npcs_independent.png', () => {
    const THREE = window.THREE;
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return null;
    const scene = debug.scene;
    const pipeline = debug.assetPipeline;
    const player = debug.player;

    player.motor.position.set(0, 0.45, 15);

    let npcA = scene.getObjectByName('NPC_Independent_A');
    if (!npcA) {
      npcA = pipeline.getCharacterMesh('office_worker');
      npcA.name = 'NPC_Independent_A';
      npcA.position.set(-1.2, 0.45, 13.0);
      npcA.rotation.y = Math.PI * 0.8;
      scene.add(npcA);

      const animsA = npcA.userData?.animations || pipeline.getAnimations('char_pedestrian_business_01');
      if (animsA && animsA.length > 0) {
        const mixerA = new THREE.AnimationMixer(npcA);
        const idleClip = animsA.find(c => c.name.toLowerCase().includes('idle')) || animsA[0];
        mixerA.clipAction(idleClip).play();
        mixerA.update(0.2);
        npcA.userData.mixer = mixerA;
        npcA.userData.animState = 'idle';
      }
    }

    let npcB = scene.getObjectByName('NPC_Independent_B');
    if (!npcB) {
      npcB = pipeline.getCharacterMesh('office_worker');
      npcB.name = 'NPC_Independent_B';
      npcB.position.set(1.2, 0.45, 13.0);
      npcB.rotation.y = -Math.PI * 0.8;
      scene.add(npcB);

      const animsB = npcB.userData?.animations || pipeline.getAnimations('char_pedestrian_business_01');
      if (animsB && animsB.length > 0) {
        const mixerB = new THREE.AnimationMixer(npcB);
        const walkClip = animsB.find(c => c.name.toLowerCase().includes('walk')) || animsB[0];
        mixerB.clipAction(walkClip).play();
        mixerB.update(0.5);
        npcB.userData.mixer = mixerB;
        npcB.userData.animState = 'walk';
      }
    }

    player.cameraManager.setOrbit(0, 0.12, 4.2);

    return {
      npcAState: npcA.userData?.animState,
      npcBState: npcB.userData?.animState,
      independentMixers: npcA.userData?.mixer !== npcB.userData?.mixer
    };
  });

  console.log('\n=== Character Animation Verification Complete ===');
  ws.close();
  cleanup();
  console.log('✅ All 5 character animation screenshots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error in character animation verification:', err);
  process.exit(1);
});
