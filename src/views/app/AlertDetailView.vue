<script setup>
import { alertsService, monitoringService, scansService } from '@/api'
import ShareModal from '@/components/share/ShareModal.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import DeltaChip from '@/components/ui/DeltaChip.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ScoreBar from '@/components/ui/ScoreBar.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useAlertsStore } from '@/stores/alerts'
import { formatDateLong, timeAgo } from '@/utils/format'
import { BANDS, CATEGORY_MAP } from '@/utils/scoring'
import {
    ArrowLeft,
    ArrowRight,
    ArrowUpRight,
    BellOff,
    CalendarClock,
    Heart,
    Layers,
    Mail,
    Share2,
    ThumbsUp,
    TriangleAlert,
    Wind,
} from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const toast = useToast()
const alertsStore = useAlertsStore()
const { data: alert, loading, error } = useAsync(() => alertsService.get(route.params.alertId))

const KINDS = {
  negative: { label: 'Heads up', icon: TriangleAlert },
  positive: { label: 'Good news', icon: ThumbsUp },
  forecast: { label: 'Forecast', icon: CalendarClock },
}

const isForecast = computed(() => alert.value?.kind === 'forecast')
const delta = computed(() => (alert.value ? alert.value.scoreAfter - alert.value.scoreBefore : 0))
const bandChanged = computed(() => alert.value && alert.value.bandBefore !== alert.value.bandAfter)

onMounted(() => alertsStore.markRead(route.params.alertId).catch(() => {}))

const shareOpen = ref(false)
const shareSecurity = ref(null)
async function openShare() {
  if (!alert.value.analysisLink) return
  if (!shareSecurity.value) {
    const holding = await scansService.getHolding(alert.value.analysisLink.scanId, alert.value.symbol)
    shareSecurity.value = holding.security
  }
  shareOpen.value = true
}

const muted = ref(false)
async function stopWatching() {
  try {
    await monitoringService.unwatch(alert.value.symbol)
    muted.value = true
    toast.info(`Stopped watching ${alert.value.symbol}`, {
      description: 'You can start again anytime from Monitoring.',
      action: { label: 'Undo', onClick: undoStopWatching },
    })
  } catch (err) {
    toast.error("Couldn't update monitoring", { description: err.message })
  }
}

async function undoStopWatching() {
  await monitoringService.watch(alert.value.symbol)
  muted.value = false
}
</script>

