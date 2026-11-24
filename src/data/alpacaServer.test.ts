import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_ORDER_REQUESTS_PER_MINUTE, handleAlpaca as handle, resetRateLimit } from '../../server/alpaca.js'

const env = { ALPACA_KEY_ID: 'id', ALPACA_SECRET_KEY: 'secret' }
const headers = { 'x-rally-demo': '1' }
/** The app's own calls always carry the guard header. */
const handleAlpaca = (method: string, body: unknown, e: Record<string, string | undefined>, h: Record<string, string> = headers) => handle(method, body, e, h)

/** Stand in for the Alpaca paper API: positions held, and every order is recorded. */
function mockAlpaca(positions: { symbol: string; qty: string; market_value: string; current_price: string }[]) {
  const orders: any[] = []
  const urls: string[] = []
  const open: any[] = []
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      urls.push(url)
      const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
      if (url.endsWith('/v2/account')) return reply({ status: 'ACTIVE', equity: '100000', cash: '50000', buying_power: '200000' })
      if (url.endsWith('/v2/positions')) return reply(positions)
      if (url.includes('/v2/orders?') && (!init || !init.method || init.method === 'GET')) return reply(open)
      if (url.endsWith('/v2/orders') && init?.method === 'DELETE') return reply(open.splice(0).map((o) => ({ id: o.client_order_id, status: 200 })), 207)
      if (url.endsWith('/v2/orders')) {
        const order = JSON.parse(String(init?.body))
        if (order.symbol === 'BAD') return reply({ message: 'asset not found' }, 422)
        orders.push(order)
        open.push({ client_order_id: order.client_order_id })
        return reply({ id: `o-${orders.length}`, status: 'accepted', qty: order.qty })
      }
      return reply({ message: 'not found' }, 404)
    }),
  )
  return { orders, urls, open }
}

beforeEach(resetRateLimit)
afterEach(() => vi.unstubAllGlobals())

