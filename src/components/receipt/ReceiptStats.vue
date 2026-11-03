<script setup>
import SampleBadge from '@/components/brand/SampleBadge.vue'
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  label: { type: String, required: true }, // e.g. "your VOO" or "your portfolio"
  hasLines: { type: Boolean, default: true },
  eyebrow: { type: String, default: 'Step 03 · The awkward part' },
})
const pct = computed(() => Math.round(props.result.crossingPct))
const money = computed(() => `$${props.result.perTenK.toLocaleString('en-US')}`)
</script>

<template>
  <div class="stats">
    <div class="stat stat--big sticker tilt-l">
      <SampleBadge class="stat__badge" />
      <p class="label-mono stat__eyebrow">{{ eyebrow }}</p>
      <p class="stat__number">{{ pct }}%</p>
      <p class="stat__caption">
        <template v-if="!hasLines">Pick a line to see who crosses it.</template>
        <template v-else-if="pct === 0">Of {{ label }} crosses your lines.</template>
        <template v-else>Of {{ label }} just got awkward.</template>
      </p>
    </div>
    <div class="stats__side">
      <div class="stat stat--pink sticker tilt-r">
        <p class="stat__mid">{{ result.bigNames.crossing }}<span> / {{ result.bigNames.total }}</span></p>
        <p class="stat__small">Of the big names cross your lines.</p>
      </div>
      <div class="stat stat--flare sticker">
        <p class="stat__mid">{{ money }}</p>
        <p class="stat__small">Of every $10K. Your money, their agenda.</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
}
.stat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 28px 30px;
  color: var(--ink);
}
.stat--big {
  flex: 1.35 1 380px;
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 10px 10px 0 var(--sun);
}
.stat__badge {
  position: absolute;
  top: -20px;
  right: 24px;
}
.stat__eyebrow {
  color: var(--sun);
}
.stat__number {
  font-family: var(--font-display);
  font-size: clamp(110px, 13vw, 190px);
  line-height: 0.85;
  color: var(--sun);
}
.stat__caption {
  font-family: var(--font-display);
  font-size: 34px;
  line-height: 1.05;
  text-transform: uppercase;
}
.stats__side {
  flex: 1 1 300px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.stat--pink {
  flex: 1;
  background: var(--bubblegum);
}
.stat--flare {
  flex: 1;
  background: var(--flare);
  transform: rotate(-0.6deg);
}
.stat__mid {
  font-family: var(--font-display);
  font-size: 88px;
  line-height: 0.9;
}
.stat__mid span {
  font-size: 44px;
}
.stat__small {
  font-family: var(--font-display);
  font-size: 26px;
  line-height: 1.05;
  text-transform: uppercase;
}
</style>
