<script setup>
import { ref } from 'vue'
import { Search, Bell } from '@lucide/vue'
import AppShell from '../AppShell.vue'
import { EXPLORE_ROWS } from '@/landing/sample.js'

const funds = ['VOO', 'VTI', 'QQQ', 'SCHD', 'VUG', 'ESGU', 'Basket']
const selected = ref(0)
const heat = (v) => {
  if (v === null) return 'transparent'
  const p = Math.min(parseFloat(v) / 9, 1)
  return `color-mix(in srgb, var(--flare) ${Math.round(18 + p * 72)}%, #2a2530)`
}
const latest = [
  { d: 'Nov 18', who: 'Palantir', what: 'New contract award posted', src: 'USAspending.gov' },
  { d: 'Nov 14', who: 'GEO Group', what: 'Quarterly report filed', src: 'SEC filing' },
  { d: 'Nov 12', who: 'VOO', what: 'Quarterly rebalance, 3 companies added', src: 'Vanguard' },
  { d: 'Nov 7', who: 'Lockheed Martin', what: 'Contract change posted', src: 'USAspending.gov' },
]
const companies = [
  { tk: 'PLTR', name: 'Palantir Technologies', ex: 'Nasdaq', what: 'Software contracts with ICE for case management and data analysis.', held: '0.6%', funds: '214 funds', src: 'USAspending.gov' },
  { tk: 'GD', name: 'General Dynamics', ex: 'NYSE', what: 'IT services contracts with ICE and the Department of Homeland Security.', held: '0.1%', funds: '162 funds', src: 'USAspending.gov' },
  { tk: 'GEO', name: 'GEO Group', ex: 'NYSE', what: 'Runs immigration detention centers under ICE contracts.', held: 'Not held', funds: '41 funds', src: 'SEC filing' },
  { tk: 'CXW', name: 'CoreCivic', ex: 'NYSE', what: 'Runs immigration detention centers under ICE contracts.', held: 'Not held', funds: '47 funds', src: 'SEC filing' },
]
const where = [
  { tk: 'VOO', mine: true, v: 0.6 },
  { tk: 'VTI', v: 0.5 },
  { tk: 'QQQ', v: 1.4 },
  { tk: 'VUG', v: 1.1 },
]
</script>

