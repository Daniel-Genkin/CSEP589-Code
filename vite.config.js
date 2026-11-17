import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // On GitHub Pages this repo is served from a subpath (https://<user>.github.io/<repo>/),
  // so assets and routes must be prefixed with the repo name instead of the domain root.
  base: process.env.GITHUB_ACTIONS ? '/CSEP589-Code/' : '/',
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Component tests opt in to a DOM with a `@vitest-environment happy-dom` comment.
    environment: 'node',
  },
})
