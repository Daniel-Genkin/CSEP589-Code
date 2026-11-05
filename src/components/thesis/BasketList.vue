<script setup>
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { X } from '@lucide/vue'

defineProps({
  basket: { type: Array, required: true },
  editable: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  removing: { type: String, default: null },
  highlight: { type: Array, default: () => [] },
})
const emit = defineEmits(['remove'])
</script>

<template>
  <ul class="basket" :class="{ 'basket--compact': compact }">
    <li v-for="item in basket" :key="item.symbol" class="row" :class="{ 'is-highlight': highlight.includes(item.symbol) }">
      <SecurityLogo :symbol="item.symbol" :name="item.name" :color="item.color" :size="compact ? 32 : 40" />
      <div class="row__id">
        <p class="row__name">
          {{ item.name }}
          <span class="row__ticker">{{ item.symbol }}</span>
        </p>
        <p v-if="!compact" class="row__why">{{ item.why }}</p>
        <p v-else class="row__sector">{{ item.sector }}</p>
      </div>
      <span v-if="!compact && item.exposure !== undefined" class="row__exposure" :title="`About ${item.exposure}% of its business ties to this idea`">
        {{ item.exposure }}% exposed
      </span>
      <div class="row__weight">
        <span class="row__pct num">{{ item.weight.toFixed(1) }}%</span>
        <span class="row__bar" aria-hidden="true"><span :style="{ width: `${Math.min(100, item.weight * 3)}%`, background: item.color }" /></span>
      </div>
      <button
        v-if="editable"
        type="button"
        class="row__remove"
        :disabled="Boolean(removing) || basket.length <= 2"
        :aria-label="`Remove ${item.name}`"
        :title="basket.length <= 2 ? 'A basket needs at least 2 companies' : `Remove ${item.name}`"
        @click="emit('remove', item)"
      >
        <span v-if="removing === item.symbol" class="spinner" />
        <X v-else :size="16" />
      </button>
    </li>
  </ul>
</template>

<style scoped>
.basket {
  display: flex;
  flex-direction: column;
}
.row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border-top: 1px solid var(--line);
  transition: background-color 0.3s var(--ease);
}
.row:first-child {
  border-top: 0;
}
.row.is-highlight {
  margin: 0 -10px;
  padding-inline: 14px;
  border-radius: 14px;
  background: var(--sun-100);
  box-shadow: inset 0 0 0 2px var(--ink-solid);
}
.row__id {
  flex: 1;
  min-width: 0;
}
.row__name {
  font-weight: 700;
  line-height: 1.3;
}
.row__ticker {
  margin-left: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--subtle);
}
.row__why {
  margin-top: 3px;
  font-size: 13.5px;
  color: var(--muted);
  line-height: 1.45;
}
.row__sector {
  font-size: 12.5px;
  color: var(--muted);
}
.row__exposure {
  flex-shrink: 0;
  padding: 3px 9px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--brand-100);
  color: var(--ink);
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
}
.row__weight {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
  width: 64px;
  flex-shrink: 0;
}
.row__pct {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
}
.row__bar {
  width: 100%;
  height: 8px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  background: var(--bg-tint);
  overflow: hidden;
}
.row__bar span {
  display: block;
  height: 100%;
}
.row__remove {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border-radius: 50%;
  color: var(--subtle);
  transition:
    background-color 0.2s,
    color 0.2s;
}
.row__remove:hover:not(:disabled) {
  background: var(--coral-50);
  color: var(--coral-700);
}
.row__remove:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.basket--compact .row {
  gap: 12px;
  padding: 9px 0;
}
.basket--compact .row__name {
  font-size: 14.5px;
}
.basket--compact .row__pct {
  font-size: 17px;
}
.basket--compact .row__weight {
  width: 52px;
}

@media (max-width: 640px) {
  .row {
    flex-wrap: wrap;
  }
  .row__id {
    flex-basis: calc(100% - 140px);
  }
  .row__exposure {
    order: 5;
    margin-left: 54px;
  }
  .basket--compact .row {
    flex-wrap: nowrap;
  }
}
</style>