<template>
  <AppShell active="explore">
    <header class="top">
      <div>
        <h1 class="display title">See who’s linked<br />to what.</h1>
        <p class="body">Pick an issue to see which companies are tied to it and which funds hold them. Rally shows the record and where it came from. What you do with it is up to you.</p>
      </div>
      <div class="search-col">
        <label class="search"><Search :size="17" color="var(--dim)" /><input placeholder="Search a company, fund or issue" /><kbd class="mono">/</kbd></label>
        <p class="upd mono">Updated Nov 19, 2026 · 9:41 AM <span class="tag"><i class="dot" style="background: var(--sun)" />Sample data</span></p>
      </div>
    </header>

    <div class="latest">
      <span class="badge mono">Latest</span>
      <span v-for="l in latest" :key="l.who" class="li"><span class="mono d">{{ l.d }}</span> <b>{{ l.who }}</b> <span class="dim">{{ l.what }}</span> <span class="src">{{ l.src }} ↗</span></span>
    </div>

    <section class="card issues">
      <div class="ih">
        <div>
          <h3>Issues across funds</h3>
          <p class="caption">How much of each fund is tied to each issue. Select a row to see the companies.</p>
        </div>
        <p class="legend"><span><i class="dot" style="background: var(--sun)" /> Your lines</span><span><i class="ring" /> Other issues</span><span class="scale">0% <i /><i /><i /><i /> 5%+</span></p>
      </div>
      <table>
        <thead>
          <tr>
            <th class="iss">Issue</th>
            <th v-for="(f, i) in funds" :key="f"><small v-if="i === 0">Your fund</small><small v-else-if="i === 6">Yours</small>{{ f }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, ri) in EXPLORE_ROWS" :key="r.name" :class="{ sel: selected === ri }" @click="selected = ri">
            <td class="iss"><i v-if="r.mine" class="dot" :style="{ background: r.color }" /><i v-else class="ring" /> {{ r.name }}</td>
            <td v-for="(v, i) in r.v" :key="i"><span class="cell mono" :style="{ background: heat(v) }">{{ v === null ? '–' : v + '%' }}</span></td>
          </tr>
        </tbody>
      </table>
    </section>

    <div class="detail">
      <section class="card issue">
        <div class="dh">
          <div>
            <h2><i class="dot" style="background: var(--violet); width: 10px; height: 10px" /> Human rights &amp; conflict</h2>
            <p class="label" style="margin-top: 8px">6 companies · 1.4% of VOO</p>
            <p class="dim desc">Companies with contracts or services tied to immigration detention and enforcement.</p>
          </div>
          <RouterLink to="/alerts" class="btn btn-secondary btn-sm"><Bell :size="15" /> Get Alerts</RouterLink>
        </div>
        <div class="ct head label"><span>Company</span><span>What the record shows</span><span>In VOO · Funds</span><span>Source</span></div>
        <div v-for="(c, i) in companies" :key="c.tk" class="ct" :class="{ sel: i === 0 }">
          <span class="co"><span class="tk mono">{{ c.tk }}</span><span><b>{{ c.name }}</b><small class="mono">{{ c.ex }}</small></span></span>
          <span class="what">{{ c.what }}</span>
          <span class="held mono"><b>{{ c.held }}</b><small>{{ c.funds }}</small></span>
          <span class="src">{{ c.src }} ↗</span>
        </div>
        <button class="btn-link" style="align-self: flex-start">Show 2 More</button>
        <div class="note">
          <p class="label">What counts as a link</p>
          <p>A company is listed when a public record ties it to the issue: a federal contract, a company filing, or an agency or court record. Each row links to that record. If the record changes, the row changes with it.</p>
        </div>
      </section>

      <aside class="card rec">
        <div class="rh"><span class="tk mono">PLTR</span><div><b>Palantir Technologies</b><p class="label">PLTR · Nasdaq · 0.6% of VOO</p></div></div>
        <p class="label sh">What the record shows</p>
        <div class="fact"><p class="label"><i class="dot" style="background: var(--violet)" /> Human rights &amp; conflict</p><p>Holds contracts with ICE for case-management and data software.</p><p class="src">USAspending.gov ↗ <span class="mute">Updated Nov 18</span></p></div>
        <div class="fact"><p class="label"><i class="dot" style="background: var(--flare)" /> Military &amp; defense</p><p>Holds contracts with the U.S. Army and other defense agencies.</p><p class="src">USAspending.gov ↗ <span class="mute">Updated Nov 2</span></p></div>
        <p class="label sh">Checked, nothing on record</p>
        <div class="chips">
          <span class="chip chip-xs"><i class="dot" style="background: var(--sun)" /> Environment &amp; climate</span>
          <span class="chip chip-xs"><i class="dot" style="background: var(--signal)" /> Labor practices</span>
          <span class="chip chip-xs"><i class="ring" /> Political donations</span>
          <span class="chip chip-xs"><i class="ring" /> Corporate taxes</span>
        </div>
        <p class="label sh">Where it shows up</p>
        <div v-for="w in where" :key="w.tk" class="wr">
          <span class="mono">{{ w.tk }} <small v-if="w.mine">Your fund</small></span>
          <span class="tr"><i :style="{ width: (w.v / 1.6) * 100 + '%' }" /></span>
          <span class="mono">{{ w.v.toFixed(1) }}%</span>
        </div>
        <RouterLink to="/lines" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px; margin-top: 10px">Add to My Lines</RouterLink>
        <RouterLink to="/basket" class="btn btn-secondary btn-block" style="height: 44px; font-size: 15px">Exclude from Basket</RouterLink>
        <p class="caption">Rally doesn’t score or rank companies. It shows the record and the source.</p>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.top { display: flex; justify-content: space-between; align-items: flex-end; gap: 40px; margin-top: 8px; }
