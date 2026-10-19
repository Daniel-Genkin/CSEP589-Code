// Mock HTTP server: matches METHOD + path against handler tables and simulates network latency.
import { ApiError, ERROR_CODES } from '../errors'
import { db, persist } from './db'
import alerts from './handlers/alerts'
import auth from './handlers/auth'
import billing from './handlers/billing'
import monitoring from './handlers/monitoring'
import scans from './handlers/scans'
import securities from './handlers/securities'
import shares from './handlers/shares'
import { clone, sleep } from './utils'

const routes = [...auth, ...securities, ...scans, ...monitoring, ...alerts, ...shares, ...billing].map((route) => {
  const keys = []
  const pattern = route.path.replace(/:(\w+)/g, (_, key) => {
    keys.push(key)
    return '([^/]+)'
  })
  return { ...route, keys, regex: new RegExp(`^${pattern}/?$`) }
})

function match(method, pathname) {
  for (const route of routes) {
    if (route.method !== method) continue
    const found = pathname.match(route.regex)
    if (found) {
      const params = Object.fromEntries(route.keys.map((key, i) => [key, decodeURIComponent(found[i + 1])]))
      return { route, params }
    }
  }
  return null
}

export async function handle(method, path, { query = {}, body, token } = {}) {
  const pathname = path.split('?')[0]
  const matched = match(method, pathname)
  await sleep(matched?.route.latency ?? 260 + Math.random() * 340)

  if (!matched) throw new ApiError(404, `No mock handler for ${method} ${pathname}`, ERROR_CODES.NOT_FOUND)

  const userId = token ? db.sessions[token] : null
  const user = userId ? db.users.find((u) => u.id === userId) : null
  if (!matched.route.public && !user) {
    throw new ApiError(401, 'Please log in to continue.', ERROR_CODES.UNAUTHENTICATED)
  }

  const result = await matched.route.handler({
    params: matched.params,
    query,
    body: clone(body) ?? {},
    user,
    token,
  })
  persist()
  return clone(result ?? null)
}
