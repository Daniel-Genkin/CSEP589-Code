// In-browser stand-in for the backend database. Persisted to localStorage so the demo survives reloads.
import { createSeed } from './seed'

const STORAGE_KEY = 'outvest.mock-db.v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const db = load() ?? createSeed()

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Storage full or disabled: keep working in memory.
  }
}

export function resetMockDb() {
  localStorage.removeItem(STORAGE_KEY)
}
