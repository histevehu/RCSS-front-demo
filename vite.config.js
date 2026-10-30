import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const proxy = { '/api': { target: process.env.DEMO_API_URL || 'http://127.0.0.1:8001', changeOrigin: true, rewrite: path => path.replace(/^\/api/, '') } }

export default defineConfig({
  plugins: [vue()],
  preview: { proxy },
  server: {
    port: 3000,
    open: false,
    proxy
  }
})
