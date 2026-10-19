<script setup>
import { alertsService } from '@/api'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { formatDateLong } from '@/utils/format'
import { BANDS, CATEGORY_MAP } from '@/utils/scoring'
import { ArrowLeft, ArrowRight, Inbox, Paperclip, Reply, Star, TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { data: email, loading, error } = useAsync(() => alertsService.getEmail(route.params.alertId))

const alert = computed(() => email.value?.alert)
const sentAt = computed(() =>
  email.value
    ? new Date(email.value.sentAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    : '',
)
const intro = computed(() => {
  if (!alert.value) return ''
  if (alert.value.kind === 'positive') return 'Some good news about one of your holdings. Here’s the quick version:'
  if (alert.value.kind === 'forecast') return 'One of your ETFs is about to change what it holds. Here’s the quick version:'
  return 'Something changed with one of your holdings. Here’s the quick version:'
})
</script>

<template>
  <div class="email-page">
    <header class="bar">
      <div class="bar__inner">
        <RouterLink :to="`/app/alerts/${route.params.alertId}`" class="back-link bar__back">
          <ArrowLeft :size="16" /> Back to alert
        </RouterLink>
        <span class="bar__note"><span class="badge badge-sky">Preview</span> This is the email Pro members receive.</span>
      </div>
    </header>

    <div v-if="loading" class="client client--loading skeleton" />

    <div v-else-if="error" class="client">
      <EmptyState :icon="TriangleAlert" title="We couldn't load this email" :text="error.message">
        <RouterLink to="/app/alerts" class="btn btn-primary">Back to alerts</RouterLink>
      </EmptyState>
    </div>

    <div v-else-if="email" class="client fade-up">
      <div class="client__chrome">
        <span class="client__dots"><span /><span /><span /></span>
        <span class="client__folder"><Inbox :size="15" /> Inbox</span>
        <span class="client__tools"><Star :size="16" /><Reply :size="16" /></span>
      </div>

      <div class="client__header">
        <h1 class="client__subject">{{ email.subject }}</h1>
        <div class="client__from">
          <BrandLogo :size="38" :show-wordmark="false" />
          <div class="client__from-text">
            <p><strong>outvest</strong> <span class="muted">&lt;alerts@outvest.app&gt;</span></p>
            <p class="muted text-sm">to {{ email.to }}</p>
          </div>
          <span class="muted text-sm client__time">{{ sentAt }}</span>
        </div>
      </div>

      <div class="client__body">
        <div class="mail">
          <div class="mail__brand"><BrandLogo :size="26" /></div>

          <p class="mail__hi">Hi {{ email.firstName }},</p>
          <p class="mail__intro">{{ intro }}</p>

          <div class="mail__card">
            <div class="mail__security">
              <SecurityLogo :symbol="alert.symbol" :name="alert.security.name" :color="alert.security.color" :type="alert.security.type" :size="40" />
              <div>
                <p class="mail__name">{{ alert.security.name }}</p>
                <p class="mail__symbol">{{ alert.symbol }}</p>
              </div>
            </div>

            <p class="mail__title">{{ alert.title }}</p>

            <div class="mail__scores">
              <div class="mail__score">
                <ScoreRing :score="alert.scoreBefore" :size="64" muted />
                <span>{{ alert.kind === 'forecast' ? 'Now' : 'Before' }}</span>
              </div>
              <ArrowRight :size="18" class="muted" />
              <div class="mail__score">
                <ScoreRing :score="alert.scoreAfter" :size="64" />
                <span>{{ alert.kind === 'forecast' ? 'Projected' : 'Now' }}</span>
              </div>
              <p class="mail__band">
                <template v-if="alert.bandBefore !== alert.bandAfter">
                  <strong :style="{ color: BANDS[alert.bandBefore].color }">{{ BANDS[alert.bandBefore].label }}</strong> →
                  <strong :style="{ color: BANDS[alert.bandAfter].color }">{{ BANDS[alert.bandAfter].label }}</strong>
                </template>
                <template v-else>
                  Still <strong :style="{ color: BANDS[alert.bandAfter].color }">{{ BANDS[alert.bandAfter].label }}</strong>
                </template>
              </p>
            </div>

            <p class="mail__text">{{ alert.whatHappened }}</p>

            <ul v-if="alert.categoryChanges.length" class="mail__changes">
              <li v-for="c in alert.categoryChanges" :key="c.key">
                <span>{{ CATEGORY_MAP[c.key].label }}</span>
                <span class="num" :class="c.after < c.before ? 'is-down' : 'is-up'">
                  {{ c.before }} → {{ c.after }}
                </span>
              </li>
            </ul>

            <p v-if="alert.kind === 'forecast'" class="mail__forecast">Expected at the rebalance on {{ formatDateLong(alert.forecastFor) }}.</p>
          </div>

          <RouterLink :to="`/app/alerts/${alert.id}`" class="mail__cta">See what changed <ArrowRight :size="17" /></RouterLink>

          <p class="mail__calm">
            No need to act right away. Take a breath, read the full summary, and decide what feels right for you.
          </p>
          <p class="mail__sign">— The outvest team</p>

          <div class="mail__footer">
            <p>
              You're getting this because you watch {{ alert.symbol }} with outvest Pro.
              <RouterLink to="/app/monitoring">Manage alerts</RouterLink> ·
              <RouterLink to="/app/monitoring">Unsubscribe</RouterLink>
            </p>
            <p class="mail__attach"><Paperclip :size="12" /> Research only, not financial advice.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.email-page {
  min-height: 100vh;
  padding-bottom: 64px;
  background:
    radial-gradient(800px 400px at 50% -100px, rgba(128, 197, 157, 0.25), transparent 70%),
    var(--bg-tint);
}
.bar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(240, 237, 228, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--line);
}
.bar__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  max-width: 880px;
  margin: 0 auto;
  padding: 14px 20px;
}
.bar__back {
  margin: 0;
}
.bar__note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 13.5px;
  color: var(--muted);
}
.client {
  max-width: 880px;
  margin: 28px auto 0;
  border-radius: 24px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
.client--loading {
  height: 720px;
}
.client__chrome {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 18px;
  border-bottom: 1px solid var(--line);
  background: var(--surface-muted);
  font-size: 13px;
  color: var(--muted);
}
.client__dots {
  display: flex;
  gap: 6px;
}
.client__dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #e6dfd1;
}
.client__dots span:first-child {
  background: #f2b8ab;
}
.client__dots span:nth-child(2) {
  background: #f3dc9f;
}
.client__dots span:last-child {
  background: #b9dfc4;
}
.client__folder {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: 650;
}
.client__tools {
  display: inline-flex;
  gap: 14px;
  margin-left: auto;
}
.client__header {
  padding: 24px 28px 18px;
  border-bottom: 1px solid var(--line);
}
.client__subject {
  font-family: var(--font-sans);
  font-size: 22px;
  font-weight: 750;
  letter-spacing: -0.01em;
}
.client__from {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
}
.client__from-text {
  flex: 1;
  min-width: 0;
  line-height: 1.4;
}
.client__time {
  white-space: nowrap;
}
.client__body {
  padding: 36px 20px 48px;
  background: #f6f4ee;
}
.mail {
  max-width: 560px;
  margin: 0 auto;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  border: 1px solid var(--line);
}
.mail__brand {
  padding-bottom: 22px;
  margin-bottom: 22px;
  border-bottom: 1px solid var(--line);
}
.mail__hi {
  font-size: 17px;
  font-weight: 700;
}
.mail__intro {
  margin-top: 6px;
  color: var(--ink-2);
}
.mail__card {
  margin: 20px 0;
  padding: 22px;
  border-radius: 18px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
}
.mail__security {
  display: flex;
  align-items: center;
  gap: 12px;
}
.mail__name {
  font-weight: 750;
}
.mail__symbol {
  font-size: 13px;
  color: var(--muted);
}
.mail__title {
  margin-top: 16px;
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 22px;
  font-weight: 560;
  line-height: 1.25;
}
.mail__scores {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 18px;
}
.mail__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--muted);
}
.mail__band {
  font-size: 14.5px;
}
.mail__text {
  margin-top: 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-2);
}
.mail__changes {
  margin-top: 14px;
  border-top: 1px solid var(--line);
}
.mail__changes li {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid var(--line);
  font-size: 14px;
  font-weight: 600;
}
.mail__changes .is-down {
  color: var(--score-low);
}
.mail__changes .is-up {
  color: var(--score-great);
}
.mail__forecast {
  margin-top: 12px;
  font-size: 13.5px;
  color: var(--sky-700);
  font-weight: 600;
}
.mail__cta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 52px;
  border-radius: var(--radius-pill);
  background: var(--brand-700);
  color: #fff;
  font-weight: 700;
  transition: background-color 0.2s;
}
.mail__cta:hover {
  background: var(--brand-600);
}
.mail__calm {
  margin-top: 22px;
  color: var(--ink-2);
  font-size: 15px;
}
.mail__sign {
  margin-top: 12px;
  font-weight: 650;
}
.mail__footer {
  margin-top: 28px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: 12.5px;
  color: var(--subtle);
  line-height: 1.6;
}
.mail__footer a {
  text-decoration: underline;
}
.mail__attach {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}
@media (max-width: 640px) {
  .client {
    margin: 16px 12px 0;
    border-radius: 18px;
  }
  .client__header {
    padding: 18px;
  }
  .client__body {
    padding: 16px 10px 28px;
  }
  .mail {
    padding: 20px;
  }
  .client__time {
    display: none;
  }
}
</style>
