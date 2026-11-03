<script setup>
import SampleBadge from '@/components/brand/SampleBadge.vue'
import ScoreChip from '@/components/ui/ScoreChip.vue'
import ScoreRing from '@/components/ui/ScoreRing.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { getSecurity } from '@/api/mock/catalog'
import { timeAgo } from '@/utils/format'
import { CATEGORIES, band } from '@/utils/scoring'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const sec = computed(() => getSecurity(String(route.params.symbol).toUpperCase()))
const inside = computed(() => (sec.value?.type === 'etf' ? [...sec.value.fund.constituents].sort((a, b) => b.weight - a.weight) : []))
const news = computed(() => (sec.value ? sec.value.news.filter((n) => !n.via).slice(0, 5) : []))
</script>

<template>
  <div class="company ground-blue">
    <section class="container">
      <RouterLink to="/browse" class="back">← All companies</RouterLink>

      <div v-if="!sec" class="panel sticker">
        <h1 class="h-2">We don't have "{{ route.params.symbol }}" yet.</h1>
        <p>The demo only covers sample data. <RouterLink to="/browse" class="link">Browse what we have →</RouterLink></p>
      </div>

      <template v-else>
        <div class="panel sticker hero">
          <SampleBadge class="panel__badge" />
          <div class="hero__who">
            <SecurityLogo :symbol="sec.symbol" :name="sec.name" :type="sec.type" :size="64" />
            <div>
              <p class="label-mono hero__meta">
                {{ sec.symbol }} · {{ sec.type === 'etf' ? `Fund · ${sec.holdingsCount.toLocaleString('en-US')} companies` : sec.sector }}
              </p>
              <h1 class="h-1">{{ sec.name }}</h1>
              <p class="hero__blurb">{{ sec.blurb }}</p>
              <div class="hero__flags">
                <span v-for="f in sec.flags" :key="f" class="badge badge-flag">{{ f }}</span>
              </div>
            </div>
          </div>
          <div class="hero__score">
            <ScoreRing :score="sec.score" :size="120" caption="out of 100" />
            <ScoreChip :score="sec.score" />
          </div>
          <p class="hero__summary">{{ sec.summary }}</p>
        </div>

        <h2 class="h-2 shout-shadow section-h">The receipts.</h2>
        <div class="cats">
          <div v-for="c in CATEGORIES" :key="c.key" class="cat sticker">
            <div class="cat__head">
              <span class="cat__label">{{ c.label }}</span>
              <span class="cat__score" :style="{ color: band(sec.categories[c.key].score).color }">{{ sec.categories[c.key].score }}</span>
            </div>
            <p class="cat__note">{{ sec.categories[c.key].note }}</p>
          </div>
        </div>

        <template v-if="inside.length">
          <h2 class="h-2 shout-shadow section-h">What's inside.</h2>
          <div class="panel sticker inside">
            <RouterLink v-for="c in inside" :key="c.symbol" :to="`/company/${c.symbol}`" class="inside__row">
              <span class="inside__pct">{{ c.weight.toFixed(1) }}%</span>
              <span class="inside__name">{{ c.name }}</span>
              <ScoreChip :score="c.score" short show-score size="sm" />
            </RouterLink>
            <p class="inside__rest">
              + {{ sec.fund.others.count.toLocaleString('en-US') }} more companies making up the other {{ sec.fund.others.weight.toFixed(1) }}%.
            </p>
          </div>
        </template>

        <template v-if="news.length">
          <h2 class="h-2 shout-shadow section-h">Lately.</h2>
          <div class="panel sticker news">
            <div v-for="n in news" :key="n.id" class="news__item">
              <p class="label-mono news__meta">{{ n.source }} · {{ timeAgo(n.publishedAt) }}</p>
              <p class="news__title">{{ n.title }}</p>
              <p class="news__sum">{{ n.summary }}</p>
            </div>
          </div>
        </template>

        <div class="next">
          <RouterLink to="/check" class="btn btn-flare next__cta">Check my holdings ↗</RouterLink>
          <p class="next__fine">Made-up company, sample data. Information, not investment advice.</p>
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.company {
  padding-top: 28px;
  padding-bottom: 80px;
}
.back {
  display: inline-block;
  margin-bottom: 20px;
  font-weight: 700;
}
.back:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.panel {
  position: relative;
  background: var(--cream);
  color: var(--ink);
  padding: 28px;
}
.panel__badge {
  position: absolute;
  top: -18px;
  right: 28px;
}
.hero {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 20px 32px;
}
.hero__who {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.hero__meta {
  color: var(--deep-violet);
}
.hero__who h1 {
  margin-top: 6px;
  font-size: clamp(40px, 5vw, 72px);
}
.hero__blurb {
  margin-top: 8px;
  font-size: 17px;
  max-width: 620px;
}
.hero__flags {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}
.hero__score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.hero__summary {
  grid-column: 1 / -1;
  padding: 14px 18px;
  border: var(--outline-thin);
  border-radius: 14px;
  background: var(--sun-100);
  font-size: 16px;
}
.section-h {
  margin: 56px 0 20px;
  color: var(--cream);
  font-size: clamp(40px, 5vw, 72px);
}
.cats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 22px;
}
.cat {
  background: var(--cream);
  color: var(--ink);
  padding: 20px 22px;
  border-radius: 22px;
}
.cat__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}
.cat__label {
  font-weight: 700;
  font-size: 17px;
}
.cat__score {
  font-family: var(--font-display);
  font-size: 40px;
  line-height: 1;
}
.cat__note {
  margin-top: 8px;
  font-size: 15px;
}
.inside {
  display: flex;
  flex-direction: column;
  padding: 12px 28px;
}
.inside__row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 2px solid var(--line);
}
.inside__row:hover .inside__name {
  text-decoration: underline;
  text-underline-offset: 3px;
}
.inside__pct {
  font-family: var(--font-display);
  font-size: 26px;
  width: 80px;
}
.inside__name {
  flex: 1;
  font-weight: 700;
  font-size: 17px;
}
.inside__rest {
  padding: 14px 0 6px;
  color: var(--muted);
}
.news {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.news__item + .news__item {
  padding-top: 18px;
  border-top: 2px solid var(--line);
}
.news__meta {
  color: var(--muted);
  font-size: 12px;
}
.news__title {
  margin-top: 4px;
  font-weight: 700;
  font-size: 18px;
}
.news__sum {
  margin-top: 4px;
}
.next {
  margin-top: 56px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
}
.next__cta {
  --btn-h: 64px;
  padding: 0 32px;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 26px;
  text-transform: uppercase;
}
.next__fine {
  background: var(--ink-solid);
  border-radius: 12px;
  padding: 10px 16px;
  font-size: 14px;
}
@media (max-width: 760px) {
  .hero {
    grid-template-columns: 1fr;
  }
}
</style>
