<script setup>
import DeltaChip from '@/components/ui/DeltaChip.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { daysUntil, formatDateLong } from '@/utils/format'
import { CATEGORY_MAP } from '@/utils/scoring'
import { ArrowRight, CalendarClock, Info, Minus, TrendingDown, TrendingUp } from '@lucide/vue'
import { computed } from 'vue'

const props = defineProps({
  rebalance: { type: Object, required: true },
  scanId: { type: String, required: true },
})

const KIND_LABELS = { add: 'Joining', remove: 'Leaving', increase: 'Bigger slice', decrease: 'Smaller slice' }
const EFFECTS = {
  helps: { label: 'Helps score', icon: TrendingUp },
  hurts: { label: 'Hurts score', icon: TrendingDown },
  neutral: { label: 'No real effect', icon: Minus },
}

const delta = computed(() => props.rebalance.projectedScore - props.rebalance.currentScore)
const shifts = computed(() =>
  Object.entries(props.rebalance.categoryShifts)
    .filter(([, value]) => value !== 0)
    .map(([key, value]) => ({ key, value, label: CATEGORY_MAP[key].label })),
)
const rangeLabel = computed(() => {
  const [low, high] = props.rebalance.projectedRange
  return low === high ? `${low}` : `${low}–${high}`
})
</script>

<template>
  <section class="rebalance">
    <div class="card card-pad rebalance__hero">
      <div class="rebalance__when">
        <span class="eyebrow"><CalendarClock :size="15" /> Next rebalance</span>
        <p class="rebalance__date">{{ formatDateLong(rebalance.nextAt) }}</p>
        <p class="rebalance__meta">
          {{ rebalance.frequency }} · in {{ daysUntil(rebalance.nextAt) }} days
          <span class="badge" :class="rebalance.confidence === 'Announced' ? 'badge-brand' : 'badge-sky'">
            {{ rebalance.confidence }}
          </span>
        </p>
        <p class="rebalance__method">{{ rebalance.method }}</p>
      </div>
      <div class="rebalance__projection">
        <ScoreRing :score="rebalance.currentScore" :size="84" caption="Now" />
        <ArrowRight :size="22" class="rebalance__arrow" />
        <ScoreRing :score="rebalance.projectedScore" :size="84" caption="After" />
        <div class="rebalance__delta">
          <DeltaChip :value="delta" suffix=" pts" />
          <span class="text-sm muted">Likely range {{ rangeLabel }}</span>
        </div>
      </div>
    </div>

    <div class="callout">
      <Info :size="18" />
      <span>
        <strong>What's a rebalance?</strong> ETFs follow a rulebook. Every so often they add, drop or resize companies to
        stay within those rules. That can quietly change what you own, so we forecast it for you.
      </span>
    </div>

    <p class="rebalance__summary">{{ rebalance.summary }}</p>

    <div class="card">
      <p class="rebalance__list-title">Expected changes</p>
      <ul>
        <li v-for="change in rebalance.changes" :key="change.symbol" class="change">
          <RouterLink :to="`/app/scan/${scanId}/${change.symbol}`" class="change__company">
            <SecurityLogo :symbol="change.symbol" :name="change.name" :color="change.color" :size="40" />
            <span class="change__id">
              <span class="change__name-row">
                <span class="change__name">{{ change.name }}</span>
                <span class="change__kind" :class="`change__kind--${change.kind}`">{{ KIND_LABELS[change.kind] }}</span>
              </span>
              <span class="change__reason">{{ change.reason }}</span>
            </span>
          </RouterLink>
          <span class="change__weights num">
            {{ change.from }}% <ArrowRight :size="13" /> {{ change.to }}%
          </span>
          <ScoreChip :score="change.score" short show-score size="sm" class="hide-sm" />
          <span class="change__effect" :class="`change__effect--${change.effect}`">
            <component :is="EFFECTS[change.effect].icon" :size="14" />
            {{ EFFECTS[change.effect].label }}
          </span>
        </li>
      </ul>
    </div>

    <div v-if="shifts.length" class="rebalance__shifts">
      <span class="text-sm muted">Values most affected:</span>
      <span v-for="shift in shifts" :key="shift.key" class="chip">
        {{ shift.label }}
        <DeltaChip :value="shift.value" subtle />
      </span>
    </div>

    <p class="rebalance__note">
      Forecasts are estimates based on the fund's published rules and recent prices, and can change before the
      rebalance date.
    </p>
  </section>
</template>

<style scoped>
.rebalance {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.rebalance__hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  flex-wrap: wrap;
}
.rebalance__date {
  margin-top: 8px;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 30px;
  font-weight: 560;
  letter-spacing: -0.02em;
}
.rebalance__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  font-size: 14px;
  color: var(--muted);
}
.rebalance__method {
  max-width: 420px;
  margin-top: 10px;
  font-size: 14px;
  color: var(--ink-2);
}
.rebalance__projection {
  display: flex;
  align-items: center;
  gap: 14px;
}
.rebalance__arrow {
  color: var(--subtle);
}
.rebalance__delta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  margin-left: 6px;
}
.rebalance__summary {
  font-size: 16px;
  line-height: 1.6;
  color: var(--ink-2);
}
.rebalance__list-title {
  padding: 18px 20px 6px;
  font-weight: 700;
}
.change {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 118px 132px 112px;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  border-top: 1px solid var(--line);
}
.change > :not(:first-child) {
  justify-self: end;
}
.change:first-child {
  border-top: 0;
}
.change__company {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.change__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.change__name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.change__name {
  font-weight: 700;
}
.change__kind {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  font-size: 11.5px;
  font-weight: 700;
  background: var(--bg-tint);
  color: var(--ink-2);
}
.change__kind--add {
  background: var(--sky-100);
  color: var(--sky-700);
}
.change__kind--remove {
  background: var(--peach-100);
  color: var(--peach-700);
}
.change__reason {
  margin-top: 2px;
  font-size: 13.5px;
  color: var(--muted);
}
.change__weights {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 650;
  white-space: nowrap;
}
.change__effect {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 700;
  white-space: nowrap;
  color: var(--muted);
}
.change__effect--helps {
  color: var(--score-great);
}
.change__effect--hurts {
  color: var(--score-low);
}
.rebalance__shifts {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.rebalance__note {
  font-size: 12.5px;
  color: var(--subtle);
}

@media (max-width: 720px) {
  .change {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px 12px;
    padding: 14px 16px;
  }
  .change > :not(:first-child) {
    justify-self: start;
  }
  .change > :last-child {
    justify-self: end;
  }
  .change__company {
    grid-column: 1 / -1;
  }
  .rebalance__date {
    font-size: 26px;
  }
}
</style>
