// The brokers the simulated connection offers, and what each allows (PRD F6).
import type { BrokerId } from '@/types'

export type BrokerCapability = 'trades' | 'case_by_case' | 'list_only'

export interface Broker {
  id: BrokerId
  name: string
  capability: BrokerCapability
  /** Whether Rally gives a trade list to carry out by hand instead of sending approved trades */
  listOnly: boolean
  note: string
}

export const CAPABILITY_LABEL: Record<BrokerCapability, string> = {
  trades: 'Can place approved trades',
  case_by_case: 'Trading case by case',
  list_only: 'Trade list only',
}

const LISTED: Omit<Broker, 'listOnly'>[] = [
  { id: 'alpaca', name: 'Alpaca', capability: 'trades', note: 'Rally sends the trades you approve.' },
  { id: 'webull', name: 'Webull', capability: 'trades', note: 'Rally sends the trades you approve.' },
  // Trading through Schwab is decided account by account, so v1 treats it as list-only.
  { id: 'schwab', name: 'Schwab', capability: 'case_by_case', note: 'Treated as trade list only for now.' },
  { id: 'robinhood', name: 'Robinhood', capability: 'list_only', note: 'You get a list to place yourself.' },
  { id: 'fidelity', name: 'Fidelity', capability: 'list_only', note: 'You get a list to place yourself.' },
]

/** Only a broker that can place approved trades gets the approve actions; every other one gets a list. */
export const BROKERS: Broker[] = LISTED.map((broker) => ({ ...broker, listOnly: broker.capability !== 'trades' }))

export const brokerById = (id: BrokerId | undefined | null) => BROKERS.find((b) => b.id === id) ?? null

/** How long the simulated connection takes, in milliseconds. */
export const CONNECT_MS = 1500
