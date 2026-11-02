<script setup>
// Pick an ETF and your lines, print the receipt. Nothing is filled in until the visitor
// picks it, and the per-company breakdown stays blurred until they join the waitlist.
import { getSecurity } from '@/api/mock/catalog'
import LinePicker from '@/components/receipt/LinePicker.vue'
import ReceiptPrinter from '@/components/receipt/ReceiptPrinter.vue'
import { prefersReducedMotion, useCountUp, useTypewriter } from '@/composables/useReceiptFx'
import { BRAND_NAME } from '@/config/brand'
import { useLinesStore } from '@/stores/lines'
import { useSessionStore } from '@/stores/session'
import { useWaitlistStore } from '@/stores/waitlist'
import { DEMO_FUNDS, checkFund } from '@/utils/lines'
import { saveReceiptCard } from '@/utils/receiptCard'
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useRoute } from 'vue-router'

const MAX_ROWS = 6

const route = useRoute()
const linesStore = useLinesStore()
const session = useSessionStore()
const waitlist = useWaitlistStore()

const funds = DEMO_FUNDS.map((f) => {
  const sec = getSecurity(f.symbol)
  return { ...f, name: sec.name, holdings: sec.holdingsCount.toLocaleString('en-US') }
})

// Nothing is picked until the visitor picks it (or links in with ?fund=).
const requested = String(route.query.fund ?? '').toUpperCase()
const fundSymbol = ref(funds.some((f) => f.symbol === requested) ? requested : null)
const picked = ref([])

const printed = ref(false) // nothing shows (blur, waitlist) until they hit Print
const busy = ref(false) // print button says PRINTING… while the paper feeds
const printCount = ref(0)
const saving = ref(false)

const fund = computed(() => funds.find((f) => f.symbol === fundSymbol.value) ?? null)
const ready = computed(() => Boolean(fund.value && picked.value.length))
const shown = computed(() => ready.value && printed.value)
const unlocked = computed(() => waitlist.joined || session.isAuthed)

const result = computed(() => (ready.value ? checkFund(fundSymbol.value, picked.value) : null))
const rows = computed(() =>
  (result.value?.crossers ?? []).map((r) => ({ symbol: r.symbol, name: r.name, weight: r.weight, note: r.crossed[0].reason })),
)
const visibleRows = computed(() => (shown.value ? rows.value.slice(0, MAX_ROWS) : []))
const hiddenRows = computed(() => (shown.value ? Math.max(0, rows.value.length - MAX_ROWS) : 0))
const gated = computed(() => shown.value && rows.value.length > 0 && !unlocked.value)
const lineCodes = computed(() => picked.value.map((key) => key.toUpperCase()))

const emptyHint = computed(() => {
  if (!fund.value && !picked.value.length) return 'Pick a fund and your lines to print your receipt.'
  if (!fund.value) return 'Pick a fund to see who crosses your lines.'
  if (!picked.value.length) return 'Pick a line to see who crosses it.'
  if (!printed.value) return 'Ready. Hit Print my receipt.'
  if (!rows.value.length) return 'Nothing in this fund crosses your lines.'
  return ''
})
const printLabel = computed(() => (busy.value ? 'Printing…' : printed.value ? 'Reprint my receipt' : 'Print my receipt'))
const printHint = computed(() => {
  if (!ready.value) return 'Pick a fund and at least one line first.'
  return printed.value ? 'Your receipt updates as you change picks.' : 'Ready when you are.'
})

const count = (n) => `${n} ${n === 1 ? 'company' : 'companies'}`
const barText = computed(() => {
  if (!ready.value) return fund.value ? 'Now pick your lines' : 'Pick a fund and your lines'
  if (!printed.value) return 'Ready to print your receipt'
  if (unlocked.value) return `${(result.value?.crossingPct ?? 0).toFixed(1)}% crosses your lines`
  return `${count(rows.value.length)} ${rows.value.length === 1 ? 'crosses' : 'cross'} your lines`
})

// Fields type themselves out; totals roll up.
const fundField = useTypewriter(() => fund.value?.symbol ?? '')
const holdingsField = useTypewriter(() => fund.value?.holdings ?? '')
const valuesField = useTypewriter(() => lineCodes.value.join(' · '))
const total = useCountUp(() => (shown.value ? result.value.crossingPct : 0))

// ---- Print-out ----
const paper = useTemplateRef('paper')
const receipt = useTemplateRef('receipt')
const bar = useTemplateRef('bar')
const grid = useTemplateRef('grid')
let busyTimer

