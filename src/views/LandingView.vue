<script setup>
import BandMixBar from '@/components/scan/BandMixBar.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useSessionStore } from '@/stores/session'
import { CATEGORIES } from '@/utils/scoring'
import {
    ArrowRight,
    BellRing,
    Check,
    Layers,
    Link2,
    Newspaper,
    Quote,
    ScanSearch,
    Sparkles,
    TriangleAlert,
} from '@lucide/vue'

const session = useSessionStore()

const heroRows = [
  { symbol: 'GRNB', name: 'Greenbloom Foods', color: '#54AE6C', score: 84, type: 'stock' },
  { symbol: 'CLNE', name: 'Evergreen Clean Energy ETF', color: '#16A35A', score: 73, type: 'etf' },
  { symbol: 'NOVA', name: 'Novabyte', color: '#4F5BD5', score: 67, type: 'stock' },
  { symbol: 'QUIK', name: 'Quikcart', color: '#EE8A24', score: 44, type: 'stock' },
]

const steps = [
  {
    icon: Link2,
    title: 'Add what you own, or want to',
    text: 'Link your brokerage in a few taps (read-only) or type the tickers you’re curious about.',
  },
  {
    icon: ScanSearch,
    title: 'We do the homework',
    text: 'We read filings, watchdog reports and news from 40+ sources, then score every company on six values.',
  },
  {
    icon: Sparkles,
    title: 'Get clear, calm answers',
    text: 'Your most aligned picks land on top, with plain-English reasons and the news behind every score.',
  },
]

const etfRows = [
  { symbol: 'NOVA', name: 'Novabyte', color: '#4F5BD5', weight: 7.2, score: 67 },
  { symbol: 'QUIK', name: 'Quikcart', color: '#EE8A24', weight: 4.1, score: 44 },
  { symbol: 'PTRX', name: 'Petrex Energy', color: '#4A4F55', weight: 2.4, score: 37 },
]

const testimonials = [
  {
    quote: 'I had no idea my “safe” index fund owned an oil company. Now I actually understand what I’m invested in.',
    name: 'Priya, 22',
    detail: 'First-time investor',
  },
  {
    quote: 'The alerts are so chill. No panic, just “here’s what happened and why it matters to you.”',
    name: 'Marcus, 25',
    detail: 'Pro member',
  },
  {
    quote: 'I sent my sister the Voltway breakdown before she bought. Turns out EVs aren’t automatically ethical.',
    name: 'Lena, 20',
    detail: 'College student',
  },
]

const plans = [
  { name: 'Free', price: '$0', note: '1 scan a month, up to 5 stocks' },
  { name: 'Premium', price: '$4.99', note: 'Unlimited scans, anytime' },
  { name: 'Pro', price: '$9.99', note: 'We monitor and email you', popular: true },
]
</script>

