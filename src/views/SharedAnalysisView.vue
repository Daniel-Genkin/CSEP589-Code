<script setup>
import { shareService } from '@/api'
import CategoryBreakdown from '@/components/scan/CategoryBreakdown.vue'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { useSessionStore } from '@/stores/session'
import { timeAgo } from '@/utils/format'
import { band } from '@/utils/scoring'
import { ArrowRight, Check, Flag, Layers, Link2Off, Lock, Newspaper, ThumbsUp, TriangleAlert } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const session = useSessionStore()
const { data: share, error, loading } = useAsync(() => shareService.getPublic(route.params.shareId))

const security = computed(() => share.value?.security)
const meta = computed(() => (security.value ? band(security.value.score) : null))
const moreStories = computed(() => (security.value ? security.value.newsCount - security.value.highlights.length : 0))
const signupLink = computed(() => ({
  name: 'signup',
  query: share.value?.referralCode ? { ref: share.value.referralCode, from: share.value.sharer.firstName } : {},
}))
</script>

<template>
  <div class="shared">
    <header class="shared__header">
      <div class="container shared__header-inner">
        <RouterLink to="/" aria-label="outvest home"><BrandLogo /></RouterLink>
        <RouterLink v-if="session.isAuthed" to="/app" class="btn btn-secondary btn-sm">Open app</RouterLink>
        <RouterLink v-else :to="signupLink" class="btn btn-primary btn-sm">Get started free</RouterLink>
      </div>
    </header>

    <main class="container shared__main">
      <div v-if="loading" class="shared__loading">
        <div class="skeleton" style="height: 120px; max-width: 520px; margin: 0 auto" />
        <div class="skeleton" style="height: 640px" />
      </div>

      <div v-else-if="error" class="card">
        <EmptyState :icon="Link2Off" title="This link isn't available" text="It may have expired, or the person who shared it turned it off.">
          <RouterLink to="/" class="btn btn-primary">Discover outvest</RouterLink>
        </EmptyState>
      </div>

      <template v-else-if="share">
        <section class="intro fade-up">
          <span class="intro__avatar">{{ share.sharer.initial }}</span>
          <p class="intro__who"><strong>{{ share.sharer.firstName }}</strong> shared a values check with you</p>
          <p v-if="share.note" class="intro__note">“{{ share.note }}”</p>
          <p class="intro__time">{{ timeAgo(share.createdAt) }}</p>
        </section>

        <div class="shared__grid">
          <article class="analysis card fade-up" style="animation-delay: 0.08s">
            <header class="analysis__head">
              <SecurityLogo :symbol="security.symbol" :name="security.name" :color="security.color" :type="security.type" :size="56" />
              <div class="analysis__id">
                <h1 class="analysis__name">{{ security.name }}</h1>
                <p class="analysis__meta">
                  {{ security.symbol }} · {{ security.sector }}
                  <span v-if="security.type === 'etf'" class="badge badge-etf"><Layers :size="11" /> ETF</span>
                </p>
              </div>
            </header>

            <div class="analysis__score">
              <ScoreRing :score="security.score" :size="108" caption="of 100" />
              <div>
                <p class="analysis__band" :style="{ color: meta.color }">{{ meta.label }}</p>
                <p class="analysis__summary">{{ security.summary }}</p>
                <div v-if="security.flags.length" class="analysis__flags">
                  <span v-for="flag in security.flags" :key="flag" class="badge badge-flag"><Flag :size="11" /> Includes {{ flag.toLowerCase() }}</span>
                </div>
              </div>
            </div>

            <h2 class="analysis__title">The values breakdown</h2>
            <CategoryBreakdown :categories="security.categories" compact />

            <template v-if="security.topHoldings">
              <h2 class="analysis__title">Biggest companies inside</h2>
              <ul class="inside">
                <li v-for="h in security.topHoldings" :key="h.symbol">
                  <SecurityLogo :symbol="h.symbol" :name="h.name" :color="h.color" :size="32" />
                  <span class="grow">{{ h.name }}</span>
                  <span class="muted num">{{ h.weight }}%</span>
                  <ScoreChip :score="h.score" short show-score size="sm" />
                </li>
              </ul>
            </template>

            <h2 class="analysis__title">In the news</h2>
            <ul class="headlines">
              <li v-for="item in security.highlights" :key="item.id" class="headline" :class="`headline--${item.sentiment}`">
                <span class="headline__icon">
                  <ThumbsUp v-if="item.sentiment === 'positive'" :size="16" />
                  <TriangleAlert v-else :size="16" />
                </span>
                <span>
                  <span class="headline__meta">{{ item.sentiment === 'positive' ? 'Good news' : 'Heads up' }} · {{ item.source }}</span>
                  <a :href="item.url" target="_blank" rel="noopener noreferrer" class="headline__title">{{ item.title }}</a>
                </span>
              </li>
            </ul>

            <div v-if="moreStories > 0" class="locked">
              <div class="locked__ghost" aria-hidden="true">
                <div v-for="n in 3" :key="n" class="locked__row">
                  <span class="locked__dot" />
                  <span class="locked__lines"><span /><span /></span>
                </div>
              </div>
              <div class="locked__overlay">
                <span class="locked__icon"><Lock :size="18" /></span>
                <p>
                  <strong>{{ moreStories }} more {{ moreStories === 1 ? 'story' : 'stories' }}</strong> plus the full
                  research, ETF breakdowns and alerts when things change.
                </p>
                <RouterLink :to="signupLink" class="btn btn-primary btn-sm">Unlock free <ArrowRight :size="15" /></RouterLink>
              </div>
            </div>
          </article>

          <aside class="shared__aside">
            <div class="cta-card fade-up" style="animation-delay: 0.16s">
              <BrandLogo inverse :size="26" />
              <h2 class="cta-card__title">What's in <span class="cta-card__em">your</span> portfolio?</h2>
              <p class="cta-card__text">
                outvest checks your stocks and ETFs against what you care about, in about two minutes.
              </p>
              <ul class="cta-card__list">
                <li><Check :size="16" /> Free to start, no card needed</li>
                <li><Check :size="16" /> Plain English, zero jargon</li>
                <li><Check :size="16" /> ETFs unpacked, company by company</li>
              </ul>
              <RouterLink :to="signupLink" class="btn btn-light btn-lg btn-block">
                Scan my stocks free <ArrowRight :size="18" />
              </RouterLink>
              <p class="cta-card__fine">Invited by {{ share.sharer.firstName }}</p>
            </div>

            <div class="card card-pad how">
              <p class="how__title"><Newspaper :size="16" /> How outvest works</p>
              <ol class="how__list">
                <li><span>1</span> Link a brokerage or type a few tickers.</li>
                <li><span>2</span> We research every company against six values.</li>
                <li><span>3</span> You get clear scores, the reasons and the news.</li>
              </ol>
              <RouterLink to="/" class="link text-sm">Learn more about outvest →</RouterLink>
            </div>
          </aside>
        </div>

        <p class="disclaimer">
          Shared from outvest. Scores reflect values research, not financial advice. Company data shown is illustrative.
        </p>
      </template>
    </main>
  </div>
