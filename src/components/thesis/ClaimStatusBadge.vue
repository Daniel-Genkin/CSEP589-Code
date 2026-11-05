<script setup>
import { CLAIM_STATUS } from '@/utils/thesis'
import { computed } from 'vue'

const props = defineProps({
  status: { type: String, required: true },
})
const meta = computed(() => CLAIM_STATUS[props.status] ?? CLAIM_STATUS.mixed)
</script>

<template>
  <span class="claim-badge" :class="`claim-badge--${meta.tone}`">
    <component :is="meta.icon" :size="13" :stroke-width="2.4" />
    {{ meta.label }}
  </span>
</template>

<style scoped>
.claim-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 24px;
  padding: 0 9px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}
.claim-badge--great {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.claim-badge--mixed {
  background: var(--score-mixed-bg);
  color: var(--score-mixed);
}
.claim-badge--low {
  background: var(--score-low-bg);
  color: var(--score-low);
}
</style>
