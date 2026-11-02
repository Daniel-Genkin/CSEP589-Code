<script setup>
// The ticker: a tilted Ink band for slogans, sparkles in between.
import BrandSparkle from './BrandSparkle.vue'

defineProps({
  items: { type: Array, default: () => ['No judgment', 'Just receipts', 'Your money', 'Your lines'] },
})
const colors = ['#F7C54E', '#F07AB6', '#E85A2A', '#8A6CF2']
</script>

<template>
  <div class="ticker" aria-hidden="true">
    <div class="ticker__track">
      <template v-for="n in 3" :key="n">
        <template v-for="(item, i) in items" :key="`${n}-${i}`">
          <span>{{ item }}</span>
          <BrandSparkle :size="26" :color="colors[i % colors.length]" />
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.ticker {
  background: var(--ink-solid);
  color: var(--cream);
  overflow: hidden;
  white-space: nowrap;
  padding: 18px 0;
  transform: rotate(-1.5deg);
  margin: 0 -40px;
  border-top: 4px solid var(--sun);
  border-bottom: 4px solid var(--bubblegum);
}
.ticker__track {
  display: inline-flex;
  gap: 32px;
  align-items: center;
  font-family: var(--font-display);
  font-size: 44px;
  line-height: 1;
  text-transform: uppercase;
  animation: ticker 40s linear infinite;
}
@keyframes ticker {
  to {
    transform: translateX(-33.333%);
  }
}
</style>
