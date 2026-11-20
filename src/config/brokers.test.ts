import { describe, expect, it } from 'vitest'
import { BROKERS, CAPABILITY_LABEL, CONNECT_MS, brokerById } from './brokers'

const label = (id: string) => CAPABILITY_LABEL[BROKERS.find((b) => b.id === id)!.capability]

describe('brokers (PRD F6)', () => {
  it('marks Webull and Alpaca as able to place approved trades', () => {
    expect(label('webull')).toBe('Can place approved trades')
    expect(label('alpaca')).toBe('Can place approved trades')
    expect(brokerById('alpaca')?.listOnly).toBe(false)
    expect(brokerById('webull')?.listOnly).toBe(false)
  })

  it('marks Schwab as trading case by case, treated as list-only in v1', () => {
    expect(label('schwab')).toBe('Trading case by case')
    expect(brokerById('schwab')?.listOnly).toBe(true)
  })

  it('marks Robinhood and Fidelity as trade list only', () => {
    expect(label('robinhood')).toBe('Trade list only')
    expect(label('fidelity')).toBe('Trade list only')
    expect(brokerById('robinhood')?.listOnly).toBe(true)
    expect(brokerById('fidelity')?.listOnly).toBe(true)
  })

  it('hands over a list for every broker that cannot place approved trades', () => {
    for (const broker of BROKERS) expect(broker.listOnly).toBe(broker.capability !== 'trades')
  })

  it('lists exactly the five brokers, and connects in about a second and a half', () => {
    expect(BROKERS.map((b) => b.id).sort()).toEqual(['alpaca', 'fidelity', 'robinhood', 'schwab', 'webull'])
    expect(CONNECT_MS).toBe(1500)
    expect(brokerById(undefined)).toBeNull()
  })
})