</template>

<style scoped>
.shared {
  min-height: 100vh;
  background:
    radial-gradient(900px 420px at 50% -120px, rgba(128, 197, 157, 0.35), transparent 70%),
    radial-gradient(600px 360px at 90% 10%, rgba(196, 186, 255, 0.28), transparent 70%),
    var(--bg);
}
.shared__header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}
.shared__main {
  padding-bottom: 64px;
}
.shared__loading {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-top: 32px;
}
.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 620px;
  margin: 24px auto 36px;
  text-align: center;
}
.intro__avatar {
  display: grid;
  place-items: center;
  width: 60px;
  height: 60px;
  margin-bottom: 4px;
  border-radius: 50%;
  border: 3px solid var(--surface);
  background: linear-gradient(135deg, var(--peach-100), var(--lilac-100));
  box-shadow: var(--shadow);
  font-family: var(--font-display);
  font-size: 26px;
  font-weight: 600;
}
.intro__who {
  font-size: 18px;
}
.intro__note {
  position: relative;
  margin-top: 8px;
  padding: 16px 22px;
  border-radius: 22px;
  background: var(--surface);
  border: 1px solid var(--line);
  box-shadow: var(--shadow-sm);
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 20px;
  font-style: italic;
  line-height: 1.4;
  color: var(--ink-2);
}
.intro__time {
  font-size: 13px;
  color: var(--subtle);
}
.shared__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  align-items: start;
}
.analysis {
  padding: 30px;
  border-radius: 30px;
  box-shadow: var(--shadow);
}
.analysis__head {
  display: flex;
  align-items: center;
  gap: 16px;
}
.analysis__id {
  min-width: 0;
}
.analysis__name {
  font-size: 32px;
}
.analysis__meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
  color: var(--muted);
}
.analysis__score {
  display: flex;
  align-items: center;
  gap: 24px;
  margin-top: 24px;
  padding: 22px;
  border-radius: 22px;
  background: var(--surface-muted);
}
.analysis__band {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 26px;
  font-weight: 600;
}
.analysis__summary {
  margin-top: 6px;
  color: var(--ink-2);
}
.analysis__flags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}
.analysis__title {
  margin: 30px 0 14px;
  font-family: var(--font-sans);
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.01em;
}
.inside li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-top: 1px solid var(--line);
  font-weight: 600;
  font-size: 14.5px;
}
.headlines {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.headline {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
}
.headline__icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 11px;
}
.headline--positive .headline__icon {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.headline--negative .headline__icon {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.headline > span:last-child {
  display: flex;
  flex-direction: column;
}
.headline__meta {
  font-size: 12.5px;
  font-weight: 650;
  color: var(--muted);
}
.headline__title {
  font-weight: 700;
  line-height: 1.4;
}
.headline__title:hover {
  color: var(--brand-600);
}
.locked {
  position: relative;
  margin-top: 10px;
  border-radius: 18px;
  overflow: hidden;
}
.locked__ghost {
  display: flex;
  flex-direction: column;
  gap: 10px;
  filter: blur(3px);
  opacity: 0.6;
}
.locked__row {
  display: flex;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 16px;
}
.locked__dot {
  width: 34px;
  height: 34px;
  border-radius: 11px;
  background: var(--bg-tint);
}
.locked__lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.locked__lines span {
  height: 10px;
  border-radius: 6px;
  background: var(--bg-tint);
}
.locked__lines span:last-child {
  width: 60%;
}
.locked__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 16px;
  text-align: center;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.92));
  font-size: 14.5px;
}
.locked__icon {
  display: grid;
  place-items: center;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-700);
}
.shared__aside {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.cta-card {
  padding: 28px;
  border-radius: 30px;
  color: #fff;
  background:
    radial-gradient(circle at 90% 0%, rgba(128, 197, 157, 0.55), transparent 50%),
    radial-gradient(circle at 0% 100%, rgba(123, 104, 238, 0.35), transparent 50%),
    linear-gradient(160deg, var(--brand-700), var(--brand-900));
  box-shadow: var(--shadow-lg);
}
.cta-card__title {
  margin-top: 22px;
  font-size: 30px;
  color: #fff;
}
.cta-card__em {
  font-style: italic;
  color: var(--brand-200);
}
.cta-card__text {
  margin-top: 10px;
  color: rgba(255, 255, 255, 0.82);
}
.cta-card__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 20px 0 24px;
  font-size: 14.5px;
  font-weight: 600;
}
.cta-card__list li {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cta-card__list svg {
  flex-shrink: 0;
  color: var(--brand-200);
}
.cta-card__fine {
  margin-top: 12px;
  font-size: 12.5px;
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}
.how__title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}
.how__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 16px 0;
  font-size: 14.5px;
  color: var(--ink-2);
}
.how__list li {
  display: flex;
  gap: 12px;
}
.how__list span {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 12px;
  font-weight: 750;
}

@media (max-width: 960px) {
  .shared__grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .shared__aside {
    position: static;
  }
}
@media (max-width: 640px) {
  .analysis {
    padding: 20px;
    border-radius: 24px;
  }
  .analysis__name {
    font-size: 26px;
  }
  .analysis__score {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  .intro__note {
    font-size: 17px;
  }
}
</style>
