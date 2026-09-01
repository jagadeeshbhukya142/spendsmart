import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': { target: process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000', changeOrigin: true } },
  },
  build: {
    // No source maps in the production artifact - there's no reason to ship
    // readable source (and inline comments) to every visitor's browser.
    sourcemap: false,
    rollupOptions: {
      output: {
        // Chart.js and the icon set change far less often than app code and
        // are used across most authenticated pages, so they're worth their
        // own cacheable chunk instead of being duplicated into every page
        // chunk or bloating the main bundle.
        manualChunks: {
          charts: ['chart.js'],
          icons: ['lucide-react'],
        },
      },
    },
  },
});
