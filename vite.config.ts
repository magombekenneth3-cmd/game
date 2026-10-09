import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';

function getBuildRevision(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
    }).trim();
  } catch {
    return 'unknown';
  }
}

export default defineConfig({
  define: {
    __BUILD_REVISION__: JSON.stringify(getBuildRevision()),
  },
  server: {
    port: 3000,
    open: false,
    host: true
  },
  build: {
    target: 'esnext',
    sourcemap: true
  }
});
