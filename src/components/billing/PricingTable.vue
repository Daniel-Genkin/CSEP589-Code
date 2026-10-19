<script setup>
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import { formatMoney } from '@/utils/format'
import { Check, Sparkles, X } from '@lucide/vue'

const props = defineProps({
  plans: { type: Array, required: true },
  currentPlanId: { type: String, default: null },
  currentInterval: { type: String, default: 'month' },
  busy: { type: Boolean, default: false },
})
const emit = defineEmits(['choose'])
const interval = defineModel('interval', { type: String, default: 'month' })

const TIER = { free: 0, premium: 1, pro: 2 }
const intervalOptions = [
  { value: 'month', label: 'Monthly' },
  { value: 'year', label: 'Yearly', badge: 'Save 20%' },
]

const isCurrent = (plan) =>
  plan.id === props.currentPlanId && (plan.id === 'free' || interval.value === props.currentInterval)

const monthlyPrice = (plan) => (interval.value === 'year' ? plan.prices.year / 12 : plan.prices.month)

function billingNote(plan) {
  if (plan.prices.month === 0) return 'Free forever. No card needed.'
  return interval.value === 'year'
    ? `Billed ${formatMoney(plan.prices.year)} once a year`
    : 'Billed monthly. Cancel anytime.'
}

function ctaLabel(plan) {
  if (!props.currentPlanId) return plan.id === 'free' ? 'Start for free' : `Get ${plan.name}`
  if (isCurrent(plan)) return 'Your current plan'
  if (plan.id === props.currentPlanId) return `Switch to ${interval.value === 'year' ? 'yearly' : 'monthly'}`
  return TIER[plan.id] > TIER[props.currentPlanId] ? `Upgrade to ${plan.name}` : `Switch to ${plan.name}`
}

function ctaClass(plan) {
  if (isCurrent(plan)) return 'btn-secondary'
  if (props.currentPlanId && TIER[plan.id] < TIER[props.currentPlanId]) return 'btn-secondary'
  return plan.popular ? 'btn-primary' : 'btn-dark'
}
</script>

<template>
  <div class="pricing">
    <div class="pricing__toggle">
      <SegmentedControl v-model="interval" :options="intervalOptions" label="Billing interval" />
    </div>

    <div class="pricing__grid">
      <article
        v-for="plan in plans"
        :key="plan.id"
        class="plan"
        :class="{ 'plan--popular': plan.popular, 'plan--current': isCurrent(plan) }"
      >
        <span v-if="isCurrent(plan)" class="plan__flag plan__flag--current">Current plan</span>
        <span v-else-if="plan.popular" class="plan__flag"><Sparkles :size="13" /> Most popular</span>

        <h3 class="plan__name">{{ plan.name }}</h3>
        <p class="plan__tagline">{{ plan.tagline }}</p>

        <div class="plan__price">
          <span class="plan__amount num">{{ formatMoney(monthlyPrice(plan)) }}</span>
          <span class="plan__per">/ month</span>
        </div>
        <p class="plan__billing">{{ billingNote(plan) }}</p>
        <p class="plan__description">{{ plan.description }}</p>

        <button
          type="button"
          class="btn btn-lg btn-block plan__cta"
          :class="ctaClass(plan)"
          :disabled="isCurrent(plan) || busy"
          @click="emit('choose', plan)"
        >
          {{ ctaLabel(plan) }}
        </button>

        <ul class="plan__features">
          <li v-for="feature in plan.features" :key="feature.label" :class="{ 'is-off': !feature.included }">
            <span class="plan__check">
              <Check v-if="feature.included" :size="14" :stroke-width="3" />
              <X v-else :size="13" :stroke-width="2.6" />
            </span>
            {{ feature.label }}
          </li>
        </ul>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pricing__toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 28px;
}
.pricing__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
  align-items: stretch;
}
.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 30px 26px 26px;
  border: 1px solid var(--line);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}
.plan--popular {
  border-color: transparent;
  background:
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(150deg, var(--brand-300), var(--lilac-500)) border-box;
  border: 1.5px solid transparent;
  box-shadow: var(--shadow-lg);
}
.plan--current {
  background: linear-gradient(180deg, var(--brand-25), var(--surface));
  border-color: var(--brand-200);
}
.plan__flag {
  position: absolute;
  top: -13px;
  left: 26px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 12px;
  border-radius: var(--radius-pill);
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
}
.plan__flag--current {
  background: var(--brand-600);
}
.plan__name {
  font-family: var(--font-display);
  font-variation-settings: 'SOFT' 100;
  font-size: 28px;
  font-weight: 560;
  letter-spacing: -0.02em;
}
.plan__tagline {
  margin-top: 2px;
  color: var(--muted);
}
.plan__price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-top: 22px;
}
.plan__amount {
  font-size: 44px;
  font-weight: 780;
  letter-spacing: -0.04em;
  line-height: 1;
}
.plan__per {
  font-size: 15px;
  color: var(--muted);
  font-weight: 600;
}
.plan__billing {
  margin-top: 8px;
  font-size: 13.5px;
  color: var(--muted);
}
.plan__description {
  margin-top: 16px;
  font-size: 14.5px;
  color: var(--ink-2);
  min-height: 44px;
}
.plan__cta {
  margin-top: 20px;
}
.plan__features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 24px;
  padding-top: 22px;
  border-top: 1px solid var(--line);
  font-size: 14.5px;
}
.plan__features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.plan__features li.is-off {
  color: var(--subtle);
}
.plan__check {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 1px;
  border-radius: 50%;
  background: var(--brand-100);
  color: var(--brand-700);
}
.is-off .plan__check {
  background: var(--bg-tint);
  color: var(--subtle);
}

@media (max-width: 960px) {
  .pricing__grid {
    grid-template-columns: minmax(0, 1fr);
    max-width: 480px;
    margin: 0 auto;
    gap: 26px;
  }
}
</style>