describe('Alpaca paper server handler', () => {
  it('says "not configured" without keys, and never calls Alpaca', async () => {
    const { urls } = mockAlpaca([])
    expect(await handleAlpaca('GET', null, {})).toEqual({ status: 200, json: { configured: false } })
    expect((await handleAlpaca('POST', { orders: [] }, {})).status).toBe(503)
    expect(urls).toEqual([])
  })

  it('refuses requests without the app header, before doing anything', async () => {
    const { urls } = mockAlpaca([])
    expect((await handleAlpaca('GET', null, env, {})).status).toBe(403)
    expect((await handleAlpaca('POST', { orders: [{ side: 'buy', symbol: 'AAPL', qty: 1 }] }, env, {})).status).toBe(403)
    expect(urls).toEqual([])
  })

  it('reads the account and positions, paper endpoint only', async () => {
    const { urls } = mockAlpaca([{ symbol: 'XOM', qty: '10', market_value: '1100', current_price: '110' }])
    const { status, json } = await handleAlpaca('GET', null, env)
    expect(status).toBe(200)
    expect(json).toMatchObject({ configured: true, paper: true, account: { equity: 100000 }, positions: [{ symbol: 'XOM', qty: 10, marketValue: 1100 }] })
    expect(urls.every((u) => u.startsWith('https://paper-api.alpaca.markets/'))).toBe(true)
  })

  it('never sells more than is held, and refuses a sell of something not held', async () => {
    const { orders } = mockAlpaca([{ symbol: 'XOM', qty: '10', market_value: '1100', current_price: '110' }])
    const { json } = await handleAlpaca('POST', { orders: [
      { side: 'sell', symbol: 'XOM', qty: 10.02 }, // a hair over: sells exactly what is held
      { side: 'sell', symbol: 'LMT', qty: 1 },
      { side: 'buy', symbol: 'AAPL', qty: 2.5 },
    ] }, env)
    const results = (json as any).results
    expect(orders.map((o) => [o.symbol, o.side, o.qty])).toEqual([['XOM', 'sell', '10'], ['AAPL', 'buy', '2.5']])
    expect(results.map((r: any) => r.ok)).toEqual([true, false, true])
    expect(results[1].error).toMatch(/No LMT position/)
  })

  it('does not sell shares that a pending sell order already holds', async () => {
    const { orders } = mockAlpaca([
      { symbol: 'RTX', qty: '12.92', market_value: '2500', current_price: '193', qty_available: '0' },
      { symbol: 'LMT', qty: '10', market_value: '3000', current_price: '300', qty_available: '4' },
    ] as any)
    const { json } = await handleAlpaca('POST', { orders: [{ side: 'sell', symbol: 'RTX', qty: 12.92 }, { side: 'sell', symbol: 'LMT', qty: 10 }] }, env)
    const results = (json as any).results
    expect(results[0]).toMatchObject({ ok: false, error: 'Your RTX shares are already in a pending sell order' })
    expect(results[1].ok).toBe(true)
    expect(orders.map((o) => [o.symbol, o.qty])).toEqual([['LMT', '4']]) // only what is free
  })

  it('explains buying-power and quantity refusals in plain words', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => {
      const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status })
      if (url.endsWith('/v2/positions') || url.includes('/v2/orders?')) return reply([])
      return reply({ message: 'insufficient buying power' }, 403)
    }))
    const { json } = await handleAlpaca('POST', { orders: [{ side: 'buy', symbol: 'AAPL', qty: 1 }] }, env)
    expect((json as any).results[0].error).toBe('Not enough buying power in the paper account')
  })

  it('never rounds a sell up past what is held, and sends the exact amount for a full sale', async () => {
    const { orders } = mockAlpaca([
      { symbol: 'MO', qty: '20.374762292', market_value: '1476', current_price: '72', qty_available: '20.374762292' },
      { symbol: 'LMT', qty: '5.26378678', market_value: '3021', current_price: '574', qty_available: '5.26378678' },
      { symbol: 'AAPL', qty: '17.216', market_value: '6000', current_price: '350', qty_available: '17.216' },
    ] as any)
    await handleAlpaca('POST', { orders: [
      { side: 'sell', symbol: 'MO', qty: 20.3748 }, // rounds above the 20.37476 held
      { side: 'sell', symbol: 'LMT', qty: 5.2638 },
      { side: 'sell', symbol: 'AAPL', qty: 3.33339 }, // a trim: rounded down, never up
      { side: 'buy', symbol: 'MSFT', qty: 1.23456 }, // a buy rounds normally
    ] }, env)
    const qty = Object.fromEntries(orders.map((o) => [o.symbol, o.qty]))
    expect(qty).toEqual({ MO: '20.374762292', LMT: '5.26378678', AAPL: '3.3333', MSFT: '1.2346' })
  })

  it('refuses nonsense before Alpaca sees it and passes Alpaca errors through', async () => {
    const { orders } = mockAlpaca([])
    const { json } = await handleAlpaca('POST', { orders: [
      { side: 'buy', symbol: 'lower case!', qty: 1 },
      { side: 'buy', symbol: 'AAPL', qty: -1 },
      { side: 'hold', symbol: 'AAPL', qty: 1 },
      { side: 'buy', symbol: 'AAPL', qty: 1, clientOrderId: 'bad id with spaces' },
      { side: 'buy', symbol: 'BAD', qty: 1 },
    ] }, env)
    const results = (json as any).results
    expect(orders).toEqual([])
    expect(results.map((r: any) => r.ok)).toEqual([false, false, false, false, false])
    expect(results[4].error).toBe('asset not found')
    expect((await handleAlpaca('POST', { orders: [] }, env)).status).toBe(400)
  })

  it('places the same list only once while it is open: a repeat is reported as already placed', async () => {
    const { orders, open } = mockAlpaca([])
    const list = { orders: [{ side: 'buy', symbol: 'AAPL', qty: 1, clientOrderId: 'rally-abc-2026-11-23-buy-AAPL' }, { side: 'buy', symbol: 'MSFT', qty: 1, clientOrderId: 'rally-abc-2026-11-23-buy-MSFT' }] }
    const first = (await handleAlpaca('POST', list, env)).json as any
    const second = (await handleAlpaca('POST', list, env)).json as any
    expect(first.results.every((r: any) => r.ok)).toBe(true)
    expect(second.results.map((r: any) => [r.ok, r.duplicate])).toEqual([[false, true], [false, true]])
    expect(orders).toHaveLength(2)
    expect(orders[0].client_order_id).toMatch(/^rally-abc-2026-11-23-buy-AAPL-[0-9a-z]+$/)

    // Cancelled in the broker's dashboard: the same list can be placed again.
    open.length = 0
    const third = (await handleAlpaca('POST', list, env)).json as any
    expect(third.results.every((r: any) => r.ok)).toBe(true)
    expect(orders).toHaveLength(4)
    expect(orders[2].client_order_id).toMatch(/^rally-abc-2026-11-23-buy-AAPL-/)
  })

  it('keeps results in order when orders go out in batches', async () => {
    mockAlpaca([])
    const many = Array.from({ length: 12 }, (_, i) => ({ side: 'buy', symbol: `T${String.fromCharCode(65 + i)}`, qty: 1 }))
    const results = ((await handleAlpaca('POST', { orders: many }, env)).json as any).results
    expect(results.map((r: any) => r.symbol)).toEqual(many.map((o) => o.symbol))
  })

  it('cancels every open order, reports how many, and shows the open count on GET', async () => {
    const { open } = mockAlpaca([])
    await handleAlpaca('POST', { orders: [{ side: 'buy', symbol: 'AAPL', qty: 1 }, { side: 'buy', symbol: 'MSFT', qty: 1 }] }, env)
    expect(((await handleAlpaca('GET', null, env)).json as any).openOrders).toBe(2)
    expect((await handleAlpaca('DELETE', null, env)).json).toEqual({ cancelled: 2 })
    expect(open).toHaveLength(0)
    expect(((await handleAlpaca('GET', null, env)).json as any).openOrders).toBe(0)
    expect((await handleAlpaca('DELETE', null, env, {})).status).toBe(403)
    expect((await handleAlpaca('DELETE', null, {})).status).toBe(503)
  })

  it('limits how often orders can be sent', async () => {
    mockAlpaca([])
    const send = () => handleAlpaca('POST', { orders: [{ side: 'buy', symbol: 'AAPL', qty: 1 }] }, env)
    for (let i = 0; i < MAX_ORDER_REQUESTS_PER_MINUTE; i++) expect((await send()).status).toBe(200)
    expect((await send()).status).toBe(429)
  })
})
