import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    emptyOutDir: false,    // don't wipe folder on rebuild
    copyPublicDir: false,  // images stay in public/images/, not copied to assets/
  },
  server: {
    port: 3000,
    host: true,
  },
});
