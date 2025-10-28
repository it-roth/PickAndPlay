import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: 'localhost',
    open: true,
    strictPort: false,
    proxy: {
      // Proxy API requests to backend to avoid CORS in development
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: false,
  // Forward /api/* to backend as-is so backend routes under /api/* are reachable.
      }
    }
  },
  preview: {
    port: 3000,
    host: 'localhost'
  }
})
