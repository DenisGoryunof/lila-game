import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSSG } from 'vite-plugin-ssg-spa'

export default defineConfig({
  plugins: [
    react(),
    viteSSG(),
  ],
  base: '/lila-game/',
})