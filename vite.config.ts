import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const apiTarget = (process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '')

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 5173),
    strictPort: false,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: Number(process.env.VITE_PORT || 4173),
  },
})
