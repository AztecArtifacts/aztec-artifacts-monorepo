import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const resolveFromRoot = (relativePath: string) =>
  path.resolve(fileURLToPath(new URL('.', import.meta.url)), relativePath);

export default defineConfig({
  resolve: {
    alias: {
      assert: 'assert',
      buffer: 'buffer',
      path: 'path-browserify',
      process: 'process/browser',
      tty: resolveFromRoot('./polyfills/tty.ts'),
      util: 'util',
    },
  },
  optimizeDeps: {
    include: ['assert', 'buffer', 'process', 'util', 'path-browserify'],
  },
  server: {
    port: 4173,
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
