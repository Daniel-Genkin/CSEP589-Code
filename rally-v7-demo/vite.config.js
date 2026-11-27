import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' keeps the build working from any folder or GitHub Pages path.
export default defineConfig({
  base: './',
  plugins: [vue()],
  server: { port: 5180 },
})
