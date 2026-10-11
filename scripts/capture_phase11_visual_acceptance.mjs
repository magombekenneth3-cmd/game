import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const PORT = 9229;
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
  console.log('=== KINGMAKER: Phase 11.3 Realistic Character Visual Acceptance ===\n');
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
    '--user-data-dir=/tmp/chrome-phase11-profile-' + Date.now(),
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
        if (btn) btn.click();
        const overlay = document.getElementById('main-menu-overlay');
        if (overlay) overlay.remove();
        return window.__KINGMAKER_DEBUG__ ? 'Started' : 'Waiting';
      })()`,
      returnByValue: true
    });
    if (clickRes.result.value === 'Started') {
      console.log('[CDP] Game started and menu overlay removed.');
      break;
    }
  }

  // Allow 3D scene, character models, and textures to settle
  console.log('[CDP] Allowing 3D world assets to load and render...');
  await new Promise(r => setTimeout(r, 5000));

  async function captureShot(filename, scriptToRun) {
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
      await new Promise(r => setTimeout(r, 700));
    }

    const res = await sendCommand('Page.captureScreenshot', { format: 'png', fromSurface: true });
    const fullPath = path.join(SCREENSHOTS_DIR, filename);
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(fullPath, buf);
    console.log(`📸 Captured: ${filename} (${(buf.length / 1024).toFixed(1)} KB)`);
    return fullPath;
  }

  // Log runtime performance telemetry
  const perfData = await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const debug = window.__KINGMAKER_DEBUG__;
      if (!debug) return null;
      const stats = debug.perfMonitor.getStats(
        debug.rendererManager.renderer,
        'webgl2',
        false,
        debug.scene,
        14.0,
        debug.chunkManager.getActiveChunkCount(),
        0, 40, 40, 0, 40, 10, 10, 35, 0
      );
      return {
        fps: debug.perfMonitor.fps,
        frameTimeMs: debug.perfMonitor.frameTimeMs,
        drawCalls: stats.drawCalls,
        triangles: stats.triangles,
        textures: stats.textures,
        activeChunks: stats.activeChunks
      };
    })()`,
    returnByValue: true
  });
  console.log('\n📊 Runtime Performance Telemetry:', perfData.result.value);

  // Helper inside browser to ensure clean state
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const debug = window.__KINGMAKER_DEBUG__;
      if (!debug) return;
      const scene = debug.scene;
      const pipeline = debug.assetPipeline;

      // Create inspection NPCs if they don't exist yet
      let npcBiz = scene.getObjectByName('NPC_Showcase_Business');
      if (!npcBiz) {
        npcBiz = pipeline.getCharacterMesh('office_worker');
        npcBiz.name = 'NPC_Showcase_Business';
        scene.add(npcBiz);
        const anims = npcBiz.userData.animations || pipeline.getAnimations('char_pedestrian_business_01');
        if (anims && anims.length > 0) {
          const mixer = new window.THREE.AnimationMixer(npcBiz);
          const clip = anims.find(c => c.name.toLowerCase().includes('idle')) || anims[0];
          mixer.clipAction(clip).play();
          mixer.update(0.1);
          npcBiz.userData.mixer = mixer;
        }
      }
      npcBiz.position.set(500, 0, 500); // park far away initially

      let npcStudent = scene.getObjectByName('NPC_Showcase_Student');
      if (!npcStudent) {
        npcStudent = pipeline.getCharacterMesh('student');
        npcStudent.name = 'NPC_Showcase_Student';
        scene.add(npcStudent);
        const anims = npcStudent.userData.animations || pipeline.getAnimations('char_pedestrian_student_01');
        if (anims && anims.length > 0) {
          const mixer = new window.THREE.AnimationMixer(npcStudent);
          const clip = anims.find(c => c.name.toLowerCase().includes('idle')) || anims[0];
          mixer.clipAction(clip).play();
          mixer.update(0.1);
          npcStudent.userData.mixer = mixer;
        }
      }
      npcStudent.position.set(500, 0, 500); // park far away initially
    })()`,
    returnByValue: true
  });

  // -------------------------------------------------------------
  // SHOT 1: Player Front View at 2 Metres (Face, Eyes, Streetwear)
  // -------------------------------------------------------------
  console.log('\n--- 1. Player Front View (2 Metres Close-up) ---');
  await captureShot('phase11_player_front_2m.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;

    // Park showcase NPCs far away
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) b.position.set(500, 0, 500);
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) s.position.set(500, 0, 500);

    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }
    // Front close-up framing
    player.cameraManager.setOrbit(0, 0.04, 2.0);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 2: Player Side View at 2 Metres (Anatomy & Profile)
  // -------------------------------------------------------------
  console.log('\n--- 2. Player Side View (2 Metres Profile) ---');
  await captureShot('phase11_player_side_2m.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;

    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }
    // 90-degree side profile
    player.cameraManager.setOrbit(Math.PI * 0.5, 0.04, 2.0);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 3: Player at 5 Metres in Nairobi Scene
  // -------------------------------------------------------------
  console.log('\n--- 3. Player at 5 Metres in Nairobi Scene ---');
  await captureShot('phase11_player_nairobi_5m.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;

    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }
    // Three-quarter angle at 5 metres in street
    player.cameraManager.setOrbit(0.28, 0.1, 5.0);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 4: Business Professional NPC (Front Close-up)
  // -------------------------------------------------------------
  console.log('\n--- 4. Business Professional NPC (Nairobi CBD Executive) ---');
  await captureShot('phase11_npc_business_professional.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;

    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    // Hide player model so it does not overlap with Business NPC
    if (player.mesh.children[0]) player.mesh.children[0].visible = false;

    // Park student NPC far away
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) {
      s.position.set(500, 0, 500);
      s.visible = false;
    }

    // Position Business NPC right at target position
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) {
      b.position.set(0, 0.45, 15.0);
      b.rotation.y = 0;
      b.visible = true;
    }

    // Orbit around Business NPC at 2.1m
    player.cameraManager.setOrbit(0, 0.04, 2.1);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 5: University Student NPC (Front Close-up)
  // -------------------------------------------------------------
  console.log('\n--- 5. University Student NPC ---');
  await captureShot('phase11_npc_student.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;

    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    // Hide player model so it does not overlap with Student NPC
    if (player.mesh.children[0]) player.mesh.children[0].visible = false;

    // Park Business NPC far away
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) {
      b.position.set(500, 0, 500);
      b.visible = false;
    }

    // Position Student NPC at target position
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) {
      s.position.set(0, 0.45, 15.0);
      s.rotation.y = 0;
      s.visible = true;
    }

    // Orbit around Student NPC at 2.1m
    player.cameraManager.setOrbit(0, 0.04, 2.1);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // Restore player model visibility for subsequent shots
  await sendCommand('Runtime.evaluate', {
    expression: `(() => {
      const debug = window.__KINGMAKER_DEBUG__;
      if (debug && debug.player && debug.player.mesh.children[0]) {
        debug.player.mesh.children[0].visible = true;
      }
    })()`,
    returnByValue: true
  });

  // -------------------------------------------------------------
  // SHOT 6: Player Walking Animation
  // -------------------------------------------------------------
  console.log('\n--- 6. Player Walking Animation ---');
  await captureShot('phase11_player_walking_animation.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;

    // Move showcase NPCs far away
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) b.position.set(500, 0, 500);
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) s.position.set(500, 0, 500);

    // Reset player to crosswalk
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;

    if (player.animController) {
      player.animController.setState('walk');
      player.animController.update(0.35); // dynamic mid-stride pose
    }
    // Front three-quarter angle to show stride, foot contact, and arm swing
    player.cameraManager.setOrbit(0.32, 0.04, 2.5);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 7: Player Running Animation
  // -------------------------------------------------------------
  console.log('\n--- 7. Player Running Animation ---');
  await captureShot('phase11_player_running_animation.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;

    // Move showcase NPCs far away
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) b.position.set(500, 0, 500);
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) s.position.set(500, 0, 500);

    // Reset player to crosswalk
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;

    if (player.animController) {
      player.animController.setState('run');
      player.animController.update(0.28); // dynamic sprinting stride
    }
    player.cameraManager.setOrbit(0.32, 0.04, 2.5);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  // -------------------------------------------------------------
  // SHOT 8: Player Alongside Two Distinct NPCs
  // -------------------------------------------------------------
  console.log('\n--- 8. Player Alongside Two Distinct NPCs ---');
  await captureShot('phase11_player_and_two_npcs.png', () => {
    const debug = window.__KINGMAKER_DEBUG__;
    if (!debug) return;
    const player = debug.player;

    // Player in Center
    player.motor.position.set(0, 0.45, 15);
    player.motor.rotationY = 0;
    player.mesh.rotation.y = 0;
    player.mesh.position.copy(player.motor.position);
    player.mesh.visible = true;
    if (player.animController) {
      player.animController.setState('idle');
      player.animController.update(0.1);
    }

    // Business NPC on Left
    const b = debug.scene.getObjectByName('NPC_Showcase_Business');
    if (b) {
      b.position.set(-1.15, 0.45, 15.0);
      b.rotation.y = 0.12;
      b.visible = true;
    }

    // Student NPC on Right
    const s = debug.scene.getObjectByName('NPC_Showcase_Student');
    if (s) {
      s.position.set(1.15, 0.45, 15.0);
      s.rotation.y = -0.12;
      s.visible = true;
    }

    // Frame all three characters together at 3.6m distance
    player.cameraManager.setOrbit(0, 0.06, 3.6);
    player.cameraManager.snapToTarget(player.motor.position);
  });

  console.log('\n=== Visual Acceptance Screenshots Capture Complete ===');
  ws.close();
  cleanup();
  console.log('✅ All Phase 11.3 visual acceptance screenshots updated and captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
