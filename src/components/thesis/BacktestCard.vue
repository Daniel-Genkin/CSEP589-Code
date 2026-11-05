<script setup>
import InfoTip from '@/components/ui/InfoTip.vue'
import { formatPts, formatReturn } from '@/utils/thesis'
import { computed } from 'vue'
import PerformanceChart from './PerformanceChart.vue'

const props = defineProps({
  backtest: { type: Object, required: true },
  title: { type: String, default: 'A similar basket vs the S&P 500' },
  subtitle: { type: String, default: 'Past 5 years · hypothetical' },
  compact: { type: Boolean, default: false },
  variant: { type: String, default: 'backtest' },
})

const isRecord = computed(() => props.variant === 'record')
const stats = computed(() => {
  const b = props.backtest
  const list = [
    { label: isRecord.value ? 'Basket' : 'Basket return', value: formatReturn(b.basketReturn), tone: b.basketReturn >= 0 ? 'up' : 'down' },
    { label: 'S&P 500', value: formatReturn(b.benchmarkReturn) },
    { label: 'Difference', value: formatPts(b.excess), tone: b.excess >= 0 ? 'up' : 'down' },
  ]
  if (!props.compact) list.push({ label: 'Worst drop', value: formatReturn(b.maxDrawdown) })
  return list
})
const note = computed(() =>
  isRecord.value
    ? 'Measured on the basket as it was published, against the S&P 500. Illustrative demo data.'
    : 'Hypothetical backtest on illustrative demo data, using today’s picks with hindsight. Past performance doesn’t predict future results.',
)
</script>

<template>
  <section class="backtest" :class="{ 'backtest--compact': compact }">
    <header class="backtest__head">
      <div>
        <p class="backtest__title">{{ title }}</p>
        <p class="backtest__sub">{{ subtitle }}</p>
      </div>
      <InfoTip :text="note" align="end" label="About these numbers" />
    </header>
    <dl class="backtest__stats">
      <div v-for="stat in stats" :key="stat.label" class="stat">
        <dt>{{ stat.label }}</dt>
        <dd class="num" :class="stat.tone && `is-${stat.tone}`">{{ stat.value }}</dd>
      </div>
    </dl>
    <PerformanceChart
      :points="backtest.points"
      :start-date="backtest.startDate"
      :end-date="backtest.endDate"
      :basket-return="backtest.basketReturn"
      :benchmark-return="backtest.benchmarkReturn"
      :height="compact ? 150 : 220"
      :compact="compact"
    />
    <p v-if="!compact" class="backtest__note">{{ note }}</p>
  </section>
</template>

<style scoped>
.backtest__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.backtest__title {
  font-weight: 750;
  font-size: 16px;
}
.backtest__sub {
  margin-top: 2px;
  font-size: 13.5px;
  color: var(--muted);
}
.backtest__stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 16px 0 18px;
}
.stat {
  padding: 10px 12px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--surface-muted);
}
.stat dt {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.stat dd {
  margin-top: 4px;
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 400;
  line-height: 1;
}
.stat dd.is-up {
  color: var(--score-great);
}
.stat dd.is-down {
  color: var(--score-low);
}
.backtest__note {
  margin-top: 12px;
  font-size: 12.5px;
  color: var(--subtle);
}
.backtest--compact .backtest__stats {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 12px 0 14px;
}
.backtest--compact .stat dd {
  font-size: 22px;
}
@media (max-width: 640px) {
  .backtest__stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .backtest--compact .backtest__stats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .backtest--compact .stat {
    padding: 8px 10px;
  }
  .backtest--compact .stat dd {
    font-size: 19px;
  }
}
</style>
