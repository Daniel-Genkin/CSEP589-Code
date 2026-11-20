<script lang="ts">
// Which trades were approved, kept for the visit so that leaving the screen and coming back does
// not offer the same trades again. It belongs to one trade list: a different list starts clean.
import { ref } from 'vue'

const sent = ref(new Set<string>())
const selected = ref(new Set<string>())
const confirmation = ref('')
let listSignature: string | null = null
</script>

<script setup lang="ts">
// F7 Trade approval (paid). The trades that would carry out the what-if on the active portfolio.
// Nothing is sent until the user approves it. For a list-only broker (and when no broker is
// connected) the approve actions are replaced by "Copy list" and "Download CSV": a main path,
// not a fallback. No Figma frame: built from docs/STYLE.md.
import { usePortfolioData } from '@/composables/usePortfolioData'
import { brokerById } from '@/config/brokers'
import { provider } from '@/data'
import { hasExclusions } from '@/domain/exclusions'
import { shortName } from '@/domain/portfolio'
import { proposeTrades, tradeTotals, tradesToCsv, tradesToText } from '@/domain/trades'
import { useDemoStore } from '@/state/demo'
import type { ProposedTrade } from '@/types'
import { plural, usdCents } from '@/utils/format'
import { computed, nextTick, shallowRef, watch } from 'vue'

/** Sells and buys should match to within this many dollars (PRD F7). */
const BALANCE_USD = 1

const demo = useDemoStore()
const data = usePortfolioData()

const broker = computed(() => brokerById(demo.portfolio?.brokerId))
/** Whether this screen hands over a list instead of sending trades. */
const listOnly = computed(() => !broker.value || broker.value.listOnly)

// Prices for swapped-in alternatives, which the portfolio's own data does not include.
const extra = shallowRef(new Map<string, { price: number; name: string }>())
const swapKey = computed(() => [...new Set(Object.values(demo.exclusions.swaps))].sort().join(','))
/** The swap targets `extra` was loaded for. The list waits until it matches the current ones. */
const extraKey = shallowRef<string | null>(null)
const extraFailed = shallowRef(false)

async function loadExtra() {
  const key = swapKey.value
  extraFailed.value = false
  try {
    const found = key ? await provider.getSecurities(key.split(',')) : []
    if (key !== swapKey.value) return // the swaps changed while this was loading
    extra.value = new Map(found.map((s) => [s.ticker, { price: s.price, name: s.name }]))
    extraKey.value = key
  } catch {
    if (key === swapKey.value) extraFailed.value = true
  }
}
watch(swapKey, loadExtra, { immediate: true })

const ready = computed(() => data.status.value === 'ready' && extraKey.value === swapKey.value)

const prices = computed(() => {
  const out: Record<string, number> = {}
  for (const [ticker, security] of data.securities.value) out[ticker] = security.price
  for (const [ticker, security] of extra.value) out[ticker] = security.price
  return out
})
const nameOf = (ticker: string) => extra.value.get(ticker)?.name ?? data.nameOf(ticker)

interface Row {
  /** Unique within the list, even if the same ticker is traded on the same side twice */
  key: string
  trade: ProposedTrade
}

const proposal = computed<{ rows: Row[]; error: boolean }>(() => {
  const portfolio = demo.portfolio
  if (!portfolio || !ready.value) return { rows: [], error: false }
  try {
    const trades = proposeTrades(portfolio, data.funds.value, data.tags.value, demo.exclusions, prices.value)
    return { rows: trades.map((trade, i) => ({ key: `${i}:${trade.side}:${trade.ticker}`, trade })), error: false }
  } catch (error) {
    // Usually a price missing for something the list must trade. Show nothing rather than a list that does not balance.
    console.error('Trade list could not be worked out:', error)
    return { rows: [], error: true }
  }
})
const rows = computed(() => proposal.value.rows)
const failed = computed(() => data.status.value === 'error' || extraFailed.value || proposal.value.error)
const totalsOf = (list: Row[]) => tradeTotals(list.map((r) => r.trade))
const totals = computed(() => totalsOf(rows.value))
const gap = computed(() => Math.abs(totals.value.sellUsd - totals.value.buyUsd))

const notice = shallowRef('')
/** Set the status line so that the same message twice in a row is still announced. */
async function say(text: string) {
  notice.value = ''
  await nextTick()
  notice.value = text
}

// A different list is a different decision: start again with everything selected and nothing sent.
watch(
  () => (ready.value ? rows.value.map((r) => `${r.key}:${r.trade.shares}`).join('|') + `@${demo.portfolio?.id ?? ''}@${demo.portfolio?.brokerId ?? ''}@${demo.resets}` : null),
  (signature) => {
    if (signature === null || signature === listSignature) return
    listSignature = signature
    selected.value = new Set(rows.value.map((r) => r.key))
    sent.value = new Set()
    confirmation.value = ''
  },
  { immediate: true },
)

