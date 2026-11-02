<script setup>
import BrandSpiral from '@/components/brand/BrandSpiral.vue'
import SampleBadge from '@/components/brand/SampleBadge.vue'
import TickerBand from '@/components/brand/TickerBand.vue'
import { BRAND_NAME } from '@/config/brand'
import { DEMO_FUNDS, LINES, checkFund } from '@/utils/lines'
import { computed, ref } from 'vue'

const fundSymbol = ref('VOO')
const lineKeys = ref(['oil', 'pay', 'senators'])
const openReceipt = ref(null)

const result = computed(() => checkFund(fundSymbol.value, lineKeys.value))
const fund = computed(() => result.value.fund)
const pct = computed(() => Math.round(result.value.crossingPct))

function toggleLine(key) {
  lineKeys.value = lineKeys.value.includes(key) ? lineKeys.value.filter((k) => k !== key) : [...lineKeys.value, key]
}
function toggleReceipt(symbol) {
  openReceipt.value = openReceipt.value === symbol ? null : symbol
}

const fmtCount = (n) => n.toLocaleString('en-US')
const fmtMoney = (n) => `$${n.toLocaleString('en-US')}`
// Bar width scaled to the biggest slice in the lineup.
const barWidth = (weight) => `${Math.max(8, (weight / result.value.lineup[0].weight) * 100)}%`
</script>

