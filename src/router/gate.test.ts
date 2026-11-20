import { describe, expect, it } from 'vitest'
import { DEFAULT_AFTER_UPGRADE, gateRedirect, safeNext } from './gate'

describe('gateRedirect', () => {
  const connect = { fullPath: '/connect', meta: { paid: true } }

  it('sends a free user to /upgrade with the place they were going', () => {
    expect(gateRedirect(connect, 'free')).toEqual({ path: '/upgrade', query: { next: '/connect' } })
  })

  it('keeps the query string of the gated page', () => {
    expect(gateRedirect({ fullPath: '/trades?from=whatif', meta: { paid: true } }, 'free')?.query.next).toBe('/trades?from=whatif')
  })

  it('lets a paid user through', () => {
    expect(gateRedirect(connect, 'paid')).toBeNull()
  })

  it('never gates a free screen', () => {
    expect(gateRedirect({ fullPath: '/portfolio', meta: {} }, 'free')).toBeNull()
  })
})

describe('safeNext', () => {
  it('accepts a path inside the app', () => {
    expect(safeNext('/connect')).toBe('/connect')
    expect(safeNext('/trades?x=1')).toBe('/trades?x=1')
  })

  it('falls back when next is missing or not a string', () => {
    expect(safeNext(undefined)).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext(['/connect'])).toBe(DEFAULT_AFTER_UPGRADE)
  })

  it('rejects other sites', () => {
    expect(safeNext('https://example.com')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('//example.com')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/\\example.com')).toBe(DEFAULT_AFTER_UPGRADE)
  })

  it('does not loop back to the upgrade wall', () => {
    expect(safeNext('/upgrade')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/upgrade?next=/connect')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/upgrade#x')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/UPGRADE')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/%75pgrade/')).toBe(DEFAULT_AFTER_UPGRADE)
    expect(safeNext('/%E0%A4%A')).toBe(DEFAULT_AFTER_UPGRADE)
  })

  it('still accepts paths that merely start with the same letters', () => {
    expect(safeNext('/upgrades')).toBe('/upgrades')
  })
})
