import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import { handleAlpaca } from './server/alpaca.js'

/**
 * Serves /api/alpaca during `npm run dev` and `npm run preview`, with the same handler the Vercel
 * function uses. The keys come from .env.local (see .env.example) and stay on the server.
 */
function alpacaDevApi(mode) {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const middleware = async (req, res, next) => {
    if (req.url?.split('?')[0] !== '/api/alpaca') return next()
    let body = null
    if (req.method === 'POST') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      try {
        body = JSON.parse(Buffer.concat(chunks).toString() || 'null')
      } catch {
        body = null
      }
    }
    const { status, json } = await handleAlpaca(req.method ?? 'GET', body, env, req.headers)
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.setHeader('cache-control', 'no-store')
    res.end(JSON.stringify(json))
  }
  return {
    name: 'alpaca-dev-api',
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

export default defineConfig(({ mode }) => ({
  // On GitHub Pages this repo is served from a subpath (https://<user>.github.io/<repo>/),
  // so assets and routes must be prefixed with the repo name instead of the domain root.
  base: process.env.GITHUB_ACTIONS ? '/CSEP589-Code/' : '/',
  plugins: [vue(), alpacaDevApi(mode)],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.ts'],
    // Component tests opt in to a DOM with a `@vitest-environment happy-dom` comment.
    environment: 'node',
  },
}))