<template>
  <div class="page">
    <RouterLink to="/app/alerts" class="back-link"><ArrowLeft :size="16" /> All alerts</RouterLink>

    <div v-if="loading" class="stack gap-4">
      <div class="skeleton" style="height: 180px" />
      <div class="skeleton" style="height: 360px" />
    </div>

    <div v-else-if="error" class="card">
      <EmptyState :icon="TriangleAlert" title="We couldn't find that alert" :text="error.message">
        <RouterLink to="/app/alerts" class="btn btn-primary">Back to alerts</RouterLink>
      </EmptyState>
    </div>

    <article v-else-if="alert">
      <header class="hero card" :class="`hero--${alert.kind}`">
        <div class="hero__meta">
          <span class="kind" :class="`kind--${alert.kind}`">
            <component :is="KINDS[alert.kind].icon" :size="15" /> {{ KINDS[alert.kind].label }}
          </span>
          <span>{{ timeAgo(alert.createdAt) }}</span>
          <span class="hero__emailed"><Mail :size="14" /> Emailed to {{ alert.emailedTo }}</span>
        </div>
        <h1 class="hero__title">{{ alert.title }}</h1>
        <p class="hero__summary">{{ alert.summary }}</p>
        <RouterLink
          v-if="alert.analysisLink"
          :to="`/app/scan/${alert.analysisLink.scanId}/${alert.symbol}`"
          class="hero__security"
        >
          <SecurityLogo :symbol="alert.symbol" :name="alert.security.name" :color="alert.security.color" :type="alert.security.type" :size="34" />
          <span>
            <strong>{{ alert.security.name }}</strong>
            <span class="muted"> · {{ alert.symbol }}</span>
          </span>
          <ScoreChip :score="alert.security.score" short show-score size="sm" />
        </RouterLink>
      </header>

      <div class="grid">
        <div class="main">
          <section class="card card-pad">
            <h2 class="section-title">What happened</h2>
            <p class="body-text">{{ alert.whatHappened }}</p>
            <p v-if="isForecast" class="forecast-note">
              <CalendarClock :size="16" /> Expected at the rebalance on {{ formatDateLong(alert.forecastFor) }}. Nothing has changed yet.
            </p>
          </section>

          <section class="card card-pad impact">
            <h2 class="section-title">{{ isForecast ? 'How the score could change' : 'How this changes the score' }}</h2>
            <div class="impact__rings">
              <div class="impact__ring">
                <ScoreRing :score="alert.scoreBefore" :size="96" muted />
                <span>{{ isForecast ? 'Now' : 'Before' }}</span>
              </div>
              <ArrowRight :size="24" class="impact__arrow" />
              <div class="impact__ring">
                <ScoreRing :score="alert.scoreAfter" :size="96" />
                <span>{{ isForecast ? 'Projected' : 'Now' }}</span>
              </div>
              <div class="impact__verdict">
                <DeltaChip :value="delta" suffix=" pts overall" />
                <p v-if="bandChanged" class="impact__band">
                  Moved from <strong :style="{ color: BANDS[alert.bandBefore].color }">{{ BANDS[alert.bandBefore].label }}</strong>
                  to <strong :style="{ color: BANDS[alert.bandAfter].color }">{{ BANDS[alert.bandAfter].label }}</strong>
                </p>
                <p v-else class="impact__band">Still <strong :style="{ color: BANDS[alert.bandAfter].color }">{{ BANDS[alert.bandAfter].label }}</strong></p>
              </div>
            </div>

            <ul v-if="alert.categoryChanges.length" class="impact__cats">
              <li v-for="change in alert.categoryChanges" :key="change.key" class="impact__cat">
                <CategoryIcon :category="change.key" :size="34" />
                <div class="impact__cat-body">
                  <div class="row-between">
                    <span class="impact__cat-label">{{ CATEGORY_MAP[change.key].label }}</span>
                    <span class="impact__cat-nums num">
                      {{ change.before }} <ArrowRight :size="12" /> <strong>{{ change.after }}</strong>
                    </span>
                  </div>
                  <ScoreBar :score="change.after" :previous="change.before > change.after ? change.before : null" />
                </div>
                <DeltaChip :value="change.after - change.before" />
              </li>
            </ul>
          </section>

          <section class="card card-pad">
            <h2 class="section-title">Sources</h2>
            <p class="muted text-sm">We only send an alert when trusted reporting backs it up.</p>
            <ul class="sources">
              <li v-for="source in alert.sources" :key="source.id">
                <a :href="source.url" target="_blank" rel="noopener noreferrer" class="source">
                  <span class="source__text">
                    <span class="source__title">{{ source.title }}</span>
                    <span class="source__meta">{{ source.source }} · {{ timeAgo(source.publishedAt) }}</span>
                  </span>
                  <ArrowUpRight :size="17" class="source__icon" />
                </a>
              </li>
            </ul>
          </section>
        </div>

        <aside class="side">
          <section class="card card-pad why">
            <p class="why__title"><Heart :size="16" fill="currentColor" /> Why it matters to you</p>
            <p class="body-text">{{ alert.whyItMatters }}</p>
            <div v-if="alert.matchedValues.length" class="why__values">
              <span v-for="key in alert.matchedValues" :key="key" class="chip">
                <CategoryIcon :category="key" :size="20" /> {{ CATEGORY_MAP[key].short }}
              </span>
            </div>
          </section>

          <section class="card card-pad exposure">
            <p class="card-title">Your exposure</p>
            <template v-if="alert.exposure.source === 'linked'">
              <p v-if="alert.exposure.totalWeight" class="exposure__total num">
                {{ alert.exposure.totalWeight }}% <span>of your {{ alert.exposure.brokerageName }} portfolio</span>
              </p>
              <ul class="exposure__list">
                <li v-if="alert.exposure.holdsDirectly">
                  <span>You own {{ alert.symbol }} directly</span>
                  <strong class="num">{{ alert.exposure.directWeight }}%</strong>
                </li>
                <li v-for="etf in alert.exposure.viaEtfs" :key="etf.symbol">
                  <span><Layers :size="14" /> Through {{ etf.symbol }} ({{ etf.weight }}% of that fund)</span>
                  <strong class="num">{{ etf.portfolioWeight }}%</strong>
                </li>
              </ul>
            </template>
            <ul v-else class="exposure__list">
              <li v-if="alert.exposure.holdsDirectly"><span>On your watchlist directly</span></li>
              <li v-for="etf in alert.exposure.viaEtfs" :key="etf.symbol">
                <span><Layers :size="14" /> Inside {{ etf.symbol }} ({{ etf.weight }}% of that fund)</span>
              </li>
            </ul>
          </section>

          <section class="card card-pad actions">
            <p class="card-title">What you can do</p>
            <RouterLink
              v-if="alert.analysisLink"
              :to="`/app/scan/${alert.analysisLink.scanId}/${alert.symbol}`"
              class="action"
            >
              <span class="action__icon"><ArrowUpRight :size="17" /></span>
              <span><strong>Read the full analysis</strong><span>All six values, news and context</span></span>
            </RouterLink>
            <button v-if="alert.analysisLink" type="button" class="action" @click="openShare">
              <span class="action__icon"><Share2 :size="17" /></span>
              <span><strong>Talk it through with a friend</strong><span>Share a clean summary</span></span>
            </button>
            <RouterLink :to="`/preview/email/${alert.id}`" class="action">
              <span class="action__icon"><Mail :size="17" /></span>
              <span><strong>View the email</strong><span>See the alert as it landed in your inbox</span></span>
            </RouterLink>
            <button type="button" class="action" :disabled="muted" @click="stopWatching">
              <span class="action__icon"><BellOff :size="17" /></span>
              <span>
                <strong>{{ muted ? `Not watching ${alert.symbol}` : `Stop watching ${alert.symbol}` }}</strong>
                <span>No more alerts about it</span>
              </span>
            </button>
          </section>

          <p class="calm">
            <Wind :size="16" />
            No need to act right away. Take a breath, read up, and decide what feels right for you.
          </p>
        </aside>
      </div>

      <ShareModal
        v-if="alert.analysisLink"
        :open="shareOpen"
        :scan-id="alert.analysisLink.scanId"
        :security="shareSecurity"
        @close="shareOpen = false"
      />
    </article>
  </div>
