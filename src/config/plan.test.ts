import { describe, expect, it } from 'vitest'
import { FREE_FEATURES, PAID_FEATURES, PLAN_PRICE_USD, planPriceLabel } from './plan'

describe('plan', () => {
  it('has one flat monthly price, set in one place', () => {
    expect(PLAN_PRICE_USD).toBeGreaterThan(0)
    expect(planPriceLabel()).toBe('$' + PLAN_PRICE_USD)
  })

  it('writes whole and fractional prices', () => {
    expect(planPriceLabel(5)).toBe('$5')
    expect(planPriceLabel(9.99)).toBe('$9.99')
    expect(planPriceLabel(7.5)).toBe('$7.50')
  })

  it('lists what the paid plan adds: brokerage connection, live monitoring, approval-gated trades (PRD F5)', () => {
    expect(PAID_FEATURES.map((f) => f.title)).toEqual(['Connect your brokerage', 'Live monitoring', 'Approval-gated trades'])
    expect(FREE_FEATURES.length).toBeGreaterThan(0)
  })
})
