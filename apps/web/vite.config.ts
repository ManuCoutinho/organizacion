/// <reference types='vite/client' />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_TARGET = process.env.VITE_API_PROXY ?? 'http://localhost:3333'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true }
    }
  },
  resolve: {
    alias: [
      { find: '@', replacement: new URL('./src/', import.meta.url).pathname }
    ]
  }
})