<template>
  <div class="landing">
    <!-- Hero -->
    <section class="hero">
      <div class="hero__glow hero__glow--mint" />
      <div class="hero__glow hero__glow--lilac" />
      <div class="container hero__inner">
        <div class="hero__copy fade-up">
          <span class="hero__pill"><Sparkles :size="14" /> Ethical investing, minus the jargon</span>
          <h1 class="h-hero">Invest in what you <span class="accent">actually</span> believe in.</h1>
          <p class="lead hero__lead">
            outvest checks your stocks and ETFs against the things you care about (climate, fair pay, privacy and more)
            and explains it all in plain English.
          </p>
          <div class="hero__actions">
            <RouterLink :to="session.isAuthed ? '/app/scan/new' : '/signup'" class="btn btn-primary btn-lg">
              Scan my investments free <ArrowRight :size="18" />
            </RouterLink>
            <RouterLink to="/s/demo" class="btn btn-secondary btn-lg">See an example</RouterLink>
          </div>
          <ul class="hero__trust">
            <li><Check :size="16" /> Free to start</li>
            <li><Check :size="16" /> No card needed</li>
            <li><Check :size="16" /> 2-minute setup</li>
          </ul>
        </div>

        <div class="hero__visual fade-up" style="animation-delay: 0.12s">
          <div class="hero-card">
            <div class="hero-card__head">
              <div>
                <p class="hero-card__label">Your scan · 7 holdings</p>
                <p class="hero-card__title">A mixed bag, with some bright spots</p>
              </div>
              <ScoreRing :score="61" :size="64" />
            </div>
            <ul class="hero-card__rows">
              <li v-for="(row, i) in heroRows" :key="row.symbol" class="hero-card__row">
                <span class="hero-card__rank">{{ i + 1 }}</span>
                <SecurityLogo :symbol="row.symbol" :name="row.name" :color="row.color" :type="row.type" :size="38" />
                <span class="hero-card__id">
                  <strong>{{ row.symbol }}</strong>
                  <span>{{ row.name }}</span>
                </span>
                <ScoreChip :score="row.score" short size="sm" class="hide-sm" />
                <ScoreRing :score="row.score" :size="40" />
              </li>
            </ul>
          </div>

          <div class="float float--values">
            <CategoryIcon category="climate" :size="34" />
            <span>
              <span class="float__label">Planet & Climate</span>
              <span class="float__value">96 <span class="muted">/ 100</span></span>
            </span>
          </div>

          <div class="float float--alert">
            <span class="float__bell"><BellRing :size="17" /></span>
            <span>
              <span class="float__label">Heads up · QUIK</span>
              <span class="float__text">Fined $14M over warehouse safety</span>
            </span>
          </div>
        </div>
      </div>

      <div class="container">
        <ul class="strip">
          <li><strong>6</strong> values Gen Z actually cares about</li>
          <li><strong>40+</strong> news & watchdog sources</li>
          <li><strong>Every</strong> company inside your ETFs</li>
          <li><strong>0</strong> jargon, judgment or pressure</li>
        </ul>
      </div>
    </section>

    <!-- How it works -->
    <section id="how-it-works" class="section">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">How it works</span>
          <h2 class="h-1">From “what do I even own?” to clarity in two minutes.</h2>
        </div>
        <ol class="steps">
          <li v-for="(step, i) in steps" :key="step.title" class="step card">
            <span class="step__num">0{{ i + 1 }}</span>
            <span class="step__icon"><component :is="step.icon" :size="22" /></span>
            <h3 class="step__title">{{ step.title }}</h3>
            <p class="step__text">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Values -->
    <section id="values" class="section section--tint">
      <div class="container">
        <div class="section__head">
          <span class="eyebrow">What we look at</span>
          <h2 class="h-1">Six values, one combined score.</h2>
          <p class="lead">
            Every company gets a 0–100 score for each value. Together they make one combined score you can expand
            anytime to see the why.
          </p>
        </div>
        <div class="values">
          <article v-for="cat in CATEGORIES" :key="cat.key" class="value card">
            <CategoryIcon :category="cat.key" :size="46" />
            <h3 class="value__title">{{ cat.label }}</h3>
            <p class="value__text">{{ cat.description }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- ETFs -->
    <section id="etfs" class="section">
      <div class="container split">
        <div class="split__copy">
          <span class="eyebrow"><Layers :size="15" /> ETFs, unpacked</span>
          <h2 class="h-1">One ETF can hold 500 companies. We check every one.</h2>
          <p class="lead">
            ETFs are a great way to start investing, but they can quietly include things you'd never pick yourself. We
            break each fund into its companies, weight them by size, and forecast how the next rebalance could change
            your score.
          </p>
          <ul class="checks">
            <li><Check :size="18" /> See exactly where your money goes</li>
            <li><Check :size="18" /> Spot surprises, like oil inside an “ESG” fund</li>
            <li><Check :size="18" /> Get a heads-up before rebalances shift things</li>
          </ul>
        </div>
        <div class="etf-card card">
          <div class="etf-card__head">
            <SecurityLogo symbol="BMKT" name="Broadline" color="#0F766E" type="etf" :size="46" />
            <div class="grow">
              <p class="etf-card__name">Broadline Total Market ETF</p>
              <p class="muted text-sm">BMKT · 503 companies inside</p>
            </div>
            <ScoreRing :score="58" :size="56" />
          </div>
          <BandMixBar :mix="{ great: 9.6, good: 38.4, mixed: 30.3, low: 21.7 }" :legend="false" :height="12" />
          <ul class="etf-card__rows">
            <li v-for="row in etfRows" :key="row.symbol">
              <SecurityLogo :symbol="row.symbol" :name="row.name" :color="row.color" :size="32" />
              <span class="grow">{{ row.name }}</span>
              <span class="muted num">{{ row.weight }}%</span>
              <ScoreChip :score="row.score" short show-score size="sm" />
            </li>
          </ul>
          <div class="etf-card__foot">
            <TriangleAlert :size="16" />
            Next rebalance likely adds more Petrex Energy. Projected score: 57.
          </div>
        </div>
      </div>
    </section>

    <!-- Monitoring -->
    <section class="section section--tint">
      <div class="container split split--reverse">
        <div class="split__copy">
          <span class="eyebrow"><BellRing :size="15" /> Continuous monitoring</span>
          <h2 class="h-1">We keep watch, so you don't have to.</h2>
          <p class="lead">
            Companies change. With Pro, we watch your holdings around the clock and email you only when something is
            worth a look, with a calm summary of what happened and how it affects the values you care about.
          </p>
          <RouterLink to="/pricing" class="btn btn-secondary">Explore Pro <ArrowRight :size="16" /></RouterLink>
        </div>
        <div class="mail card">
          <div class="mail__meta">
            <span class="mail__from">outvest alerts</span>
            <span class="muted text-xs">2 hours ago</span>
          </div>
          <p class="mail__subject">Heads up: something changed with Quikcart</p>
          <div class="mail__scores">
            <ScoreRing :score="46" :size="58" muted />
            <ArrowRight :size="18" class="muted" />
            <ScoreRing :score="44" :size="58" />
            <div>
              <p class="strong">Mixed bag → Concerning</p>
              <p class="muted text-sm">Workers & Fair Pay fell 9 points</p>
            </div>
          </div>
          <div class="mail__bar">
            <span class="text-sm">Workers & Fair Pay</span>
            <ScoreBar :score="28" :previous="37" />
          </div>
          <p class="mail__text">
            Inspectors fined Quikcart $14M after finding injury rates at 11 warehouses were nearly double the industry
            average.
          </p>
          <span class="btn btn-primary btn-sm mail__btn">See what changed <ArrowRight :size="15" /></span>
        </div>
      </div>
    </section>

    <!-- Testimonials -->
    <section class="section">
      <div class="container">
        <div class="section__head section__head--center">
          <span class="eyebrow"><Newspaper :size="15" /> From our community</span>
          <h2 class="h-1">Made for people who are new to this.</h2>
        </div>
        <div class="quotes">
          <figure v-for="t in testimonials" :key="t.name" class="quote card">
            <Quote :size="22" class="quote__mark" />
            <blockquote>{{ t.quote }}</blockquote>
            <figcaption>
              <span class="avatar">{{ t.name[0] }}</span>
              <span>
                <strong>{{ t.name }}</strong>
                <span class="muted text-sm">{{ t.detail }}</span>
              </span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <!-- Pricing teaser -->
    <section class="section section--tint">
      <div class="container">
        <div class="section__head section__head--center">
          <span class="eyebrow">Pricing</span>
          <h2 class="h-1">Start free. Upgrade when it clicks.</h2>
        </div>
        <div class="mini-plans">
          <RouterLink v-for="p in plans" :key="p.name" to="/pricing" class="mini-plan card" :class="{ 'is-popular': p.popular }">
            <span v-if="p.popular" class="mini-plan__flag"><Sparkles :size="12" /> Most popular</span>
            <span class="mini-plan__name">{{ p.name }}</span>
            <span class="mini-plan__price num">{{ p.price }}<span>/mo</span></span>
            <span class="muted text-sm">{{ p.note }}</span>
          </RouterLink>
        </div>
        <p class="center"><RouterLink to="/pricing" class="link">Compare plans →</RouterLink></p>
      </div>
    </section>

    <!-- CTA -->
    <section class="section">
      <div class="container">
        <div class="cta">
          <h2 class="h-1">Your money. Your values.</h2>
          <p>Find out what you're really invested in. It's free and takes about two minutes.</p>
          <RouterLink :to="session.isAuthed ? '/app/scan/new' : '/signup'" class="btn btn-light btn-lg">
            Get started free <ArrowRight :size="18" />
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing {
  overflow-x: clip;
}

/* Hero */
.hero {
  position: relative;
  padding: 56px 0 24px;
}
.hero__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(70px);
  pointer-events: none;
}
.hero__glow--mint {
  top: -120px;
  right: 8%;
  width: 520px;
  height: 420px;
  background: rgba(128, 197, 157, 0.35);
}
.hero__glow--lilac {
  top: 160px;
  right: 30%;
  width: 360px;
  height: 320px;
  background: rgba(196, 186, 255, 0.35);
}
.hero__inner {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr);
  gap: 56px;
  align-items: center;
}
.hero__pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 22px;
  padding: 7px 14px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-xs);
  font-size: 13.5px;
  font-weight: 650;
  color: var(--brand-700);
}
.hero__lead {
  max-width: 540px;
  margin-top: 22px;
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 32px;
}
.hero__trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 22px;
  margin-top: 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
