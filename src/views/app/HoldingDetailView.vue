<script setup>
import { monitoringService, scansService } from '@/api'
import CategoryBreakdown from '@/components/scan/CategoryBreakdown.vue'
import EtfBreakdown from '@/components/scan/EtfBreakdown.vue'
import NewsFeed from '@/components/scan/NewsFeed.vue'
import RebalanceOutlook from '@/components/scan/RebalanceOutlook.vue'
import ShareModal from '@/components/share/ShareModal.vue'
import DeltaChip from '@/components/ui/DeltaChip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import InfoTip from '@/components/ui/InfoTip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import { band } from '@/utils/scoring'
import { ArrowLeft, BellRing, Check, Flag, Layers, Share2, TriangleAlert } from '@lucide/vue'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const toast = useToast()

const { data, loading, error } = useAsync(() => scansService.getHolding(route.params.scanId, route.params.symbol))

const security = computed(() => data.value?.security)
const meta = computed(() => (security.value ? band(security.value.score) : null))
const values = computed(() => session.user?.values ?? [])
const shareOpen = ref(false)
const watched = ref(false)
const watchBusy = ref(false)
watch(data, (d) => (watched.value = Boolean(d?.watched)))

const tabs = computed(() => {
  const list = [
    { value: 'values', label: 'Values' },
    { value: 'news', label: 'News', count: security.value?.news.length ?? 0 },
  ]
  if (data.value?.fund) {
    list.push({ value: 'fund', label: 'Inside the fund', icon: Layers }, { value: 'rebalance', label: 'Rebalance outlook' })
  }
  return list
})

const tab = computed({
  get: () => (tabs.value.some((t) => t.value === route.query.tab) ? route.query.tab : 'values'),
  set: (value) => router.replace({ query: { ...route.query, tab: value === 'values' ? undefined : value } }),
})

async function toggleWatch() {
  if (!data.value.canWatch) {
    toast.info('Monitoring is part of Pro', {
      description: 'We watch your holdings and email you when something changes.',
      action: { label: 'See Pro', to: '/app/plan' },
    })
    return
  }
  watchBusy.value = true
  try {
    if (watched.value) {
      await monitoringService.unwatch(security.value.symbol)
      watched.value = false
      toast.info(`Stopped watching ${security.value.symbol}`)
    } else {
      await monitoringService.watch(security.value.symbol)
      watched.value = true
      toast.success(`Watching ${security.value.symbol}`, {
        description: "We'll email you if anything changes the picture.",
        action: { label: 'Manage', to: '/app/monitoring' },
      })
    }
  } catch (err) {
    toast.error("Couldn't update monitoring", { description: err.message })
  } finally {
    watchBusy.value = false
  }
}
</script>

