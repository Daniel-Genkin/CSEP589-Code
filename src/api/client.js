import { apiConfig } from './config'
import { ApiError } from './errors'
import { tokenStore } from './token'

function toQueryString(query) {
  if (!query) return ''
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') params.append(key, value)
  }
  const qs = params.toString()
  return qs ? `?${qs}` : ''
}

async function httpRequest(method, path, { query, body } = {}) {
  const token = tokenStore.get()
  let response
  try {
    response = await fetch(`${apiConfig.baseUrl}${path}${toQueryString(query)}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError(0, "We couldn't reach outvest. Check your connection and try again.", 'NETWORK')
  }

  const data = response.status === 204 ? null : await response.json().catch(() => null)
  if (!response.ok) {
    throw new ApiError(response.status, data?.message || response.statusText, data?.code, data?.details)
  }
  return data
}

let mockServer
async function mockRequest(method, path, options = {}) {
  // Loaded lazily so the mock backend is never downloaded in "http" mode.
  mockServer ??= await import('./mock/server.js')
  return mockServer.handle(method, path, { ...options, token: tokenStore.get() })
}

export function request(method, path, options) {
  return apiConfig.mode === 'http' ? httpRequest(method, path, options) : mockRequest(method, path, options)
}

export const api = {
  get: (path, query) => request('GET', path, { query }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  put: (path, body) => request('PUT', path, { body }),
  delete: (path) => request('DELETE', path),
}