.hero__trust li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hero__trust svg {
  color: var(--brand-500);
}
.hero__visual {
  position: relative;
  padding: 66px 28px 80px;
}
.hero-card {
  position: relative;
  padding: 22px;
  border-radius: 28px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
}
.hero-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--line);
}
.hero-card__label {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--subtle);
}
.hero-card__title {
  margin-top: 4px;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 21px;
  font-weight: 560;
  line-height: 1.2;
}
.hero-card__rows {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 10px;
}
.hero-card__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 9px 6px;
}
.hero-card__rank {
  width: 16px;
  font-size: 13px;
  font-weight: 700;
  color: var(--subtle);
}
.hero-card__id {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}
.hero-card__id span {
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.float {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px 12px 12px;
  border-radius: 18px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
  animation: float 6s ease-in-out infinite;
}
.float > span:last-child {
  display: flex;
  flex-direction: column;
}
.float--values {
  top: 2px;
  left: -8px;
}
.float--alert {
  right: -6px;
  bottom: 0;
  max-width: 290px;
  animation-delay: -3s;
}
.float__label {
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
}
.float__value {
  font-size: 18px;
  font-weight: 760;
}
.float__value .muted {
  font-size: 13px;
  font-weight: 600;
}
.float__text {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
}
.float__bell {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--coral-100);
  color: var(--coral-500);
}
.strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 56px;
  padding: 22px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  color: var(--muted);
}
.strip strong {
  display: block;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 28px;
  font-weight: 560;
  color: var(--ink);
}