const restart = (el, cls) => {
  if (!el) return
  el.classList.remove(cls)
  void el.offsetWidth // restart the CSS animation
  el.classList.add(cls)
}

// The printer buzzes and the paper feeds out of the slot.
function feedPaper() {
  restart(paper.value, 'reprint')
  restart(receipt.value, 'printing')
}

function printOut() {
  printed.value = true
  busy.value = true
  printCount.value += 1
  linesStore.lineKeys = [...picked.value] // carries over to the landing page and dashboard
  feedPaper()
  clearTimeout(busyTimer)
  busyTimer = setTimeout(() => (busy.value = false), prefersReducedMotion() ? 0 : 1200)
}

function onPrint() {
  printOut()
  // On one-column layouts the receipt is below; bring it into view.
  if (window.matchMedia('(max-width: 1100px)').matches) {
    receipt.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function pickFund(symbol, event) {
  if (symbol === fundSymbol.value) return
  fundSymbol.value = symbol
  restart(event?.currentTarget, 'pop')
  if (printed.value) printOut()
}

// Arrow keys move between ETF boxes, like a native radio group.
function onFundKeydown(event) {
  const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key]
  if (!step) return
  event.preventDefault()
  const i = funds.findIndex((f) => f.symbol === fundSymbol.value)
  const next = (i + step + funds.length) % funds.length
  grid.value.children[next].focus()
  grid.value.children[next].click()
}

async function onSave() {
  if (!rows.value.length || !shown.value) return
  saving.value = true
  try {
    await saveReceiptCard(
      { fund: fund.value.symbol, holdings: fund.value.holdings, lines: lineCodes.value, rows: rows.value, total: result.value.crossingPct },
      unlocked.value,
    )
  } finally {
    saving.value = false
  }
}

// Mini bar (phones/tablets): bumps on every change, hides while the real receipt is on screen.
const barAway = ref(false)
let observer
watch(barText, () => restart(bar.value, 'bump'), { flush: 'post' })
onMounted(() => {
  feedPaper() // the blank receipt prints out as you arrive
  if (!('IntersectionObserver' in window)) return
  observer = new IntersectionObserver(
    ([entry]) => {
      barAway.value = entry.isIntersecting
    },
    { threshold: 0.15 },
  )
  observer.observe(receipt.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  clearTimeout(busyTimer)
})
</script>

<template>
  <div class="check-page ground-blue">
    <div class="container check">
      <div class="check__main">
        <div class="check__copy">
          <p class="label-mono check__eyebrow">Your receipt, printed live</p>
          <h1 class="check__title shout-shadow">Pick a fund. <span>Get the receipt.</span></h1>
          <p class="check__lede">Choose an ETF and the lines you won't cross, then print your receipt.</p>
        </div>

        <!-- Step 01: ETF boxes -->
        <section id="pick" class="check__step" aria-labelledby="pick-label">
          <p id="pick-label" class="label-mono">Step 01 · Which ETF do you own?</p>
          <div ref="grid" class="etf-grid" role="radiogroup" aria-labelledby="pick-label" @keydown="onFundKeydown">
            <button
              v-for="(f, i) in funds"
              :key="f.symbol"
              type="button"
              class="etf"
              role="radio"
              :style="{ background: f.bg }"
              :aria-checked="f.symbol === fundSymbol"
              :tabindex="f.symbol === fundSymbol || (!fundSymbol && i === 0) ? 0 : -1"
              @click="pickFund(f.symbol, $event)"
              @animationend="$event.currentTarget.classList.remove('pop')"
            >
              <span class="etf__ticker">{{ f.symbol }}</span>
              <span class="etf__name">{{ f.name }}</span>
              <span class="etf__count">{{ f.holdings }} holdings</span>
            </button>
          </div>
        </section>

        <!-- Step 02: lines -->
        <section id="lines" class="check__step" aria-labelledby="lines-label">
          <p id="lines-label" class="label-mono">Step 02 · Tap what you won't fund</p>
          <LinePicker v-model="picked" />
        </section>

        <!-- Step 03: print -->
        <section id="print-step" class="check__step" aria-labelledby="print-label">
          <p id="print-label" class="label-mono">Step 03 · See who crosses them</p>
          <div class="print-row">
            <button
              type="button"
              class="btn btn-flare big-cta rc-print"
              :class="{ ready: ready && !printed }"
              :disabled="!ready || busy"
              aria-describedby="rc-print-hint"
              @click="onPrint"
            >
              {{ printLabel }} ↗
            </button>
            <button type="button" class="btn btn-primary big-cta" :disabled="!shown || !rows.length || saving" @click="onSave">Download receipt ↓</button>
            <p id="rc-print-hint" class="print-hint" aria-live="polite">{{ printHint }}</p>
          </div>
        </section>

        <p class="check__fine">Real ETF names, sample conflict data and made-up company names. Information, not investment advice.</p>
      </div>

      <!-- Portfolio receipt (updates live) -->
      <aside id="receipt" ref="receipt" class="check-receipt" aria-label="Your portfolio receipt">
        <ReceiptPrinter />
        <div ref="paper" class="receipt-paper">
          <header class="rc-head">
            <p class="rc-logo">{{ BRAND_NAME.toUpperCase() }}</p>
            <p class="rc-sub">PORTFOLIO RECEIPT</p>
          </header>

          <dl class="rc-meta">
            <div>
              <dt>FUND</dt>
              <dd :class="{ typing: fundField.typing.value }">{{ fundField.text.value }}</dd>
            </div>
            <div>
              <dt>HOLDINGS</dt>
              <dd :class="{ typing: holdingsField.typing.value }">{{ holdingsField.text.value }}</dd>
            </div>
            <div>
              <dt>VALUES</dt>
              <dd :class="{ typing: valuesField.typing.value }">{{ valuesField.text.value }}</dd>
            </div>
          </dl>

          <div class="rc-locked" :class="{ gated }">
            <div class="rc-blur" :aria-hidden="gated || undefined">
              <ul class="rc-items">
                <li v-if="emptyHint" class="rc-empty">{{ emptyHint }}</li>
                <!-- New rows slide in one after another (after the paper on a fresh print). -->
                <li
                  v-for="(row, i) in visibleRows"
                  :key="`${printCount}-${row.symbol}`"
                  class="rc-new"
                  :style="{ '--d': busy ? `${0.45 + i * 0.09}s` : '0s' }"
                >
                  <span class="rc-tick">{{ row.symbol }}</span>
                  <span class="rc-what">
                    <span class="rc-name">{{ row.name }}</span>
                    <span class="rc-note">{{ row.note }}</span>
                  </span>
                  <b>{{ row.weight.toFixed(1) }}%</b>
                </li>
                <li v-if="hiddenRows" class="rc-more">+ {{ hiddenRows }} more</li>
              </ul>
              <div class="rc-total">
                <span>CROSSES YOUR LINES</span>
                <b>{{ shown ? `${total.toFixed(1)}%` : '—' }}</b>
              </div>
              <p class="rc-dollars">
                = <b>{{ shown ? `$${Math.round(total * 100).toLocaleString('en-US')}` : '$—' }}</b> of every $10K
              </p>
            </div>

            <div v-if="gated" class="rc-lock">
              <button type="button" class="rc-unlock" @click="waitlist.isOpen = true">
                <span class="rc-unlock__main">Join the waitlist</span>
                <span class="rc-unlock__sub">click here to unlock {{ count(rows.length) }}</span>
              </button>
            </div>
          </div>

          <div class="rc-barcode" aria-hidden="true"></div>
          <p class="rc-foot">SAMPLE DATA · NO JUDGMENT · JUST RECEIPTS</p>
          <span v-if="shown" :key="printCount" class="rc-stamp rc-printed" aria-hidden="true">NO JUDGMENT</span>
        </div>
      </aside>
    </div>

    <!-- Phones/tablets: mini receipt pinned to the bottom while picking -->
    <a ref="bar" class="rc-bar" :class="{ away: barAway }" href="#receipt" @click.prevent="receipt.scrollIntoView({ behavior: 'smooth', block: 'start' })">
      <span v-if="fund" class="rc-bar__fund">{{ fund.symbol }}</span>
      <span class="rc-bar__text">{{ barText }}</span>
      <span class="rc-bar__cta">See receipt <span aria-hidden="true">↓</span></span>
    </a>
  </div>
</template>

<style scoped>
.check-page {
  padding-bottom: 24px;
  overflow-x: clip; /* the tilted receipt shouldn't widen the page; clip keeps it sticky */
}
.check {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 400px;
  gap: 64px;
  align-items: start;
  padding-top: 32px;
  padding-bottom: 72px;
}
.check__main {
  display: flex;
  flex-direction: column;
  gap: 48px;
  min-width: 0;
}
.check__eyebrow {
  margin-bottom: 18px;
  color: var(--sun);
}
.check__title {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(52px, 7vw, 104px);
  line-height: 0.92;
  text-transform: uppercase;
  color: var(--cream);
}
.check__title span {
  display: block;
  color: var(--bubblegum);
}
.check__lede {
  margin-top: 18px;
  max-width: 620px;
  font-size: 22px;
  line-height: 1.45;
  font-weight: 500;
}
.check__step {
  display: flex;
  flex-direction: column;
  gap: 16px;
  scroll-margin-top: 24px;
}
.check__fine {
  align-self: flex-start;
  padding: 12px 18px;
  border-radius: 12px;
  background: var(--ink-solid);
  font-size: 15px;
  line-height: 1.45;
}

/* ETF boxes */
.etf-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
}
.etf {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-height: 168px;
  padding: 20px 22px;
  border: var(--outline);
  border-radius: 20px;
  box-shadow: 3px 3px 0 var(--ink-solid);
  color: var(--ink);
  text-align: left;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}
.etf__ticker {
  font-family: var(--font-display);
  font-size: 52px;
  line-height: 1;
}
.etf__name {
  font-weight: 600;
  font-size: 16px;
  line-height: 1.3;
}
.etf__count {
  margin-top: auto;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
.etf:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0 var(--ink-solid);
}
.etf[aria-checked='true'] {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 var(--ink-solid);
}
.etf[aria-checked='true']::after {
  content: '✓';
  position: absolute;
  top: 14px;
  right: 14px;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--ink-solid);
  color: var(--cream);
  font-weight: 700;
  font-size: 18px;
}
.etf.pop {
  animation: etf-pop 0.38s cubic-bezier(0.2, 1.6, 0.4, 1);
}
@keyframes etf-pop {
  0% {
    transform: translate(0, 0) scale(1);
  }
  45% {
    transform: translate(-3px, -3px) scale(1.05) rotate(-1.5deg);
  }
  100% {
    transform: translate(-3px, -3px) scale(1);
  }
}

