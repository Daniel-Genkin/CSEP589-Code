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
// not a fallback. Laid out in the V7 style (docs/STYLE.md).
import AppShell from '@/components/v7/AppShell.vue'
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

/** Everything on the list has been sent or handed over: the basket is done. */
const allSent = computed(() => rows.value.length > 0 && !unsent.value.length)
</script>

<template>
  <AppShell active="basket" back-label="Basket · Step 2 of 3" title="Nothing moves until you say so." :body="listOnly ? 'The trades that carry out your basket, as a list to place at your broker.' : 'The trades that carry out your basket. Review them, then approve the ones you want sent.'">
    <p v-if="demo.portfolio" class="label crumb">{{ shortName(demo.portfolio) }} · Trades · {{ demo.dataLabel }}</p>

    <section v-if="live" class="card-pad orders" aria-label="Open orders at Alpaca">
      <p class="ot"><span class="label">Alpaca paper account</span><span>{{ openOrders === null ? 'Checking open orders…' : `${plural(openOrders, 'open order')} waiting at Alpaca` }}</span></p>
      <div class="oa">
        <button v-if="confirmingCancel" type="button" class="btn btn-secondary btn-sm" @click="confirmingCancel = false">Keep Them</button>
        <button type="button" class="btn btn-secondary btn-sm" :disabled="cancelling || openOrders === 0" @click="cancelOpenOrders">
          {{ cancelling ? 'Cancelling…' : confirmingCancel ? `Yes, Cancel ${plural(openOrders ?? 0, 'Order')}` : 'Cancel All Open Orders' }}
        </button>
      </div>
    </section>

    <div v-if="!demo.portfolio" class="empty">
      <p class="display">Nothing to trade.</p>
      <p class="dim">Check a fund or connect an account first.</p>
      <div class="btns"><RouterLink to="/check" class="btn btn-primary">Check a Fund</RouterLink><RouterLink to="/connect" class="btn btn-secondary">Connect an Account</RouterLink></div>
    </div>

    <section v-else-if="failed" class="card-pad err" role="alert">
      <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Trade list unavailable</span>
      <b>The trade list couldn’t be worked out.</b>
      <p class="dim">A price or holding is missing, so Rally won’t show a list that doesn’t add up. Nothing has been sent.</p>
      <button type="button" class="btn btn-primary" style="align-self: flex-start" @click="retry">Try Again</button>
    </section>

    <div v-else-if="!ready" class="sk" style="height: 420px" role="status" aria-label="Working out the trade list" />

    <div v-else-if="!rows.length" class="empty">
      <p class="display">No trades.</p>
      <p class="dim">
        <template v-if="hasExclusions(demo.exclusions)">What you dropped isn’t in this fund, so there’s nothing to trade.</template>
        <template v-else>Drop a company in your basket first.</template>
      </p>
      <RouterLink to="/basket" class="btn btn-primary" style="align-self: flex-start">Go to Basket</RouterLink>
    </div>

    <template v-else>
      <div class="notes">
        <p class="note"><i class="dot" style="background: var(--sun)" />Selling can trigger a tax bill. Check before you place these.</p>
        <p v-if="rows.some((r) => r.trade.side === 'buy')" class="note">
          <i class="dot" style="background: var(--link)" />
          <span><b>Why are there buys?</b> Selling frees up money, and Rally puts it back into what you keep (or the company you swapped in), so your total stays the same and matches the What-if. Untick the buys to approve only the sells; you’d then hold the proceeds as cash.</span>
        </p>
      </div>

      <section class="card-pad trades">
        <header class="th">
          <div>
            <h3 id="trades-title">{{ plural(rows.length, 'proposed trade') }}</h3>
            <p class="dim s">
              <template v-if="broker">{{ broker.name }}{{ live ? ' paper account' : '' }} · {{ listOnly ? 'trade list only: place these yourself' : 'can place the trades you approve' }}</template>
              <template v-else>No account connected: copy or download the list, or <RouterLink to="/connect" class="lnk">connect one</RouterLink>.</template>
            </p>
          </div>
          <div class="btns">
            <template v-if="listOnly">
              <button type="button" class="btn btn-primary btn-sm" @click="copy">Copy List</button>
              <button type="button" class="btn btn-secondary btn-sm" @click="download">Download CSV</button>
            </template>
            <template v-else>
              <button type="button" class="btn btn-secondary btn-sm" :disabled="!selectedUnsent.length || sending" @click="approve(selectedUnsent)">Approve Selected · {{ selectedUnsent.length }}</button>
              <button type="button" class="btn btn-primary btn-sm" :disabled="!unsent.length || sending" @click="approve(unsent)">{{ sending ? 'Sending…' : 'Approve All' }}</button>
            </template>
          </div>
        </header>

        <div class="status">
          <span v-if="confirmation && !listOnly" class="tag"><i class="dot" style="background: var(--green)" />{{ confirmation }}</span>
          <p class="dim s" role="status">{{ notice }}</p>
          <p v-if="!listOnly && !confirmation && !notice" class="label">Nothing has been sent</p>
          <button v-if="live && sent.size" type="button" class="btn btn-secondary btn-sm" :disabled="refreshing" @click="refreshAccount">{{ refreshing ? 'Updating…' : 'Update From Alpaca' }}</button>
        </div>
        <p v-if="partial && !listOnly" class="note"><i class="dot" style="background: var(--sun)" />Selected: sells {{ usdCents(partial.sellUsd) }} · buys {{ usdCents(partial.buyUsd) }}. Approving part of the list leaves sells and buys unequal.</p>

        <table aria-labelledby="trades-title">
          <thead>
            <tr>
              <th v-if="!listOnly" scope="col"><span class="sr-only">Include</span></th>
              <th scope="col">Side</th>
              <th scope="col">Company</th>
              <th scope="col" class="num">Shares</th>
              <th scope="col" class="num">Estimated</th>
              <th scope="col">Why</th>
              <th v-if="!listOnly" scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.key" :class="{ sent: sent.has(row.key) }">
              <td v-if="!listOnly">
                <input type="checkbox" class="cb" :checked="selected.has(row.key)" :disabled="sent.has(row.key)" :aria-label="`Include ${row.trade.side} ${row.trade.ticker}`" @change="toggle(row)" />
              </td>
              <td><span class="side" :class="row.trade.side">{{ row.trade.side === 'sell' ? 'Sell' : 'Buy' }}</span></td>
              <th scope="row" class="co"><span class="mono tkc">{{ row.trade.ticker }}</span><span class="nm" :title="nameOf(row.trade.ticker)">{{ nameOf(row.trade.ticker) }}</span></th>
              <td class="num mono">{{ row.trade.shares.toFixed(4) }}</td>
              <td class="num mono">{{ usdCents(row.trade.estUsd) }}</td>
              <td class="dim why">{{ row.trade.reason }}</td>
              <td v-if="!listOnly" class="label st" :class="{ refused: orderResults.get(row.key)?.ok === false }">{{ statusOf(row) }}</td>
            </tr>
          </tbody>
        </table>

        <p class="totals" :class="{ off: gap >= BALANCE_USD }">
          <span class="mono">Sells {{ usdCents(totals.sellUsd) }} · Buys {{ usdCents(totals.buyUsd) }}</span>
          <span v-if="gap < BALANCE_USD">{{ usdCents(gap) }} apart, from rounding shares to four decimal places.</span>
          <span v-else>{{ usdCents(gap) }} apart: more than the {{ usdCents(BALANCE_USD) }} this list should stay within. Check it before placing anything.</span>
        </p>
      </section>

      <div class="done">
        <RouterLink v-if="listOnly" to="/basket/done?list=1" class="btn btn-primary">I’ve Got the List</RouterLink>
        <RouterLink v-else to="/basket/done" class="btn btn-primary" :class="{ dis: !allSent }">Done</RouterLink>
        <p class="caption">
          <template v-if="live">These are market orders on your Alpaca paper account. Outside market hours they wait for the next open. </template>
          Estimates use current Alpaca prices. A company inside a fund can’t be sold on its own, so the fund is sold whole and the rest is bought back company by company. Rally is not a broker and
          doesn’t hold your money.
        </p>
      </div>
    </template>
  </AppShell>
