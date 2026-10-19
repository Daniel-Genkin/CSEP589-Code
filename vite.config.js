import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    // On GitHub Pages this repo is served from a subpath (https://<user>.github.io/<repo>/),
    // so assets and routes must be prefixed with the repo name instead of the domain root.
    base: process.env.GITHUB_ACTIONS ? '/CSEP589-Code/' : '/',
    plugins: [vue()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // Only used when VITE_API_MODE=http: forwards /api calls to the real backend during development.
      proxy: env.API_PROXY_TARGET
        ? { '/api': { target: env.API_PROXY_TARGET, changeOrigin: true } }
        : undefined,
    },
  }
})
