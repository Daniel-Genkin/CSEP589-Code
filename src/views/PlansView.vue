<script setup lang="ts">
// Plans. Free next to Plus at one flat monthly price. "Try Plus" sets the plan with no payment
// form (demo) and returns to what the person was doing.
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Check } from '@lucide/vue'
import FlowShell from '@/components/v7/FlowShell.vue'
import { FREE_FEATURES, PAID_FEATURES, planPriceLabel } from '@/config/plan'
import { safeNext } from '@/router/gate'
import { useDemoStore } from '@/state/demo'

const DESTINATIONS: Record<string, string> = { '/connect': 'Connecting an account', '/trades': 'Approving trades' }

const demo = useDemoStore()
const route = useRoute()
const router = useRouter()
const next = computed(() => safeNext(route.query.next, '/home'))
const wanted = computed(() => DESTINATIONS[next.value.split(/[?#]/)[0].replace(/\/\d$/, '')] ?? null)
const price = planPriceLabel()

function start() {
  demo.upgrade()
  router.replace(next.value)
}
</script>

<template>
  <FlowShell
    label="Plans"
    :back="true"
    logo-to="/home"
    title="Pick your plan."
    :body="wanted && !demo.isPaid ? `${wanted} is on Plus. Checking a fund is always free.` : 'Checking a fund is always free. Plus is for people who want Rally to keep watching their money.'"
  >
    <section class="card-pad plan" aria-labelledby="plan-free">
      <div class="top">
        <h3 id="plan-free">Free</h3>
        <p class="price"><span class="display">$0</span></p>
      </div>
      <p class="dim">Everything you need to check a fund. Email only, never an account link.</p>
      <ul>
        <li v-for="f in FREE_FEATURES" :key="f">{{ f }} <Check :size="18" color="var(--link)" /></li>
      </ul>
      <span class="btn btn-secondary btn-block" style="cursor: default">{{ demo.isPaid ? 'Included' : 'Your Plan' }}</span>
    </section>

    <section class="card-pad plan plus" aria-labelledby="plan-plus">
      <div class="top">
        <h3 id="plan-plus">Plus</h3>
        <p class="price"><span class="display" style="color: var(--sun)">{{ price }}</span><small>/month</small></p>
      </div>
      <p class="dim">One flat price. No percentage of your money.</p>
      <ul>
        <li v-for="f in PAID_FEATURES" :key="f.title">
          <span class="ft"><b>{{ f.title }}</b><small>{{ f.detail }}</small></span>
          <Check :size="18" color="var(--link)" />
        </li>
      </ul>
      <button v-if="!demo.isPaid" class="btn btn-primary btn-block" @click="start">Try Plus</button>
      <RouterLink v-else :to="next" class="btn btn-primary btn-block">{{ wanted ? `Continue to ${wanted}` : 'Continue' }}</RouterLink>
    </section>
    <p class="caption">Demo: Try Plus turns it on with no payment. Cancel any time.</p>
  </FlowShell>
</template>

<style scoped>
.plan { gap: 12px; padding: 20px; }
.plan.plus { border: 1.5px solid var(--sun); }
.top { display: flex; justify-content: space-between; align-items: flex-end; }
.top h3 { font-weight: 600; font-size: 22px; color: var(--cream); }
.price { display: flex; align-items: baseline; gap: 4px; }
.price .display { font-size: 40px; text-transform: none; color: var(--cream); }
.price small { font-size: 14px; color: var(--mute); }
.dim { font-size: 15px; }
ul { list-style: none; margin: 0; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-bottom: 1px solid var(--line); font-weight: 600; font-size: 16px; color: var(--white); }
.ft { display: flex; flex-direction: column; gap: 2px; }
.ft small { font-weight: 400; font-size: 13px; color: var(--dim); }
</style>
