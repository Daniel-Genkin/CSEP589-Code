<script setup>
import DeltaChip from '@/components/ui/DeltaChip.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { formatDate } from '@/utils/format'
import { ArrowRight, ChevronDown, Flag, Layers, Newspaper, Share2 } from '@lucide/vue'
import { ref } from 'vue'
import BandMixBar from './BandMixBar.vue'
import CategoryBreakdown from './CategoryBreakdown.vue'

const props = defineProps({
  item: { type: Object, required: true },
  rank: { type: Number, required: true },
  scanId: { type: String, required: true },
  values: { type: Array, default: () => [] },
  focus: { type: String, default: 'score' },
})
defineEmits(['share'])

const open = ref(false)
const rendered = ref(false)

function toggle() {
  rendered.value = true
  open.value = !open.value
}

const shownScore = () => (props.focus === 'score' ? props.item.score : props.item.categories[props.focus].score)
</script>

<template>
  <article class="holding" :class="{ 'is-open': open }">
    <button type="button" class="holding__row" :aria-expanded="open" @click="toggle">
      <span class="holding__rank num">{{ rank }}</span>
      <SecurityLogo :symbol="item.symbol" :name="item.name" :color="item.color" :type="item.type" :size="46" />
      <span class="holding__id">
        <span class="holding__line">
          <span class="holding__symbol">{{ item.symbol }}</span>
          <span v-if="item.type === 'etf'" class="badge badge-etf"><Layers :size="11" /> ETF</span>
          <span v-for="flag in item.flags" :key="flag" class="badge badge-flag hide-sm"><Flag :size="11" /> {{ flag }}</span>
        </span>
        <span class="holding__name">
          {{ item.name }}<span v-if="item.weight !== null" class="hide-sm"> · {{ item.weight }}% of portfolio</span>
        </span>
      </span>
      <span class="holding__trend hide-sm">
        <DeltaChip :value="item.trend" subtle />
        <span class="holding__trend-label">90 days</span>
      </span>
      <ScoreChip :score="shownScore()" class="holding__chip" />
      <ScoreRing :score="shownScore()" :size="54" />
      <ChevronDown :size="20" class="holding__chevron" />
    </button>

    <div class="holding__collapse">
      <div class="holding__inner">
        <div v-if="rendered" class="holding__details">
          <p class="holding__summary">{{ item.summary }}</p>

          <CategoryBreakdown :categories="item.categories" :highlight="values" compact />

          <div v-if="item.etf" class="holding__etf">
            <div class="holding__etf-head">
              <span class="holding__etf-title"><Layers :size="16" /> Inside: {{ item.etf.holdingsCount }} companies</span>
              <span class="holding__etf-meta">
                Next rebalance {{ formatDate(item.etf.nextRebalanceAt) }} · projected score {{ item.etf.projectedScore }}
              </span>
            </div>
            <BandMixBar :mix="item.etf.bandMix" />
            <div class="holding__top">
              <span class="text-sm muted">Biggest slices:</span>
              <RouterLink
                v-for="h in item.etf.topHoldings"
                :key="h.symbol"
                :to="`/app/scan/${scanId}/${h.symbol}`"
                class="chip holding__top-chip"
              >
                <SecurityLogo :symbol="h.symbol" :name="h.name" :color="h.color" :size="20" />
                {{ h.symbol }} <span class="muted">{{ h.weight }}%</span>
                <ScoreChip :score="h.score" short size="sm" />
              </RouterLink>
            </div>
          </div>

          <div class="holding__actions">
            <RouterLink :to="`/app/scan/${scanId}/${item.symbol}`" class="btn btn-primary btn-sm">
              Full analysis <ArrowRight :size="16" />
            </RouterLink>
            <RouterLink :to="{ path: `/app/scan/${scanId}/${item.symbol}`, query: { tab: 'news' } }" class="btn btn-secondary btn-sm">
              <Newspaper :size="16" /> News ({{ item.news.total }})
            </RouterLink>
            <button type="button" class="btn btn-ghost btn-sm" @click="$emit('share', item)">
              <Share2 :size="16" /> Share
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<style scoped>
.holding {
  border: 1px solid var(--line);
  border-radius: 22px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  transition:
    box-shadow 0.25s var(--ease),
    border-color 0.25s var(--ease);
}
.holding:hover,
.holding.is-open {
  border-color: var(--line-strong);
  box-shadow: var(--shadow);
}
.holding__row {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  text-align: left;
  border-radius: 22px;
}
.holding__rank {
  width: 22px;
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 700;
  color: var(--subtle);
  text-align: center;
}
.holding__id {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.holding__line {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.holding__symbol {
  font-size: 17px;
  font-weight: 760;
  letter-spacing: -0.01em;
}
.holding__name {
  margin-top: 2px;
  font-size: 14px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.holding__trend {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.holding__trend-label {
  font-size: 11.5px;
  color: var(--subtle);
}
.holding__chevron {
  flex-shrink: 0;
  color: var(--subtle);
  transition: transform 0.3s var(--ease);
}
.is-open .holding__chevron {
  transform: rotate(180deg);
}

.holding__collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 0.4s var(--ease);
}
.is-open .holding__collapse {
  grid-template-rows: 1fr;
}
.holding__inner {
  overflow: hidden;
}
.holding__details {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 20px 20px 82px;
}
.holding__summary {
  font-size: 15px;
  color: var(--ink-2);
}
.holding__etf {
  padding: 18px;
  border-radius: 18px;
  background: var(--lilac-50);
}
.holding__etf-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.holding__etf-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: var(--lilac-700);
}
.holding__etf-meta {
  font-size: 13px;
  color: var(--muted);
}
.holding__top {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}
.holding__top-chip {
  height: 34px;
  padding-left: 6px;
}
.holding__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 720px) {
  .holding__row {
    gap: 12px;
    padding: 14px;
  }
  .holding__rank,
  .holding__chip {
    display: none;
  }
  .holding__details {
    padding: 4px 14px 16px;
  }
}
</style>
