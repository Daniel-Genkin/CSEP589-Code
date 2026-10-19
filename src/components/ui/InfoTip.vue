<script setup>
import { CircleHelp } from '@lucide/vue';
import { useId } from 'vue';

defineProps({
  text: { type: String, required: true },
  label: { type: String, default: 'What does this mean?' },
  align: { type: String, default: 'center' },
})

const id = useId()
</script>

<template>
  <span class="tip" :class="`tip--${align}`">
    <button type="button" class="tip__btn" :aria-label="label" :aria-describedby="id">
      <CircleHelp :size="15" />
    </button>
    <span :id="id" role="tooltip" class="tip__bubble">{{ text }}</span>
  </span>
</template>

<style scoped>
.tip {
  position: relative;
  display: inline-flex;
  vertical-align: middle;
}
.tip__btn {
  display: inline-grid;
  place-items: center;
  color: var(--subtle);
  border-radius: 50%;
  transition: color 0.2s;
}
.tip__btn:hover,
.tip__btn:focus-visible {
  color: var(--brand-600);
}
.tip__bubble {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  z-index: 40;
  width: max-content;
  max-width: 260px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.45;
  letter-spacing: 0;
  text-transform: none;
  text-align: left;
  white-space: normal;
  box-shadow: var(--shadow);
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 4px);
  transition:
    opacity 0.18s var(--ease),
    transform 0.18s var(--ease);
}
.tip--start .tip__bubble {
  left: -8px;
  transform: translate(0, 4px);
}
.tip--end .tip__bubble {
  left: auto;
  right: -8px;
  transform: translate(0, 4px);
}
.tip:hover .tip__bubble,
.tip__btn:focus-visible + .tip__bubble {
  opacity: 1;
  transform: translate(-50%, 0);
}
.tip--start:hover .tip__bubble,
.tip--start .tip__btn:focus-visible + .tip__bubble,
.tip--end:hover .tip__bubble,
.tip--end .tip__btn:focus-visible + .tip__bubble {
  transform: translate(0, 0);
}
</style>
