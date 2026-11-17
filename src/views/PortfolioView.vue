<script setup lang="ts">
// /portfolio is one route with these states, each a Figma frame:
//   no portfolio        -> first visit
//   portfolio, no account -> the one-line result and the free-account prompt
//   loading             -> scanning
//   provider failed     -> data unavailable
//   nothing flagged     -> zero conflicts
//   otherwise           -> the breakdown
import ConflictTeaser from '@/components/rally/ConflictTeaser.vue'
import { countConflicts } from '@/composables/useHoldingsCheck'
import { usePortfolioData } from '@/composables/usePortfolioData'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PortfolioFirstVisit from './portfolio/PortfolioFirstVisit.vue'
import PortfolioResult from './portfolio/PortfolioResult.vue'
import PortfolioScanning from './portfolio/PortfolioScanning.vue'
import PortfolioUnavailable from './portfolio/PortfolioUnavailable.vue'
import PortfolioZero from './portfolio/PortfolioZero.vue'

/** Long enough for the scanning screen to read as a step, not a flicker. */
const MIN_SCAN_MS = 700
const PINNABLE = ['scanning', 'unavailable'] as const

const route = useRoute()
const demo = useDemoStore()
const catalog = useCatalogStore()
const data = usePortfolioData()

// Hold the scanning screen for a moment each time a different portfolio starts loading.
const holding = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
watch(
  () => data.status.value,
  (status) => {
    if (status !== 'loading') return
    holding.value = true
    clearTimeout(timer)
    timer = setTimeout(() => (holding.value = false), MIN_SCAN_MS)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearTimeout(timer))

// ?state=scanning|unavailable pins a state that is otherwise brief or rare, for design review.
const pinned = computed(() => PINNABLE.find((s) => s === route.query.state) ?? null)

const state = computed(() => {
  if (!demo.portfolio) return 'first-visit'
  if (pinned.value) return pinned.value
  if (data.status.value === 'error') return 'unavailable'
  if (data.status.value !== 'ready' || holding.value) return 'scanning'
  if (!demo.account) return 'gate'
  return data.flagged.value.count ? 'result' : 'zero'
})

// The same count Home shows, from the same function.
const summary = computed(() => countConflicts({ portfolio: demo.portfolio!, rows: data.rows.value, tags: data.tags.value }, catalog.selectedIds))
</script>

<template>
  <Transition name="fade" mode="out-in">
    <PortfolioFirstVisit v-if="state === 'first-visit'" key="first-visit" />
    <PortfolioScanning v-else-if="state === 'scanning'" key="scanning" :portfolio="demo.portfolio!" />
    <PortfolioUnavailable v-else-if="state === 'unavailable'" key="unavailable" :portfolio="demo.portfolio!" @retry="data.reload()" />
    <div v-else-if="state === 'gate'" key="gate" class="page">
      <header class="page-head">
        <p class="eyebrow">Your Rally · Portfolio · sample data</p>
        <h1 class="page-title">One line is free.<br />The rest is one email away.</h1>
      </header>
      <ConflictTeaser :summary="summary" :name="shortName(demo.portfolio!)" :categories="catalog.selectedIds.length" />
    </div>
    <PortfolioZero v-else-if="state === 'zero'" key="zero" :data="data" />
    <PortfolioResult v-else key="result" :data="data" />
  </Transition>
</template>