</template>

<style scoped>
.crumb { margin-top: -18px; }
.orders { flex-direction: row; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 18px; margin-bottom: 16px; }
.ot { display: flex; flex-direction: column; gap: 4px; font-size: 15px; color: var(--white); }
.oa, .btns { display: flex; gap: 10px; flex-wrap: wrap; }
.btns .btn:disabled, .oa .btn:disabled { opacity: 0.4; pointer-events: none; }
.notes { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.note { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; line-height: 1.45; color: var(--dim); max-width: 900px; }
.note .dot { margin-top: 6px; flex: none; }
.note b { color: var(--white); font-weight: 600; }
.trades { padding: 22px; gap: 16px; }
.th { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.th h3 { font-weight: 600; font-size: 20px; color: var(--white); }
.s { font-size: 14px; margin-top: 4px; }
.lnk { color: var(--link); }
.status { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; min-height: 32px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; color: var(--white); }
thead th { text-align: left; font-family: var(--mono); font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mute); padding: 8px 10px; border-bottom: 1px solid var(--line); }
td, tbody th { padding: 10px; border-bottom: 1px solid var(--line); vertical-align: middle; text-align: left; font-weight: 400; }
.num { text-align: right; white-space: nowrap; }
tr.sent td, tr.sent th { opacity: 0.55; }
.cb { width: 18px; height: 18px; accent-color: var(--sun); }
.side { display: inline-flex; height: 26px; align-items: center; padding: 0 10px; border-radius: 999px; font-weight: 600; font-size: 12px; }
.side.sell { background: rgba(232, 90, 42, 0.16); color: var(--flare); }
.side.buy { background: rgba(90, 107, 246, 0.18); color: var(--link); }
.co { display: flex; align-items: center; gap: 10px; min-width: 0; }
.tkc { width: 52px; font-size: 12px; color: var(--cream); flex: none; }
.nm { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 240px; }
.why { font-size: 13px; max-width: 320px; }
.st { white-space: nowrap; }
.st.refused { color: var(--flare); }
.totals { display: flex; flex-direction: column; gap: 4px; font-size: 13px; color: var(--dim); }
.totals .mono { color: var(--white); font-size: 14px; }
.totals.off span:last-child { color: var(--flare); }
.done { display: flex; flex-direction: column; align-items: flex-start; gap: 12px; margin-top: 20px; max-width: 900px; }
.dis { opacity: 0.4; pointer-events: none; }
.empty { display: flex; flex-direction: column; gap: 14px; }
.empty .display { font-size: 72px; color: var(--cream); }
.err { gap: 12px; max-width: 640px; }
.err b { font-size: 20px; color: var(--white); }
.sk { border-radius: 20px; background: linear-gradient(90deg, #2a2832, #34313d, #2a2832); background-size: 200% 100%; animation: shimmer 1.4s linear infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
</style>
