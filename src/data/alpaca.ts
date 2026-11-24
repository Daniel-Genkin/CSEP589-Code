// Client for the Alpaca PAPER account, through this app's own /api/alpaca endpoint. The keys
// stay on the server (see server/alpaca.js); the browser only ever sees positions and results.
import { type BrokerAccount, type BrokerPosition, type OrderRequest, type OrderResult, portfolioFromPositions } from '@/domain/broker'
import type { Portfolio } from '@/types'

const ENDPOINT = '/api/alpaca'

export type AlpacaState = { configured: false } | { configured: true; account: BrokerAccount; portfolio: Portfolio | null; positions: BrokerPosition[]; openOrders: number }

async function request(init?: RequestInit): Promise<any> {
  const response = await fetch(ENDPOINT, { ...init, headers: { 'content-type': 'application/json', 'x-rally-demo': '1' } })
  let json: any = null
  try {
    json = await response.json()
  } catch {
    // Not JSON: a static host (GitHub Pages) has no /api route and answers 404 or the app's HTML.
    // Read as "not set up", so the demo carries on with the sample account.
    if (response.ok || response.status === 404) return { configured: false }
  }
  if (!response.ok) throw new Error(json?.error ?? `Alpaca request failed (${response.status})`)
  return json
}

/** Whether a paper account is set up on the server, and if so what it holds. */
export async function loadAlpaca(): Promise<AlpacaState> {
  const json = await request()
  if (!json?.configured) return { configured: false }
  const positions: BrokerPosition[] = json.positions ?? []
  return { configured: true, account: json.account, positions, openOrders: Number(json.openOrders ?? 0), portfolio: portfolioFromPositions(positions, 'alpaca', 'Alpaca paper account') }
}

/** Cancel every open order on the paper account. Returns how many were cancelled. */
export async function cancelAlpacaOrders(): Promise<number> {
  const json = await request({ method: 'DELETE' })
  return Number(json?.cancelled ?? 0)
}

export async function placeAlpacaOrders(orders: OrderRequest[]): Promise<OrderResult[]> {
  const json = await request({ method: 'POST', body: JSON.stringify({ orders }) })
  if (!Array.isArray(json?.results)) throw new Error('Orders can only be sent from the deployed app with Alpaca set up.')
  return json.results as OrderResult[]
}
