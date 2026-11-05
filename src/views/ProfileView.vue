<script setup>
import { communityService } from '@/api'
import ThesisCard from '@/components/thesis/ThesisCard.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import { useAsync } from '@/composables/useAsync'
import { formatDate } from '@/utils/format'
import { formatPts } from '@/utils/thesis'
import { FileText, UserRoundX } from '@lucide/vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const { data: person, error, loading } = useAsync(() => communityService.person(route.params.handle))
</script>

<template>
  <div class="container profile">
    <div v-if="loading" class="skeleton" style="height: 260px" />

    <div v-else-if="error" class="card">
      <EmptyState :icon="UserRoundX" title="We couldn’t find that member" :text="error.message">
        <RouterLink to="/" class="btn btn-primary">Back home</RouterLink>
      </EmptyState>
    </div>

    <template v-else-if="person">
      <header class="head fade-up">
        <span class="avatar head__avatar">{{ person.initials }}</span>
        <div class="grow">
          <h1 class="head__name shout-shadow">{{ person.name }}</h1>
          <p class="head__handle">@{{ person.handle }} · joined {{ formatDate(person.joinedAt, { month: 'long', year: 'numeric' }) }}</p>
          <p v-if="person.bio" class="head__bio">{{ person.bio }}</p>
        </div>
        <RouterLink v-if="person.isYou" to="/app/settings" class="btn btn-secondary btn-sm">Edit profile</RouterLink>
      </header>

      <dl class="stats">
        <div class="stat stat--ink">
          <dt>Published calls</dt>
          <dd class="num">{{ person.record.calls }}</dd>
        </div>
        <div class="stat stat--pink">
          <dt>Beating the S&P 500</dt>
          <dd class="num">{{ person.record.beating }}<span> of {{ person.record.scored }}</span></dd>
        </div>
        <div class="stat stat--cream">
          <dt>Average vs S&P 500</dt>
          <dd class="num" :class="person.record.avgExcess > 0 ? 'is-up' : person.record.avgExcess < 0 ? 'is-down' : ''">
            {{ person.record.avgExcess === null ? '—' : formatPts(person.record.avgExcess) }}
          </dd>
        </div>
      </dl>

      <section>
        <div class="section-head">
          <h2 class="calls-title">Every call, good and bad</h2>
          <p class="calls-sub">Measured from the day each thesis was published, on the basket as published.</p>
        </div>
        <div v-if="person.theses.length" class="grid">
          <ThesisCard v-for="thesis in person.theses" :key="thesis.id" :thesis="thesis" :to="`/t/${thesis.id}`" :show-author="false" />
        </div>
        <div v-else class="card">
          <EmptyState :icon="FileText" title="No published theses yet" text="Published theses and their track records show up here." />
        </div>
      </section>
      <p class="disclaimer">Illustrative demo data. Track records compare each basket with the S&P 500 and don’t predict future results.</p>
    </template>
  </div>
</template>

<style scoped>
.profile {
  max-width: 1088px;
  padding-top: 40px;
  padding-bottom: 72px;
}
.head {
  display: flex;
  align-items: flex-start;
  gap: 22px;
}
.head__avatar {
  width: 88px;
  height: 88px;
  border-width: 3px;
  font-size: 28px;
  box-shadow: var(--shadow-sm);
}
.head__name {
  font-size: clamp(44px, 6vw, 84px);
  line-height: 0.9;
  color: var(--cream);
}
.head__handle {
  margin-top: 10px;
  font-family: var(--font-mono);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--sun);
}
.head__bio {
  max-width: 600px;
  margin-top: 10px;
  font-size: 17px;
}
.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin: 36px 0 56px;
}
.stat {
  padding: 20px 22px;
  border: var(--outline);
  border-radius: 24px;
  box-shadow: var(--shadow);
}
.stat--ink {
  background: var(--ink-solid);
  color: var(--cream);
  box-shadow: 6px 6px 0 var(--sun);
  transform: rotate(-1deg);
}
.stat--pink {
  background: var(--bubblegum);
  color: var(--ink);
  transform: rotate(0.8deg);
}
.stat--cream {
  background: var(--surface);
  color: var(--ink);
  transform: rotate(-0.6deg);
}
.stat dt {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.stat dd {
  margin-top: 8px;
  font-family: var(--font-display);
  font-size: 60px;
  line-height: 0.9;
}
.stat--ink dd {
  color: var(--sun);
}
.stat dd span {
  font-size: 26px;
}
.stat dd.is-up {
  color: var(--score-great);
}
.stat dd.is-down {
  color: var(--score-low);
}
.section-head {
  margin-bottom: 22px;
}
.calls-title {
  font-size: clamp(34px, 4vw, 52px);
  color: var(--cream);
  text-shadow: 4px 4px 0 var(--ink-solid);
}
.calls-sub {
  margin-top: 8px;
  font-size: 15px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px;
}
@media (max-width: 760px) {
  .head {
    flex-wrap: wrap;
  }
  .stats,
  .grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
