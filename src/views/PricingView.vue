<script setup>
import { billingService } from '@/api'
import ChangePlanModal from '@/components/billing/ChangePlanModal.vue'
import PricingTable from '@/components/billing/PricingTable.vue'
import { useSessionStore } from '@/stores/session'
import { ChevronDown, ShieldCheck } from '@lucide/vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const session = useSessionStore()
const router = useRouter()

const plans = ref([])
const subscription = ref(null)
const interval = ref('month')
const selected = ref(null)
const modalOpen = ref(false)

const faqs = [
  {
    q: 'Is outvest financial advice?',
    a: "No. We research how companies line up with values like climate and fair pay, then explain it in plain English. We never tell you what to buy or sell. That's always your call.",
  },
  {
    q: 'How do you score companies?',
    a: 'Every company gets a 0–100 score for six values, based on public filings, watchdog reports and news from 40+ sources. The combined score blends all six, and we always show the reasons behind each one.',
  },
  {
    q: 'What counts as a scan?',
    a: 'A scan is one check of a list of stocks or ETFs, linked from your brokerage or typed in by you. Free includes one scan a month with up to 5 holdings. Premium and Pro are unlimited.',
  },
  {
    q: 'How does monitoring work?',
    a: 'With Pro, we keep checking your holdings in the background. When news meaningfully changes a score, or an ETF rebalance is coming up, we email you a calm summary of what happened and why it matters.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Switch plans or cancel from Plan & billing whenever you like. Unused time is credited automatically, and your past scans stay in your account.',
  },
  {
    q: 'Is linking my brokerage safe?',
    a: 'Linking is read-only: we can see what you hold but can never trade or move money. Your brokerage login goes straight to your broker, not to us, and you can disconnect anytime.',
  },
]

onMounted(async () => {
  const [planList, sub] = await Promise.all([
    billingService.listPlans(),
    session.isAuthed ? billingService.getSubscription() : Promise.resolve(null),
  ])
  plans.value = planList
  subscription.value = sub
  if (sub) interval.value = sub.interval
})

function choose(plan) {
  if (!session.isAuthed) {
    router.push({ name: 'signup', query: plan.id === 'free' ? {} : { plan: plan.id, interval: interval.value } })
    return
  }
  selected.value = plan
  modalOpen.value = true
}

async function onChanged() {
  subscription.value = await billingService.getSubscription()
}
</script>

<template>
  <div class="pricing-page">
    <section class="container pricing-page__hero">
      <span class="eyebrow">Pricing</span>
      <h1 class="h-1">Simple plans. <span class="accent">Start free.</span></h1>
      <p class="lead">Try a scan on us. Go Premium for unlimited scans, or Pro and we'll keep watch for you.</p>
    </section>

    <section class="container">
      <PricingTable
        v-if="plans.length"
        v-model:interval="interval"
        :plans="plans"
        :current-plan-id="subscription?.planId ?? null"
        :current-interval="subscription?.interval ?? 'month'"
        @choose="choose"
      />
      <div v-else class="pricing-page__loading">
        <div v-for="n in 3" :key="n" class="skeleton" />
      </div>
      <p class="pricing-page__assure"><ShieldCheck :size="16" /> No hidden fees. Cancel anytime in two taps.</p>
    </section>

    <section class="container faq">
      <h2 class="h-2">Questions, answered</h2>
      <div class="faq__list">
        <details v-for="item in faqs" :key="item.q" class="faq__item">
          <summary>
            {{ item.q }}
            <ChevronDown :size="18" class="faq__chevron" />
          </summary>
          <p>{{ item.a }}</p>
        </details>
      </div>
    </section>

    <ChangePlanModal
      :open="modalOpen"
      :plan="selected"
      :interval="interval"
      :subscription="subscription"
      @close="modalOpen = false"
      @changed="onChanged"
    />
  </div>
</template>

<style scoped>
.pricing-page__hero {
  max-width: 720px;
  padding-top: 64px;
  padding-bottom: 40px;
  text-align: center;
}
.pricing-page__hero .h-1 {
  margin-top: 12px;
}
.pricing-page__hero .lead {
  margin-top: 14px;
}
.pricing-page__loading {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18px;
  margin-top: 64px;
}
.pricing-page__loading .skeleton {
  height: 560px;
  border-radius: 28px;
}
.pricing-page__assure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 28px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
.faq {
  max-width: 820px;
  padding-top: 96px;
}
.faq .h-2 {
  text-align: center;
}
.faq__list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 32px;
}
.faq__item {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--surface);
  transition: box-shadow 0.25s var(--ease);
}
.faq__item[open] {
  box-shadow: var(--shadow-sm);
}
.faq__item summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  font-weight: 700;
  font-size: 16px;
  cursor: pointer;
  list-style: none;
}
.faq__item summary::-webkit-details-marker {
  display: none;
}
.faq__chevron {
  flex-shrink: 0;
  color: var(--muted);
  transition: transform 0.25s var(--ease);
}
.faq__item[open] .faq__chevron {
  transform: rotate(180deg);
}
.faq__item p {
  padding: 0 22px 20px;
  color: var(--ink-2);
}
@media (max-width: 960px) {
  .pricing-page__loading {
    grid-template-columns: 1fr;
  }
}
</style>
