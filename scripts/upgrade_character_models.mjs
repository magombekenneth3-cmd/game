import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { PNG } from 'pngjs';

const ROOT = process.cwd();
const CHAR_DIR = path.join(ROOT, 'public/assets/models/characters');

console.log('=== KINGMAKER: Building Authentic Realistic Nairobi Characters ===\n');

// Helper to write a PNG and convert to JPEG with sips
function writeJpegFromPng(png, targetJpgPath) {
  const tmpPng = targetJpgPath.replace(/\.jpe?g$/i, '_tmp.png');
  const buffer = PNG.sync.write(png);
  fs.writeFileSync(tmpPng, buffer);
  execSync(`/usr/bin/sips -s format jpeg "${tmpPng}" --out "${targetJpgPath}"`, { stdio: 'pipe' });
  if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng);
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Photorealistic Face (East African Melanin)
// -------------------------------------------------------------
function createFaceTexture(options = {}) {
  const {
    isBusiness = false,
    baseR = 82, baseG = 54, baseB = 40, // Warm rich melanin
  } = options;

  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Distance from face center (512, 450)
      const dx = (x - 512) / 380;
      const dy = (y - 450) / 420;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Radial melanin shading
      let r = baseR;
      let g = baseG;
      let b = baseB;

      // Forehead & Cheekbone ambient highlights
      const cheek1 = Math.hypot((x - 400) / 90, (y - 460) / 70);
      const cheek2 = Math.hypot((x - 624) / 90, (y - 460) / 70);
      const forehead = Math.hypot((x - 512) / 160, (y - 230) / 80);
      const noseBridge = Math.hypot((x - 512) / 30, (y - 370) / 90);

      if (cheek1 < 1.0) {
        const factor = (1.0 - cheek1) * 0.18;
        r += 24 * factor; g += 16 * factor; b += 12 * factor;
      }
      if (cheek2 < 1.0) {
        const factor = (1.0 - cheek2) * 0.18;
        r += 24 * factor; g += 16 * factor; b += 12 * factor;
      }
      if (forehead < 1.0) {
        const factor = (1.0 - forehead) * 0.15;
        r += 20 * factor; g += 14 * factor; b += 10 * factor;
      }
      if (noseBridge < 1.0) {
        const factor = (1.0 - noseBridge) * 0.22;
        r += 28 * factor; g += 18 * factor; b += 14 * factor;
      }

      // Outer occlusion / edge shading
      if (dist > 0.8) {
        const edge = Math.min(1.0, (dist - 0.8) / 0.4);
        r -= 20 * edge; g -= 14 * edge; b -= 10 * edge;
      }

      // Lips: center (512, 485), width 150, height 36
      const lipDist = Math.hypot((x - 512) / 75, (y - 485) / 18);
      if (lipDist < 1.0) {
        const lipFactor = 1.0 - lipDist;
        // Warm natural terra-cotta lips
        r = r * (1 - lipFactor) + 115 * lipFactor;
        g = g * (1 - lipFactor) + 68 * lipFactor;
        b = b * (1 - lipFactor) + 56 * lipFactor;
      }

      // Nostrils: left (490, 422), right (534, 422)
      const nostrilL = Math.hypot((x - 490) / 14, (y - 422) / 10);
      const nostrilR = Math.hypot((x - 534) / 14, (y - 422) / 10);
      if (nostrilL < 1.0 || nostrilR < 1.0) {
        r = Math.min(r, 28); g = Math.min(g, 18); b = Math.min(b, 14);
      }

      // Eyebrows: left (395, 280), right (629, 280)
      const browL = Math.hypot((x - 395) / 60, (y - 280) / 14);
      const browR = Math.hypot((x - 629) / 60, (y - 280) / 14);
      if (browL < 1.0 || browR < 1.0) {
        const bFactor = 1.0 - Math.min(browL, browR);
        r = r * (1 - bFactor) + 22 * bFactor;
        g = g * (1 - bFactor) + 16 * bFactor;
        b = b * (1 - bFactor) + 12 * bFactor;
      }

      // Ears shading: (210, 360) and (814, 360)
      const earL = Math.hypot((x - 210) / 45, (y - 360) / 60);
      const earR = Math.hypot((x - 814) / 45, (y - 360) / 60);
      if (earL < 1.0 || earR < 1.0) {
        r += 8; g += 4; b += 2;
      }

      // Hairline gradient along top (y < 120)
      if (y < 130) {
        const hairFactor = (130 - y) / 130;
        r = r * (1 - hairFactor) + 22 * hairFactor;
        g = g * (1 - hairFactor) + 16 * hairFactor;
        b = b * (1 - hairFactor) + 12 * hairFactor;
      }

      // Business mature goatee/beard line if isBusiness
      if (isBusiness) {
        const chin = Math.hypot((x - 512) / 80, (y - 540) / 35);
        if (chin < 1.0) {
          const gFactor = (1.0 - chin) * 0.65;
          r = r * (1 - gFactor) + 24 * gFactor;
          g = g * (1 - gFactor) + 18 * gFactor;
          b = b * (1 - gFactor) + 14 * gFactor;
        }
      }

      // Subtle skin pore micro-texture
      const noise = ((x * 17 + y * 31) % 7) - 3;
      r = Math.max(0, Math.min(255, Math.round(r + noise)));
      g = Math.max(0, Math.min(255, Math.round(g + noise)));
      b = Math.max(0, Math.min(255, Math.round(b + noise)));

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Nairobi Streetwear Bomber Jacket (Player Top)
// -------------------------------------------------------------
function createStreetwearTopTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Base jacket body: deep charcoal twill (RGB 36, 40, 48)
      let r = 36;
      let g = 40;
      let b = 48;

      // Sleeve regions (outer quarters x < 240 or x > 780): deep olive leatherette
      if (x < 240 || x > 780) {
        r = 42; g = 58; b = 46;
      }

      // Center front zipper track (x between 506 and 518, y between 180 and 850)
      if (x >= 506 && x <= 518 && y >= 180 && y <= 850) {
        // Metallic brass zipper teeth
        const tooth = (y % 6 < 3) ? 220 : 160;
        r = tooth; g = Math.round(tooth * 0.82); b = Math.round(tooth * 0.45);
      }

      // Center front seam highlight (x around 504 and 520)
      if ((x >= 502 && x <= 505) || (x >= 519 && x <= 522)) {
        r = 24; g = 26; b = 30; // Shadow seam
      }

      // Athletic ribbed knit collar (y between 120 and 175, x between 420 and 604)
      if (y >= 120 && y <= 175 && x >= 420 && x <= 604) {
        // Black ribbed knit with golden accent stripe
        if (y >= 142 && y <= 152) {
          r = 225; g = 168; b = 45; // Vibrant gold stripe
        } else {
          r = 18; g = 20; b = 24; // Black knit
        }
      }

      // Inner crewneck tee showing above collar (y < 120, x between 440 and 584)
      if (y < 120 && x >= 440 && x <= 584) {
        r = 236; g = 232; b = 224; // Clean heather white cotton tee
      }

      // Ribbed waist hem (y between 850 and 910)
      if (y >= 850 && y <= 910) {
        if (y >= 875 && y <= 885) {
          r = 225; g = 168; b = 45; // Gold stripe
        } else {
          r = 18; g = 20; b = 24;
        }
      }

      // Subtle fabric weave texture
      const weave = ((x + y) % 4 === 0) ? 4 : -4;
      r = Math.max(0, Math.min(255, r + weave));
      g = Math.max(0, Math.min(255, g + weave));
      b = Math.max(0, Math.min(255, b + weave));

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Raw Indigo Denim Jeans (Player Bottom)
// -------------------------------------------------------------
function createDenimBottomTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Base raw indigo denim: RGB 28, 35, 52
      let r = 28;
      let g = 35;
      let b = 52;

      // Thigh & Knee subtle wear fade (y between 400 and 700)
      if (y >= 400 && y <= 700) {
        const thigh1 = Math.hypot((x - 260) / 90, (y - 540) / 120);
        const thigh2 = Math.hypot((x - 760) / 90, (y - 540) / 120);
        if (thigh1 < 1.0) {
          const fade = (1.0 - thigh1) * 0.22;
          r += 35 * fade; g += 42 * fade; b += 55 * fade;
        }
        if (thigh2 < 1.0) {
          const fade = (1.0 - thigh2) * 0.22;
          r += 35 * fade; g += 42 * fade; b += 55 * fade;
        }
      }

      // Waistband along top (y between 50 and 110)
      if (y >= 50 && y <= 110) {
        // Brass button at center (512, 80)
        const btnDist = Math.hypot(x - 512, y - 80);
        if (btnDist <= 10) {
          r = 210; g = 175; b = 70; // Brass button
        } else {
          r = 24; g = 30; b = 45; // Waistband
        }
      }

      // Tobacco/gold contrast topstitching (outseams and fly)
      // Fly stitch line (x between 508 and 514, y between 110 and 260)
      if (x >= 510 && x <= 512 && y >= 110 && y <= 260 && (y % 4 < 2)) {
        r = 215; g = 158; b = 55; // Golden thread
      }
      // Outseam stitches on outer borders
      if ((x === 30 || x === 994) && (y % 5 < 3)) {
        r = 215; g = 158; b = 55;
      }

      // Pocket copper rivets (x around 370 and 650, y around 130)
      if ((Math.hypot(x - 370, y - 130) < 5) || (Math.hypot(x - 654, y - 130) < 5)) {
        r = 185; g = 115; b = 50; // Copper rivet
      }

      // 3x1 twill diagonal denim weave
      const twill = ((x * 2 + y) % 4 === 0) ? 6 : -3;
      r = Math.max(0, Math.min(255, r + twill));
      g = Math.max(0, Math.min(255, g + twill));
      b = Math.max(0, Math.min(255, b + twill));

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Contemporary Urban Sneakers (Player Footwear)
// -------------------------------------------------------------
function createSneakerFootwearTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Base sneaker upper: matte black leather (RGB 30, 32, 36)
      let r = 30;
      let g = 32;
      let b = 36;

      // Outsole / Midsole region: crisp off-white vulcanized rubber (y > 750 or specific UV patch)
      if (y > 750 || x < 260) {
        r = 242; g = 240; b = 235; // Clean white rubber sole
        // Subtle foxing stripe on midsole
        if (y >= 810 && y <= 820) {
          r = 25; g = 25; b = 28; // Black racing stripe on sole
        }
      }

      // Laces region (x between 480 and 544, y between 320 and 580)
      if (x >= 480 && x <= 544 && y >= 320 && y <= 580) {
        if ((y % 28) < 10) {
          r = 248; g = 248; b = 248; // White cotton cross-laces
        }
      }

      // Breathable mesh perforations on toe box
      if (x >= 460 && x <= 564 && y >= 600 && y <= 720) {
        const dot = (x % 6 < 2 && y % 6 < 2) ? -12 : 6;
        r = Math.max(0, Math.min(255, r + dot));
        g = Math.max(0, Math.min(255, g + dot));
        b = Math.max(0, Math.min(255, b + dot));
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Tailored Business Suit Jacket (Business Top)
// -------------------------------------------------------------
function createBusinessSuitTopTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Base tailored Italian wool: midnight navy / charcoal (RGB 24, 32, 45)
      let r = 24;
      let g = 32;
      let b = 45;

      // Center V-opening for dress shirt and tie (x between 460 and 564, y between 120 and 520)
      const vDist = Math.abs(x - 512);
      const vWidth = 14 + (y - 120) * 0.16; // Narrowing downwards

      if (y >= 120 && y <= 480 && vDist < vWidth) {
        // Center tie: royal burgundy silk (x between 500 and 524)
        if (vDist <= 12 && y >= 170) {
          r = 135; g = 26; b = 42; // Rich burgundy silk tie
          // Subtle diagonal silk twill
          if ((x + y) % 6 < 3) {
            r += 12; g += 4; b += 6;
          }
        } else {
          // Crisp white poplin dress shirt
          r = 252; g = 252; b = 254;
        }
      }

      // Suit lapels: tailored peak lapel lines (vDist between vWidth and vWidth + 24)
      if (y >= 120 && y <= 560 && vDist >= vWidth && vDist <= vWidth + 26) {
        r = 18; g = 24; b = 34; // Lapel shadow / edge
      }

      // Breast pocket with white silk pocket square (x around 370 to 420, y around 380)
      if (x >= 370 && x <= 420 && y >= 376 && y <= 390) {
        if (y <= 382) {
          r = 255; g = 255; b = 255; // White pocket square tip
        } else {
          r = 16; g = 22; b = 30; // Pocket welt
        }
      }

      // Fine worsted wool micro-weave
      const weave = ((x * 3 + y) % 4 === 0) ? 3 : -3;
      r = Math.max(0, Math.min(255, r + weave));
      g = Math.max(0, Math.min(255, g + weave));
      b = Math.max(0, Math.min(255, b + weave));

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Tailored Business Trousers (Business Bottom)
// -------------------------------------------------------------
function createBusinessTrousersTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Matching midnight navy / charcoal wool: RGB 24, 32, 45
      let r = 24;
      let g = 32;
      let b = 45;

      // Sharp pressed center crease lines down each leg (x = 260 and x = 760)
      if (y >= 160 && y <= 950) {
        if (Math.abs(x - 260) <= 2 || Math.abs(x - 760) <= 2) {
          r += 18; g += 22; b += 28; // Crease highlight
        }
      }

      // Black leather belt along waistband (y between 60 and 100)
      if (y >= 60 && y <= 100) {
        if (Math.abs(x - 512) <= 12) {
          r = 215; g = 215; b = 220; // Polished silver buckle
        } else {
          r = 12; g = 12; b = 14; // Black leather belt
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Polished Leather Oxford Shoes (Business Shoes)
// -------------------------------------------------------------
function createBusinessOxfordShoesTexture() {
  const png = new PNG({ width: 1024, height: 1024 });

  for (let y = 0; y < 1024; y++) {
    for (let x = 0; x < 1024; x++) {
      const idx = (1024 * y + x) << 2;

      // Mirror-polished black calfskin leather: RGB 16, 16, 18
      let r = 16;
      let g = 16;
      let b = 18;

      // Leather sole edge (y > 800 or x < 260)
      if (y > 800 || x < 260) {
        r = 62; g = 40; b = 26; // Tan/brown leather sole edge
      }

      // Subtle toe cap brogue perforations
      if (x >= 460 && x <= 564 && y >= 640 && y <= 660 && (x % 12 < 4)) {
        r = 35; g = 35; b = 40; // Perforation detail
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: African Iris Texture (Eyes)
// -------------------------------------------------------------
function createEyeTexture() {
  const png = new PNG({ width: 64, height: 64 });

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const idx = (64 * y + x) << 2;
      const dist = Math.hypot(x - 32, y - 32);

      let r = 245; let g = 242; let b = 238; // Sclera

      if (dist <= 26) {
        // Dark limbal ring
        r = 18; g = 12; b = 10;
        if (dist <= 23) {
          // Warm amber / hazel brown iris
          r = 75; g = 46; b = 24;
          if (dist <= 11) {
            // Dark pupil
            r = 6; g = 6; b = 6;
          }
        }
      }

      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = 255;
    }
  }

  return png;
}

// -------------------------------------------------------------
// TEXTURE GENERATOR: Solid Color Swatch
// -------------------------------------------------------------
function createSolidTexture(width, height, r, g, b) {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    const idx = i << 2;
    png.data[idx] = r;
    png.data[idx + 1] = g;
    png.data[idx + 2] = b;
    png.data[idx + 3] = 255;
  }
  return png;
}

// =============================================================
// MAIN PIPELINE EXECUTION
// =============================================================
async function main() {
  // 1. UPGRADE PLAYER MODEL (char_player_01.glb)
  console.log('1. Upgrading Player Character (Contemporary East African Urban Protagonist)...');
  const playerBuildDir = '/tmp/kingmaker_player_build';
  if (fs.existsSync(playerBuildDir)) fs.rmSync(playerBuildDir, { recursive: true, force: true });
  fs.mkdirSync(playerBuildDir, { recursive: true });

  execSync(`gltf-pipeline -i "${path.join(CHAR_DIR, 'char_player_01.glb')}" -o "${path.join(playerBuildDir, 'player.gltf')}" -s`, { stdio: 'pipe' });

  // Read gltf JSON and remove cowboy hat (child 73) and mustache (child 72)
  const playerGltfPath = path.join(playerBuildDir, 'player.gltf');
  const playerGltf = JSON.parse(fs.readFileSync(playerGltfPath, 'utf8'));

  const armatureNode = playerGltf.nodes[71];
  if (armatureNode && armatureNode.children) {
    // Remove 73 (Wolf3D_Headwear) and 72 (Wolf3D_Beard)
    armatureNode.children = armatureNode.children.filter((c) => c !== 73 && c !== 72);
  }
  fs.writeFileSync(playerGltfPath, JSON.stringify(playerGltf, null, 2));

  // Write photorealistic PBR textures
  console.log('  Generating East African Melanin Face Texture...');
  writeJpegFromPng(createFaceTexture({ isBusiness: false }), path.join(playerBuildDir, 'baseColor.jpg'));

  console.log('  Generating African Iris Texture...');
  writeJpegFromPng(createEyeTexture(), path.join(playerBuildDir, 'baseColor_1.jpg'));

  console.log('  Generating Natural Hair Texture...');
  writeJpegFromPng(createSolidTexture(32, 32, 22, 16, 12), path.join(playerBuildDir, 'baseColor_2.jpg'));

  console.log('  Generating Body Melanin Skin Tone Texture...');
  writeJpegFromPng(createSolidTexture(128, 128, 82, 54, 40), path.join(playerBuildDir, 'baseColor_3.jpg'));

  console.log('  Generating Nairobi Streetwear Bomber Jacket Texture...');
  writeJpegFromPng(createStreetwearTopTexture(), path.join(playerBuildDir, 'outfit-wedding-01-v2-m-top-D.jpg'));

  console.log('  Generating Raw Indigo Denim Jeans Texture...');
  writeJpegFromPng(createDenimBottomTexture(), path.join(playerBuildDir, 'outfit-wedding-01-v2-m-bottom-D.jpg'));

  console.log('  Generating Urban Street Sneakers Texture...');
  writeJpegFromPng(createSneakerFootwearTexture(), path.join(playerBuildDir, 'outfit-wedding-01-v2-m-footwear-D.jpg'));

  // Repack Player GLB
  const finalPlayerGlb = path.join(CHAR_DIR, 'char_player_01.glb');
  execSync(`gltf-pipeline -i "${playerGltfPath}" -o "${finalPlayerGlb}" -b`, { stdio: 'pipe' });
  const playerSz = fs.statSync(finalPlayerGlb).size;
  console.log(`✓ Upgraded Player Model: ${finalPlayerGlb} (${(playerSz / 1024).toFixed(1)} KB)`);

  // 2. UPGRADE BUSINESS PROFESSIONAL NPC (char_pedestrian_business_01.glb)
  console.log('\n2. Upgrading Business Professional NPC (Contemporary Nairobi CBD Executive)...');
  const bizBuildDir = '/tmp/kingmaker_biz_build';
  if (fs.existsSync(bizBuildDir)) fs.rmSync(bizBuildDir, { recursive: true, force: true });
  fs.mkdirSync(bizBuildDir, { recursive: true });

  // Unpack original base player
  execSync(`gltf-pipeline -i "${finalPlayerGlb}" -o "${path.join(bizBuildDir, 'business.gltf')}" -s`, { stdio: 'pipe' });

  // Generate Business Suit PBR Textures
  console.log('  Generating Executive Mature Face Texture...');
  writeJpegFromPng(createFaceTexture({ isBusiness: true }), path.join(bizBuildDir, 'baseColor.jpg'));

  console.log('  Generating Tailored Italian Wool Business Suit Jacket & Tie...');
  writeJpegFromPng(createBusinessSuitTopTexture(), path.join(bizBuildDir, 'outfit-wedding-01-v2-m-top-D.jpg'));

  console.log('  Generating Pressed Dress Trousers with Leather Belt...');
  writeJpegFromPng(createBusinessTrousersTexture(), path.join(bizBuildDir, 'outfit-wedding-01-v2-m-bottom-D.jpg'));

  console.log('  Generating Polished Oxford Calfskin Leather Shoes...');
  writeJpegFromPng(createBusinessOxfordShoesTexture(), path.join(bizBuildDir, 'outfit-wedding-01-v2-m-footwear-D.jpg'));

  // Repack Business NPC GLB
  const finalBizGlb = path.join(CHAR_DIR, 'char_pedestrian_business_01.glb');
  execSync(`gltf-pipeline -i "${path.join(bizBuildDir, 'business.gltf')}" -o "${finalBizGlb}" -b`, { stdio: 'pipe' });
  const bizSz = fs.statSync(finalBizGlb).size;
  console.log(`✓ Upgraded Business Professional: ${finalBizGlb} (${(bizSz / 1024).toFixed(1)} KB)`);

  // Also update driver and guard with appropriate models
  fs.copyFileSync(finalBizGlb, path.join(CHAR_DIR, 'char_guard_security_01.glb'));
  fs.copyFileSync(finalPlayerGlb, path.join(CHAR_DIR, 'char_driver_01.glb'));

  console.log('\n🎉 All character art successfully built and packaged!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
