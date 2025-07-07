import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/server.ts'),
      name: 'Server',
      fileName: 'server',
      formats: ['cjs']
    },
    rollupOptions: {
      external: ['express', 'cors', 'helmet', 'dotenv', 'ws', 'uuid']
    },
    outDir: 'dist'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  }
});