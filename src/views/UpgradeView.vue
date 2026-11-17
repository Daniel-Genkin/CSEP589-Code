<script setup lang="ts">
// F5 Upgrade. The wall a free user meets when they ask to connect a brokerage, monitor live or
// send trades: Free and Paid side by side at one flat monthly price. "Start paid plan (demo)"
// sets the plan with no payment form and returns to what they were doing. No Figma frame.
import { FREE_FEATURES, PAID_FEATURES, planPriceLabel } from '@/config/plan'
import { safeNext } from '@/router/gate'
import { useDemoStore } from '@/state/demo'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const DESTINATIONS: Record<string, string> = { '/connect': 'Connect brokerage', '/trades': 'Trade approval', '/alerts': 'Alerts' }

const demo = useDemoStore()
const route = useRoute()
const router = useRouter()

const next = computed(() => safeNext(route.query.next))
const wanted = computed(() => DESTINATIONS[next.value.split(/[?#]/)[0]] ?? null)
const price = planPriceLabel()

function start() {
  demo.upgrade()
  router.replace(next.value)
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · Upgrade<template v-if="wanted && !demo.isPaid"> · {{ wanted }} is on the paid plan</template></p>
      <h1 class="page-title">Let Rally<br />keep watch.</h1>
      <p class="lead">Seeing what you own is free. Connecting your real account, watching it and acting on it is one flat price a month.</p>
    </header>

    <div class="plans">
      <section class="card plan" aria-labelledby="plan-free">
        <p class="label-mono">{{ demo.isPaid ? 'Included' : 'Your plan now' }}</p>
        <h2 id="plan-free" class="title-lg">Free</h2>
        <p class="plan__price"><span class="stat-md">$0</span><span class="plan__per">email only, never a brokerage link</span></p>
        <ul class="plan__list">
          <li v-for="feature in FREE_FEATURES" :key="feature"><span class="dot" />{{ feature }}</li>
        </ul>
      </section>

      <section class="card plan plan--paid" aria-labelledby="plan-paid">
        <p class="label-mono">{{ demo.isPaid ? 'Your plan now · demo' : 'Paid' }}</p>
        <h2 id="plan-paid" class="title-lg">Paid</h2>
        <p class="plan__price">
          <span class="stat-md">{{ price }}</span><span class="plan__per">a month, flat. No percentage of your assets.</span>
        </p>
        <ul class="plan__list plan__list--paid">
          <li v-for="feature in PAID_FEATURES" :key="feature.title">
            <span class="dot" style="--dot: var(--sun)" />
            <span><strong>{{ feature.title }}</strong><br />{{ feature.detail }}</span>
          </li>
        </ul>
        <div class="plan__actions">
          <button v-if="!demo.isPaid" type="button" class="btn btn-primary" @click="start">Start paid plan (demo)</button>
          <RouterLink v-else :to="next" class="btn btn-primary">Continue{{ wanted ? ` to ${wanted}` : '' }}</RouterLink>
          <RouterLink v-if="!demo.isPaid" to="/portfolio" class="btn btn-outline">Not now</RouterLink>
        </div>
        <p class="small">Simulated: there is no payment form and nothing is charged. {{ price }} a month is a placeholder price.</p>
      </section>
    </div>

    <p class="promise"><span class="dot" style="--dot: var(--sun)" />We don’t hold your money. We show you what you’re buying. Trades happen at your own broker, only after you approve them.</p>
  </div>
</template>

<style scoped>
.plans {
  display: flex;
  align-items: stretch;
  gap: 24px;
}
.plan {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
  padding: 36px;
}
.plan--paid {
  padding: 34.5px;
  border: 1.5px solid var(--brand-400);
}
.plan__price {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}
.plan__per {
  padding-bottom: 12px;
  font-size: 15px;
  color: var(--text-muted);
}
.plan__list {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.plan__list li {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 0;
  border-top: 1px solid var(--hairline);
  line-height: 1.45;
}
.plan__list--paid li {
  color: var(--text-muted);
}
.plan__list strong {
  font-size: 17px;
  font-weight: 600;
  color: var(--text);
}
.plan__actions {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 8px;
}
.promise {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  color: var(--text-muted);
}
@media (max-width: 1100px) {
  .plans {
    flex-direction: column;
  }
}
</style>
