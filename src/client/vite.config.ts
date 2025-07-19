import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    host: true,  // 允许局域网访问
    port: 5173,
    proxy: {
      '/api': 'http://10.219.192.172:3000'  // 改为后端端口 3000
    }
  }
})