<template>
  <div class="page">
    <RouterLink :to="`/app/scan/${route.params.scanId}`" class="back-link"><ArrowLeft :size="16" /> Back to results</RouterLink>

    <div v-if="loading" class="stack gap-4">
      <div class="skeleton" style="height: 300px" />
      <div class="skeleton" style="height: 44px; max-width: 420px" />
      <div class="skeleton" style="height: 420px" />
    </div>

    <div v-else-if="error" class="card">
      <EmptyState :icon="TriangleAlert" title="We couldn't load this analysis" :text="error.message">
        <RouterLink :to="`/app/scan/${route.params.scanId}`" class="btn btn-primary">Back to results</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="data">
      <div v-if="!data.inScan && data.parentEtfs.length" class="callout callout-lilac context">
        <Layers :size="18" />
        <span>
          You own this through
          <template v-for="(etf, i) in data.parentEtfs" :key="etf.symbol">
            <strong>{{ etf.name }}</strong> ({{ etf.weight }}% of the fund)<template v-if="i < data.parentEtfs.length - 1"> and </template>
          </template>.
        </span>
      </div>

      <header class="hero card">
        <div class="hero__top">
          <div class="hero__id">
            <SecurityLogo :symbol="security.symbol" :name="security.name" :color="security.color" :type="security.type" :size="64" />
            <div class="hero__text">
              <div class="hero__tags">
                <span class="badge">{{ security.sector }}</span>
                <span v-if="security.type === 'etf'" class="badge badge-etf"><Layers :size="11" /> ETF · {{ security.holdingsCount }} companies</span>
                <span v-for="flag in security.flags" :key="flag" class="badge badge-flag">
                  <Flag :size="11" /> {{ security.type === 'etf' ? `Includes ${flag.toLowerCase()}` : flag }}
                </span>
              </div>
              <h1 class="hero__name">{{ security.name }}</h1>
              <p class="hero__meta">
                {{ security.symbol }}<template v-if="data.weight !== null"> · {{ data.weight }}% of your portfolio</template>
              </p>
              <p class="hero__blurb">{{ security.blurb }}</p>
            </div>
          </div>
          <div class="hero__score">
            <ScoreRing :score="security.score" :size="124" caption="combined" />
            <p class="hero__band" :style="{ color: meta.color }">{{ meta.label }}</p>
            <DeltaChip :value="security.trend" suffix=" pts · 90 days" />
          </div>
        </div>

        <div class="hero__short">
          <p class="eyebrow">The short version</p>
          <p class="hero__summary">{{ security.summary }}</p>
        </div>

        <div class="hero__actions">
          <button type="button" class="btn btn-primary" @click="shareOpen = true"><Share2 :size="17" /> Share with a friend</button>
          <button type="button" class="btn btn-secondary" :disabled="watchBusy" @click="toggleWatch">
            <Check v-if="watched" :size="17" />
            <BellRing v-else :size="17" />
            {{ watched ? 'Watching for changes' : 'Watch for changes' }}
            <span v-if="!data.canWatch" class="badge badge-brand">Pro</span>
          </button>
        </div>
      </header>

      <div class="tabs-row">
        <SegmentedControl v-model="tab" :options="tabs" label="Analysis sections" />
      </div>

      <Transition name="fade" mode="out-in">
        <section v-if="tab === 'values'" key="values">
          <div class="section-head">
            <h2 class="section-title">How it scores on each value</h2>
            <InfoTip
              text="Scores run from 0 to 100 and come from public filings, watchdog reports and news coverage. The combined score blends all six."
              align="start"
            />
          </div>
          <CategoryBreakdown :categories="security.categories" :highlight="values" />
        </section>

        <section v-else-if="tab === 'news'" key="news" class="card card-pad">
          <div class="section-head section-head--stack">
            <h2 class="section-title">What's happening</h2>
            <p class="muted text-sm">
              Recent stories that might shape how you feel about {{ security.name }}, the good and the not-so-good.
              <template v-if="security.type === 'etf'"> Includes news about the fund's biggest companies.</template>
            </p>
          </div>
          <NewsFeed :items="security.news" />
        </section>

        <EtfBreakdown v-else-if="tab === 'fund'" key="fund" :security="security" :fund="data.fund" :scan-id="data.scan.id" />

        <RebalanceOutlook v-else-if="tab === 'rebalance'" key="rebalance" :rebalance="data.fund.rebalance" :scan-id="data.scan.id" />
      </Transition>

      <p class="disclaimer">
        outvest shares values research, not financial advice. Always consider your own goals before buying or selling.
      </p>

      <ShareModal :open="shareOpen" :scan-id="data.scan.id" :security="security" @close="shareOpen = false" />
    </template>
  </div>
</template>

<style scoped>
.context {
  margin-bottom: 16px;
}
.hero {
  padding: 28px;
  background:
    radial-gradient(600px 220px at 100% 0%, color-mix(in srgb, var(--brand-100) 60%, transparent), transparent 70%),
    var(--surface);
}
.hero__top {
  display: flex;
  justify-content: space-between;
  gap: 28px;
}
.hero__id {
  display: flex;
  gap: 20px;
  min-width: 0;
}
.hero__text {
  min-width: 0;
}
.hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.hero__name {
  margin-top: 10px;
  font-size: clamp(30px, 3.6vw, 42px);
}
.hero__meta {
  margin-top: 4px;
  font-weight: 650;
  color: var(--muted);
}
.hero__blurb {
  max-width: 520px;
  margin-top: 10px;
  color: var(--ink-2);
}
.hero__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.hero__band {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 22px;
  font-weight: 600;
}
.hero__short {
  margin-top: 24px;
  padding: 18px 20px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
}
.hero__summary {
  margin-top: 6px;
  font-size: 17px;
  line-height: 1.55;
}
.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.tabs-row {
  margin: 26px 0 18px;
}
.section-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}
.section-head--stack {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  margin-bottom: 20px;
}

@media (max-width: 820px) {
  .hero__top {
    flex-direction: column-reverse;
    gap: 20px;
  }
  .hero__score {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
  }
}
@media (max-width: 640px) {
  .hero {
    padding: 20px;
  }
  .hero__id {
    flex-direction: column;
    gap: 14px;
  }
  .hero__actions .btn {
    flex: 1 1 100%;
  }
}
</style>