.title { font-size: 76px; color: var(--cream); }
.body { margin-top: 14px; max-width: 560px; font-size: 15px; line-height: 1.5; color: var(--dim); }
.search-col { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.search { width: 440px; height: 48px; border-radius: 999px; background: rgba(33, 31, 41, 0.8); border: 1px solid var(--line); display: flex; align-items: center; gap: 10px; padding: 0 8px 0 18px; }
.search input { flex: 1; background: none; border: 0; outline: none; font-size: 15px; }
.search input::placeholder { color: var(--dim); }
kbd { width: 28px; height: 28px; border-radius: 8px; background: var(--raise); display: grid; place-items: center; color: var(--dim); font-size: 13px; }
.upd { font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dim); display: flex; align-items: center; gap: 10px; }
.latest { display: flex; align-items: center; gap: 22px; height: 48px; padding: 0 10px; border-radius: 999px; background: var(--surf); white-space: nowrap; overflow: hidden; font-size: 14px; }
.badge { background: var(--sun); color: var(--ink); font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 12px; border-radius: 999px; }
.li b { color: var(--white); font-weight: 600; }
.d { font-size: 11px; color: var(--mute); text-transform: uppercase; }
.src { color: var(--link); font-size: 13px; }
.issues { padding: 22px 20px; }
.ih { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px; }
.ih h3 { font-weight: 600; font-size: 20px; color: var(--white); margin-bottom: 4px; }
.legend { display: flex; gap: 16px; font-size: 12px; color: var(--dim); align-items: center; }
.legend span { display: inline-flex; align-items: center; gap: 6px; }
.scale i { width: 18px; height: 10px; border-radius: 3px; background: var(--flare); opacity: 0.3; }
.scale i:nth-child(2) { opacity: 0.5; } .scale i:nth-child(3) { opacity: 0.75; } .scale i:nth-child(4) { opacity: 1; }
table { width: 100%; border-collapse: separate; border-spacing: 0 6px; }
th { font-family: var(--mono); font-weight: 500; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--dim); text-align: center; vertical-align: bottom; }
th small { display: block; color: var(--link); font-size: 9px; margin-bottom: 2px; }
th.iss, td.iss { text-align: left; width: 240px; }
td.iss { font-weight: 500; font-size: 14px; color: var(--white); display: flex; align-items: center; gap: 10px; height: 40px; padding-left: 12px; }
tbody tr { cursor: pointer; }
tbody tr.sel td { background: rgba(134, 146, 248, 0.06); }
tbody tr.sel td:first-child { border-radius: 12px 0 0 12px; box-shadow: inset 1.5px 0 0 var(--link), inset 0 1.5px 0 var(--link), inset 0 -1.5px 0 var(--link); }
tbody tr.sel td:last-child { border-radius: 0 12px 12px 0; box-shadow: inset -1.5px 0 0 var(--link), inset 0 1.5px 0 var(--link), inset 0 -1.5px 0 var(--link); }
tbody tr.sel td:not(:first-child):not(:last-child) { box-shadow: inset 0 1.5px 0 var(--link), inset 0 -1.5px 0 var(--link); }
td { padding: 0 4px; }
.cell { display: block; height: 32px; line-height: 32px; border-radius: 6px; text-align: center; font-size: 12px; color: #fff; }
.detail { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
.issue { padding: 24px 22px; display: flex; flex-direction: column; gap: 10px; }
.dh { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
.dh h2 { display: flex; align-items: center; gap: 10px; font-weight: 600; font-size: 24px; color: var(--white); }
.desc { margin-top: 8px; font-size: 14px; }
.ct { display: grid; grid-template-columns: 220px 1fr 110px 140px; gap: 16px; align-items: center; padding: 12px; border-radius: 12px; border-bottom: 1px solid var(--line); font-size: 14px; }
.ct.head { border: 0; padding-bottom: 4px; font-size: 10px; }
.ct.sel { border: 1.5px solid var(--link); background: rgba(134, 146, 248, 0.06); }
.co { display: flex; align-items: center; gap: 10px; }
.co b, .held b { display: block; color: var(--white); font-weight: 600; }
.co small, .held small { display: block; color: var(--mute); font-size: 11px; }
.held { text-align: right; }
.what { color: var(--white); line-height: 1.4; }
.tk { width: 36px; height: 36px; border-radius: 9px; background: #34313d; display: grid; place-items: center; font-size: 10px; color: var(--cream); flex: none; }
.note { margin-top: auto; background: var(--ink); border-radius: 14px; padding: 14px 16px; font-size: 14px; color: var(--white); line-height: 1.45; display: flex; flex-direction: column; gap: 6px; }
.rec { padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.rh { display: flex; gap: 14px; align-items: center; }
.rh .tk { width: 48px; height: 48px; font-size: 12px; }
.rh b { font-weight: 600; font-size: 18px; color: var(--white); }
.sh { border-bottom: 1px solid var(--line); padding: 14px 0 8px; }
.fact { display: flex; flex-direction: column; gap: 6px; padding: 8px 0 10px; border-bottom: 1px solid var(--line); font-size: 14px; color: var(--white); line-height: 1.4; }
.fact .label { display: inline-flex; align-items: center; gap: 7px; color: var(--white); font-size: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chip-xs { height: 28px; font-size: 12px; padding: 0 10px; background: transparent; border: 1px solid var(--line); color: var(--dim); }
.wr { display: grid; grid-template-columns: 100px 1fr 44px; gap: 10px; align-items: center; font-size: 12px; color: var(--white); }
.wr small { color: var(--link); font-size: 9px; text-transform: uppercase; }
.tr { height: 5px; border-radius: 3px; background: #34313d; }
.tr i { display: block; height: 100%; border-radius: 3px; background: var(--link); }
.mute { color: var(--mute); }
</style>
