<script setup lang="ts">
// The exposure panel, laid out as a receipt (PRD F2). One row per selected category: dollars,
// share of the portfolio, number of flagged holdings and the top three contributors. Headed by
// a sentence naming the largest: "You have $375 in fossil fuels."
import ReceiptPaper from '@/components/rally/ReceiptPaper.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import type { PortfolioData } from '@/composables/usePortfolioData'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { pct, plural, usd } from '@/utils/format'
import { computed } from 'vue'

const props = defineProps<{ data: PortfolioData }>()
const demo = useDemoStore()

const EXPLAINER =
  'Exposure is the full position value of every holding tagged in that category. A holding tagged in several categories counts in each one; the total counts each holding once.'

const catalog = useCatalogStore()
const portfolio = computed(() => props.data.portfolio.value!)
const flagged = computed(() => props.data.flagged.value)
const largest = computed(() => props.data.largest.value)
const short = computed(() => (portfolio.value.origin === 'fund' ? portfolio.value.id : portfolio.value.origin === 'connected' ? 'your account' : 'your picks'))

const items = computed(() =>
  props.data.exposures.value.map((e) => ({
    name: catalog.label(e.category),
    note: e.count ? `${plural(e.count, 'holding')} · ${pct(e.share)} · ${e.top.map((c) => c.ticker).join(', ')}` : 'No holdings',
    value: usd(e.usd),
  })),
)
</script>

<template>
  <section class="exposure" aria-labelledby="exposure-headline">
    <p class="label-mono exposure__label">
      Your exposure · {{ plural(data.selectedIds.value.length, 'line') }}
      <InfoTip :text="EXPLAINER" label="How exposure is counted" align="end" />
    </p>
    <h2 id="exposure-headline" class="title-section exposure__headline">
      <template v-if="largest">You have {{ usd(largest.usd) }} in {{ catalog.label(largest.category).toLowerCase() }}.</template>
      <template v-else>Nothing you hold crosses your lines.</template>
    </h2>
    <ReceiptPaper
      class="exposure__receipt"
      compact
      flat
      :subtitle="`Exposure receipt · ${short}`"
      :meta="[{ label: 'Portfolio', value: usd(portfolio.totalUsd) }]"
      :items="items"
      :total="{ label: 'Crosses your lines', note: `${plural(flagged.count, 'holding')}, each counted once · ${pct(flagged.share)}`, value: usd(flagged.usd), tone: flagged.count ? 'flare' : 'ink' }"
      :after="[{ label: 'Passes your lines', value: usd(portfolio.totalUsd - flagged.usd) }]"
      :footer="demo.isLive ? 'Paper positions · Live quotes · Dated lines' : 'Live quotes · Dated holdings · Just receipts'"
    />
    <p class="small exposure__note">{{ EXPLAINER }}</p>
  </section>
</template>

<style scoped>
.exposure {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.exposure__label {
  display: flex;
  align-items: center;
  gap: 8px;
}
.exposure__receipt {
  align-self: center;
  margin: 10px 0 6px;
  transform: rotate(1.5deg);
}
.exposure__receipt :deep(.paper__figure) {
  font-size: 48px;
}
.exposure__note {
  padding-top: 6px;
}
</style>
