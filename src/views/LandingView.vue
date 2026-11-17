<script setup>
// Figma "Rally · Landing": pick a fund, draw your lines, see the receipt. Everything on the
// page is live: the fund picker and the line pills drive the receipt, dots, stats and lineup.
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import { SURVEY_URL } from '@/config/brand'
import { useLinesStore } from '@/stores/lines'
import { pct1 as fmtPct } from '@/utils/format'
import { DEMO_FUNDS, LINES, LINE_MAP, checkFund } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed, ref } from 'vue'

const DOTS = 64
const RECEIPT_ROWS = 4

const fundSymbol = ref('VOO')
const { lineKeys } = storeToRefs(useLinesStore())

const result = computed(() => checkFund(fundSymbol.value, lineKeys.value))
const fund = computed(() => result.value.fund)
const pct = computed(() => result.value.crossingPct)
const pctLabel = computed(() => fmtPct(pct.value))
const perTenK = computed(() => `$${result.value.perTenK.toLocaleString('en-US')}`)
const flaggedDots = computed(() => Math.round((pct.value / 100) * DOTS))
const maxWeight = computed(() => Math.max(...result.value.lineup.map((r) => r.weight)))

const fmtCount = (n) => n.toLocaleString('en-US')

// The five line pills around the hero receipt, in the Figma positions.
const PILL_SLOTS = [
  { key: 'oil', left: 173.57, top: 80.4, rotate: -9, size: 28 },
  { key: 'pay', left: 91.43, top: 332.63, rotate: 7, size: 24 },
  { key: 'weapons', left: 216.45, top: 604.21, rotate: -5, size: 22 },
  { key: 'senators', left: 786.48, top: 161.88, rotate: 8, size: 28 },
  { key: 'data', left: 914.59, top: 575.35, rotate: -6, size: 22 },
]
const pills = computed(() => PILL_SLOTS.map((slot) => ({ ...slot, line: LINE_MAP[slot.key], on: lineKeys.value.includes(slot.key) })))
const stepLines = computed(() => PILL_SLOTS.map((slot) => ({ line: LINE_MAP[slot.key], on: lineKeys.value.includes(slot.key) })))

function toggleLine(key) {
  lineKeys.value = lineKeys.value.includes(key) ? lineKeys.value.filter((k) => k !== key) : [...lineKeys.value, key]
}

const receipt = computed(() => {
  const rows = result.value.crossers.slice(0, RECEIPT_ROWS)
  const more = result.value.crossers.length - rows.length
  return {
    meta: [
      { label: 'Fund', value: `${fund.value.symbol} · ${fmtCount(fund.value.holdingsCount)} holdings` },
      {
        label: 'Lines',
        value:
          LINES.filter((l) => lineKeys.value.includes(l.key))
            .map((l) => l.short)
            .join(' · ') || 'None yet',
      },
    ],
    items: rows.map((r) => ({ name: r.name, note: r.crossed[0].reason, value: fmtPct(r.weight) })),
    more: more > 0 ? `+ ${more} more` : '',
    total: { label: 'Crosses your lines', note: `= ${perTenK.value} of every $10K`, value: pctLabel.value, tone: 'flare' },
    footer: 'Sample data · No judgment · Just receipts',
  }
})

// The tape repeats the lineup; three copies cover the widest screen at -3 degrees.
const tape = computed(() => {
  const once = result.value.lineup.map((r) => ({ text: `${r.symbol} ${fmtPct(r.weight)} ${r.crossed.length ? 'crosses' : 'passes'}`, crosses: r.crossed.length > 0 }))
  return [...once, ...once, ...once, ...once]
})

const receiptPath = computed(() => ({ path: '/receipt', query: { fund: fundSymbol.value } }))
</script>

