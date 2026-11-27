<script setup>
import AppShell from '../components/AppShell.vue'
import Row from '../components/Row.vue'
import { LINES, state } from '../data.js'
</script>

<template>
  <AppShell active="home" glow="grey" title="We couldn’t find the data." body="The scan didn’t finish. Your lines are saved.">
    <div class="grid">
      <div class="col">
        <div class="card-pad main">
          <div class="list" style="padding-left: 0; background: none"><Row tk="VOO" title="Vanguard S&P 500 ETF" sub="5 lines · scan didn’t finish" /></div>
          <span class="tag" style="align-self: flex-start"><i class="dot" style="background: var(--flare)" />Data unavailable</span>
          <b class="t">The data didn’t come through.</b>
          <p class="dim">Rally couldn’t get VOO’s holdings right now, so there’s nothing to show yet.</p>
          <div class="note"><p class="label" style="color: var(--flare)">Missing data isn’t 0%</p><p>Rally won’t show an old result or treat missing data as a clean fund.</p></div>
          <RouterLink to="/check/printing" class="btn btn-primary btn-block">Try Again</RouterLink>
          <RouterLink to="/check" class="btn btn-secondary btn-block">Change Fund</RouterLink>
          <p class="caption center">Nothing was bought or sold.</p>
        </div>
        <h3 class="h">What this means for you</h3>
        <div class="list">
          <Row title="Baskets" sub="Available after a scan finishes." dot="var(--flare)" right="Paused" />
          <Row title="Sharing" sub="Available after a scan finishes." dot="var(--flare)" right="Paused" />
          <Row title="Your lines" :sub="`All ${state.lines.length} are saved.`" dot="var(--sun)" right="Saved" />
        </div>
      </div>
      <aside class="col">
        <div class="empty"><p class="display">No receipt.</p><p class="caption">Your receipt shows up once a scan finishes.</p></div>
        <div class="card-pad">
          <div class="sh"><b>Your lines</b><span class="caption">{{ state.lines.length }} saved</span></div>
          <div class="chips"><span v-for="l in LINES.filter((x) => state.lines.includes(x.id))" :key="l.id" class="chip"><i class="dot" :style="{ background: l.color }" />{{ l.name }}</span></div>
          <RouterLink to="/check/printing" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px">Rescan VOO</RouterLink>
        </div>
        <h3 class="h">Still stuck?</h3>
        <p class="dim">If this keeps happening, let us know and we’ll look into it.</p>
        <button class="btn btn-secondary" style="align-self: flex-start; height: 44px; font-size: 15px">Report a Problem</button>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 14px; }
.main { gap: 14px; padding: 16px 16px 12px; }
.t { font-weight: 600; font-size: 18px; color: var(--white); }
.note { background: var(--ink); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 15px; color: var(--white); }
.h { font-weight: 600; font-size: 20px; color: var(--white); margin-top: 10px; }
.center { text-align: center; }
.empty { border: 1.5px dashed #4a4654; border-radius: 20px; padding: 32px; text-align: center; display: flex; flex-direction: column; gap: 10px; }
.empty .display { font-size: 44px; color: #8a8594; }
.sh { display: flex; justify-content: space-between; align-items: baseline; }
.sh b { font-weight: 600; font-size: 17px; color: var(--white); }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip { height: 34px; font-size: 14px; background: #2f2c38; }
</style>
