<script setup>
import { scansService } from '@/api'
import HoldingCard from '@/components/scan/HoldingCard.vue'
import ShareModal from '@/components/share/ShareModal.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAsync } from '@/composables/useAsync'
import { useSessionStore } from '@/stores/session'
import { formatDateLong } from '@/utils/format'
import { BAND_ORDER, BANDS, CATEGORIES, CATEGORY_MAP } from '@/utils/scoring'
import { ArrowLeft, Heart, Info, RefreshCw, TriangleAlert } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const { data: scan, loading, error } = useAsync(() => scansService.get(route.params.scanId))

watch(scan, (s) => {
  if (s?.status === 'running') router.replace(`/app/scan/${s.id}/progress`)
})

const focus = ref('score')
const typeFilter = ref('all')
const shareOpen = ref(false)
const shareTarget = ref(null)
const values = computed(() => session.user?.values ?? [])
const summary = computed(() => scan.value?.summary)

const items = computed(() => {
  let list = scan.value?.results ?? []
  if (typeFilter.value !== 'all') list = list.filter((i) => i.type === typeFilter.value)
  if (focus.value !== 'score') list = [...list].sort((a, b) => b.categories[focus.value].score - a.categories[focus.value].score)
  return list
})

const typeOptions = computed(() => [
  { value: 'all', label: 'All', count: scan.value?.results.length },
  { value: 'stock', label: 'Stocks', count: summary.value?.stockCount },
  { value: 'etf', label: 'ETFs', count: summary.value?.etfCount },
])

function openShare(item) {
  shareTarget.value = item
  shareOpen.value = true
}
</script>

<template>
  <div class="page">
    <RouterLink to="/app" class="back-link"><ArrowLeft :size="16" /> Home</RouterLink>

    <div v-if="loading" class="stack gap-4">
      <div class="skeleton" style="height: 60px; max-width: 420px" />
      <div class="skeleton" style="height: 240px" />
      <div v-for="n in 4" :key="n" class="skeleton" style="height: 86px" />
    </div>

    <div v-else-if="error" class="card">
      <EmptyState :icon="TriangleAlert" title="We couldn't open this scan" :text="error.message">
        <RouterLink to="/app/scan/new" class="btn btn-primary">Start a new scan</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="summary">
      <header class="page-head">
        <div>
          <h1 class="page-title">Your scan results</h1>
          <p class="page-sub">
            {{ formatDateLong(scan.createdAt) }} ·
            {{ scan.source === 'linked' ? `Linked from ${scan.brokerageName}` : 'Your list' }} ·
            {{ scan.holdingsCount }} holdings · {{ scan.companiesCovered.toLocaleString() }} companies checked
          </p>
        </div>
        <RouterLink to="/app/scan/new" class="btn btn-secondary"><RefreshCw :size="16" /> New scan</RouterLink>
      </header>

      <section class="summary card">
        <div class="summary__main">
          <ScoreRing :score="summary.score" :size="136" caption="combined" />
          <div class="summary__text">
            <p class="summary__headline">{{ summary.headline }}</p>
            <p class="summary__detail">
              Strongest on <strong>{{ CATEGORY_MAP[summary.strongest].label }}</strong>, weakest on
              <strong>{{ CATEGORY_MAP[summary.weakest].label }}</strong>.
              <InfoTip
                :text="
                  summary.weighted
                    ? 'Your combined score is weighted by how much money you have in each holding, so bigger positions count more.'
                    : 'Each holding counts equally in your combined score since this list has no amounts.'
                "
              />
            </p>
            <div class="summary__counts">
              <template v-for="key in BAND_ORDER" :key="key">
                <span v-if="summary.counts[key]" class="summary__count" :style="{ color: BANDS[key].color, background: BANDS[key].bg }">
                  <span class="summary__dot" />{{ summary.counts[key] }} {{ BANDS[key].group }}
                </span>
              </template>
            </div>
          </div>
        </div>
        <ul class="summary__values">
          <li v-for="cat in CATEGORIES" :key="cat.key" :class="{ 'is-mine': values.includes(cat.key) }">
            <CategoryIcon :category="cat.key" :size="28" />
            <span class="summary__value-label">
              {{ cat.short }}
              <Heart v-if="values.includes(cat.key)" :size="11" fill="currentColor" class="summary__heart" />
            </span>
            <ScoreBar :score="summary.categories[cat.key]" :height="6" />
            <span class="summary__value-score num">{{ summary.categories[cat.key] }}</span>
          </li>
        </ul>
      </section>

      <div class="toolbar">
        <div class="toolbar__sort" role="group" aria-label="Sort results">
          <span class="toolbar__label">Sort by</span>
          <button type="button" class="chip" :class="{ 'is-active': focus === 'score' }" @click="focus = 'score'">Overall</button>
          <button
            v-for="cat in CATEGORIES"
            :key="cat.key"
            type="button"
            class="chip"
            :class="{ 'is-active': focus === cat.key }"
            @click="focus = cat.key"
          >
            <component :is="cat.icon" :size="14" />
            {{ cat.short }}
          </button>
        </div>
        <SegmentedControl v-if="summary.etfCount && summary.stockCount" v-model="typeFilter" :options="typeOptions" label="Filter by type" />
      </div>

      <p class="sort-note">
        <Info :size="15" />
        Most aligned on top<template v-if="focus !== 'score'">, ranked by {{ CATEGORY_MAP[focus].label }}</template>. Tap any
        holding to see the breakdown.
      </p>

      <TransitionGroup tag="div" name="reorder" class="results">
        <HoldingCard
          v-for="(item, index) in items"
          :key="item.symbol"
          :item="item"
          :rank="index + 1"
          :scan-id="scan.id"
          :values="values"
          :focus="focus"
          @share="openShare"
        />
      </TransitionGroup>

      <p class="disclaimer">
        Scores reflect how companies line up with the six values we track, based on public information. They're not a
        recommendation to buy or sell.
      </p>

      <ShareModal :open="shareOpen" :scan-id="scan.id" :security="shareTarget" @close="shareOpen = false" />
    </template>
  </div>
