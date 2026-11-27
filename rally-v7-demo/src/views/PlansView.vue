<script setup>
import { Check } from '@lucide/vue'
import FlowShell from '../components/FlowShell.vue'

const plans = [
  { name: 'Free', price: '$0', sub: 'Everything you need to check a fund.', feats: ['Check one fund at a time', 'Pick your lines', 'Every company, flag and source', 'Share your receipt'], cta: 'Your Plan' },
  { name: 'Plus', price: '$9.99', per: '/month', sub: 'For people who want Rally to keep watching.', feats: ['Check every fund you own', 'Connect your investing accounts', 'Build a basket without the companies you pick', 'Daily alerts on companies you own'], cta: 'Try Plus', primary: true },
]
</script>

<template>
  <FlowShell label="Plans" title="Pick your plan." body="Checking a fund is always free. Plus is for people who want Rally to keep watching their money.">
    <div v-for="p in plans" :key="p.name" class="card-pad plan" :class="{ plus: p.primary }">
      <div class="top">
        <h3>{{ p.name }}</h3>
        <p class="price"><span class="display" :style="{ color: p.primary ? 'var(--sun)' : 'var(--cream)' }">{{ p.price }}</span><small v-if="p.per">{{ p.per }}</small></p>
      </div>
      <p class="dim">{{ p.sub }}</p>
      <ul>
        <li v-for="f in p.feats" :key="f">{{ f }} <Check :size="18" color="var(--link)" /></li>
      </ul>
      <RouterLink v-if="p.primary" to="/home" class="btn btn-primary btn-block">{{ p.cta }}</RouterLink>
      <span v-else class="btn btn-secondary btn-block" style="cursor: default">{{ p.cta }}</span>
    </div>
    <p class="caption">Cancel any time.</p>
  </FlowShell>
</template>

<style scoped>
.plan { gap: 12px; padding: 20px; }
.plan.plus { border: 1.5px solid var(--sun); }
.top { display: flex; justify-content: space-between; align-items: flex-end; }
.top h3 { font-weight: 600; font-size: 22px; color: var(--cream); }
.price { display: flex; align-items: baseline; gap: 4px; }
.price .display { font-size: 40px; text-transform: none; }
.price small { font-size: 14px; color: var(--mute); }
.dim { font-size: 15px; }
ul { list-style: none; margin: 0; padding: 0; }
li { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); font-weight: 600; font-size: 16px; color: var(--white); }
</style>
