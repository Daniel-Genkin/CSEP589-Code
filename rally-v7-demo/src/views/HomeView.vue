<script setup>
import { computed } from 'vue'
import { ChevronRight, FileText, ShoppingBasket, ArrowLeftRight, Upload } from '@lucide/vue'
import AppShell from '../components/AppShell.vue'
import DotGrid from '../components/DotGrid.vue'
import Row from '../components/Row.vue'
import { state, line } from '../data.js'

const myLines = computed(() => state.lines.map(line).filter(Boolean))
const actions = [
  { to: '/basket', icon: ShoppingBasket, title: 'Drop Companies', sub: 'Build a basket without them', tint: 'var(--sun)' },
  { to: '/redirect', icon: ArrowLeftRight, title: 'Redirect Deposits', sub: 'Send new money somewhere else', tint: 'var(--link)' },
  { to: '/check/receipt?dialog=share', icon: Upload, title: 'Share Your Receipt', sub: 'Holdings only, never balances', tint: 'var(--white)' },
]
</script>

<template>
  <AppShell active="home">
    <div class="grid">
      <div class="col">
        <section class="card summary">
          <p class="label">VOO · S&amp;P 500 · Sample</p>
          <div class="hero">
            <p class="display big">13%</p>
            <p class="lead">of your money in VOO crosses your lines</p>
          </div>
          <DotGrid :segments="[{ n: 4, color: 'var(--pink)' }, { n: 3, color: 'var(--sun)' }, { n: 6, color: 'var(--violet)' }]" :size="28" :gap="10" />
          <p class="legend">
            <span><i class="dot" style="background: var(--pink)" /> Data privacy</span>
            <span><i class="dot" style="background: var(--sun)" /> Environment &amp; climate</span>
            <span><i class="dot" style="background: var(--violet)" /> Not in sample</span>
          </p>
          <hr class="rule" />
          <RouterLink to="/breakdown" class="more">See Breakdown <ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        </section>

        <div class="section-head">
          <h3>Who crosses your lines</h3>
          <RouterLink to="/breakdown" class="btn-link" style="height: auto">See All</RouterLink>
        </div>
        <div class="list">
          <Row tk="MSFT" title="Microsoft" sub="Data privacy" dot="var(--pink)" right="4.0%" right-sub="$4.00 per $100" icon="chev" to="/explore" />
          <Row tk="XOM" title="ExxonMobil" sub="Environment & climate · Excluded" dot="var(--sun)" right="3.0%" right-sub="$3.00 per $100" icon="chev" to="/explore" />
        </div>
      </div>

      <aside class="side">
        <RouterLink to="/receipts" class="card upd">
          <span class="sq"><FileText :size="18" /></span>
          <span class="t"><b>2 new updates</b><small>About ExxonMobil and Lockheed Martin</small></span>
          <ChevronRight :size="18" color="var(--mute)" />
        </RouterLink>

        <div>
          <h3 class="h">What you can do</h3>
          <p class="hs">Or keep VOO as it is. Nothing changes.</p>
        </div>
        <div class="card acts">
          <RouterLink v-for="a in actions" :key="a.title" :to="a.to" class="act">
            <span class="sq" :style="{ color: a.tint }"><component :is="a.icon" :size="18" /></span>
            <span class="t"><b>{{ a.title }}</b><small>{{ a.sub }}</small></span>
            <ChevronRight :size="18" color="var(--mute)" />
          </RouterLink>
        </div>

        <div class="card-pad lines">
          <div class="lh"><b>Your lines</b><span>{{ myLines.length }} lines</span></div>
          <div class="chips">
            <span v-for="l in myLines" :key="l.id" class="chip"><i class="dot" :style="{ background: l.color }" />{{ l.name }}</span>
          </div>
          <RouterLink to="/lines" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px">Edit Lines</RouterLink>
        </div>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; margin-top: 8px; }
.col { display: flex; flex-direction: column; gap: 20px; }
.summary { padding: 22px 20px 6px; display: flex; flex-direction: column; gap: 18px; }
.hero { display: flex; align-items: center; gap: 22px; margin-top: -4px; }
.big { font-size: 150px; color: var(--cream); background: linear-gradient(180deg, #fff 30%, #f2dca6); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
.lead { font-weight: 500; font-size: 28px; line-height: 1.25; color: var(--white); max-width: 400px; }
.legend { display: flex; gap: 20px; font-size: 13px; color: var(--dim); }
.legend span { display: inline-flex; align-items: center; gap: 7px; }
.more { display: flex; justify-content: space-between; align-items: center; height: 48px; color: var(--link); font-weight: 600; font-size: 15px; }
.side { display: flex; flex-direction: column; gap: 14px; }
.upd, .act { display: flex; align-items: center; gap: 14px; padding: 12px 16px; }
.upd { min-height: 62px; }
.sq { width: 40px; height: 40px; border-radius: 10px; background: #34313d; display: grid; place-items: center; color: var(--white); flex: none; }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
.h { font-weight: 600; font-size: 20px; color: var(--white); margin-top: 10px; }
.hs { font-size: 13px; color: var(--dim); margin-top: 4px; }
.acts { padding: 4px 0; }
.act { border-bottom: 1px solid var(--line); margin-left: 0; }
.act:last-child { border-bottom: 0; }
.act:hover b, .upd:hover b { color: var(--link); }
.lines { margin-top: 10px; gap: 14px; }
.lh { display: flex; justify-content: space-between; align-items: baseline; }
.lh b { font-weight: 600; font-size: 18px; color: var(--white); }
.lh span { font-size: 13px; color: var(--mute); }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip { height: 34px; font-size: 14px; background: #2f2c38; }
</style>
