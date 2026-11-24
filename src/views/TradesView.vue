<script lang="ts">
// Which trades were approved, kept for the visit so that leaving the screen and coming back does
// not offer the same trades again. It belongs to one trade list: a different list starts clean.
import type { OrderResult } from '@/domain/broker'
import { ref } from 'vue'

const sent = ref(new Set<string>())
const selected = ref(new Set<string>())
const confirmation = ref('')
/** What Alpaca said about each order sent, by row key (live paper account only) */
const orderResults = ref(new Map<string, OrderResult>())
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
import { cancelAlpacaOrders, loadAlpaca, placeAlpacaOrders } from '@/data/alpaca'
import { describeOrder, ordersFromTrades, pricesFromPortfolio } from '@/domain/broker'
import { hasExclusions } from '@/domain/exclusions'
import { shortName } from '@/domain/portfolio'
import { proposeTrades, tradeTotals, tradesToCsv, tradesToText } from '@/domain/trades'
import { useDemoStore } from '@/state/demo'
import type { ProposedTrade } from '@/types'
import { plural, usdCents } from '@/utils/format'
import { computed, nextTick, onMounted, shallowRef, watch } from 'vue'

/** Sells and buys should match to within this many dollars (PRD F7). */
const BALANCE_USD = 1

const demo = useDemoStore()
const data = usePortfolioData()

const broker = computed(() => brokerById(demo.portfolio?.brokerId))
/** Whether this screen hands over a list instead of sending trades. */
const listOnly = computed(() => !broker.value || broker.value.listOnly)
/** Whether approving places real orders on the Alpaca paper account (not a simulated send). */
const live = computed(() => demo.portfolio?.live === true)
const sending = shallowRef(false)

// Prices for all trade legs. Portfolio look-through intentionally loads constituent metadata
// without quotes so the Portfolio screen stays fast; the Trade screen quotes the required set.
const extra = shallowRef(new Map<string, { price: number; name: string }>())
const swapKey = computed(() => [...new Set(Object.values(demo.exclusions.swaps))].sort().join(','))
/** The swap targets `extra` was loaded for. The list waits until it matches the current ones. */
const extraKey = shallowRef<string | null>(null)
const extraFailed = shallowRef(false)
let priceRequest = 0

async function loadExtra() {
  const mine = ++priceRequest
  const key = swapKey.value
  extraKey.value = null
  extraFailed.value = false
  try {
    const tickers = hasExclusions(demo.exclusions)
      ? [...new Set([...data.rows.value.map((row) => row.ticker), ...(data.portfolio.value?.holdings.map((holding) => holding.ticker) ?? []), ...Object.values(demo.exclusions.swaps)])]
      : []
    const found = tickers.length ? await provider.getSecurities(tickers) : []
    if (mine !== priceRequest || key !== swapKey.value) return
    extra.value = new Map(found.map((s) => [s.ticker, { price: s.price, name: s.name }]))
    extraKey.value = key
  } catch {
    if (mine === priceRequest && key === swapKey.value) extraFailed.value = true
  }
}
watch([swapKey, () => hasExclusions(demo.exclusions), () => data.rows.value.map((row) => row.ticker).join(',')], loadExtra, { immediate: true })

const ready = computed(() => data.status.value === 'ready' && extraKey.value === swapKey.value)

