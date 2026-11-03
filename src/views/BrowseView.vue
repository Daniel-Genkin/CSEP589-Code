<script setup>
import SampleBadge from '@/components/brand/SampleBadge.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { allSecurities } from '@/api/mock/catalog'
import { computed, ref } from 'vue'

const query = ref('')
const kind = ref('all')
const sort = ref('low')

const kinds = [
  { key: 'all', label: 'Everything' },
  { key: 'etf', label: 'Funds' },
  { key: 'stock', label: 'Companies' },
]
const sorts = [
  { key: 'low', label: 'Most concerning first' },
  { key: 'high', label: 'Best aligned first' },
  { key: 'name', label: 'A to Z' },
]

const rows = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = allSecurities().filter(
    (s) => (kind.value === 'all' || s.type === kind.value) && (!q || s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)),
  )
  if (sort.value === 'low') list.sort((a, b) => a.score - b.score)
  else if (sort.value === 'high') list.sort((a, b) => b.score - a.score)
  else list.sort((a, b) => a.name.localeCompare(b.name))
  return list
})
</script>

<template>
  <div class="browse ground-blue">
    <section class="container browse__head">
      <p class="label-mono browse__eyebrow">Browse · no account needed</p>
      <h1 class="h-1 shout-shadow">Look up any company</h1>
      <p class="browse__lead">Every fund and company we track, with its scores and the reasons behind them.</p>
    </section>

    <section class="container">
      <div class="panel sticker">
        <SampleBadge class="panel__badge" />
        <div class="controls">
          <input v-model="query" class="input controls__search" type="search" placeholder="Search a name or ticker, like VOO or Loopline" />
          <div class="controls__group">
            <button v-for="k in kinds" :key="k.key" type="button" class="chip" :class="{ 'is-active': kind === k.key }" @click="kind = k.key">{{ k.label }}</button>
          </div>
          <select v-model="sort" class="input controls__sort" aria-label="Sort">
            <option v-for="s in sorts" :key="s.key" :value="s.key">{{ s.label }}</option>
          </select>
        </div>

        <ul class="list">
          <li v-for="s in rows" :key="s.symbol">
            <RouterLink :to="`/company/${s.symbol}`" class="row">
              <SecurityLogo :symbol="s.symbol" :name="s.name" :type="s.type" :size="42" />
              <span class="row__who">
                <span class="row__name">{{ s.name }}</span>
                <span class="row__meta mono">{{ s.symbol }} · {{ s.type === 'etf' ? `Fund · ${s.holdingsCount.toLocaleString('en-US')} companies` : s.sector }}</span>
              </span>
              <span class="row__flags">
                <span v-for="f in s.flags" :key="f" class="badge badge-flag">{{ f }}</span>
              </span>
              <ScoreChip :score="s.score" show-score />
              <span class="row__go" aria-hidden="true">→</span>
            </RouterLink>
          </li>
          <li v-if="!rows.length" class="empty">Nothing matches "{{ query }}" in the sample data.</li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.browse {
  padding-bottom: 80px;
}
.browse__head {
  padding-top: 40px;
  padding-bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.browse__eyebrow {
  color: var(--sun);
}
.browse__head h1 {
  font-size: clamp(52px, 7vw, 112px);
}
.browse__lead {
  font-size: 20px;
  font-weight: 500;
}
.panel {
  position: relative;
  background: var(--cream);
  color: var(--ink);
  padding: 24px 28px;
}
.panel__badge {
  position: absolute;
  top: -18px;
  right: 28px;
}
.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}
.controls__search {
  flex: 1 1 320px;
}
.controls__group {
  display: flex;
  gap: 8px;
}
.controls__sort {
  width: auto;
  min-width: 220px;
}
.list {
  display: flex;
  flex-direction: column;
  border-top: 3px solid var(--ink-solid);
}
.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 6px;
  border-bottom: 2px solid var(--line);
}
.row:hover {
  background: var(--sun-100);
}
.row__who {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.row__name {
  font-weight: 700;
  font-size: 17px;
}
.row__meta {
  font-size: 12.5px;
  color: var(--muted);
}
.row__flags {
  display: flex;
  gap: 6px;
}
.row__go {
  font-weight: 700;
  font-size: 18px;
}
.empty {
  padding: 24px 6px;
  color: var(--muted);
}
</style>
