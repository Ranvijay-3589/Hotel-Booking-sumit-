import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react({ include: /\.[jt]sx?$/ })],
  base: '/sumit/',
  server: {
    proxy: {
      '/api': 'http://localhost:5003',
    },
  },
  build: {
    outDir: 'dist',
  },
});
