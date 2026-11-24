#!/usr/bin/env node
// Put a demo portfolio into your Alpaca PAPER account: a mix of companies the app flags (oil,
// defense, tobacco, animal testing, gambling) and ordinary ones, all inside the app's universe so
// every holding has data. Paper only: the URL below is fixed.
//
//   npm run seed:alpaca            show what would be bought (changes nothing)
//   npm run seed:alpaca -- --place place the orders
//
// Reads ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY from .env.local (or the environment).
import { existsSync, readFileSync } from 'node:fs'

const PAPER_URL = 'https://paper-api.alpaca.markets'

/** Dollars of each company to buy. About $46,000 in all, roughly a third of it in flagged names. */
const PLAN = {
  // ordinary holdings
  AAPL: 6000, MSFT: 6000, NVDA: 5000, GOOGL: 4500, AMZN: 4500, JPM: 3000, V: 2500, COST: 2000,
  // flagged by the app: fossil fuels, defense, tobacco, animal testing, gambling
  XOM: 4000, CVX: 3000, LMT: 3000, RTX: 2500, PM: 2000, MO: 1500, JNJ: 2000, PFE: 1500, LVS: 1500,
}

function loadEnv() {
  const env = { ...process.env }
  if (existsSync('.env.local')) {
    for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/)
      if (match && env[match[1]] === undefined) env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

const env = loadEnv()
const keyId = env.ALPACA_API_KEY_ID || env.ALPACA_KEY_ID
const secretKey = env.ALPACA_API_SECRET_KEY || env.ALPACA_SECRET_KEY
if (!keyId || !secretKey) {
  console.error('Set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY in .env.local first (see .env.example).')
  process.exit(1)
}
const headers = { 'APCA-API-KEY-ID': keyId, 'APCA-API-SECRET-KEY': secretKey, 'content-type': 'application/json' }
const call = async (method, path, body) => {
  const response = await fetch(`${PAPER_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const json = await response.json().catch(() => null)
  if (!response.ok) throw new Error(json?.message ?? `Alpaca answered ${response.status}`)
  return json
}

const place = process.argv.includes('--place')
const account = await call('GET', '/v2/account')
const held = new Set((await call('GET', '/v2/positions')).map((p) => p.symbol))
console.log(`Paper account ${account.status}: equity $${Number(account.equity).toFixed(2)}, buying power $${Number(account.buying_power).toFixed(2)}`)

const todo = Object.entries(PLAN).filter(([symbol]) => !held.has(symbol))
const total = todo.reduce((sum, [, usd]) => sum + usd, 0)
console.log(`${todo.length} companies to buy, $${total.toLocaleString('en-US')} in all (${held.size} already held, skipped).`)
if (total > Number(account.buying_power)) {
  console.error('That is more than the buying power. Lower the amounts in PLAN.')
  process.exit(1)
}
for (const [symbol, usd] of todo) {
  if (!place) {
    console.log(`  would buy $${usd} of ${symbol}`)
    continue
  }
  try {
    const order = await call('POST', '/v2/orders', { symbol, notional: String(usd), side: 'buy', type: 'market', time_in_force: 'day' })
    console.log(`  ${symbol}: $${usd} ${order.status}`)
  } catch (error) {
    console.log(`  ${symbol}: refused (${error.message})`)
  }
}
console.log(place ? 'Done. Orders placed outside market hours fill at the next open.' : 'Dry run. Add --place to buy.')