const unsent = computed(() => rows.value.filter((r) => !sent.value.has(r.key)))
const selectedUnsent = computed(() => unsent.value.filter((r) => selected.value.has(r.key)))
/** Totals of what "Approve selected" would send, shown when it is only part of what is left. */
const partial = computed(() => (selectedUnsent.value.length && selectedUnsent.value.length < unsent.value.length ? totalsOf(selectedUnsent.value) : null))

function toggle(row: Row) {
  const next = new Set(selected.value)
  if (!next.delete(row.key)) next.add(row.key)
  selected.value = next
}

/** The only two actions that mark trades as sent. */
function approve(list: Row[]) {
  if (!list.length || !broker.value || listOnly.value) return
  sent.value = new Set([...sent.value, ...list.map((r) => r.key)])
  confirmation.value = `Sent to ${broker.value.name} (simulated)`
  void say(`${plural(list.length, 'trade')} approved. ${unsent.value.length ? `${plural(unsent.value.length, 'trade')} not sent.` : 'Nothing is left to send.'}`)
}

async function copy() {
  const text = tradesToText(rows.value.map((r) => r.trade))
  try {
    await navigator.clipboard.writeText(text)
    void say(`Copied ${plural(rows.value.length, 'trade')} to the clipboard.`)
  } catch {
    void say('Copying is blocked in this browser. Use Download CSV instead.')
  }
}

