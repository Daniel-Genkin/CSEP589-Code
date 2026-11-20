<script setup lang="ts">
// F1 Home (Figma "Landing"). Confirm the categories you care about, type a fund or a few
// tickers, and get one line back: how many holdings conflict. The breakdown is behind a free,
// email-only account. Nothing here shows which holdings, or why.
import CategoryChips from '@/components/rally/CategoryChips.vue'
import ConflictTeaser from '@/components/rally/ConflictTeaser.vue'
import TickerInput from '@/components/rally/TickerInput.vue'
import { type InputProblem, type Inspection, countConflicts, inspect, portfolioFromInput, tickersFromScreenshot } from '@/composables/useHoldingsCheck'
import { DEFAULT_PORTFOLIO_USD } from '@/config/defaults'
import { SHOW_SCREENSHOT_UPLOAD } from '@/config/flags'
import { provider } from '@/data'
import { parseTickerInput, samePortfolio, shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { Portfolio } from '@/types'
import { plural } from '@/utils/format'
import { computed, nextTick, onMounted, ref, shallowRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const SAMPLE_FUNDS = ['SPY', 'VOO', 'VTI']

const demo = useDemoStore()
const catalog = useCatalogStore()
const route = useRoute()
const router = useRouter()

const text = ref('')
const amount = ref(DEFAULT_PORTFOLIO_USD.toLocaleString('en-US'))
const busy = ref(false)
const problem = ref<InputProblem | { kind: 'failed' } | null>(null)
// The portfolio the line is about, looked through once; the count follows the chips from it.
const inspection = shallowRef<Inspection | null>(null)
const fromScreenshot = ref(false)
const field = ref<InstanceType<typeof TickerInput> | null>(null)
const result = ref<HTMLElement | null>(null)

const amountUsd = computed(() => Number(amount.value.replace(/[^0-9.]/g, '')))
const summary = computed(() => (inspection.value ? countConflicts(inspection.value, catalog.selectedIds) : null))
const checkedName = computed(() => (inspection.value ? shortName(inspection.value.portfolio) : ''))

/**
 * Work out the result first, then commit: the card never shows one portfolio's name over
 * another's count, and a check that fails saves nothing. Re-checking what is already the active
 * portfolio leaves it alone, so what-if exclusions survive.
 */
async function show(portfolio: Portfolio, reveal = true) {
  const next = await inspect(portfolio)
  if (!samePortfolio(demo.portfolio, portfolio)) demo.setPortfolio(portfolio)
  inspection.value = next
  if (reveal) {
    await nextTick()
    result.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

/** One check at a time: a second submit while one is running is ignored. */
async function guarded(work: () => Promise<void>) {
  if (busy.value) return
  problem.value = null
  busy.value = true
  try {
    await catalog.load()
    await work()
  } catch {
    problem.value = { kind: 'failed' }
  } finally {
    busy.value = false
  }
}

const check = () =>
  guarded(async () => {
    const built = await portfolioFromInput(text.value, amountUsd.value)
    if ('problem' in built) problem.value = built.problem
    else await show(built.portfolio)
  })

function checkFund(ticker: string) {
  text.value = ticker
  return check()
}

const checkSample = () =>
  guarded(async () => {
    const sample = await provider.getSamplePortfolio('sample')
    text.value = sample.holdings.map((h) => h.ticker).join(', ')
    amount.value = sample.totalUsd.toLocaleString('en-US')
    await show(sample)
  })

/** Replace the unknown ticker with the suggested one and check again. */
function useSuggestion() {
  if (problem.value?.kind !== 'unknown' || !problem.value.suggestion) return
  const { ticker, suggestion } = problem.value
  text.value = [...new Set(parseTickerInput(text.value).map((t) => (t === ticker ? suggestion : t)))].join(', ')
  return check()
}

async function onScreenshot(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  await guarded(async () => {
    text.value = await tickersFromScreenshot(file)
    fromScreenshot.value = true
    field.value?.focus()
  })
}

function formatAmount() {
  if (amountUsd.value > 0) amount.value = amountUsd.value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

function focusInput() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  field.value?.focus()
}

/** What typing would reproduce a portfolio: a fund's ticker, or its holdings. */
const inputFor = (portfolio: Portfolio) => (portfolio.origin === 'fund' ? portfolio.id : portfolio.holdings.map((h) => h.ticker).join(', '))

onMounted(async () => {
  await catalog.load().catch(() => {})
  const asked = typeof route.query.q === 'string' ? route.query.q : ''
  const current = demo.portfolio
  // A link like /?q=SPY checks SPY, unless SPY is already the portfolio in use.
  if (asked && !(current && parseTickerInput(asked).join(',') === parseTickerInput(inputFor(current)).join(','))) {
    text.value = asked
    await check()
  } else if (current) {
    // Coming back to Home: show the line for the portfolio already being checked.
    if (current.origin !== 'connected') text.value = inputFor(current)
    amount.value = current.totalUsd.toLocaleString('en-US')
    await guarded(() => show(current, false))
  }
})
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <section class="hero">
      <div class="col pitch">
        <p class="tag pitch__eyebrow"><span class="dot" />Investing with a point of view. Yours.</p>
        <h1 class="pitch__title">
          <span>Who’s in</span>
          <span class="pitch__tilt">your fund?</span>
        </h1>
        <p class="pitch__lede">One fund. Hundreds of companies you’ve never met. Type what you own and Rally tells you how much of it crosses your lines.</p>

        <div class="lines">
          <p class="label-mono">Your lines · tap to change</p>
          <CategoryChips v-if="catalog.featured.length" :categories="catalog.featured" :selected="catalog.selectedIds" label="Values categories" @toggle="catalog.toggle" />
          <div v-else class="skeleton lines__loading" />
        </div>

        <form class="finder" :class="{ 'is-invalid': problem }" novalidate @submit.prevent="check">
          <TickerInput ref="field" v-model="text" :invalid="Boolean(problem)" described-by="finder-message" @submit="check" />
          <label class="finder__amount">
            <span class="sr-only">Portfolio value in dollars</span>
            <span aria-hidden="true">$</span>
            <input v-model="amount" type="text" inputmode="decimal" autocomplete="off" @blur="formatAmount" @keydown.enter.prevent="check" />
          </label>
          <button type="submit" class="btn btn-primary" :disabled="busy">{{ busy ? 'Checking…' : 'Check my holdings' }}</button>
        </form>

        <div id="finder-message" class="finder__message" role="alert">
          <template v-if="problem?.kind === 'unknown'">
            <p>
              We don’t have <strong>{{ problem.ticker }}</strong> in the sample.
              <template v-if="problem.suggestion">Closest match: <strong>{{ problem.suggestion }}</strong>.</template>
            </p>
            <button v-if="problem.suggestion" type="button" class="btn btn-outline btn-sm" @click="useSuggestion">Use {{ problem.suggestion }}</button>
          </template>
          <p v-else-if="problem?.kind === 'empty'">Type a fund like SPY, or a few tickers, first.</p>
          <p v-else-if="problem?.kind === 'amount'">Enter a portfolio value above $0.</p>
          <p v-else-if="problem?.kind === 'failed'">That check didn’t finish. Nothing was saved. Try again.</p>
        </div>

        <div class="samples">
          <span class="label-mono">Or try a sample</span>
          <button type="button" class="btn btn-outline btn-sm" :disabled="busy" @click="checkFund('SPY')">S&amp;P 500 fund (SPY)</button>
          <button type="button" class="btn btn-outline btn-sm" :disabled="busy" @click="checkSample">My sample portfolio</button>
          <label v-if="SHOW_SCREENSHOT_UPLOAD" class="btn btn-outline btn-sm samples__upload">
            Upload a screenshot
            <input type="file" accept="image/*" class="sr-only" @change="onScreenshot" />
          </label>
        </div>
        <p v-if="fromScreenshot" class="small">Read from your screenshot. Correct anything that’s wrong, then check.</p>
        <p class="label-mono">No account needed for the count. Sample data for now.</p>
      </div>

      <div ref="result" class="col result">
        <ConflictTeaser
          v-if="summary"
          :summary="summary"
          :name="checkedName"
          :categories="catalog.selectedIds.length"
          @created="router.push('/portfolio')"
        />
        <div v-else-if="busy" class="card result__loading" aria-busy="true">
          <p class="label-mono">Checking your holdings against {{ plural(catalog.selectedIds.length, 'line') }}…</p>
          <div class="skeleton" style="width: 60%; height: 72px" />
          <div class="skeleton" style="width: 80%; height: 20px" />
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="how ground-cream">
      <div class="col how__inner">
        <header class="how__head">
          <p class="label-mono how__label">How it works</p>
          <h2 class="how__title">Draw your lines.<br />See who crosses them.</h2>
        </header>
        <ol class="steps">
          <li class="step step--1">
            <p class="step__n" style="color: var(--flare)">01</p>
            <h3 class="step__title">Pick a fund.</h3>
            <p class="step__body">Start with the fund you already own, or type a few tickers. Three funds and 89 companies are in the sample.</p>
            <div class="step__example">
              <button v-for="ticker in SAMPLE_FUNDS" :key="ticker" type="button" class="mini-fund" :class="{ 'is-on': checkedName === ticker }" :disabled="busy" @click="checkFund(ticker)">
                {{ ticker }}
              </button>
            </div>
          </li>
          <li class="step step--2">
            <p class="step__n" style="color: var(--bubblegum)">02</p>
            <h3 class="step__title">Draw your lines.</h3>
            <p class="step__body">Tap what you won’t fund. These are your choices about industries and practices, not verdicts.</p>
            <div class="step__example">
              <button
                v-for="category in catalog.featured.slice(0, 5)"
                :key="category.id"
                type="button"
                class="mini-line"
                :class="{ 'is-off': !catalog.selectedIds.includes(category.id) }"
                :aria-pressed="catalog.selectedIds.includes(category.id)"
                @click="catalog.toggle(category.id)"
              >
                {{ catalog.selectedIds.includes(category.id) ? category.label : `+ ${category.label}` }}
              </button>
            </div>
          </li>
          <li class="step step--3">
            <p class="step__n">03</p>
            <h3 class="step__title">Get the receipt.</h3>
            <p class="step__body">See which holdings cross your lines, how big each slice is, and where the claim comes from.</p>
            <div class="step__example step__example--result">
              <p class="step__pct">{{ summary ? summary.count : '?' }}</p>
              <p class="step__claim">holdings conflict.<br />The count is free.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- Closing -->
    <section class="closing">
      <div class="col closing__inner">
        <p class="label-mono">Which fund do you own?</p>
        <h2 class="closing__title">Know what<br />you own.</h2>
        <p class="closing__lede">We don’t hold your money. We show you what you’re buying.</p>
        <div class="closing__actions">
          <button type="button" class="btn btn-primary" @click="focusInput">Check my holdings</button>
          <RouterLink to="/settings" class="btn btn-outline">Choose your lines</RouterLink>
        </div>
        <p class="closing__fine">Real tickers and prices, sample holdings and weights. Information, not investment advice. Options, never recommendations.</p>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home {
  overflow-x: clip;
}
.col {
  width: 100%;
  max-width: calc(var(--container) + 48px);
  margin-inline: auto;
  padding-inline: 24px;
}

/* ---------- Hero ---------- */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 56px;
  padding: 40px 0 110px;
}
.pitch {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
  text-align: center;
}
.pitch__eyebrow {
  gap: 10px;
  padding: 9px 16px;
}
.pitch__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 176px;
  line-height: 0.98;
  white-space: nowrap;
}
.pitch__tilt {
  margin: 17px 0;
  color: var(--bubblegum);
  transform: rotate(-2.5deg);
}
.pitch__lede {
  width: 720px;
  max-width: 100%;
  font-size: 22px;
  line-height: 1.5;
  color: var(--text-muted);
}
.lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}
.lines :deep(.category-chips) {
  justify-content: center;
  max-width: 920px;
}
.lines__loading {
  width: 720px;
  max-width: 100%;
  height: 40px;
  border-radius: var(--radius-pill);
}

/* The input pill: tickers, portfolio value, the one sun button */
.finder {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 760px;
  max-width: 100%;
  padding: 10px 10px 10px 12px;
  border: 1.5px solid var(--brand-400);
  border-radius: var(--radius-pill);
  background: var(--surface);
  transition: box-shadow 0.2s var(--ease);
}
.finder:focus-within {
  box-shadow: var(--ring);
}
.finder.is-invalid {
  border-color: var(--flare);
}
.finder__amount {
  display: flex;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding: 0 16px;
  border-left: 1px solid var(--hairline);
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-muted);
}
.finder__amount input {
  width: 96px;
  border: 0;
  background: none;
  color: var(--text);
}
.finder__amount input:focus {
  outline: none;
}
.finder__message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  min-height: 0;
  margin-top: -14px;
  font-size: 15px;
  color: #f6a283;
}
.finder__message:empty {
  display: none;
}
.finder__message strong {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text);
}
.samples {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 10px;
}
.samples .label-mono {
  margin-right: 4px;
}
.samples__upload {
  cursor: pointer;
}
.result:empty {
  display: none;
}
.result__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 36px 40px;
}

