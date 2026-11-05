<script setup>
import { alertsService } from '@/api'
import ClaimStatusBadge from '@/components/thesis/ClaimStatusBadge.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAlertsStore } from '@/stores/alerts'
import { formatDate, formatDateLong, formatMoney } from '@/utils/format'
import { ALERT_KINDS, formatReturn, scheduleLabel } from '@/utils/thesis'
import { ArrowLeft, BellOff, Lightbulb, Newspaper, Sparkles } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const alerts = useAlertsStore()

const alert = ref(null)
const loading = ref(true)
const error = ref(null)

onMounted(async () => {
  try {
    alert.value = await alertsService.get(route.params.alertId)
    alerts.markRead(alert.value.id).catch(() => {})
  } catch (err) {
    error.value = err
  } finally {
    loading.value = false
  }
})

const kind = computed(() => (alert.value ? ALERT_KINDS[alert.value.kind] : null))
const askText = computed(() => (alert.value ? `How does “${alert.value.title}” change my thesis?` : ''))
const effect = computed(() => {
  if (!alert.value?.claim) return null
  return alert.value.kind === 'strengthens' ? 'This news strengthens it.' : 'This news weakens it.'
})
</script>

<template>
  <div class="page alert-detail">
    <RouterLink to="/app/alerts" class="back-link"><ArrowLeft :size="16" /> All alerts</RouterLink>

    <div v-if="loading" class="skeleton" style="height: 420px" />

    <div v-else-if="error" class="card">
      <EmptyState :icon="BellOff" title="We couldn’t find that alert" :text="error.message">
        <RouterLink to="/app/alerts" class="btn btn-primary">Back to alerts</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="alert">
      <header class="head">
        <span class="kind" :class="`kind--${kind.tone}`"><component :is="kind.icon" :size="15" /> {{ kind.label }}</span>
        <h1 class="page-title head__title">{{ alert.title }}</h1>
        <p class="head__meta">
          <Newspaper :size="15" /> {{ alert.source }} · {{ formatDateLong(alert.createdAt) }}
        </p>
        <RouterLink v-if="alert.thesis" :to="`/app/theses/${alert.thesis.id}`" class="thesis-link">
          <span class="topic-chip">{{ alert.thesis.topic.short }}</span>
          <span class="grow strong">{{ alert.thesis.title }}</span>
          <span class="link text-sm">Open thesis →</span>
        </RouterLink>
      </header>

      <div class="grid">
        <div class="main">
          <section class="card card-pad">
            <h2 class="section-title">What happened</h2>
            <p class="body">{{ alert.whatHappened }}</p>
          </section>

          <section v-if="alert.claim" class="card card-pad">
            <h2 class="section-title">The claim it affects</h2>
            <div class="claim" :class="`claim--${kind.tone}`">
              <span class="claim__num num">{{ alert.claim.number }}</span>
              <div class="grow">
                <p class="claim__text">{{ alert.claim.text }}</p>
                <p class="claim__effect">{{ effect }}</p>
              </div>
              <ClaimStatusBadge :status="alert.claim.status" />
            </div>
          </section>

          <section v-if="alert.companies.length" class="card card-pad">
            <h2 class="section-title">Companies in the story</h2>
            <ul class="companies">
              <li v-for="c in alert.companies" :key="c.symbol">
                <SecurityLogo :symbol="c.symbol" :name="c.name" :color="c.color" :size="36" />
                <span class="grow">
                  <strong>{{ c.name }}</strong>
                  <span class="muted text-sm"> {{ c.symbol }} · {{ c.sector }}</span>
                </span>
                <span v-if="c.inBasket" class="badge badge-brand">{{ c.weight }}% of your basket</span>
                <span v-else class="badge">Not in your basket</span>
              </li>
            </ul>
          </section>
        </div>

        <aside class="side">
          <section class="card card-pad suggest">
            <span class="suggest__icon"><Lightbulb :size="18" /></span>
            <h2 class="section-title">What the copilot suggests</h2>
            <p class="body">{{ alert.action }}</p>
            <RouterLink
              v-if="alert.thesis && alert.kind !== 'rebalance'"
              :to="{ path: `/app/theses/${alert.thesis.id}`, query: { ask: askText } }"
              class="btn btn-primary btn-sm"
            >
              <Sparkles :size="15" /> Ask the copilot about this
            </RouterLink>
            <RouterLink v-else-if="alert.kind === 'rebalance'" to="/app/portfolio" class="btn btn-secondary btn-sm">Change schedule</RouterLink>
          </section>

          <section v-if="alert.position" class="card card-pad">
            <p class="card-title">Your basket</p>
            <p class="position__value num">{{ formatMoney(alert.position.value) }}</p>
            <p class="text-sm" :class="alert.position.gainPct >= 0 ? 'is-up' : 'is-down'">
              {{ formatReturn(alert.position.gainPct) }} <span class="muted">since you invested</span>
            </p>
            <p class="muted text-sm position__schedule">
              Rebalances {{ scheduleLabel(alert.position.schedule).toLowerCase() }} · next {{ formatDate(alert.position.nextRebalanceAt) }}
            </p>
          </section>
        </aside>
      </div>
      <p class="disclaimer">Illustrative demo data. Alerts are research, not advice to buy or sell.</p>
    </template>
  </div>
</template>

<style scoped>
.alert-detail {
  max-width: 980px;
}
.head {
  margin-bottom: 22px;
}
.kind {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px;
  border: 1.5px solid var(--ink-solid);
  border-radius: var(--radius-pill);
  font-size: 13px;
  font-weight: 700;
}
.kind--up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.kind--down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.kind--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.head__title {
  margin-top: 12px;
}
.head__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 14px;
  color: var(--muted);
}
.thesis-link {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 16px;
  border: var(--outline-thin);
  background: var(--surface);
  transition:
    transform 0.2s var(--ease),
    box-shadow 0.2s var(--ease);
}
.thesis-link:hover {
  transform: translate(-2px, -2px);
  box-shadow: var(--shadow-sm);
}
.grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 18px;
  align-items: start;
}
.main,
.side {
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
}
.body {
  margin-top: 8px;
  color: var(--ink-2);
}
.claim {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 12px;
  padding: 14px;
  border-radius: 16px;
  border: var(--outline-thin);
}
.claim--up {
  background: var(--score-great-bg);
}
.claim--down {
  background: var(--score-low-bg);
}
.claim__num {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 10px;
  background: var(--sun);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
}
.claim__text {
  font-weight: 700;
}
.claim__effect {
  margin-top: 4px;
  font-size: 14px;
}
.companies {
  display: flex;
  flex-direction: column;
  margin-top: 8px;
}
.companies li {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 10px 0;
  border-top: 2px dashed var(--line);
}
.companies li:first-child {
  border-top: 0;
}
.suggest {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}
.suggest .btn {
  margin-top: 12px;
}
.suggest__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-bottom: 8px;
  border: 1.5px solid var(--ink-solid);
  border-radius: 12px;
  background: var(--sun);
  color: var(--ink);
}
.position__value {
  margin-top: 6px;
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1;
}
.position__schedule {
  margin-top: 6px;
}
.is-up {
  color: var(--score-great);
}
.is-down {
  color: var(--score-low);
}
@media (max-width: 860px) {
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
