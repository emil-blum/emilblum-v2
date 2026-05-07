import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Reads the images/ directory at build time and emits a plain filename list.
// Using import.meta.glob would cause Vite to base64-embed the images into the
// IIFE bundle (lib mode inlines all assets). This plugin avoids that entirely.
function imageListPlugin(): Plugin {
  const resolved = '\0virtual:image-list';
  return {
    name: 'image-list',
    resolveId(id) { if (id === 'virtual:image-list') return resolved; },
    load(id) {
      if (id !== resolved) return;
      const dir = resolve(__dirname, 'images');
      const files = readdirSync(dir).filter(f => /\.(jpe?g|png|webp)$/i.test(f));
      return `export const imageList = ${JSON.stringify(files)};`;
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), imageListPlugin()],
  base: './',
  // In IIFE/lib mode Vite doesn't auto-replace process.env.NODE_ENV,
  // so React throws "process is not defined" at runtime. Define it explicitly.
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  build: {
    lib: {
      entry: './src/main.tsx',
      name: 'FragmentCollage',
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        // Clean, hash-free filenames so about.html never needs updating after rebuilds
        entryFileNames: 'fragment-collage.js',
        assetFileNames: 'fragment-collage[extname]',
      },
    },
    outDir: './assets',
    emptyOutDir: false,
    copyPublicDir: false,
  },
  server: {
    port: 3000,
    host: true,
  },
});
