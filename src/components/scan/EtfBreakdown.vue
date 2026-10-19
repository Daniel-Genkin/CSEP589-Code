<script setup>
import InfoTip from '@/components/ui/InfoTip.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { ChevronRight, Layers, Lightbulb } from '@lucide/vue'
import { computed } from 'vue'
import BandMixBar from './BandMixBar.vue'

const props = defineProps({
  security: { type: Object, required: true },
  fund: { type: Object, required: true },
  scanId: { type: String, required: true },
})

const maxWeight = computed(() => Math.max(...props.fund.constituents.map((c) => c.weight), props.fund.others.weight / 6))
const topShare = computed(() => Math.round(props.fund.constituents.reduce((sum, c) => sum + c.weight, 0)))
</script>

<template>
  <section class="etf">
    <div class="etf__facts">
      <div class="fact">
        <span class="fact__label">Companies inside</span>
        <span class="fact__value num">{{ security.holdingsCount }}</span>
      </div>
      <div class="fact">
        <span class="fact__label">Top {{ fund.constituents.length }} make up</span>
        <span class="fact__value num">{{ topShare }}%</span>
      </div>
      <div class="fact">
        <span class="fact__label">
          Yearly fee
          <InfoTip text="The expense ratio: the share of your investment the fund keeps each year to run itself. 0.03% means $0.30 per $1,000." />
        </span>
        <span class="fact__value num">{{ security.expenseRatio }}%</span>
      </div>
      <div class="fact">
        <span class="fact__label">Managed by</span>
        <span class="fact__value fact__value--text">{{ security.issuer }}</span>
      </div>
    </div>

    <div class="callout callout-lilac">
      <Lightbulb :size="18" />
      <span>{{ security.insight }}</span>
    </div>

    <div class="card card-pad">
      <div class="card-head">
        <div>
          <p class="card-title">Where your money actually goes</p>
          <p class="card-sub">Share of the fund, grouped by how well each company lines up with your values.</p>
        </div>
      </div>
      <BandMixBar :mix="fund.bandMix" :height="14" />
    </div>

    <div class="card holdings">
      <div class="holdings__head">
        <span>Biggest holdings</span>
        <span class="hide-sm">Share of fund</span>
        <span>Score</span>
      </div>
      <RouterLink
        v-for="c in fund.constituents"
        :key="c.symbol"
        :to="`/app/scan/${scanId}/${c.symbol}`"
        class="holdings__row"
      >
        <span class="holdings__company">
          <SecurityLogo :symbol="c.symbol" :name="c.name" :color="c.color" :size="38" />
          <span class="holdings__id">
            <span class="holdings__name">{{ c.name }}</span>
            <span class="holdings__meta">{{ c.symbol }} · {{ c.sector }}<span class="show-sm"> · {{ c.weight }}%</span></span>
          </span>
        </span>
        <span class="holdings__weight hide-sm">
          <span class="holdings__track"><span :style="{ width: `${(c.weight / maxWeight) * 100}%` }" /></span>
          <span class="num">{{ c.weight }}%</span>
        </span>
        <span class="holdings__score">
          <ScoreChip :score="c.score" short show-score size="sm" />
          <ChevronRight :size="16" class="holdings__chevron" />
        </span>
      </RouterLink>
      <div class="holdings__row holdings__row--others">
        <span class="holdings__company">
          <span class="holdings__others-icon"><Layers :size="18" /></span>
          <span class="holdings__id">
            <span class="holdings__name">{{ fund.others.count }} other companies</span>
            <span class="holdings__meta">Each one researched, shown here as an average<span class="show-sm"> · {{ fund.others.weight }}%</span></span>
          </span>
        </span>
        <span class="holdings__weight hide-sm">
          <span class="holdings__track holdings__track--others"><span style="width: 100%" /></span>
          <span class="num">{{ fund.others.weight }}%</span>
        </span>
        <span class="holdings__score">
          <ScoreChip :score="fund.others.score" short show-score size="sm" />
          <span class="holdings__chevron-space" />
        </span>
      </div>
    </div>

    <p class="etf__strategy"><strong>How this fund picks companies:</strong> {{ security.strategy }}</p>
  </section>
</template>

<style scoped>
.etf {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.etf__facts {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}
.fact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
}
.fact__label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--muted);
}
.fact__value {
  font-size: 24px;
  font-weight: 760;
  letter-spacing: -0.02em;
}
.fact__value--text {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.3;
}
.holdings {
  overflow: hidden;
}
.holdings__head,
.holdings__row {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(120px, 1fr) 160px;
  align-items: center;
  gap: 18px;
  padding: 0 20px;
}
.holdings__head {
  padding-top: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--line);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--subtle);
}
.holdings__head span:last-child {
  text-align: right;
  padding-right: 24px;
}
.holdings__row {
  padding-top: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--line);
  transition: background-color 0.2s;
}
a.holdings__row:hover {
  background: var(--surface-muted);
}
.holdings__row--others {
  border-bottom: 0;
  background: var(--surface-muted);
}
.holdings__company {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.holdings__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.holdings__name {
  font-weight: 700;
  font-size: 14.5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.holdings__meta {
  font-size: 12.5px;
  color: var(--muted);
}
.holdings__weight {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13.5px;
  font-weight: 650;
}
.holdings__track {
  flex: 1;
  height: 6px;
  border-radius: var(--radius-pill);
  background: #efebe2;
  overflow: hidden;
}
.holdings__track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--lilac-500);
}
.holdings__track--others span {
  background: repeating-linear-gradient(-45deg, #c9c1f5 0 4px, #ddd7fa 4px 8px);
}
.holdings__score {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}
.holdings__chevron {
  color: var(--subtle);
}
.holdings__chevron-space {
  width: 16px;
}
.holdings__others-icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  flex-shrink: 0;
  border-radius: 30%;
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.etf__strategy {
  font-size: 14px;
  color: var(--muted);
}
.etf__strategy strong {
  color: var(--ink-2);
}

@media (max-width: 820px) {
  .etf__facts {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .holdings__head,
  .holdings__row {
    grid-template-columns: minmax(0, 1fr) auto;
    padding: 12px 14px;
  }
  .holdings__head span:last-child {
    padding-right: 0;
  }
}
</style>