/* ---------- How it works (cream ground) ---------- */
.how {
  padding: 120px 0;
}
.how__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 64px;
}
.how__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}
.how__label {
  color: var(--muted-ink);
}
.how__title {
  font-size: 92px;
  line-height: 1.04;
  text-align: center;
  color: var(--ink);
}
.steps {
  display: flex;
  align-items: flex-start;
  gap: 24px;
  width: 100%;
  min-height: 600px;
}
.step {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  padding: 40px;
  border-radius: var(--radius-xl);
  background: #fff;
  color: var(--ink);
  box-shadow: var(--shadow-card-light);
  transform-origin: top left;
}
.step--1 {
  margin-top: 26px;
  transform: rotate(2deg);
}
.step--2 {
  margin-top: 78px;
  transform: rotate(-1.5deg);
}
.step--3 {
  margin-top: 150px;
  transform: rotate(1.5deg);
}
.step__n {
  font-family: var(--font-display);
  font-size: 72px;
  line-height: 1;
}
.step__title {
  font-size: 30px;
  font-weight: 600;
  line-height: 1.175;
}
.step__body {
  font-size: 17px;
  line-height: 1.5;
  color: var(--muted-ink);
}
.step__example {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
}
.step__example--result {
  gap: 16px;
}
.mini-fund,
.mini-line {
  padding: 11px 16px;
  border: 1px solid var(--chip-border-light);
  border-radius: var(--radius-pill);
  font-size: 14px;
  line-height: 16px;
  white-space: nowrap;
  transition:
    background-color 0.2s var(--ease),
    color 0.2s var(--ease),
    border-color 0.2s var(--ease);
}
.mini-fund {
  font-family: var(--font-mono);
  font-weight: 500;
  line-height: 18px;
  color: var(--ink);
}
.mini-fund.is-on {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--cream);
}
.mini-line {
  border-color: var(--ink);
  background: var(--ink);
  color: var(--cream);
  font-weight: 600;
}
.mini-line.is-off {
  border: 1px dashed var(--chip-border-light);
  background: none;
  color: var(--muted-ink);
}
.how :focus-visible {
  outline-color: var(--signal);
}
.step__pct {
  font-family: var(--font-display);
  font-size: 76px;
  line-height: 1;
  color: var(--flare);
}
.step__claim {
  font-size: 17px;
  font-weight: 500;
  line-height: 1.35;
}

/* ---------- Closing ---------- */
.closing {
  padding: 120px 0 100px;
}
.closing__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
}
.closing__title {
  font-size: 176px;
  line-height: 0.98;
  text-align: center;
  white-space: nowrap;
}
.closing__lede {
  width: 640px;
  max-width: 100%;
  font-size: 21px;
  line-height: 1.5;
  text-align: center;
  color: var(--text-muted);
}
.closing__actions {
  display: flex;
  gap: 12px;
  padding-top: 6px;
}
.closing__fine {
  width: 560px;
  max-width: 100%;
  font-size: 13px;
  line-height: 1.5;
  text-align: center;
  color: var(--text-muted);
}

/* ---------- Narrower desktops (down to 1024) ---------- */
@media (max-width: 1327px) {
  .pitch__title,
  .closing__title {
    font-size: 144px;
  }
  .how__title {
    font-size: 76px;
  }
  .step {
    padding: 28px;
  }
}
</style>