/* Print step */
.print-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px 24px;
}
.big-cta {
  --btn-h: 72px;
  padding: 0 34px;
  border-width: 3px;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 28px;
  text-transform: uppercase;
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.big-cta:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  box-shadow: var(--shadow-sm);
}
/* Nudge: the button wiggles once everything is picked */
.rc-print.ready:not(:disabled) {
  animation: rc-nudge 2.4s ease-in-out infinite 0.4s;
}
.rc-print.ready:hover {
  animation: none;
}
@keyframes rc-nudge {
  0%,
  70%,
  100% {
    transform: none;
  }
  75% {
    transform: rotate(-2deg) scale(1.03);
  }
  80% {
    transform: rotate(2deg) scale(1.03);
  }
  85% {
    transform: rotate(-1deg) scale(1.02);
  }
  90% {
    transform: none;
  }
}
.print-hint {
  font-weight: 600;
  font-size: 16px;
}

/* Live receipt */
.check-receipt {
  position: sticky;
  top: 24px;
  transform: rotate(1.5deg);
  filter: drop-shadow(0 3px 0 var(--ink-solid)) drop-shadow(8px 8px 0 var(--ink-solid));
  scroll-margin-top: 24px;
}
.check-receipt .receipt-paper {
  padding: 26px 26px 30px;
  font-size: 13px;
}
.check-receipt .rc-logo {
  font-size: 40px;
}
.check-receipt .rc-meta {
  gap: 6px;
}
.check-receipt .rc-meta dd {
  text-align: right;
}
/* Empty field: a blank line to fill in, like a paper form. */
.check-receipt .rc-meta dd:empty::after {
  content: '';
  display: inline-block;
  width: 96px;
  height: 1em;
  border-bottom: 2px solid var(--ink-solid);
  opacity: 0.45;
}
.check-receipt .rc-meta div:last-child dd:empty::after {
  width: 140px;
}
.check-receipt .rc-items {
  min-height: 120px;
}
.check-receipt .rc-name {
  font-size: 14px;
}
.check-receipt .rc-note {
  font-size: 12px;
}

