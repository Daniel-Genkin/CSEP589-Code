// Plan gating: paid screens send a free user to /upgrade and bring them back afterwards.
import type { Plan } from '@/types'

export const UPGRADE_PATH = '/upgrade'
/** Where to go after upgrading when nothing was asked for. */
export const DEFAULT_AFTER_UPGRADE = '/connect'

/**
 * `next` comes from the URL, so only accept a path inside this app:
 * it must start with a single "/" and must not point back at /upgrade.
 */
export function safeNext(next: unknown, fallback = DEFAULT_AFTER_UPGRADE): string {
  if (typeof next !== 'string') return fallback
  if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return fallback
  let path: string
  try {
    // The router matches paths decoded and case-insensitively, so compare the same way.
    path = decodeURIComponent(next.split(/[?#]/)[0]).toLowerCase().replace(/\/+$/, '')
  } catch {
    return fallback
  }
  if (path === UPGRADE_PATH || path.startsWith(`${UPGRADE_PATH}/`)) return fallback
  return next
}

/** The redirect for a navigation, or null to let it through. */
export function gateRedirect(to: { fullPath: string; meta: { paid?: boolean } }, plan: Plan): { path: string; query: { next: string } } | null {
  if (!to.meta.paid || plan === 'paid') return null
  return { path: UPGRADE_PATH, query: { next: to.fullPath } }
}
