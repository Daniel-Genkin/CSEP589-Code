// Alpaca PAPER trading, server side. The browser never sees the API keys: the Vercel function in
// api/alpaca.js and the Vite dev middleware in vite.config.js both call `handleAlpaca`.
//
// Paper only. The base URL is fixed here on purpose: there is no setting that points this at a
// live account.
const PAPER_URL = 'https://paper-api.alpaca.markets'

/** Most orders one request may place, and the largest quantity of one order. */
export const MAX_ORDERS = 60
export const MAX_QTY = 10_000

const SYMBOL = /^[A-Z][A-Z0-9.]{0,9}$/
const CLIENT_ID = /^[A-Za-z0-9._-]{1,100}$/
/** Orders sent to Alpaca at once. The order of the results is kept. */
const BATCH = 5
/** Order requests allowed per minute, for the whole app (one paper account). */
export const MAX_ORDER_REQUESTS_PER_MINUTE = 10
/** Browsers must send this header; a page on another site cannot add it without our consent (no CORS). */
export const GUARD_HEADER = 'x-rally-demo'

let recent = []
/** @returns true when another order request is allowed now */
function allowOrderRequest(now = Date.now()) {
  recent = recent.filter((t) => now - t < 60_000)
  if (recent.length >= MAX_ORDER_REQUESTS_PER_MINUTE) return false
  recent.push(now)
  return true
}
/**
 * The quantity as text. A sell never rounds up past what is held (rounding 20.37476 up to 20.3748
 * asks for shares that are not there), and a sell of the whole position sends the exact amount.
 */
function qtyText(qty, side, have) {
  if (side === 'sell') return qty >= have ? String(have) : String(Math.floor(qty * 1e4) / 1e4)
  return String(Math.round(qty * 1e4) / 1e4)
}

/** Alpaca's refusals in plain words. Anything else is passed through as it came. */
function friendly(message) {
  if (/insufficient (buying power|funds)/i.test(message)) return 'Not enough buying power in the paper account'
  if (/insufficient qty/i.test(message)) return 'Not enough free shares to sell (some may be in a pending order)'
  return message
}
/** Forget the rate limit's memory (tests). */
export const resetRateLimit = () => {
  recent = []
}

/** @param {Record<string, string | undefined>} env */
export function alpacaKeys(env) {
  const id = env.ALPACA_KEY_ID?.trim()
  const secret = env.ALPACA_SECRET_KEY?.trim()
  return id && secret ? { id, secret } : null
}

