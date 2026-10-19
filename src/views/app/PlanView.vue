<script setup>
import { billingService } from '@/api'
import ChangePlanModal from '@/components/billing/ChangePlanModal.vue'
import PricingTable from '@/components/billing/PricingTable.vue'
import PlanBadge from '@/components/ui/PlanBadge.vue'
import { useSessionStore } from '@/stores/session'
import { formatDate, formatDateLong, formatMoney } from '@/utils/format'
import { CircleCheck, CircleMinus, CreditCard, Infinity as InfinityIcon, Receipt } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()

const loading = ref(true)
const plans = ref([])
const subscription = ref(null)
const invoices = ref([])
const interval = ref('month')
const selected = ref(null)
const modalOpen = ref(false)

const currentPlan = computed(() => plans.value.find((p) => p.id === subscription.value?.planId))
const usage = computed(() => subscription.value?.usage)
const usagePct = computed(() => (usage.value?.scansLimit ? Math.min(100, (usage.value.scansUsed / usage.value.scansLimit) * 100) : 0))

onMounted(async () => {
  const [planList, sub, invoiceList] = await Promise.all([
    billingService.listPlans(),
    billingService.getSubscription(),
    billingService.listInvoices(),
  ])
  plans.value = planList
  subscription.value = sub
  invoices.value = invoiceList
  interval.value = route.query.interval === 'year' ? 'year' : sub.interval
  loading.value = false

  const target = planList.find((p) => p.id === route.query.upgrade)
  if (target && target.id !== sub.planId) choose(target)
  if (route.query.upgrade) router.replace({ query: {} })
})

function choose(plan) {
  selected.value = plan
  modalOpen.value = true
}

