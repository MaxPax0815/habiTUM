import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// Backend target for the dev proxy. The habit feature calls the API with
// relative URLs (e.g. fetch('/api/habits')); Vite forwards those to the
// Express server so the browser never hits a cross-origin/CORS wall.
const apiProxyTarget = process.env.VITE_API_PROXY_TARGET || 'http://localhost:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  }
})