<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <div class="col pitch">
        <p class="tag pitch__eyebrow"><span class="dot" />Investing with a point of view. Yours.</p>
        <h1 class="pitch__title">
          <span>Who’s in</span>
          <span class="pitch__tilt">your fund?</span>
        </h1>
        <p class="pitch__lede">One S&amp;P 500 fund. Hundreds of companies you’ve never met. Rally shows you who’s in there and what they’re up to.</p>

        <div class="picker" role="group" aria-label="Pick a fund">
          <button
            v-for="f in DEMO_FUNDS"
            :key="f.symbol"
            type="button"
            class="picker__fund"
            :class="{ 'is-on': fundSymbol === f.symbol }"
            :aria-pressed="fundSymbol === f.symbol"
            @click="fundSymbol = f.symbol"
          >
            {{ f.symbol }}
          </button>
          <RouterLink :to="receiptPath" class="btn btn-primary picker__go">Check my fund</RouterLink>
        </div>
        <p class="label-mono">No account needed. Sample data for now.</p>

        <div class="sticker" aria-hidden="true">
          <b>{{ fmtCount(fund.holdingsCount) }}</b>
          <span>companies<br />in one fund</span>
        </div>
      </div>

      <div class="stage-wrap">
        <div class="stage">
          <div class="tape" aria-hidden="true">
            <div class="tape__run">
              <span v-for="(item, i) in tape" :key="i" class="tape__item"><i :class="{ 'is-pass': !item.crosses }" />{{ item.text }}</span>
            </div>
          </div>

          <ReceiptPaper class="stage__behind" behind v-bind="receipt" aria-hidden="true" />
          <ReceiptPaper class="stage__receipt" v-bind="receipt" aria-label="Example receipt (sample data)" />

          <button
            v-for="pill in pills"
            :key="pill.key"
            type="button"
            class="line-pill"
            :class="{ 'is-off': !pill.on }"
            :style="{
              left: `${pill.left}px`,
              top: `${pill.top}px`,
              fontSize: `${pill.size}px`,
              transform: `rotate(${pill.rotate}deg)`,
              '--pill-bg': pill.line.bg,
              '--pill-fg': pill.line.fg,
            }"
            :aria-pressed="pill.on"
            @click="toggleLine(pill.key)"
          >
            {{ pill.on ? pill.line.label : `+ ${pill.line.label}` }}
          </button>

          <p class="label-mono stage__caption">↖ made-up names, real patterns</p>
        </div>
      </div>
    </section>

    <!-- The awkward part -->
    <section class="awkward">
      <div class="col awkward__inner">
        <header class="awkward__head">
          <h2 class="title-xl">The awkward part.</h2>
          <p class="label-mono">Sample data</p>
        </header>
        <div class="strip">
          <div class="strip__dots" role="img" :aria-label="`${flaggedDots} of ${DOTS} dots cross your lines`">
            <span v-for="n in DOTS" :key="n" :class="{ 'is-flagged': n <= flaggedDots }" />
          </div>
          <p class="label-mono">{{ DOTS }} dots · {{ flaggedDots }} cross your lines · that’s {{ pctLabel }} of {{ fund.symbol }}</p>
        </div>
        <div class="stats">
          <div class="stat">
            <p class="label-mono">Of your {{ fund.symbol }}</p>
            <p class="stat-lg stat__figure is-flare">{{ pctLabel }}</p>
            <p class="stat__caption">sits in companies that cross your lines</p>
          </div>
          <div class="stat">
            <p class="label-mono">Of the big names</p>
            <p class="stat-lg stat__figure">{{ result.bigNames.crossing }} of {{ result.bigNames.total }}</p>
            <p class="stat__caption">cross at least one of your lines</p>
          </div>
          <div class="stat">
            <p class="label-mono">Of every $10K</p>
            <p class="stat-lg stat__figure">{{ perTenK }}</p>
            <p class="stat__caption">Your money, their agenda</p>
          </div>
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
            <p class="step__body">Start with the ETF you already own. Five of the most common ones are in the sample.</p>
            <div class="step__example">
              <button
                v-for="f in DEMO_FUNDS"
                :key="f.symbol"
                type="button"
                class="mini-fund"
                :class="{ 'is-on': fundSymbol === f.symbol }"
                :aria-pressed="fundSymbol === f.symbol"
                @click="fundSymbol = f.symbol"
              >
                {{ f.symbol }}
              </button>
            </div>
          </li>
          <li class="step step--2">
            <p class="step__n" style="color: var(--bubblegum)">02</p>
            <h3 class="step__title">Draw your lines.</h3>
            <p class="step__body">Tap what you won’t fund. These are your choices about industries and practices, not verdicts.</p>
            <div class="step__example">
              <button
                v-for="{ line, on } in stepLines"
                :key="line.key"
                type="button"
                class="mini-line"
                :class="{ 'is-off': !on }"
                :style="{ '--pill-bg': line.bg, '--pill-fg': line.fg }"
                :aria-pressed="on"
                @click="toggleLine(line.key)"
              >
                {{ on ? line.label : `+ ${line.label}` }}
              </button>
            </div>
          </li>
          <li class="step step--3">
            <p class="step__n">03</p>
            <h3 class="step__title">Get the receipt.</h3>
            <p class="step__body">See which holdings cross your lines, how big each slice is, and where the claim comes from.</p>
            <div class="step__example step__example--result">
              <p class="step__pct">{{ pctLabel }}</p>
              <p class="step__claim">of {{ fund.symbol }} crosses<br />your lines</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- The lineup -->
    <section id="lineup" class="lineup">
      <div class="col lineup__inner">
        <header class="lineup__head">
          <div>
            <h2 class="title-xl">The lineup.</h2>
            <p class="lineup__sub">Names, slices, receipts. Who you’re bankrolling, flagged first.</p>
          </div>
          <p class="label-mono">Top {{ result.lineup.length }} of {{ fmtCount(fund.holdingsCount) }} · made-up names, real patterns</p>
        </header>
        <ul class="card table">
          <li v-for="row in result.lineup" :key="row.symbol" class="table__row">
            <span class="ticker-tile table__ticker">{{ row.symbol }}</span>
            <div class="table__company">
              <p class="table__name">{{ row.name }}</p>
              <p class="table__reasons">
                <span class="dot" :style="{ '--dot': row.crossed.length ? 'var(--flare)' : 'var(--border)' }" />
                {{ row.crossed.length ? row.crossed.map((c) => c.reason).join(' · ') : 'Passes your lines' }}
              </p>
            </div>
            <div class="table__slice" aria-hidden="true">
              <span :style="{ width: `${(row.weight / maxWeight) * 100}%`, background: row.crossed.length ? 'var(--flare)' : 'var(--border)' }" />
            </div>
            <p class="num-mono table__pct">{{ fmtPct(row.weight) }}</p>
            <p class="table__per">${{ Math.round(row.weight * 100).toLocaleString('en-US') }} of every $10K</p>
            <div class="table__action">
              <RouterLink v-if="row.crossed.length" :to="`/company/${row.symbol}`" class="btn btn-outline btn-sm">Receipts →</RouterLink>
              <span v-else class="label-mono">Passes</span>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <!-- Closing -->
    <section class="closing">
      <div class="col closing__inner">
        <p class="label-mono">Which fund do you own?</p>
        <h2 class="closing__title">Know what<br />you own.</h2>
        <p class="closing__lede">Pick your fund, draw your lines and print the receipt. It takes about a minute.</p>
        <div class="closing__actions">
          <RouterLink :to="receiptPath" class="btn btn-primary">Check my holdings</RouterLink>
          <a :href="SURVEY_URL" target="_blank" rel="noopener" class="btn btn-outline">Join the waitlist</a>
        </div>
        <p class="closing__fine">Real fund names, sample holdings and made-up companies. Information, not investment advice. We’re nosy, not your advisor.</p>
      </div>
      <div class="closing__art" aria-hidden="true">
        <ReceiptPaper class="closing__receipt closing__receipt--right" v-bind="receipt" />
        <ReceiptPaper class="closing__receipt closing__receipt--left" v-bind="receipt" />
        <span class="line-pill closing__pill closing__pill--pay">Pay your people</span>
        <span class="line-pill closing__pill closing__pill--oil">Not my oil money</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
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
  gap: 80px;
  padding: 80px 0 110px;
}
.pitch {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 30px;
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
  text-align: center;
  color: var(--text-muted);
}
.picker {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 10px 10px 12px;
  border: 1.5px solid var(--brand-400);
  border-radius: var(--radius-pill);
  background: var(--surface);
}
.picker__fund {
  padding: 13px 20px;
  border-radius: var(--radius-pill);
  font-family: var(--font-mono);
  font-size: 15px;
  font-weight: 500;
  line-height: 20px;
  color: var(--text-muted);
  transition:
    background-color 0.2s var(--ease),
    color 0.2s var(--ease);
}
.picker__fund:hover {
  color: var(--text);
}
.picker__fund.is-on {
  background: var(--cream);
  color: var(--ink);
}
.picker__go {
  margin-left: 26px;
}
.sticker {
  position: absolute;
  top: -1px;
  left: calc(50% + 318px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 168px;
  height: 168px;
  border-radius: 50%;
  background: var(--sun);
  color: var(--ink);
  box-shadow: var(--shadow-float);
  transform: rotate(-12deg);
}
.sticker b {
  font-family: var(--font-display);
  font-size: 60px;
  font-weight: 400;
  line-height: 1;
}
.sticker span {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  line-height: 1.4;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  text-align: center;
}

/* Receipt stage: a fixed 1280 × 833 canvas, everything inside placed as in Figma */
.stage-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
}
.stage {
  position: relative;
  flex: none;
  width: 1280px;
  height: 833px;
}
.tape {
  position: absolute;
  left: -562px;
  top: 359px;
  width: 5372px;
  height: 57px;
  overflow: hidden;
  background: var(--sun);
  color: var(--ink);
  transform: rotate(-3deg);
}
.tape__run {
  display: flex;
  align-items: center;
  gap: 26px;
  height: 100%;
  padding: 0 26px;
  width: max-content;
  animation: tape 60s linear infinite;
}
@keyframes tape {
  to {
    transform: translateX(-25%);
  }
}
.tape__item {
  display: inline-flex;
  align-items: center;
  gap: 26px;
  font-family: var(--font-mono);
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}
.tape__item i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--flare);
}
.tape__item i.is-pass {
  border: 2px solid var(--ink);
  background: none;
}
.stage__behind,
.stage__receipt {
  position: absolute;
  --paper-width: 448px;
}
.stage__behind {
  left: 538px;
  top: 45px;
  transform: rotate(-6deg);
}
.stage__receipt {
  left: 383px;
  top: 35px;
  transform: rotate(4deg);
}
.line-pill {
  position: absolute;
  padding: 18px 28px;
  border: 1px solid transparent;
  border-radius: var(--radius-pill);
  background: var(--pill-bg);
  color: var(--pill-fg);
  font-weight: 600;
  line-height: 1.175;
  white-space: nowrap;
  box-shadow: var(--shadow-float);
  transition:
    background-color 0.2s var(--ease),
    color 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}