async function onChanged() {
  const [sub, invoiceList] = await Promise.all([billingService.getSubscription(), billingService.listInvoices()])
  subscription.value = sub
  invoices.value = invoiceList
}
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">Plan & billing</h1>
        <p class="page-sub">Switch plans whenever you like. No pressure, no penalties.</p>
      </div>
    </header>

    <div v-if="loading" class="stack gap-4">
      <div class="skeleton" style="height: 170px" />
      <div class="skeleton" style="height: 520px" />
    </div>

    <template v-else>
      <section class="current card">
        <div class="current__block">
          <p class="current__label">Current plan</p>
          <div class="current__name-row">
            <h2 class="current__name">{{ currentPlan.name }}</h2>
            <PlanBadge :plan-id="currentPlan.id" />
          </div>
          <p class="current__line">
            {{ subscription.price === 0 ? 'Free forever' : `${formatMoney(subscription.price)} / ${subscription.interval === 'year' ? 'year' : 'month'}` }}
          </p>
          <p class="muted text-sm">
            <template v-if="subscription.renewsAt">Renews {{ formatDateLong(subscription.renewsAt) }}</template>
            <template v-else>{{ currentPlan.tagline }}</template>
          </p>
        </div>

        <div class="current__block">
          <p class="current__label">Scans this month</p>
          <template v-if="usage.scansLimit !== null">
            <p class="current__big num">{{ usage.scansUsed }}<span> / {{ usage.scansLimit }}</span></p>
            <div class="meter"><span :style="{ width: `${usagePct}%` }" /></div>
            <p class="muted text-sm">Resets {{ formatDate(usage.resetsAt) }} · up to {{ usage.symbolsPerScan }} holdings each</p>
          </template>
          <template v-else>
            <p class="current__big"><InfinityIcon :size="26" /> Unlimited</p>
            <p class="muted text-sm">{{ usage.scansUsed }} {{ usage.scansUsed === 1 ? 'scan' : 'scans' }} so far this month</p>
          </template>
        </div>

        <div class="current__block">
          <p class="current__label">Monitoring & alerts</p>
          <p v-if="session.isPro" class="current__status is-on"><CircleCheck :size="18" /> Included</p>
          <p v-else class="current__status"><CircleMinus :size="18" /> Not included</p>
          <RouterLink v-if="session.isPro" to="/app/monitoring" class="link text-sm">Manage monitoring →</RouterLink>
          <p v-else class="muted text-sm">Available on Pro</p>
        </div>
      </section>

      <section class="change">
        <h2 class="section-title">Change plan</h2>
        <PricingTable
          v-model:interval="interval"
          :plans="plans"
          :current-plan-id="subscription.planId"
          :current-interval="subscription.interval"
          @choose="choose"
        />
      </section>

      <div class="billing">
        <section class="card card-pad">
          <p class="card-title">Payment method</p>
          <div v-if="subscription.paymentMethod" class="pm">
            <span class="pm__icon"><CreditCard :size="20" /></span>
            <span class="grow">
              <strong>{{ subscription.paymentMethod.brand }} •••• {{ subscription.paymentMethod.last4 }}</strong>
              <span class="muted text-sm">
                Expires {{ String(subscription.paymentMethod.expMonth).padStart(2, '0') }}/{{ String(subscription.paymentMethod.expYear).slice(-2) }}
              </span>
            </span>
          </div>
          <p v-else class="muted pm__empty">No card on file. You'll add one if you upgrade.</p>
        </section>

        <section class="card invoices">
          <p class="card-title invoices__title"><Receipt :size="17" /> Billing history</p>
          <table v-if="invoices.length" class="invoices__table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th class="num">Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice.id">
                <td>{{ formatDate(invoice.date, { month: 'short', day: 'numeric', year: 'numeric' }) }}</td>
                <td>{{ invoice.description }}</td>
                <td class="num">{{ formatMoney(invoice.amount) }}</td>
                <td><span class="badge badge-brand">Paid</span></td>
              </tr>
            </tbody>
          </table>
          <p v-else class="muted invoices__empty">No invoices yet. That's the beauty of Free.</p>
        </section>
      </div>
    </template>

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
.current {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 40px;
}
.current__block {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
}
.current__block + .current__block {
  border-left: 1px solid var(--line);
}
.current__label {
  font-size: 12.5px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--subtle);
}
.current__name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.current__name {
  font-size: 32px;
}
.current__line {
  font-weight: 650;
}
.current__big {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 30px;
  font-weight: 780;
  letter-spacing: -0.03em;
  line-height: 1.2;
}
.current__big span {
  font-size: 18px;
  font-weight: 600;
  color: var(--muted);
}
.meter {
  height: 8px;
  border-radius: var(--radius-pill);
  background: var(--bg-tint);
  overflow: hidden;
}
.meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--brand-400), var(--brand-600));
}
.current__status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 700;
  color: var(--muted);
}
.current__status.is-on {
  color: var(--brand-600);
}
.change .section-title {
  margin-bottom: 4px;
}
.billing {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr);
  gap: 18px;
  margin-top: 40px;
}
.pm {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
  padding: 14px;
  border-radius: 16px;
  background: var(--surface-muted);
  border: 1px solid var(--line);
}
.pm .grow {
  display: flex;
  flex-direction: column;
}
.pm__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.pm__empty {
  margin-top: 12px;
}
.invoices__title {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 22px 24px 10px;
}
.invoices__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
.invoices__table th {
  padding: 10px 24px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: left;
  color: var(--subtle);
  border-bottom: 1px solid var(--line);
}
.invoices__table td {
  padding: 14px 24px;
  border-bottom: 1px solid var(--line);
}
.invoices__table tr:last-child td {
  border-bottom: 0;
}
.invoices__table .num {
  text-align: right;
}
.invoices__empty {
  padding: 8px 24px 24px;
}

@media (max-width: 900px) {
  .current {
    grid-template-columns: minmax(0, 1fr);
  }
  .current__block + .current__block {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .billing {
    grid-template-columns: minmax(0, 1fr);
  }
}
@media (max-width: 640px) {
  .invoices__table th,
  .invoices__table td {
    padding-left: 14px;
    padding-right: 14px;
  }
  .invoices__table th:nth-child(2),
  .invoices__table td:nth-child(2) {
    display: none;
  }
}
</style>