/* Sections */
.section {
  padding: 96px 0;
}
.section--tint {
  background: linear-gradient(180deg, var(--bg-tint), var(--bg));
}
.section__head {
  max-width: 720px;
  margin-bottom: 44px;
}
.section__head .h-1 {
  margin-top: 12px;
}
.section__head .lead {
  margin-top: 16px;
}
.section__head--center {
  margin-inline: auto;
  text-align: center;
}
.center {
  margin-top: 24px;
  text-align: center;
}

.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.step {
  position: relative;
  padding: 28px;
}
.step__num {
  position: absolute;
  top: 24px;
  right: 26px;
  font-family: var(--font-display);
  font-size: 34px;
  font-weight: 500;
  color: var(--line-strong);
}
.step__icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 16px;
  background: var(--brand-50);
  color: var(--brand-600);
}
.step__title {
  margin-top: 22px;
  font-size: 19px;
}
.step__text {
  margin-top: 8px;
  color: var(--muted);
}

.values {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.value {
  padding: 26px;
  transition:
    transform 0.3s var(--ease),
    box-shadow 0.3s var(--ease);
}
.value:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.value__title {
  margin-top: 18px;
  font-size: 18px;
}
.value__text {
  margin-top: 6px;
  color: var(--muted);
}

.split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 64px;
  align-items: center;
}
.split--reverse .split__copy {
  order: 2;
}
.split__copy .h-1 {
  margin-top: 14px;
}
.split__copy .lead {
  margin-top: 18px;
}
.split__copy .btn {
  margin-top: 28px;
}
.checks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  font-weight: 600;
}
.checks li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.checks svg {
  flex-shrink: 0;
  padding: 3px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-700);
}

