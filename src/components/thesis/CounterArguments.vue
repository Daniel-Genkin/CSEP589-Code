<script setup>
import { ShieldAlert } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  limit: { type: Number, default: 0 },
})
const shown = computed(() => (props.limit ? props.items.slice(0, props.limit) : props.items))
</script>

<template>
  <ul class="counters">
    <li v-for="item in shown" :key="item.title" class="counter">
      <span class="counter__icon"><ShieldAlert :size="17" /></span>
      <div>
        <p class="counter__title">{{ item.title }}</p>
        <p class="counter__text">{{ item.text }}</p>
      </div>
    </li>
  </ul>
</template>

<style scoped>
.counters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.counter {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  border: var(--outline-thin);
  border-radius: 16px;
  background: var(--coral-50);
  color: var(--ink);
}
.counter__icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 10px;
  background: var(--flare);
  color: var(--ink);
}
.counter__title {
  font-weight: 750;
  color: var(--coral-700);
}
.counter__text {
  margin-top: 2px;
  font-size: 14px;
  color: var(--ink-2);
}
</style>