</template>

<style scoped>
.hero {
  padding: 28px;
  margin-bottom: 18px;
}
.hero--negative {
  background: linear-gradient(160deg, var(--coral-50), var(--surface) 60%);
}
.hero--positive {
  background: linear-gradient(160deg, var(--brand-50), var(--surface) 60%);
}
.hero--forecast {
  background: linear-gradient(160deg, var(--sky-50), var(--surface) 60%);
}
.hero__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 14px;
  font-size: 13.5px;
  color: var(--muted);
}
.kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  font-weight: 750;
}
.kind--negative {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.kind--positive {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.kind--forecast {
  background: var(--sky-100);
  color: var(--sky-700);
}
.hero__emailed {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.hero__title {
  max-width: 820px;
  margin-top: 16px;
  font-size: clamp(28px, 3.4vw, 40px);
}
.hero__summary {
  max-width: 720px;
  margin-top: 10px;
  font-size: 17px;
  color: var(--ink-2);
}
.hero__security {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 8px 12px 8px 8px;
  border-radius: 16px;
  background: var(--surface);
  border: 1px solid var(--line);
  transition: border-color 0.2s;
}
.hero__security:hover {
  border-color: var(--line-strong);
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}
.main,
.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.body-text {
  margin-top: 10px;
  font-size: 16px;
  line-height: 1.65;
  color: var(--ink-2);
}
.forecast-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--sky-50);
  color: var(--sky-700);
  font-size: 14px;
  font-weight: 600;
}
.impact__rings {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 18px;
  margin-top: 18px;
  padding: 20px;
  border-radius: 20px;
  background: var(--surface-muted);
}
.impact__ring {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.impact__arrow {
  color: var(--subtle);
}
.impact__verdict {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  margin-left: 8px;
}
.impact__band {
  font-size: 15px;
}
.impact__cats {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 22px;
}
.impact__cat {
  display: flex;
  align-items: center;
  gap: 14px;
}
.impact__cat-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-width: 0;
}
.impact__cat-label {
  font-weight: 650;
  font-size: 14.5px;
}
.impact__cat-nums {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--muted);
}
.impact__cat-nums strong {
  color: var(--ink);
}
.sources {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}
.source {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--line);
  border-radius: 16px;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}
.source:hover {
  border-color: var(--line-strong);
  background: var(--surface-muted);
}
.source__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.source__title {
  font-weight: 650;
  line-height: 1.4;
}
.source__meta {
  font-size: 13px;
  color: var(--muted);
}
.source__icon {
  flex-shrink: 0;
  color: var(--subtle);
}
.why {
  background: linear-gradient(160deg, var(--coral-50), var(--surface) 70%);
}
.why__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 750;
  color: var(--coral-500);
}
.why .body-text {
  font-size: 15px;
}
.why__values {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.why__values .chip {
  padding-left: 6px;
}
.exposure__total {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 780;
  letter-spacing: -0.03em;
}
.exposure__total span {
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0;
  color: var(--muted);
}
.exposure__list {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}
.exposure__list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-size: 14px;
}
.exposure__list li span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.actions {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.actions .card-title {
  margin-bottom: 6px;
}
.action {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px;
  border-radius: 14px;
  text-align: left;
  transition: background-color 0.2s;
}
.action:hover:not(:disabled) {
  background: var(--surface-muted);
}
.action:disabled {
  opacity: 0.6;
  cursor: default;
}
.action__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 12px;
  background: var(--brand-50);
  color: var(--brand-700);
}
.action > span:last-child {
  display: flex;
  flex-direction: column;
  font-size: 12.5px;
  color: var(--muted);
}
.action strong {
  font-size: 14.5px;
  color: var(--ink);
}
.calm {
  display: flex;
  gap: 10px;
  padding: 16px 18px;
  border-radius: 18px;
  background: var(--lilac-50);
  color: #3a2d8c;
  font-size: 14px;
  line-height: 1.5;
}
.calm svg {
  flex-shrink: 0;
  margin-top: 2px;
}

@media (max-width: 1023px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .hero {
    padding: 20px;
  }
  .impact__verdict {
    margin-left: 0;
  }
}
</style>