.etf-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 24px;
  border-radius: 28px;
  box-shadow: var(--shadow-lg);
}
.etf-card__head {
  display: flex;
  align-items: center;
  gap: 14px;
}
.etf-card__name {
  font-weight: 750;
}
.etf-card__rows {
  display: flex;
  flex-direction: column;
}
.etf-card__rows li {
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr) 52px 128px;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
  font-weight: 600;
}
.etf-card__rows li > :nth-child(3) {
  text-align: right;
}
.etf-card__rows li > :last-child {
  justify-self: end;
}
.etf-card__foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--sun-50);
  color: #6b4d0c;
  font-size: 13.5px;
  font-weight: 600;
}

.mail {
  padding: 24px;
  border-radius: 28px;
  box-shadow: var(--shadow-lg);
}
.mail__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.mail__from {
  font-size: 13px;
  font-weight: 700;
  color: var(--brand-700);
}
.mail__subject {
  margin-top: 8px;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 22px;
  font-weight: 560;
  line-height: 1.25;
}
.mail__scores {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 18px;
  padding: 16px;
  border-radius: 18px;
  background: var(--surface-muted);
}
.mail__bar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 16px;
  font-weight: 600;
}
.mail__text {
  margin-top: 16px;
  color: var(--ink-2);
  font-size: 14.5px;
}
.mail__btn {
  margin-top: 18px;
  pointer-events: none;
}

.quotes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}
.quote {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 26px;
}
.quote__mark {
  color: var(--brand-300);
}
.quote blockquote {
  flex: 1;
  font-size: 16.5px;
  line-height: 1.55;
}
.quote figcaption {
  display: flex;
  align-items: center;
  gap: 10px;
}
.quote figcaption > span:last-child {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.mini-plans {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  max-width: 900px;
  margin: 0 auto;
}
.mini-plan {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 26px;
  transition:
    transform 0.3s var(--ease),
    box-shadow 0.3s var(--ease);
}
.mini-plan:hover {
  transform: translateY(-3px);
  box-shadow: var(--shadow);
}
.mini-plan.is-popular {
  border-color: var(--brand-300);
}
.mini-plan__flag {
  position: absolute;
  top: -12px;
  left: 22px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: #fff;
  font-size: 11.5px;
  font-weight: 700;
}
.mini-plan__name {
  font-weight: 700;
  color: var(--muted);
}
.mini-plan__price {
  font-size: 36px;
  font-weight: 780;
  letter-spacing: -0.03em;
}
.mini-plan__price span {
  font-size: 15px;
  font-weight: 600;
  color: var(--muted);
}

.cta {
  position: relative;
  overflow: hidden;
  padding: 72px 32px;
  border-radius: 36px;
  text-align: center;
  color: #fff;
  background:
    radial-gradient(circle at 15% 20%, rgba(128, 197, 157, 0.5), transparent 45%),
    radial-gradient(circle at 85% 80%, rgba(123, 104, 238, 0.35), transparent 45%),
    linear-gradient(150deg, var(--brand-700), var(--brand-900));
}
.cta .h-1 {
  color: #fff;
}
.cta p {
  max-width: 480px;
  margin: 14px auto 30px;
  font-size: 18px;
  color: rgba(255, 255, 255, 0.82);
}

@media (max-width: 1023px) {
  .hero__inner,
  .split {
    grid-template-columns: minmax(0, 1fr);
    gap: 40px;
  }
  .split--reverse .split__copy {
    order: 0;
  }
  .hero__visual {
    max-width: 560px;
    margin: 0 auto;
    width: 100%;
  }
  .steps,
  .values,
  .quotes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .hero {
    padding-top: 32px;
  }
  .section {
    padding: 64px 0;
  }
  .steps,
  .values,
  .quotes,
  .mini-plans {
    grid-template-columns: minmax(0, 1fr);
  }
  .hero__visual {
    padding: 58px 0 84px;
  }
  .float {
    padding: 10px 14px 10px 10px;
  }
  .float--values {
    top: 0;
    left: 0;
  }
  .float--alert {
    right: 0;
    bottom: 0;
    max-width: 270px;
  }
  .hero__actions .btn {
    width: 100%;
  }
  .cta {
    padding: 56px 22px;
    border-radius: 28px;
  }
}
</style>