</template>

<style scoped>
.summary {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
  gap: 28px;
  padding: 26px;
  margin-bottom: 26px;
}
.summary__main {
  display: flex;
  align-items: center;
  gap: 26px;
}
.summary__headline {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 28px;
  font-weight: 560;
  line-height: 1.15;
  letter-spacing: -0.02em;
}
.summary__detail {
  margin-top: 8px;
  color: var(--ink-2);
}
.summary__counts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}
.summary__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
}
.summary__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: currentColor;
}
.summary__values {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding-left: 28px;
  border-left: 1px solid var(--line);
}
.summary__values li {
  display: grid;
  grid-template-columns: 28px 110px minmax(0, 1fr) 30px;
  align-items: center;
  gap: 12px;
}
.summary__value-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13.5px;
  font-weight: 650;
}
.summary__heart {
  color: var(--coral-500);
}
.summary__value-score {
  font-size: 14px;
  font-weight: 750;
  text-align: right;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}
.toolbar__sort {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.toolbar__label {
  margin-right: 4px;
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.sort-note {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 16px 0 14px;
  font-size: 13.5px;
  color: var(--muted);
}
.results {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.reorder-move {
  transition: transform 0.45s var(--ease);
}
.reorder-enter-active,
.reorder-leave-active {
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}
.reorder-enter-from,
.reorder-leave-to {
  opacity: 0;
  transform: scale(0.98);
}
.reorder-leave-active {
  position: absolute;
  width: 100%;
}

@media (max-width: 1100px) {
  .summary {
    grid-template-columns: minmax(0, 1fr);
  }
  .summary__values {
    padding-left: 0;
    padding-top: 22px;
    border-left: 0;
    border-top: 1px solid var(--line);
  }
}
@media (max-width: 640px) {
  .summary {
    padding: 20px;
  }
  .summary__main {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
  .summary__headline {
    font-size: 24px;
  }
  .summary__values li {
    grid-template-columns: 28px 92px minmax(0, 1fr) 28px;
  }
}
</style>
