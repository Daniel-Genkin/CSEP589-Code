<script setup>
import SampleBadge from '@/components/brand/SampleBadge.vue'
import LinePicker from '@/components/receipt/LinePicker.vue'
import { useToast } from '@/composables/useToast'
import { useLinesStore } from '@/stores/lines'
import { DEMO_FUNDS, checkBasket } from '@/utils/lines'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'

const store = useLinesStore()
const { lineKeys, baskets } = storeToRefs(store)
const toast = useToast()

const fundSymbol = ref('VOO')
const removed = ref([])
const name = ref('')

watch(fundSymbol, () => (removed.value = []))

const basket = computed(() => checkBasket(fundSymbol.value, removed.value, lineKeys.value))
const rows = computed(() => basket.value.before.rows)
const crossers = computed(() => basket.value.before.crossers.map((r) => r.symbol))

function toggle(symbol) {
  removed.value = removed.value.includes(symbol) ? removed.value.filter((s) => s !== symbol) : [...removed.value, symbol]
}
// The user asks for this explicitly; it applies their own lines, not our picks.
function dropCrossers() {
  removed.value = [...new Set([...removed.value, ...crossers.value])]
}

function save() {
  const label = name.value.trim() || `My ${fundSymbol.value}, my lines`
  store.saveBasket({ name: label, from: fundSymbol.value, removed: [...removed.value] })
  name.value = ''
  toast.success('Basket saved', { description: `${label} is on your dashboard.` })
}

const pct = (n) => `${n.toFixed(1)}%`
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div>
        <p class="eyebrow">Baskets</p>
        <h1 class="page-title">Build a basket</h1>
        <p class="page-sub">Start from a fund, draw your lines, and drop the companies you won't fund. You choose every company; we just show the receipts.</p>
      </div>
    </div>

    <section class="card card-pad block">
      <p class="label-mono step">01 · Start from a fund</p>
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
    </section>

    <section class="card card-pad block">
      <p class="label-mono step">02 · Your lines</p>
      <LinePicker v-model="lineKeys" tone="light" />
    </section>

    <section class="card card-pad block">
      <div class="row-between wrap">
        <p class="label-mono step">03 · Pick who stays</p>
        <button type="button" class="btn btn-dark btn-sm" :disabled="!crossers.length" @click="dropCrossers">
          Drop everyone who crosses my lines ({{ crossers.length }})
        </button>
      </div>

      <ul class="picks">
        <li v-for="r in rows" :key="r.symbol" class="pick" :class="{ 'is-out': removed.includes(r.symbol) }">
          <label class="pick__label">
            <input type="checkbox" :checked="!removed.includes(r.symbol)" @change="toggle(r.symbol)" />
            <span class="pick__tick">{{ r.symbol }}</span>
            <span class="pick__name">{{ r.name }}</span>
          </label>
          <span class="pick__chips">
            <span v-for="line in r.crossed" :key="line.key" class="pick__chip" :style="{ background: line.bg, color: line.fg }">{{ line.reason }}</span>
          </span>
          <span class="pick__pct num">{{ pct(r.weight) }}</span>
        </li>
      </ul>
      <p class="picks__rest muted text-sm">
        + {{ basket.fund.fund.others.count.toLocaleString('en-US') }} smaller companies ({{ pct(basket.fund.fund.others.weight) }}) stay in.
      </p>
    </section>

    <section class="summary sticker">
      <SampleBadge class="summary__badge" />
      <div class="summary__stats">
        <div>
          <p class="summary__num">{{ removed.length }}</p>
          <p class="summary__lbl">companies dropped</p>
        </div>
        <div>
          <p class="summary__num">{{ pct(basket.removedPct) }}</p>
          <p class="summary__lbl">of {{ fundSymbol }} removed</p>
        </div>
        <div>
          <p class="summary__num">
            {{ Math.round(basket.before.crossingPct) }}% <span class="summary__arrow">→</span> {{ Math.round(basket.after.crossingPct) }}%
          </p>
          <p class="summary__lbl">crosses your lines</p>
        </div>
      </div>
      <div class="summary__save">
        <input v-model="name" class="input" :placeholder="`My ${fundSymbol}, my lines`" aria-label="Basket name" />
        <button type="button" class="btn btn-primary" @click="save">Save basket</button>
      </div>
      <p class="summary__fine">Buying a basket would happen later through a partner brokerage. Information, not investment advice.</p>
    </section>

    <section v-if="baskets.length" class="card card-pad block">
      <p class="label-mono step">Saved baskets</p>
      <ul class="saved">
        <li v-for="b in baskets" :key="b.id" class="saved__row">
          <span class="saved__name">{{ b.name }}</span>
          <span class="muted text-sm">{{ b.from }} minus {{ b.removed.length }} {{ b.removed.length === 1 ? 'company' : 'companies' }}</span>
          <button type="button" class="btn btn-ghost btn-sm" @click="store.deleteBasket(b.id)">Remove</button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.step {
  color: var(--deep-violet);
}
.funds {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
.fund {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 18px;
  border: var(--outline);
  border-radius: 18px;
  text-align: left;
}
.fund.is-on {
  box-shadow: var(--shadow);
  transform: translate(-2px, -2px);
}
.fund__ticker {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 1;
}
.fund__nick {
  font-size: 14px;
  font-weight: 500;
}
.picks {
  border-top: 2px solid var(--ink-solid);
}
.pick {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 4px;
  border-bottom: 2px solid var(--line);
}
.pick.is-out .pick__name,
.pick.is-out .pick__pct {
  text-decoration: line-through;
  color: var(--subtle);
}
.pick__label {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  cursor: pointer;
}
.pick__tick {
  font-family: var(--font-display);
  font-size: 16px;
  padding: 3px 8px;
  border: 2px solid var(--ink-solid);
  border-radius: 7px;
}
.pick__name {
  font-weight: 700;
}
.pick__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.pick__chip {
  padding: 3px 10px;
  border: 2px solid var(--ink-solid);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}
.pick__pct {
  width: 64px;
  text-align: right;
  font-family: var(--font-display);
  font-size: 22px;
}
.summary {
  position: relative;
  margin-bottom: 24px;
  padding: 28px;
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 10px 10px 0 var(--sun);
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.summary__badge {
  position: absolute;
  top: -18px;
  right: 24px;
}
.summary__stats {
  display: flex;
  flex-wrap: wrap;
  gap: 40px;
}
.summary__num {
  font-family: var(--font-display);
  font-size: 56px;
  line-height: 1;
  color: var(--sun);
}
.summary__arrow {
  color: var(--cream);
}
.summary__lbl {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.summary__save {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  max-width: 560px;
}
.summary__save .input {
  flex: 1 1 260px;
  color: var(--ink);
}
.summary__fine {
  font-size: 13px;
  color: #c9c4cf;
}
.saved__row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 2px solid var(--line);
}
.saved__name {
  flex: 1;
  font-weight: 700;
}
</style>
