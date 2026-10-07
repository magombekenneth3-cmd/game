/**
 * KINGMAKER: Rise of Africa — Development Placeholder Asset Generator
 * 
 * CRITICAL NOTICE:
 * THESE ASSETS ARE DEVELOPMENT FALLBACKS ONLY AND ARE NOT PRODUCTION ART.
 * DO NOT USE THIS SCRIPT OR EXPORTED MESHES AS PRODUCTION ART.
 * Production art is loaded from genuine authored 3D GLB models in public/assets/models/.
 */
const THREE = require('three');
const { GLTFExporter } = require('three/examples/jsm/exporters/GLTFExporter.js');
const fs = require('fs');
const path = require('path');

global.FileReader = class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (this.onloadend) this.onloadend();
      if (this.onload) this.onload();
    });
  }
};

const OUTPUT_DIR = path.resolve(__dirname, '../public/assets/models_fallback');

function exportGLB(group, relativePath) {
  return new Promise((resolve, reject) => {
    const fullPath = path.join(OUTPUT_DIR, relativePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const exporter = new GLTFExporter();
    exporter.parse(
      group,
      (gltf) => {
        const buffer = Buffer.from(gltf);
        fs.writeFileSync(fullPath, buffer);
        console.log(`[Placeholder Fallback Export] Saved ${relativePath} (${buffer.length} bytes)`);
        resolve({ path: relativePath, size: buffer.length });
      },
      (err) => reject(err),
      { binary: true }
    );
  });
}

console.log('Placeholder asset generator module initialized as development fallback.');