/* Stamp slams on after printing */
.rc-printed {
  animation: stamp-in 0.35s cubic-bezier(0.2, 1.6, 0.4, 1) both 1.15s;
}

/* Blurred breakdown + waitlist gate */
.rc-locked {
  position: relative;
}
.rc-blur {
  transition: filter 0.4s ease;
}
.rc-locked.gated .rc-blur {
  filter: blur(14px);
  opacity: 0.35;
  user-select: none;
  pointer-events: none;
}
.rc-lock {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 0 4px;
  animation: rc-lock-in 0.45s cubic-bezier(0.2, 1.4, 0.4, 1) both 0.9s;
}
@keyframes rc-lock-in {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* The waitlist button is a red rubber stamp, same look as NO JUDGMENT */
.rc-unlock {
  --stamp-red: #d62f2f;
  --ink-patches: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='180'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='.4 .28' numOctaves='3' seed='7'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 10 0 0 0 -2.7'/></filter><rect width='260' height='180' filter='url(%23n)'/></svg>");
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 16px 16px 18px;
  border: 4px solid var(--stamp-red);
  border-radius: 10px;
  background: rgba(255, 244, 214, 0.8);
  color: var(--stamp-red);
  font-family: var(--font-display);
  white-space: nowrap;
  cursor: pointer;
  transform: rotate(-6deg);
  transition: transform 0.12s ease, background 0.12s ease;
  /* Patchy ink: speckled holes knocked out of the whole stamp */
  -webkit-mask-image: var(--ink-patches);
  mask-image: var(--ink-patches);
  -webkit-mask-size: 260px 180px;
  mask-size: 260px 180px;
}
/* Thin inner rule, like an inked stamp border */
.rc-unlock::before {
  content: '';
  position: absolute;
  inset: 4px;
  border: 2px solid var(--stamp-red);
  border-radius: 5px;
  pointer-events: none;
}
.rc-unlock__main {
  font-weight: 400;
  font-size: 38px;
  line-height: 1;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}
.rc-unlock__sub {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 13px;
  line-height: 1.2;
  letter-spacing: 1.4px;
  text-transform: uppercase;
}
.rc-unlock:hover {
  transform: rotate(-6deg) scale(1.04);
  background: rgba(255, 244, 214, 0.95);
}
.rc-unlock:active {
  transform: rotate(-6deg) scale(0.97);
}

/* Mini receipt bar (phones/tablets only) */
.rc-bar {
  display: none;
}
@keyframes rc-bump {
  0% {
    transform: translateY(0) scale(1);
  }
  40% {
    transform: translateY(-4px) scale(1.02);
  }
  100% {
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 1100px) {
  .check {
    grid-template-columns: 1fr;
    gap: 56px;
    padding-bottom: 120px;
  }
  .check-receipt {
    position: relative;
    top: auto;
    width: min(420px, calc(100% - 28px));
    justify-self: center;
  }
  .rc-bar {
    position: fixed;
    left: 24px;
    right: 24px;
    bottom: max(16px, env(safe-area-inset-bottom));
    z-index: 10;
    display: flex;
    align-items: center;
    gap: 12px;
    max-width: 620px;
    margin: 0 auto;
    padding: 10px 10px 10px 12px;
    border: var(--outline);
    border-radius: 16px;
    background: var(--cream);
    box-shadow: 5px 5px 0 var(--ink-solid);
    color: var(--ink);
    transition: transform 0.25s ease, opacity 0.25s ease;
  }
  .rc-bar.bump {
    animation: rc-bump 0.35s ease-out;
  }
  .rc-bar.away {
    transform: translateY(calc(100% + 32px));
    opacity: 0;
    pointer-events: none;
    animation: none;
  }
  .rc-bar__fund {
    flex: none;
    padding: 4px 8px;
    border-radius: 8px;
    background: var(--ink-solid);
    color: var(--sun);
    font-family: var(--font-display);
    font-size: 20px;
    line-height: 1.1;
  }
  .rc-bar__text {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    font-size: 15px;
    line-height: 1.25;
  }
  .rc-bar__cta {
    flex: none;
    padding: 8px 14px;
    border: var(--outline-thin);
    border-radius: 999px;
    background: var(--sun);
    font-weight: 700;
    font-size: 14px;
    white-space: nowrap;
  }
}
@media (max-width: 900px) {
  .etf-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .etf-grid {
    gap: 14px;
  }
  .etf {
    min-height: 140px;
    padding: 16px;
  }
  .etf__ticker {
    font-size: 40px;
  }
  .etf__name {
    font-size: 14px;
  }
  .etf[aria-checked='true']::after {
    width: 28px;
    height: 28px;
    font-size: 14px;
    top: 10px;
    right: 10px;
  }
  .big-cta {
    --btn-h: 64px;
    padding: 0 26px;
    font-size: 24px;
  }
  .check-receipt :deep(.rc-printer) {
    margin: 0 -4px -10px;
  }
  .check-receipt .receipt-paper {
    padding-inline: 20px;
  }
  .rc-unlock {
    padding: 14px 10px 16px;
  }
  .rc-unlock__main {
    font-size: 30px;
  }
  .rc-unlock__sub {
    font-size: 10.5px;
    letter-spacing: 0.8px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .rc-print.ready:not(:disabled),
  .rc-printed,
  .rc-lock,
  .etf.pop,
  .rc-bar.bump {
    animation: none !important;
  }
}
</style>