function download() {
  const url = URL.createObjectURL(new Blob([tradesToCsv(rows.value.map((r) => r.trade))], { type: 'text/csv' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: 'rally-trade-list.csv' })
  // Some browsers ignore a click on a link that is not in the document, or a URL revoked too soon.
  link.hidden = true
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  void say(`Download started: rally-trade-list.csv, ${plural(rows.value.length, 'trade')}.`)
}

function retry() {
  data.reload()
  void loadExtra()
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · Trade approval<template v-if="demo.portfolio"> · {{ shortName(demo.portfolio) }}</template> · sample data</p>
      <h1 class="page-title">Nothing moves<br />until you say so.</h1>
      <p class="lead">
        <template v-if="listOnly">The trades that would carry out your what-if, as a list to place at your broker.</template>
        <template v-else>The trades that would carry out your what-if. Review them, then approve the ones you want sent.</template>
      </p>
    </header>

    <section v-if="!demo.portfolio" class="empty">
      <p class="label-mono">No portfolio yet</p>
      <p class="empty__title">There is nothing to trade until you pick what you hold.</p>
      <div class="empty__actions">
        <RouterLink to="/" class="btn btn-primary">Go to Home</RouterLink>
        <RouterLink to="/connect" class="btn btn-outline">Connect brokerage</RouterLink>
      </div>
    </section>

    <section v-else-if="failed" class="card card-pad failed" role="alert">
      <span class="tag"><span class="dot" style="--dot: var(--flare)" />Trade list unavailable</span>
      <h2 class="title-lg">The trade list couldn’t be worked out.</h2>
      <p class="body-muted">A price or holding is missing, so no list is shown rather than one that does not add up. Nothing has been sent.</p>
      <button type="button" class="btn btn-primary" @click="retry">Try again</button>
    </section>

    <div v-else-if="!ready" class="skeleton" style="height: 420px; border-radius: 28px" role="status" aria-label="Working out the trade list" />

    <section v-else-if="!rows.length" class="empty">
      <p class="label-mono">{{ hasExclusions(demo.exclusions) ? 'Nothing here to change' : 'Nothing excluded' }}</p>
      <p class="empty__title">
        <template v-if="hasExclusions(demo.exclusions)">Your exclusions don’t touch anything in this portfolio, so there are no trades.</template>
        <template v-else>No trades to propose. Exclude a category or a company in What-if first.</template>
      </p>
      <RouterLink to="/whatif" class="btn btn-primary">Open What-if</RouterLink>
    </section>

    <template v-else>
      <p class="tax"><span class="dot" style="--dot: var(--sun)" />Selling can trigger a tax bill. Check before you place these.</p>

      <section class="card list">
        <header class="list__head">
          <div>
            <h2 id="trades-title" class="title-card">{{ plural(rows.length, 'proposed trade') }}</h2>
            <p class="body-muted">
              <template v-if="broker">{{ broker.name }} · {{ listOnly ? 'trade list only: place these yourself' : 'can place the trades you approve' }}</template>
              <template v-else>No brokerage connected: copy or download the list, or <RouterLink to="/connect" class="link">connect one</RouterLink>.</template>
            </p>
          </div>
          <div class="list__actions">
            <template v-if="listOnly">
              <button type="button" class="btn btn-primary" @click="copy">Copy list</button>
              <button type="button" class="btn btn-outline" @click="download">Download CSV</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-outline" :disabled="!selectedUnsent.length" @click="approve(selectedUnsent)">Approve selected · {{ selectedUnsent.length }}</button>
              <button type="button" class="btn btn-primary" :disabled="!unsent.length" @click="approve(unsent)">Approve all</button>
            </template>
          </div>
        </header>

        <div class="list__status">
          <p v-if="confirmation && !listOnly" class="tag tag-pass"><span class="dot" style="--dot: var(--pass)" />{{ confirmation }}</p>
          <p class="body-muted" role="status">{{ notice }}</p>
          <p v-if="!listOnly && !confirmation && !notice" class="label-mono">Nothing has been sent</p>
        </div>
        <p v-if="partial && !listOnly" class="list__partial">
          <span class="dot" style="--dot: var(--sun)" />
          Selected: sells {{ usdCents(partial.sellUsd) }} · buys {{ usdCents(partial.buyUsd) }}. Approving part of the list leaves sells and buys unequal.
        </p>

        <table aria-labelledby="trades-title">
          <thead>
            <tr>
              <th v-if="!listOnly" scope="col"><span class="sr-only">Include</span></th>
              <th scope="col">Side</th>
              <th scope="col">Ticker</th>
              <th scope="col" class="num">Quantity</th>
              <th scope="col" class="num">Estimated</th>
              <th scope="col">Reason</th>
              <th v-if="!listOnly" scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" :class="{ 'is-sent': sent.has(row.key) }">
              <td v-if="!listOnly">
                <input
                  type="checkbox"
                  :checked="selected.has(row.key)"
                  :disabled="sent.has(row.key)"
                  :aria-label="`Include ${row.trade.side} ${row.trade.ticker}`"
                  @change="toggle(row)"
                />
              </td>
              <td>
                <span class="side" :class="`side--${row.trade.side}`">{{ row.trade.side === 'sell' ? 'Sell' : 'Buy' }}</span>
              </td>
              <th scope="row" class="stock">
                <span class="num-mono ticker">{{ row.trade.ticker }}</span>
                <span class="name" :title="nameOf(row.trade.ticker)">{{ nameOf(row.trade.ticker) }}</span>
              </th>
              <td class="num num-mono">{{ row.trade.shares.toFixed(4) }}</td>
              <td class="num num-mono">{{ usdCents(row.trade.estUsd) }}</td>
              <td class="reason">{{ row.trade.reason }}</td>
              <td v-if="!listOnly" class="label-mono status">{{ sent.has(row.key) ? 'Sent · simulated' : 'Not sent' }}</td>
            </tr>
          </tbody>
        </table>

        <p class="list__totals" :class="{ 'is-off': gap >= BALANCE_USD }">
          <span class="num-mono">Sells {{ usdCents(totals.sellUsd) }} · Buys {{ usdCents(totals.buyUsd) }}</span>
          <span v-if="gap < BALANCE_USD">{{ usdCents(gap) }} apart, from rounding quantities to four decimal places.</span>
          <span v-else>{{ usdCents(gap) }} apart: more than the {{ usdCents(BALANCE_USD) }} this list should stay within. Check it before placing anything.</span>
        </p>
      </section>

      <p class="small">
        Estimates use seeded prices. A company held inside a fund cannot be sold on its own, so the fund is sold whole and the rest is bought back company by company.
        Rally is not a broker and does not hold your money.
      </p>
    </template>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 260px;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
  text-align: center;
}
.empty__title {
  font-size: 20px;
  font-weight: 600;
}
.empty__actions {
  display: flex;
  gap: 12px;
}
.failed {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.tax,
.list__partial {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--text-muted);
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px 28px 24px;
}
.list__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.list__head > div:first-child {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.list__actions {
  display: flex;
  gap: 12px;
}
.list__status {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 34px;
}
.list__status [role='status']:empty {
  display: none;
}
table {
  width: 100%;
  border-collapse: collapse;
}
thead th {
  padding: 10px 12px;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-align: left;
  text-transform: uppercase;
  color: var(--text-muted);
}
tbody td,
tbody th {
  padding: 12px;
  border-top: 1px solid var(--hairline);
  font-size: 15px;
  font-weight: 400;
  text-align: left;
  vertical-align: middle;
}
thead th.num,
tbody td.num {
  text-align: right;
  white-space: nowrap;
}
.stock {
  white-space: nowrap;
}
.ticker {
  display: inline-block;
  width: 64px;
  color: var(--cream);
}
.name {
  display: inline-block;
  max-width: 170px;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
  color: var(--text-muted);
}
.reason {
  font-size: 14px;
  color: var(--text-muted);
}
.status {
  white-space: nowrap;
}
.is-sent .status {
  color: var(--pass);
}
.is-sent td,
.is-sent th {
  background: rgba(74, 222, 128, 0.04);
}
.side {
  display: inline-block;
  min-width: 52px;
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-align: center;
  text-transform: uppercase;
}
.side--sell {
  background: var(--surface-2);
  color: var(--text);
}
.side--buy {
  background: var(--cream);
  color: var(--ink);
}
.list__totals {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 16px;
  padding: 16px 12px 0;
  border-top: 1px solid var(--border);
  font-size: 14px;
  color: var(--text-muted);
}
.list__totals .num-mono {
  font-size: 15px;
  color: var(--text);
}
.list__totals.is-off span:last-child {
  color: var(--sun);
}
</style>