const prices = computed(() => {
  const out: Record<string, number> = {}
  for (const [ticker, security] of data.securities.value) out[ticker] = security.price
  for (const [ticker, security] of extra.value) out[ticker] = security.price
  // On a live account, size trades at the prices the broker values the holdings at, so selling a
  // holding sells every share held instead of leaving a sliver from a price difference.
  if (live.value && demo.portfolio) Object.assign(out, pricesFromPortfolio(demo.portfolio))
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
    orderResults.value = new Map()
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
async function approve(list: Row[]) {
  if (!list.length || !broker.value || listOnly.value || sending.value) return
  if (live.value) {
    sending.value = true
    try {
      // The ids come from the whole list, so approving it again (after a reload, say) is refused by Alpaca.
      const listId = `${demo.portfolio?.id ?? ''}|${rows.value.map((r) => `${r.key}:${r.trade.shares}`).join('|')}`
      const results = await placeAlpacaOrders(ordersFromTrades(list.map((r) => r.trade), listId))
      const nextResults = new Map(orderResults.value)
      const sentNext = new Set(sent.value)
      list.forEach((row, i) => {
        const result = results[i]
        if (!result) return
        nextResults.set(row.key, result)
        if (result.ok || result.duplicate) sentNext.add(row.key)
      })
      orderResults.value = nextResults
      sent.value = sentNext
      const placed = results.filter((r) => r.ok || r.duplicate).length
      confirmation.value = placed ? `Sent to ${broker.value.name} paper account` : ''
      void say(`${placed} of ${plural(list.length, 'order')} placed.${placed < list.length ? ' Some were refused: see Status.' : ''}`)
      void loadOpenOrders()
    } catch (error) {
      void say(error instanceof Error ? error.message : 'The orders could not be sent. Nothing was placed.')
    } finally {
      sending.value = false
    }
    return
  }
  sent.value = new Set([...sent.value, ...list.map((r) => r.key)])
  confirmation.value = `Sent to ${broker.value.name} (simulated)`
  void say(`${plural(list.length, 'trade')} approved. ${unsent.value.length ? `${plural(unsent.value.length, 'trade')} not sent.` : 'Nothing is left to send.'}`)
}

/** How many orders are open at Alpaca, and the two-step "cancel them all" button. */
const openOrders = shallowRef<number | null>(null)
const confirmingCancel = shallowRef(false)
const cancelling = shallowRef(false)
async function loadOpenOrders() {
  if (!live.value) return
  try {
    const account = await loadAlpaca()
    openOrders.value = account.configured ? account.openOrders : null
  } catch {
    openOrders.value = null
  }
}
onMounted(loadOpenOrders)
async function cancelOpenOrders() {
  if (!confirmingCancel.value) {
    confirmingCancel.value = true
    return
  }
  cancelling.value = true
  confirmingCancel.value = false
  try {
    // An order that was already being cancelled is not in Alpaca's reply, so fall back to the count shown.
    const count = (await cancelAlpacaOrders()) || openOrders.value || 0
    // The list starts again: nothing is open, so nothing here counts as sent.
    sent.value = new Set()
    orderResults.value = new Map()
    confirmation.value = ''
    void say(count ? `Cancelled ${plural(count, 'open order')} on your Alpaca paper account.` : 'There were no open orders to cancel.')
  } catch (error) {
    void say(error instanceof Error ? error.message : 'The orders could not be cancelled.')
  } finally {
    cancelling.value = false
    await loadOpenOrders()
  }
}

/** After orders are placed, read the account again so Portfolio and What-if match it. */
const refreshing = shallowRef(false)
async function refreshAccount() {
  refreshing.value = true
  try {
    const account = await loadAlpaca()
    if (account.configured && account.portfolio) {
      demo.updatePortfolio(account.portfolio)
      void say('Portfolio updated from your Alpaca paper account.')
    }
  } catch (error) {
    void say(error instanceof Error ? error.message : 'Could not read the account.')
  } finally {
    refreshing.value = false
  }
}

const statusOf = (row: Row) => {
  const result = orderResults.value.get(row.key)
  if (result) return describeOrder(result)
  return sent.value.has(row.key) ? 'Sent · simulated' : 'Not sent'
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
      <p class="eyebrow">Your Rally · Trade approval<template v-if="demo.portfolio"> · {{ shortName(demo.portfolio) }}</template> · {{ demo.dataLabel }}</p>
      <h1 class="page-title">Nothing moves<br />until you say so.</h1>
      <p class="lead">
        <template v-if="listOnly">The trades that would carry out your what-if, as a list to place at your broker.</template>
        <template v-else>The trades that would carry out your what-if. Review them, then approve the ones you want sent.</template>
      </p>
    </header>

    <section v-if="live" class="orders-bar" aria-label="Open orders at Alpaca">
      <p class="orders-bar__text">
        <span class="label-mono">Alpaca paper account</span>
        <span>{{ openOrders === null ? 'Checking open orders…' : `${plural(openOrders, 'open order')} waiting at Alpaca` }}</span>
      </p>
      <div class="orders-bar__actions">
        <button v-if="confirmingCancel" type="button" class="btn btn-outline btn-md" @click="confirmingCancel = false">Keep them</button>
        <button type="button" class="btn btn-outline btn-md" :disabled="cancelling || openOrders === 0" @click="cancelOpenOrders">
          {{ cancelling ? 'Cancelling…' : confirmingCancel ? `Yes, cancel ${plural(openOrders ?? 0, 'order')}` : 'Cancel all open orders' }}
        </button>
      </div>
    </section>

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
      <p v-if="rows.some((r) => r.trade.side === 'buy')" class="why-buys">
        <span class="dot" style="--dot: var(--brand-400)" />
        <span>
          <b>Why are there buys?</b> Selling frees up money, and Rally puts it back into what you keep (or into the company you swapped in) so your total stays the same and matches the What-if you tested.
          Don’t want the buys? Untick them and approve only the sells. You’d then hold the proceeds as cash, which the What-if didn’t assume.
        </span>
      </p>

      <section class="card list">
        <header class="list__head">
          <div>
            <h2 id="trades-title" class="title-card">{{ plural(rows.length, 'proposed trade') }}</h2>
            <p class="body-muted">
              <template v-if="broker">{{ broker.name }}{{ live ? ' paper account' : '' }} · {{ listOnly ? 'trade list only: place these yourself' : 'can place the trades you approve' }}</template>
              <template v-else>No brokerage connected: copy or download the list, or <RouterLink to="/connect" class="link">connect one</RouterLink>.</template>
            </p>
          </div>
          <div class="list__actions">
            <template v-if="listOnly">
              <button type="button" class="btn btn-primary" @click="copy">Copy list</button>
              <button type="button" class="btn btn-outline" @click="download">Download CSV</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-outline" :disabled="!selectedUnsent.length || sending" @click="approve(selectedUnsent)">Approve selected · {{ selectedUnsent.length }}</button>
              <button type="button" class="btn btn-primary" :disabled="!unsent.length || sending" @click="approve(unsent)">{{ sending ? 'Sending…' : 'Approve all' }}</button>
            </template>
          </div>
        </header>

        <div class="list__status">
          <p v-if="confirmation && !listOnly" class="tag tag-pass"><span class="dot" style="--dot: var(--pass)" />{{ confirmation }}</p>
          <p class="body-muted" role="status">{{ notice }}</p>
          <p v-if="!listOnly && !confirmation && !notice" class="label-mono">Nothing has been sent</p>
          <button v-if="live && sent.size" type="button" class="btn btn-outline btn-md" :disabled="refreshing" @click="refreshAccount">{{ refreshing ? 'Updating…' : 'Update portfolio from Alpaca' }}</button>
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
              <td v-if="!listOnly" class="label-mono status" :class="{ 'is-refused': orderResults.get(row.key)?.ok === false }">{{ statusOf(row) }}</td>
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
        <template v-if="live">These are market orders on your Alpaca paper account. Outside market hours they wait for the next open.</template>
        Estimates use current Alpaca prices. A company held inside a fund cannot be sold on its own, so the fund is sold whole and the rest is bought back company by company.
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
.why-buys,
.list__partial {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--text-muted);
}
.orders-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
}
.orders-bar__text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 15px;
}
.orders-bar__actions {
  display: flex;
  gap: 10px;
}
.why-buys {
  align-items: flex-start;
  max-width: 72ch;
  line-height: 1.5;
}
.why-buys .dot {
  margin-top: 7px;
}
.why-buys b {
  color: var(--text);
  font-weight: 600;
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
.status.is-refused {
  color: var(--flare);
  white-space: normal;
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
