import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@nx-shay/shared': path.resolve(__dirname, '../../libs/shared/src/index.ts'),
    },
  },
  server: {
    port: 3003,
    host: true,
    allowedHosts: ['.share.zrok.io'],
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
