<script setup>
import AppStoreButtons from '@/components/ui/AppStoreButtons.vue'
import { useSessionStore } from '@/stores/session'
import { ArrowRight, Check, ChevronDown, ShieldCheck } from '@lucide/vue'

const session = useSessionStore()

const plans = [
  {
    name: 'Build, workshop and publish',
    price: 'Free',
    note: 'No card needed',
    description: 'Everything you need to turn an idea into a thesis you’d put your name on.',
    features: [
      'Pitch ideas in plain language',
      'AI copilot: claims, evidence checks and the strongest arguments against',
      'Backtests of a similar basket against the S&P 500',
      'Swap companies and update your thesis anytime',
      'Publish to the community and build a public track record',
      'Follow other members’ theses',
    ],
  },
  {
    name: 'Invest',
    price: 'From $10',
    note: 'Through Outvest’s registered brokerage partner',
    description: 'When your thesis is ready, own the whole basket in one tap.',
    features: [
      'Open a brokerage account in the app in about five minutes',
      'Buy your basket in fractional shares, starting at $10',
      'Rebalancing on the schedule you pick',
      'Alerts only when news affects your thesis',
    ],
    highlight: true,
  },
]

const faqs = [
  {
    q: 'Is Outvest financial advice?',
    a: 'No. The copilot helps you test your own idea: it lays out the claims your thesis depends on, the evidence for and against them, the strongest counterarguments, and how a similar basket did in the past. Every decision is yours.',
  },
  {
    q: 'What does Outvest cost?',
    a: 'Building, workshopping and publishing a thesis is free. Investing requires opening a brokerage account in the app, which takes about five minutes.',
  },
  {
    q: 'How does investing work?',
    a: 'When your thesis is ready, you can buy the whole basket in one tap, in fractional shares starting at $10. Your account is held with Outvest’s registered brokerage partner.',
  },
  {
    q: 'How does rebalancing work?',
    a: 'You pick the schedule: monthly, quarterly, twice a year or yearly. On that schedule, Outvest brings the basket back to its target weights. You can change the schedule anytime.',
  },
  {
    q: 'What alerts will I get?',
    a: 'Only ones that matter to your thesis: news that strengthens or weakens one of its claims, plus a heads-up before a scheduled rebalance. No daily market noise.',
  },
  {
    q: 'What happens when I publish a thesis?',
    a: 'Members can question your assumptions, suggest companies and follow your thesis. Your track record starts the day you publish and stays public, good calls and bad.',
  },
  {
    q: 'Which themes can I invest in?',
    a: 'Climate is the first collection, covering ideas like building electrification, EVs, solar, the grid, nuclear and adaptation. Outvest plans to add more themes.',
  },
  {
    q: 'Where can I use Outvest?',
    a: 'Outvest is a free download on iOS and Android.',
  },
]
</script>

<template>
  <div class="pricing-page">
    <section class="container pricing-page__hero">
      <span class="eyebrow">Pricing</span>
      <h1 class="h-1">Free to build. <span class="accent">Invest from $10.</span></h1>
      <p class="lead">
        Test as many ideas as you like with the copilot and the community. Open a brokerage account only when you’re ready
        to own one.
      </p>
    </section>

    <section class="container plans">
      <article v-for="plan in plans" :key="plan.name" class="plan" :class="{ 'plan--highlight': plan.highlight }">
        <h2 class="plan__name">{{ plan.name }}</h2>
        <p class="plan__price">{{ plan.price }}</p>
        <p class="plan__note">{{ plan.note }}</p>
        <p class="plan__description">{{ plan.description }}</p>
        <ul class="plan__features">
          <li v-for="feature in plan.features" :key="feature">
            <span class="plan__check"><Check :size="14" :stroke-width="3" /></span>
            {{ feature }}
          </li>
        </ul>
      </article>
    </section>

    <section class="container start">
      <RouterLink :to="session.isAuthed ? '/app/pitch' : '/signup'" class="btn btn-primary btn-lg">
        {{ session.isAuthed ? 'Pitch a new idea' : 'Start free' }} <ArrowRight :size="18" />
      </RouterLink>
      <span class="muted">or get the app</span>
      <AppStoreButtons />
    </section>
    <p class="container pricing-page__assure">
      <ShieldCheck :size="16" /> Not investment advice. Investing involves risk, including loss of principal.
    </p>

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
  </div>
</template>

<style scoped>
.pricing-page {
  padding-bottom: 104px;
}
.pricing-page__hero {
  max-width: 900px;
  padding-top: 72px;
  padding-bottom: 44px;
  text-align: center;
}
.pricing-page__hero .h-1 {
  margin-top: 14px;
}
.pricing-page__hero .lead {
  max-width: 640px;
  margin: 16px auto 0;
}
.plans {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  max-width: 960px;
}
.plan {
  display: flex;
  flex-direction: column;
  padding: 30px 28px;
  border: var(--outline);
  border-radius: 28px;
  background: var(--surface);
  box-shadow: var(--shadow);
}
.plan--highlight {
  background: var(--sun-100);
  box-shadow: var(--shadow-lg);
}
.plan__name {
  font-size: 30px;
  line-height: 1;
}
.plan__price {
  margin-top: 14px;
  font-family: var(--font-display);
  font-size: 64px;
  line-height: 0.9;
  text-transform: uppercase;
}
.plan__note {
  margin-top: 10px;
  font-size: 13.5px;
  color: var(--muted);
}
.plan__description {
  margin-top: 16px;
  color: var(--ink-2);
}
.plan__features {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 22px;
  padding-top: 20px;
  border-top: 2px dashed var(--ink-solid);
  font-size: 14.5px;
}
.plan__features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
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
.start {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 44px;
}
.pricing-page__assure {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 24px;
  font-size: 14px;
  font-weight: 600;
  color: var(--muted);
}
.faq {
  max-width: 840px;
  padding-top: 96px;
}
.faq .h-2 {
  text-align: center;
}
.faq__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 32px;
}
.faq__item {
  border: var(--outline-thin);
  border-radius: 18px;
  background: var(--surface);
  transition:
    box-shadow 0.2s var(--ease),
    transform 0.2s var(--ease);
}
.faq__item:hover {
  box-shadow: var(--shadow-xs);
}
.faq__item[open] {
  box-shadow: var(--shadow-sm);
  transform: translate(-2px, -2px);
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
  transition: transform 0.25s var(--ease);
}
.faq__item[open] .faq__chevron {
  transform: rotate(180deg);
}
.faq__item p {
  padding: 0 22px 20px;
  color: var(--ink-2);
}
@media (max-width: 820px) {
  .plans {
    grid-template-columns: minmax(0, 1fr);
    max-width: 520px;
  }
}
@media (max-width: 640px) {
  .pricing-page__hero {
    padding-top: 48px;
  }
  .plan__price {
    font-size: 54px;
  }
}
</style>
