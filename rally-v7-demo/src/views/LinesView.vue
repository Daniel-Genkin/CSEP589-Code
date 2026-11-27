<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, ChevronRight } from '@lucide/vue'
import AppShell from '../components/AppShell.vue'
import Toggle from '../components/Toggle.vue'
import AddLineModal from '../components/AddLineModal.vue'
import { LINES, state, toggleLine } from '../data.js'

const route = useRoute()
const router = useRouter()
const adding = computed(() => route.query.dialog === 'add')
const subs = { environment: 'ExxonMobil · 3.0%', privacy: 'Microsoft · 4.0%' }
const active = computed(() => LINES.filter((l) => state.lines.includes(l.id)))
const more = computed(() => LINES.filter((l) => !state.lines.includes(l.id)))
const digest = ref(true)
const updates = ref(true)
</script>

<template>
  <AppShell active="lines" title="Your lines." body="Turn a line off and Rally checks VOO again without it.">
    <div class="grid">
      <div class="col">
        <div class="section-head"><h3>Active</h3><span class="meta">{{ active.length + state.customLines.length }}</span></div>
        <div class="card rows">
          <div v-for="l in active" :key="l.id" class="lr">
            <span class="sq"><i class="dot" :style="{ background: l.color, width: '10px', height: '10px' }" /></span>
            <span class="t"><b>{{ l.name }}</b><small>{{ l.desc }}</small><small class="hit mono">In VOO: {{ subs[l.id] || 'not in sample' }}</small></span>
            <Toggle :model-value="true" :label="l.name" @update:model-value="toggleLine(l.id)" />
          </div>
          <div v-for="n in state.customLines" :key="n" class="lr">
            <span class="sq"><i class="dot" style="background: var(--cream); width: 10px; height: 10px" /></span>
            <span class="t"><b>{{ n }}</b><small>Your own line · checking public records</small></span>
            <Toggle :model-value="true" :label="n" @update:model-value="state.customLines.splice(state.customLines.indexOf(n), 1)" />
          </div>
        </div>
        <div class="section-head" style="margin-top: 16px"><h3>Add more</h3></div>
        <div class="card rows">
          <div v-for="l in more" :key="l.id" class="lr">
            <span class="sq dashed" />
            <span class="t"><b>{{ l.name }}</b><small>{{ l.desc }}</small></span>
            <Toggle :model-value="false" :label="l.name" @update:model-value="toggleLine(l.id)" />
          </div>
          <RouterLink to="/lines?dialog=add" class="lr own"><Plus :size="20" /><span class="t"><b>Add Your Own</b></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        </div>
        <p class="caption">Changing a line starts a new scan.</p>
      </div>
      <aside class="side">
        <RouterLink to="/breakdown" class="card sum"><span class="sq"><i class="dot" style="background: var(--violet); width: 10px; height: 10px" /></span><span class="t"><b>13% of VOO crosses these lines</b><small>Last scan · sample data</small></span><ChevronRight :size="18" color="var(--mute)" /></RouterLink>
        <div class="section-head" style="margin-top: 14px"><h3>Alerts</h3></div>
        <div class="card rows">
          <div class="lr"><span class="t"><b>Weekly Digest</b><small>News on companies in your fund, once a week.</small></span><Toggle v-model="digest" label="Weekly Digest" /></div>
          <div class="lr"><span class="t"><b>Source Updates</b><small>When there’s new info on a flagged company.</small></span><Toggle v-model="updates" label="Source Updates" /></div>
        </div>
        <RouterLink to="/check/printing" class="btn btn-primary btn-block" style="margin-top: 10px">Rescan VOO</RouterLink>
        <p class="caption center">Nothing is bought or sold. Rally only shows you what you own.</p>
      </aside>
    </div>
  </AppShell>
  <AddLineModal v-if="adding" @close="router.replace('/lines')" />
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col, .side { display: flex; flex-direction: column; gap: 12px; }
.rows { padding: 0 16px; }
.lr { display: flex; align-items: center; gap: 14px; min-height: 63px; border-bottom: 1px solid var(--line); }
.lr:last-child { border-bottom: 0; }
.sq { width: 32px; height: 32px; border-radius: 9px; background: #34313d; display: grid; place-items: center; flex: none; }
.sq.dashed { background: none; border: 1.5px dashed #4a4654; }
.t { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.t b { font-weight: 600; font-size: 16px; color: var(--white); }
.t small { font-size: 13px; color: var(--dim); }
.t small.hit { font-size: 11px; color: var(--mute); margin-top: 2px; }
.lr { padding: 10px 0; }
.own { color: var(--link); }
.own b { color: var(--link); }
.sum { display: flex; align-items: center; gap: 14px; padding: 14px 16px; }
.center { text-align: center; }
</style>
