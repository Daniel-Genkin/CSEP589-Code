<script setup>
import BrandSpiral from '@/components/brand/BrandSpiral.vue'
import TickerBand from '@/components/brand/TickerBand.vue'
import LinePicker from '@/components/receipt/LinePicker.vue'
import LineupTable from '@/components/receipt/LineupTable.vue'
import ReceiptStats from '@/components/receipt/ReceiptStats.vue'
import TrustedPicker from '@/components/receipt/TrustedPicker.vue'
import { BRAND_NAME } from '@/config/brand'
import { DEMO_FUNDS, checkFund } from '@/utils/lines'
import { computed, ref } from 'vue'

const fundSymbol = ref('VOO')
const lineKeys = ref(['oil', 'pay', 'senators'])

const result = computed(() => checkFund(fundSymbol.value, lineKeys.value))
const fund = computed(() => result.value.fund)
const fmtCount = (n) => n.toLocaleString('en-US')
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
      <LinePicker v-model="lineKeys" />
      <TrustedPicker v-model="lineKeys" class="lines__trusted" />
    </section>

    <!-- Step 03: the receipt -->
    <section id="receipt" class="container stats">
      <ReceiptStats :result="result" :label="`your ${fund.symbol}`" :has-lines="lineKeys.length > 0" />
    </section>

    <!-- The lineup -->
    <section class="container">
      <LineupTable :result="result" :note="`Top ${result.lineup.length} of ${fmtCount(fund.holdingsCount)} · flagged first`" />
    </section>

    <!-- The final ask -->
    <section class="container final">
      <BrandSpiral class="final__spiral" :size="300" :rotate="22" />
      <h2 class="h-hero shout-shadow">Know what<br />you own.</h2>
      <div class="final__actions">
        <RouterLink to="/check" class="btn btn-flare final__cta">Check my holdings ↗</RouterLink>
        <RouterLink to="/browse" class="final__snoop">or browse every company →</RouterLink>
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
.lines__trusted {
  margin-top: 12px;
}

.stats {
  padding-top: 40px;
  padding-bottom: 56px;
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
