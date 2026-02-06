import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: path.resolve(__dirname, 'src/main/index.ts'),
        onstart: async ({ startup }) => {
          // Fix electron import before starting
          const mainIndexPath = path.resolve(__dirname, 'dist/main/index.js');
          const fs = await import('fs');
          if (fs.existsSync(mainIndexPath)) {
            let content = fs.readFileSync(mainIndexPath, 'utf8');
            content = content.replace(
              /^const electron = require\("electron"\);/m,
              `const electron = (function() {
  const req = typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require;
  try {
    const e = req("electron");
    console.log("[ELECTRON FIX] Type:", typeof e, "Keys:", typeof e === 'object' ? Object.keys(e).slice(0, 5) : 'N/A');
    if (typeof e === 'string') {
      console.log("[ELECTRON FIX] Got string, trying process.electronBinding");
      if (process.electronBinding) {
        return process.electronBinding('electron');
      }
    }
    return e;
  } catch(err) {
    console.error("[ELECTRON FIX] Error:", err.message);
    throw err;
  }
})();`
            );
            fs.writeFileSync(mainIndexPath, content, 'utf8');
            console.log('✓ Fixed electron module resolution with enhanced logging');
          }
          await startup();
        },
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist/main'),
            emptyOutDir: true,
            rollupOptions: {
              external: ['sqlite3', 'electron'],
            },
            commonjsOptions: {
              ignore: ['electron'],
            },
          },
          resolve: {
            conditions: ['node'],
          },
        },
      },
      preload: {
        input: path.resolve(__dirname, 'src/preload/index.ts'),
        vite: {
          build: {
            outDir: path.resolve(__dirname, 'dist/preload'),
            emptyOutDir: true,
            rollupOptions: {
              output: {
                entryFileNames: 'index.cjs',
                format: 'cjs',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/renderer'),
    },
  },
  root: 'src/renderer',
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
    }
  },
});
