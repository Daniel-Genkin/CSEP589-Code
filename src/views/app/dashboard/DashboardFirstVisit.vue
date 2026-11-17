<script setup>
// Figma "First visit": nothing scanned yet. Pick a fund (option A) or bring an account (option B).
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import { getSecurity } from '@/api/mock/catalog'
import { DEMO_FUNDS } from '@/utils/lines'
import { ref } from 'vue'

defineEmits(['continue'])

const funds = DEMO_FUNDS.slice(0, 3).map(({ symbol }) => getSecurity(symbol))
const picked = ref(funds[0].symbol)
</script>

<template>
  <div class="page first">
    <div class="page-cols">
      <div class="col-main">
        <header class="page-head">
          <p class="eyebrow">Your Rally · Dashboard</p>
          <h1 class="first__title">First, what’s in<br />your fund?</h1>
          <p class="lead">Pick your fund. We’ll look inside, not tell you what to buy.</p>
        </header>
        <ol class="steps">
          <li class="steps__pill is-current">01 Pick a fund</li>
          <li class="steps__arrow" aria-hidden="true">→</li>
          <li class="steps__pill">02 Pick your lines</li>
          <li class="steps__arrow" aria-hidden="true">→</li>
          <li class="steps__pill">03 Scan</li>
        </ol>
      </div>
      <aside class="col-side has-receipt">
        <ReceiptPaper class="side-receipt" compact flat skeleton note="Your receipt appears after a scan. No holdings to show yet.">
          <template #skeleton-extra>
            <hr />
            <div class="ghost" aria-hidden="true"><span style="width: 48%" /><span style="width: 20%" /></div>
            <hr />
          </template>
        </ReceiptPaper>
      </aside>
    </div>

    <div class="first__options">
      <section class="card option">
        <p class="label-mono">Option A · Start with a fund</p>
        <header class="row-between">
          <h2 class="title-lg option__title">Know your fund’s name? Start there.</h2>
          <p class="label-mono">{{ picked }} selected</p>
        </header>
        <p class="body-muted">Choose a fund below to continue. No account connection needed to explore a fund.</p>

        <div class="funds" role="radiogroup" aria-label="Fund">
          <button
            v-for="fund in funds"
            :key="fund.symbol"
            type="button"
            role="radio"
            class="fund"
            :class="{ 'is-on': picked === fund.symbol }"
            :aria-checked="picked === fund.symbol"
            @click="picked = fund.symbol"
          >
            <span class="ticker-tile fund__tile">{{ fund.symbol }}</span>
            <span class="fund__text">
              <span class="fund__name">{{ fund.name }}</span>
              <span class="fund__sub">{{ fund.issuer }} · {{ fund.sector }}</span>
            </span>
            <span class="fund__state"><span class="fund__radio" />{{ picked === fund.symbol ? 'Selected' : 'Choose' }}</span>
          </button>
        </div>

        <div class="option__foot">
          <button type="button" class="btn btn-primary" @click="$emit('continue', picked)">Continue with {{ picked }} →</button>
          <p class="label-mono">Up next · Choose your industry lines</p>
        </div>
      </section>

      <section class="card option option--b">
        <p class="label-mono">Option B · Start with your account</p>
        <header class="row-between">
          <h2 class="title-lg option__title">Have an account? Bring it.</h2>
          <p class="label-mono">Design demo</p>
        </header>
        <p class="body-muted">
          Prefer to choose from what you already hold? The connection option below is a design demo. No account is linked and no holdings have been loaded.
        </p>
        <div class="empty">
          <p class="empty__title">No account linked</p>
          <p class="body-muted">No holdings have been loaded.</p>
        </div>
        <div class="option__foot">
          <RouterLink to="/app/scan/new" class="btn btn-primary">Connect an account ↗</RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.first {
  gap: 40px;
}
.first__title {
  font-size: clamp(72px, 6.7vw, 96px);
  line-height: 1;
}
.ghost {
  display: flex;
  justify-content: space-between;
}
.ghost span {
  height: 12px;
  border-radius: 6px;
  background: var(--paper-ghost);
}
.steps {
  display: flex;
  align-items: center;
  gap: 10px;
}
.steps__pill {
  padding: 10px 16px;
  border-radius: var(--radius-pill);
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-muted);
}
.steps__pill.is-current {
  background: var(--cream);
  color: var(--ink);
}
.steps__arrow {
  color: var(--text-muted);
}
.first__options {
  display: flex;
  align-items: stretch;
  gap: 24px;
}
.option {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
}
.option--b {
  padding: 36px;
}
.option__title {
  font-size: 26px;
}
.funds {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px 0;
}
.fund {
  display: flex;
  align-items: center;
  gap: 18px;
  width: 100%;
  padding: 16px 22px 16px 16px;
  border: 1px solid var(--hairline);
  border-radius: var(--radius-lg);
  text-align: left;
  transition:
    border-color 0.2s var(--ease),
    background-color 0.2s var(--ease);
}
.fund:hover {
  border-color: var(--border);
}
.fund.is-on {
  padding: 15.5px 21.5px 15.5px 15.5px;
  border: 1.5px solid var(--brand-400);
  background: var(--surface-2);
}
.fund.is-on .fund__tile {
  background: var(--cream);
  color: var(--ink);
}
.fund__tile {
  width: 56px;
  height: 56px;
  background: var(--track);
  font-size: 13px;
}
.fund__text {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.fund__name {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.175;
}
.fund__sub {
  font-size: 14px;
  color: var(--text-muted);
}
.fund__state {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-muted);
}
.fund.is-on .fund__state {
  color: var(--text);
}
.fund__radio {
  width: 16px;
  height: 16px;
  border: 1.5px solid var(--border);
  border-radius: 50%;
}
.fund.is-on .fund__radio {
  border-color: var(--brand-400);
  background: var(--brand-400);
}
.option__foot {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-top: auto;
}
.empty {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 200px;
  padding: 24px;
  border: 1px dashed var(--border);
  border-radius: var(--radius-lg);
}
.empty__title {
  font-size: 18px;
  font-weight: 600;
}
</style>
