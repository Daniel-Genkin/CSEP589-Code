<script setup lang="ts">
// Your lines: switch any of the nine on or off. Every screen reads the same selection, so a
// change here re-checks the fund everywhere.
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ChevronRight, X } from '@lucide/vue'
import AppShell from '@/components/v7/AppShell.vue'
import Toggle from '@/components/v7/Toggle.vue'
import AddLineModal from '@/components/v7/AddLineModal.vue'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { bigPct, share, useLinesResult } from '@/composables/useLinesResult'
import { useCatalogStore } from '@/state/catalog'
import { useCheckStore } from '@/state/check'
import { useDemoStore } from '@/state/demo'

const route = useRoute()
const router = useRouter()
const demo = useDemoStore()
const catalog = useCatalogStore()
const check = useCheckStore()
const data = usePortfolioData()
const r = useLinesResult(data)
onMounted(() => void catalog.load().catch(() => {}))

const adding = computed(() => route.query.dialog === 'add')
const active = computed(() => catalog.categories.filter((c) => catalog.selectedIds.includes(c.id)))
const more = computed(() => catalog.categories.filter((c) => !catalog.selectedIds.includes(c.id)))
const hit = (id: string) => {
  const e = r.lines.value.find((l) => l.category === id)
  if (!r.ready.value) return demo.portfolio ? 'Checking…' : ''
  if (!e) return `In ${r.fund.value}: nothing`
  const lead = e.top[0]
  return `In ${r.fund.value}: ${lead ? data.nameOf(lead.ticker) : ''}${e.count > 1 ? ` and ${e.count - 1} more` : ''} · ${share(e.share)}`
}
const removeCustom = (n: string) => (check.customLines = check.customLines.filter((x) => x !== n))
</script>

<template>
  <AppShell active="lines" title="Your lines." :body="r.fund.value ? `Turn a line off and Rally checks ${r.fund.value} again without it.` : 'Pick what you don’t want your money to fund.'">
    <div class="grid">
      <div class="col">
        <div class="section-head"><h3>Active</h3><span class="meta">{{ active.length + check.customLines.length }}</span></div>
        <div class="card rows">
          <p v-if="!active.length && !check.customLines.length" class="caption" style="padding: 16px 0">No lines on. Turn one on below.</p>
          <div v-for="l in active" :key="l.id" class="lr">
            <span class="sq"><i class="dot" :style="{ background: l.color, width: '10px', height: '10px' }" /></span>
            <span class="t"><b>{{ l.label }}</b><small>{{ l.description }}</small><small v-if="hit(l.id)" class="hit mono">{{ hit(l.id) }}</small></span>
            <Toggle :model-value="true" :label="l.label" @update:model-value="catalog.toggle(l.id)" />
          </div>
          <div v-for="n in check.customLines" :key="n" class="lr">
            <span class="sq"><i class="dot" style="background: var(--cream); width: 10px; height: 10px" /></span>
            <span class="t"><b>{{ n }}</b><small>Your own line · not checked in this demo yet</small></span>
            <button class="rm" :aria-label="`Remove ${n}`" @click="removeCustom(n)"><X :size="18" /></button>
          </div>
        </div>
        <div class="section-head" style="margin-top: 16px"><h3>Add more</h3></div>
        <div class="card rows">
          <div v-for="l in more" :key="l.id" class="lr">
            <span class="sq dashed" />
            <span class="t"><b>{{ l.label }}</b><small>{{ l.description }}</small></span>
            <Toggle :model-value="false" :label="l.label" @update:model-value="catalog.toggle(l.id)" />
          </div>
          <RouterLink to="/lines?dialog=add" class="lr own"><Plus :size="20" /><span class="t"><b>Add Your Own</b></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        </div>
        <p class="caption">Which companies cross which line is sample data in this demo. Every line links to the public record it comes from.</p>
      </div>
      <aside class="side">
        <RouterLink v-if="demo.portfolio" to="/breakdown" class="card sum">
          <span class="sq"><i class="dot" style="background: var(--violet); width: 10px; height: 10px" /></span>
          <span class="t">
            <b>{{ r.ready.value ? `${bigPct(r.flagged.value.share)} of ${r.fund.value} crosses these lines` : `Checking ${r.fund.value}…` }}</b>
            <small>{{ r.ready.value ? `${r.flagged.value.count} companies · updates as you switch lines` : 'Live prices and holdings' }}</small>
          </span>
          <ChevronRight :size="18" color="var(--mute)" />
        </RouterLink>
        <RouterLink v-else to="/check" class="card sum"><span class="t"><b>Check a fund against these lines</b><small>No signup</small></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        <div class="section-head" style="margin-top: 14px"><h3>Updates</h3><RouterLink to="/receipts" class="btn-link" style="height: auto">See All</RouterLink></div>
        <div class="card rows">
          <RouterLink to="/receipts" class="lr"><span class="t"><b>Source updates</b><small>When there’s something new on a company you own.</small></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
          <RouterLink to="/alerts" class="lr"><span class="t"><b>Email alerts</b><small>See what an alert email looks like.</small></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        </div>
        <RouterLink v-if="demo.portfolio" to="/home" class="btn btn-primary btn-block" style="margin-top: 10px">See Your Result</RouterLink>
        <p class="caption center">Nothing is bought or sold. Rally only shows you what you own.</p>
      </aside>
    </div>
  </AppShell>
  <AddLineModal v-if="adding" @close="router.replace('/lines')" />
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col, .side { display: flex; flex-direction: column; gap: 12px; }
.side { align-self: start; }
.rows { padding: 0 16px; }
.lr { display: flex; align-items: center; gap: 14px; min-height: 63px; padding: 10px 0; border-bottom: 1px solid var(--line); }
.lr:last-child { border-bottom: 0; }
.sq { width: 32px; height: 32px; border-radius: 9px; background: #34313d; display: grid; place-items: center; flex: none; }
.sq.dashed { background: none; border: 1.5px dashed #4a4654; }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
.t small.hit { font-size: 11px; color: var(--mute); margin-top: 2px; }
.own, .own b { color: var(--link); }
.rm { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; color: var(--dim); }
.rm:hover { background: #34313d; color: var(--white); }
.sum { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
.center { text-align: center; }
</style>