.line-pill.is-off {
  border: 1px dashed var(--border);
  background: var(--surface);
  color: var(--text-muted);
  box-shadow: none;
}
button.line-pill:hover {
  filter: brightness(1.06);
}
.stage__caption {
  position: absolute;
  left: 1052px;
  top: 700px;
  white-space: nowrap;
}

/* ---------- The awkward part ---------- */
.awkward {
  padding-bottom: 120px;
}
.awkward__inner {
  display: flex;
  flex-direction: column;
  gap: 48px;
}
.awkward__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  padding-top: 56px;
  border-top: 1px solid var(--hairline);
}
.strip {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.strip__dots {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.strip__dots span {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--track);
  transition: background-color 0.3s var(--ease);
}
.strip__dots span.is-flagged {
  background: var(--flare);
}
.stats {
  display: flex;
  align-items: flex-start;
}
.stat {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 32px 4px 0;
}
.stat + .stat {
  border-left: 1px solid var(--hairline);
  padding: 60px 32px 4px 40px;
}
.stat + .stat + .stat {
  padding-top: 116px;
}
.stat__figure {
  white-space: nowrap;
  text-transform: uppercase;
}
.stat__figure.is-flare {
  color: var(--flare);
}
.stat__caption {
  font-size: 18px;
  line-height: 1.45;
  color: var(--text-muted);
}

/* ---------- How it works (cream ground) ---------- */
.how {
  padding: 120px 0;
  scroll-margin-top: 0;
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
  min-height: 663px;
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
  gap: 16px 8px;
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
  border-color: var(--pill-bg);
  background: var(--pill-bg);
  color: var(--pill-fg);
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

/* ---------- The lineup ---------- */
.lineup {
  padding: 120px 0;
}
.lineup__inner {
  display: flex;
  flex-direction: column;
  gap: 36px;
}
.lineup__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.lineup__head > div {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lineup__sub {
  font-size: 18px;
  line-height: 1.175;
  color: var(--text-muted);
}
.table {
  padding: 10px 40px;
}
.table__row {
  display: flex;
  align-items: center;
  gap: 28px;
  padding: 22px 0;
}
.table__row + .table__row {
  border-top: 1px solid var(--hairline);
}
.table__ticker {
  width: 60px;
  height: 60px;
  border-radius: 16px;
  font-size: 13px;
}
.table__company {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.table__name {
  font-size: 20px;
  font-weight: 600;
  line-height: 1.175;
}
.table__reasons {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 16px;
  color: var(--text-muted);
}
.table__slice {
  flex: none;
  width: 220px;
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--track);
  overflow: hidden;
}
.table__slice span {
  display: block;
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s var(--ease);
}
.table__pct {
  flex: none;
  width: 70px;
  font-size: 20px;
  line-height: 26px;
  text-align: right;
}
.table__per {
  flex: none;
  width: 150px;
  font-size: 14px;
  color: var(--text-muted);
}
.table__action {
  flex: none;
  display: flex;
  justify-content: flex-end;
  width: 120px;
}

/* ---------- Closing ---------- */
.closing {
  position: relative;
  height: 820px;
  padding: 40px 0 140px;
  overflow: hidden;
}
.closing__inner {
  position: relative;
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
/* Art is placed against a 1920-wide canvas centred on the section, as in Figma */
.closing__art {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1920px;
  height: 100%;
  margin-left: -960px;
  pointer-events: none;
}
.closing__receipt {
  position: absolute;
  --paper-width: 448px;
}
.closing__receipt--right {
  left: 1311px;
  top: 363px;
  transform: rotate(10deg);
}
.closing__receipt--left {
  left: 126px;
  top: 460px;
  transform: rotate(-9deg);
}
.closing__pill--pay {
  left: 294px;
  top: 167px;
  font-size: 24px;
  --pill-bg: var(--bubblegum);
  --pill-fg: var(--ink);
  transform: rotate(8deg);
}
.closing__pill--oil {
  left: 1343px;
  top: 92px;
  font-size: 28px;
  --pill-bg: var(--sun);
  --pill-fg: var(--ink);
  transform: rotate(-7deg);
}

/* ---------- Narrower desktops (down to 1024) ---------- */
@media (max-width: 1327px) {
  .pitch__title,
  .closing__title {
    font-size: 144px;
  }
  .sticker {
    left: calc(50% + 250px);
    zoom: 0.85;
  }
  .stage {
    zoom: 0.76;
  }
  .how__title {
    font-size: 76px;
  }
  .step {
    padding: 28px;
  }
  .table__slice {
    width: 140px;
  }
  .table__per {
    display: none;
  }
  .stat-lg {
    font-size: 92px;
  }
}
</style>
