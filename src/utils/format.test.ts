import { describe, expect, it } from 'vitest'
import { agoFromMinutes, headlinePct, listNames, pct, plural, signed, usd, usdCents } from './format'

describe('format', () => {
  it('writes dollars', () => {
    expect(usd(1240.4)).toBe('$1,240')
    expect(usd(0)).toBe('$0')
    expect(usd(0.3)).toBe('<$1')
    expect(usdCents(1240.5)).toBe('$1,240.50')
  })

  it('writes shares of a portfolio as percentages', () => {
    expect(pct(0.1236)).toBe('12.4%')
    expect(pct(0.1236, 2)).toBe('12.36%')
    expect(headlinePct(0.0898)).toBe('9%')
    expect(headlinePct(0.002)).toBe('<1%')
    expect(headlinePct(0)).toBe('0%')
  })

  it('writes signed differences with a real minus sign', () => {
    expect(signed(-0.914)).toBe('−0.91')
    expect(signed(0.42)).toBe('+0.42')
    expect(signed(0)).toBe('0.00')
    expect(signed(-0.003)).toBe('0.00')
    expect(signed(0.004)).toBe('0.00')
  })

  it('counts things', () => {
    expect(plural(1, 'holding')).toBe('1 holding')
    expect(plural(21, 'holding')).toBe('21 holdings')
    expect(plural(2, 'category', 'categories')).toBe('2 categories')
    expect(plural(1234, 'share')).toBe('1,234 shares')
  })

  it('lists names', () => {
    expect(listNames(['A'])).toBe('A')
    expect(listNames(['A', 'B'])).toBe('A and B')
    expect(listNames(['A', 'B', 'C', 'D'])).toBe('A, B and 2 more')
  })

  it('writes alert ages from minute offsets', () => {
    expect(agoFromMinutes(0)).toBe('just now')
    expect(agoFromMinutes(35)).toBe('35 minutes ago')
    expect(agoFromMinutes(180)).toBe('3 hours ago')
    expect(agoFromMinutes(60 * 24)).toBe('1 day ago')
    expect(agoFromMinutes(60 * 24 * 14)).toBe('14 days ago')
  })
})
