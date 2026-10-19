// "mock" answers every request in the browser (src/api/mock); "http" calls the real backend.
export const apiConfig = {
  mode: import.meta.env.VITE_API_MODE === 'http' ? 'http' : 'mock',
  baseUrl: (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, ''),
}

export const isMockApi = apiConfig.mode === 'mock'
