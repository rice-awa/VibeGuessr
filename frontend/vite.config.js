import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  server: {
    clearScreen: false,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
    port: 8085,
    host: '0.0.0.0',
    allowedHosts: ['dev.rice-awa.top'],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 8085,
    allowedHosts: ['dev.rice-awa.top'],
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
