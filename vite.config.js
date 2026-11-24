import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { defineConfig as defineVitestConfig } from 'vitest/config'
import { handleAlpaca } from './server/alpaca.js'
import { handleMarketDataRequest } from './server/alpaca-market-data.js'

/**
 * Serves /api/alpaca during `npm run dev` and `npm run preview`, with the same handler the Vercel
 * function uses. Keys come from the environment and stay on the server.
 */
function alpacaDevApi(env) {
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

function marketDataMiddleware(env) {
  const serve = async (request, response, next) => {
    const url = new URL(request.url ?? '/', 'http://localhost')
    if (url.pathname !== '/api/market-data') return next()
    if (request.method !== 'GET') {
      response.statusCode = 405
      response.setHeader('Allow', 'GET')
      response.setHeader('Content-Type', 'application/json; charset=utf-8')
      response.end(JSON.stringify({ error: { code: 'method_not_allowed', message: 'Use GET for market data.' } }))
      return
    }
    const result = await handleMarketDataRequest(url, env)
    response.statusCode = result.status
    for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value)
    response.end(JSON.stringify(result.body))
  }
  return {
    name: 'rally-alpaca-market-data',
    configureServer(server) {
      server.middlewares.use(serve)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve)
    },
  }
}

export default defineConfig(({ mode }) => {
  const apiEnv = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return defineVitestConfig({
    // On GitHub Pages this repo is served from a subpath (https://<user>.github.io/<repo>/),
    // so assets and routes must be prefixed with the repo name instead of the domain root.
    base: process.env.GITHUB_ACTIONS ? '/CSEP589-Code/' : '/',
    plugins: [alpacaDevApi(apiEnv), marketDataMiddleware(apiEnv), vue()],
    resolve: {
      alias: [
        ...(mode === 'test' ? [{ find: /^@\/data$/, replacement: fileURLToPath(new URL('./src/data/test-index.ts', import.meta.url)) }] : []),
        { find: '@', replacement: fileURLToPath(new URL('./src', import.meta.url)) },
      ],
    },
    test: {
      include: ['src/**/*.test.ts'],
      // Component tests opt in to a DOM with a `@vitest-environment happy-dom` comment.
      environment: 'node',
    },
  })
})