/** One call to the Alpaca paper API. Throws an Error with Alpaca's own message on a non-2xx answer. */
async function call(keys, method, path, body) {
  const response = await fetch(`${PAPER_URL}${path}`, {
    method,
    headers: { 'APCA-API-KEY-ID': keys.id, 'APCA-API-SECRET-KEY': keys.secret, 'content-type': 'application/json', accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await response.text()
  let json = null
  try {
    json = text ? JSON.parse(text) : null
  } catch {
    // not JSON: fall through to the status check
  }
  if (!response.ok) throw new Error(json?.message ?? `Alpaca answered ${response.status}`)
  return json
}

const num = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

async function readAccount(keys) {
  const [account, positions, open] = await Promise.all([call(keys, 'GET', '/v2/account'), call(keys, 'GET', '/v2/positions'), call(keys, 'GET', '/v2/orders?status=open&limit=500')])
  return {
    configured: true,
    paper: true,
    openOrders: open.length,
    account: { status: account.status, equity: num(account.equity), cash: num(account.cash), buyingPower: num(account.buying_power) },
    positions: positions
      .map((p) => ({ symbol: String(p.symbol), qty: num(p.qty), marketValue: num(p.market_value), price: num(p.current_price) }))
      .filter((p) => p.qty > 0),
  }
}

/**
 * Check and place orders. A sell can never be larger than what is held (so it can never open a
 * short), and a symbol or size that is not plausible is refused before Alpaca sees it.
 * @returns one result per requested order, in the same order
 */
async function placeOrders(keys, orders) {
  const positions = await call(keys, 'GET', '/v2/positions')
  const held = new Map(positions.map((p) => [String(p.symbol), num(p.qty)]))
  // Orders still open, to catch the same list being placed twice. Alpaca never lets a client_order_id
  // be used again (even after a cancel), so the id sent is the list's id plus a fresh suffix, and a
  // repeat is spotted here instead: only an order that is still open counts as "already placed".
  const openIds = (await call(keys, 'GET', '/v2/orders?status=open&limit=500')).map((o) => String(o.client_order_id ?? ''))
  // Shares not already promised to another pending sell order (Alpaca reports this per position).
  const available = new Map(positions.map((p) => [String(p.symbol), p.qty_available == null ? num(p.qty) : num(p.qty_available)]))
  const placeOne = async (order) => {
    const symbol = String(order?.symbol ?? '').toUpperCase()
    const side = order?.side
    let qty = num(order?.qty)
    const base = { symbol, side, requestedQty: qty }
    const clientOrderId = order?.clientOrderId == null ? undefined : String(order.clientOrderId)
    if (!SYMBOL.test(symbol) || (side !== 'buy' && side !== 'sell') || !(qty > 0) || qty > MAX_QTY || (clientOrderId !== undefined && !CLIENT_ID.test(clientOrderId))) {
      return { ...base, ok: false, error: 'Not a valid order' }
    }
    if (clientOrderId && openIds.some((id) => id.startsWith(`${clientOrderId}-`))) return { ...base, ok: false, duplicate: true, error: 'Already placed from this list' }
    if (side === 'sell') {
      const have = held.get(symbol) ?? 0
      if (have <= 0) return { ...base, ok: false, error: `No ${symbol} position to sell` }
      const free = available.get(symbol) ?? have
      if (free < 1e-3) return { ...base, ok: false, error: `Your ${symbol} shares are already in a pending sell order` }
      if (free < have && qty > free) qty = free // part of the position is already spoken for
      // Seeded prices differ a little from live ones, so a "sell it all" can ask for slightly
      // more than is held: sell exactly what is held rather than refuse.
      if (qty > have || qty >= have * 0.995) qty = have
    }
    try {
      const placed = await call(keys, 'POST', '/v2/orders', {
        symbol,
        side,
        type: 'market',
        time_in_force: 'day',
        qty: qtyText(qty, side, side === 'sell' ? (held.get(symbol) ?? 0) : 0),
        ...(clientOrderId ? { client_order_id: `${clientOrderId}-${Date.now().toString(36)}` } : {}),
      })
      return { ...base, ok: true, qty: num(placed.qty), status: String(placed.status), id: String(placed.id) }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Alpaca refused the order'
      return { ...base, ok: false, error: friendly(message) }
    }
  }
  const results = []
  for (let i = 0; i < orders.length; i += BATCH) results.push(...(await Promise.all(orders.slice(i, i + BATCH).map(placeOne))))
  return results
}

/**
 * Route one request. `method` is GET (status, account and positions), POST (place orders) or
 * DELETE (cancel every open order).
 * @param {string} method
 * @param {unknown} body parsed JSON body, for POST
 * @param {Record<string, string | undefined>} env
 * @param {Record<string, string | string[] | undefined>} [headers] the request's headers, lower-cased
 * @returns {Promise<{ status: number, json: unknown }>}
 */
export async function handleAlpaca(method, body, env, headers = {}) {
  // Demo-grade protection: the endpoint is public, so refuse requests that did not come from
  // this app's own page. (curl can add the header too: real protection is the host's, such as
  // Vercel Deployment Protection.)
  if (!headers[GUARD_HEADER]) return { status: 403, json: { error: 'Not allowed.' } }
  const keys = alpacaKeys(env)
  try {
    if (method === 'GET') {
      if (!keys) return { status: 200, json: { configured: false } }
      return { status: 200, json: await readAccount(keys) }
    }
    if (method === 'DELETE') {
      // Cancel every open order on the paper account (the reset button).
      if (!keys) return { status: 503, json: { error: 'Alpaca paper keys are not set on the server.' } }
      if (!allowOrderRequest()) return { status: 429, json: { error: 'Too many order requests. Wait a minute and try again.' } }
      const cancelled = await call(keys, 'DELETE', '/v2/orders')
      return { status: 200, json: { cancelled: Array.isArray(cancelled) ? cancelled.length : 0 } }
    }
    if (method === 'POST') {
      if (!keys) return { status: 503, json: { error: 'Alpaca paper keys are not set on the server.' } }
      const orders = body?.orders
      if (!Array.isArray(orders) || !orders.length || orders.length > MAX_ORDERS) return { status: 400, json: { error: `Send between 1 and ${MAX_ORDERS} orders.` } }
      if (!allowOrderRequest()) return { status: 429, json: { error: 'Too many order requests. Wait a minute and try again.' } }
      return { status: 200, json: { results: await placeOrders(keys, orders) } }
    }
    return { status: 405, json: { error: 'Method not allowed' } }
  } catch (error) {
    return { status: 502, json: { error: error instanceof Error ? error.message : 'Alpaca could not be reached.' } }
  }
}
