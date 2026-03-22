// frontend/vite.config.js
//
// WHY THIS FILE:
// Vite is our build tool — it serves the React app in development
// and bundles it for production.
//
// The proxy setting forwards /api calls to FastAPI during development
// so we don't hit CORS issues when testing locally.

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    port: 5173,

    // PROXY: During development, forward /api/* to the FastAPI backend
    // This means in React we can write: axios.get('/api/v1/promises')
    // Vite will automatically forward it to: http://localhost:8000/api/v1/promises
    // In production (Vercel), we set the full URL in the environment variable
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})