<template>
  <div class="landing ground-blue">
    <!-- Hero + step 01 -->
    <section class="container hero">
      <BrandSpiral class="hero__spiral" :size="520" :rotate="-8" />
      <div class="hero__copy">
        <p class="label-mono hero__eyebrow">Investing with a point of view. Yours.</p>
        <h1 class="h-hero shout-shadow">
          You own {{ fmtCount(fund.holdingsCount) }} companies.<br />
          <span class="pink">Meet them.</span>
        </h1>
        <p class="hero__lead">
          One {{ fund.symbol }}. Hundreds of companies you've never met. {{ BRAND_NAME }} shows you who's in there, what they're up to,
          and the <span class="wink">receipts</span>.
        </p>
      </div>

      <div id="fund" class="step">
        <p class="label-mono">Step 01 · Which fund are we roasting?</p>
        <div class="funds">
          <button
            v-for="f in DEMO_FUNDS"
            :key="f.symbol"
            type="button"
            class="fund"
            :class="{ 'is-on': fundSymbol === f.symbol }"
            :style="{ background: f.bg }"
            :aria-pressed="fundSymbol === f.symbol"
            @click="fundSymbol = f.symbol"
          >
            <span class="fund__ticker">{{ f.symbol }}</span>
            <span class="fund__nick">{{ f.nickname }}</span>
          </button>
        </div>
      </div>
    </section>

    <TickerBand />

    <!-- Step 02 -->
    <section id="lines" class="container lines">
      <div class="lines__head">
        <h2 class="h-1 shout-shadow">Draw your lines.</h2>
        <p class="label-mono">Step 02 · Tap what you won't fund</p>
      </div>
      <div class="lines__chips">
        <button
          v-for="line in LINES"
          :key="line.key"
          type="button"
          class="line-chip"
          :class="{ 'is-on': lineKeys.includes(line.key) }"
          :style="lineKeys.includes(line.key) ? { background: line.bg, color: line.fg } : null"
          :aria-pressed="lineKeys.includes(line.key)"
          @click="toggleLine(line.key)"
        >
          {{ lineKeys.includes(line.key) ? '✓' : '+' }} {{ line.label }}
        </button>
      </div>
    </section>

    <!-- Step 03: the receipt -->
    <section id="receipt" class="container stats">
      <div class="stat stat--big sticker tilt-l">
        <SampleBadge class="stat__badge" />
        <p class="label-mono stat__eyebrow">Step 03 · The awkward part</p>
        <p class="stat__number">{{ pct }}%</p>
        <p class="stat__caption">
          <template v-if="!lineKeys.length">Pick a line to see who crosses it.</template>
          <template v-else-if="pct === 0">Of your {{ fund.symbol }} crosses your lines. <span class="wink">For now.</span></template>
          <template v-else>Of your {{ fund.symbol }} just got awkward.</template>
        </p>
      </div>
      <div class="stats__side">
        <div class="stat stat--pink sticker tilt-r">
          <p class="stat__mid">{{ result.bigNames.crossing }}<span> / {{ result.bigNames.total }}</span></p>
          <p class="stat__small">Of the big names cross your lines.</p>
        </div>
        <div class="stat stat--flare sticker">
          <p class="stat__mid">{{ fmtMoney(result.perTenK) }}</p>
          <p class="stat__small">Of every $10K. Your money, their agenda.</p>
        </div>
      </div>
    </section>

    <!-- The lineup -->
    <section class="container">
      <div class="lineup sticker">
        <div class="lineup__head">
          <h2 class="h-2">The lineup. <span class="blue">Names, slices, receipts.</span></h2>
          <p class="label-mono lineup__note">Top {{ result.lineup.length }} of {{ fmtCount(fund.holdingsCount) }} · flagged first</p>
        </div>
        <div class="lineup__scroll">
          <div class="lineup__grid lineup__labels label-mono">
            <span>Who you're bankrolling <span class="pink-ink">(made-up names, real patterns)</span></span>
            <span>Your slice</span>
            <span>The problem</span>
          </div>
          <div v-for="row in result.lineup" :key="row.symbol" class="lineup__row" :class="{ 'is-flagged': row.crossed.length }">
            <div class="lineup__grid">
              <div class="who">
                <span class="who__tick">{{ row.symbol }}</span>
                <span class="who__name">{{ row.name }}</span>
              </div>
              <div class="slice">
                <span class="slice__pct">{{ row.weight.toFixed(1) }}%</span>
                <span class="slice__bar"><span :style="{ width: barWidth(row.weight), background: row.crossed[0]?.bg ?? 'var(--cream)' }" /></span>
              </div>
              <div class="problem">
                <template v-if="row.crossed.length">
                  <span v-for="line in row.crossed" :key="line.key" class="problem__chip" :style="{ background: line.bg, color: line.fg }">
                    {{ line.reason }}
                  </span>
                  <button type="button" class="problem__link" :aria-expanded="openReceipt === row.symbol" @click="toggleReceipt(row.symbol)">
                    {{ openReceipt === row.symbol ? 'Hide receipts' : 'Receipts →' }}
                  </button>
                </template>
                <span v-else class="passes">Passes your lines. <span class="wink">For now.</span></span>
              </div>
            </div>
            <ul v-if="openReceipt === row.symbol" class="receipts">
              <li v-for="line in row.crossed" :key="line.key">
                <span class="receipts__tag" :style="{ background: line.bg, color: line.fg }">{{ line.label }}</span>
                {{ line.receipt }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- The final ask -->
    <section class="container final">
      <BrandSpiral class="final__spiral" :size="300" :rotate="22" />
      <h2 class="h-hero shout-shadow">Know what<br />you own.</h2>
      <div class="final__actions">
        <RouterLink to="/signup" class="btn btn-flare final__cta">Check my holdings ↗</RouterLink>
        <RouterLink :to="{ path: '/login', query: { demo: 1 } }" class="final__snoop">or just snoop around the dashboard →</RouterLink>
      </div>
      <p class="final__fine">Real fund names, sample holdings and made-up companies. Information, not investment advice. We're nosy, not your advisor.</p>
    </section>
  </div>
</template>

<style scoped>
.landing {
  overflow: hidden;
  padding-bottom: 24px;
}
.pink {
  color: var(--bubblegum);
}
.blue {
  color: var(--signal);
}
.pink-ink {
  color: var(--bubblegum);
}

/* Hero */
.hero {
  position: relative;
  padding-top: 40px;
  padding-bottom: 72px;
}
.hero__spiral {
  position: absolute;
  right: -60px;
  top: -30px;
  z-index: 0;
}
.hero__copy {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 22px;
  max-width: 1000px;
}
.hero__eyebrow {
  color: var(--sun);
}
.hero__copy h1 {
  color: var(--cream);
}
.hero__lead {
  max-width: 620px;
  font-size: 22px;
  line-height: 1.45;
  font-weight: 500;
}
.hero__lead .wink {
  font-size: 28px;
}

.step {
  position: relative;
  z-index: 1;
  margin-top: 44px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.funds {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}
.fund {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-height: 76px;
  padding: 12px 24px;
  border: var(--outline);
  border-radius: 20px;
  color: var(--ink);
  text-align: left;
  transition: transform 0.15s var(--ease), box-shadow 0.15s var(--ease);
}
.fund:hover {
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 var(--ink-solid);
}
.fund.is-on {
  box-shadow: var(--shadow);
  transform: translate(-3px, -3px);
  outline: 3px solid var(--cream);
  outline-offset: 3px;
}
.fund__ticker {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1;
}
.fund__nick {
  font-size: 15px;
  font-weight: 500;
}

/* Lines */
.lines {
  padding-top: 88px;
  padding-bottom: 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.lines__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.lines__head h2 {
  color: var(--cream);
  font-size: clamp(48px, 7vw, 104px);
}
.lines__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.line-chip {
  min-height: 56px;
  padding: 0 24px;
  border: 3px dashed var(--cream);
  border-radius: 999px;
  color: var(--cream);
  font-size: 19px;
  font-weight: 600;
}
.line-chip.is-on {
  border: 3px solid var(--ink-solid);
  box-shadow: var(--shadow-sm);
  font-weight: 700;
}

/* Stats */
.stats {
  padding-top: 40px;
  padding-bottom: 56px;
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}
.stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 30px;
  color: var(--ink);
}
.stat--big {
  flex: 1.35 1 380px;
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 10px 10px 0 var(--sun);
}
.stat__badge {
  position: absolute;
  top: -20px;
  right: 24px;
}
.stat__eyebrow {
  color: var(--sun);
}
.stat__number {
  font-family: var(--font-display);
  font-size: clamp(110px, 13vw, 190px);
  line-height: 0.85;
  color: var(--sun);
}
.stat__caption {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1.05;
  text-transform: uppercase;
}
.stat__caption .wink {
  text-transform: none;
  color: var(--sun);
}
.stats__side {
  flex: 1 1 300px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.stat--pink {
  flex: 1;
  background: var(--bubblegum);
}
.stat--flare {
  flex: 1;
  background: var(--flare);
  transform: rotate(-0.6deg);
}
.stat__mid {
  font-family: var(--font-display);
  font-size: 88px;
  line-height: 0.9;
}
.stat__mid span {
  font-size: 44px;
}
.stat__small {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.05;
  text-transform: uppercase;
}

/* Lineup */
.lineup {
  margin-top: 16px;
  background: var(--cream);
  color: var(--ink);
  overflow: hidden;
  box-shadow: 12px 12px 0 var(--ink-solid);
}
.lineup__head {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding: 28px 28px 20px;
}
.lineup__head h2 {
  font-size: clamp(40px, 5vw, 72px);
}
.lineup__note {
  color: var(--muted);
}
.lineup__scroll {
  overflow-x: auto;
}
.lineup__grid {
  display: grid;
  grid-template-columns: 2.1fr 1.5fr 2.2fr;
  gap: 16px;
  align-items: center;
  min-width: 860px;
}
.lineup__labels {
  padding: 14px 28px;
  background: var(--ink-solid);
  color: var(--cream);
  min-width: 916px;
}
.lineup__row {
  padding: 18px 28px;
  border-top: 3px solid var(--ink-solid);
  min-width: 916px;
}
.lineup__row.is-flagged {
  background: #ffe8c9;
}
.who {
  display: flex;
  align-items: center;
  gap: 14px;
}
.who__tick {
  font-family: var(--font-display);
  font-size: 18px;
  padding: 6px 10px;
  border-radius: 8px;
  border: 2px solid var(--ink-solid);
}
.is-flagged .who__tick {
  background: var(--ink-solid);
  color: var(--sun);
}
.who__name {
  font-size: 19px;
  font-weight: 600;
}
.slice {
  display: flex;
  align-items: center;
  gap: 12px;
}
.slice__pct {
  font-family: var(--font-display);
  font-size: 30px;
  width: 78px;
}
.slice__bar {
  flex: 1;
  max-width: 220px;
}
.slice__bar span {
  display: block;
  height: 16px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
}
.problem {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
.problem__chip {
  font-size: 15px;
  font-weight: 700;
  padding: 6px 14px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
}
.problem__link {
  font-weight: 700;
  font-size: 15px;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.passes {
  font-size: 17px;
  font-weight: 600;
  color: var(--ink-2);
}
.passes .wink {
  font-size: 21px;
}
.receipts {
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 16px 18px;
  border: 2px solid var(--ink-solid);
  border-radius: 14px;
  background: var(--surface);
  font-size: 15.5px;
}
.receipts__tag {
  display: inline-block;
  margin-right: 8px;
  padding: 2px 10px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

/* Final ask */
.final {
  position: relative;
  padding-top: 88px;
  padding-bottom: 96px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 28px;
}
.final h2 {
  color: var(--cream);
}
.final__spiral {
  position: absolute;
  right: 24px;
  bottom: 60px;
}
.final__actions {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 28px;
}
.final__cta {
  --btn-h: 76px;
  padding: 0 40px;
  border-width: 3px;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 32px;
  text-transform: uppercase;
  box-shadow: 8px 8px 0 var(--ink-solid);
}
.final__snoop {
  font-weight: 700;
  font-size: 20px;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.final__fine {
  position: relative;
  background: var(--ink-solid);
  border-radius: 12px;
  padding: 12px 18px;
  font-size: 15px;
}

@media (max-width: 900px) {
  .hero__spiral {
    opacity: 0.35;
  }
  .final__spiral {
    display: none;
  }
}
</style>
