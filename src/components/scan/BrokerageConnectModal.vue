<script setup>
import { portfolioService } from '@/api'
import BrandLogo from '@/components/ui/BrandLogo.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { formatMoney } from '@/utils/format'
import { ArrowRight, Eye, Lock, RefreshCw, ShieldCheck, TriangleAlert, Unplug } from '@lucide/vue'
import { computed, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  brokerage: { type: Object, default: null },
  connection: { type: Object, default: null },
  limit: { type: Number, default: null },
})
const emit = defineEmits(['close', 'confirm', 'linked'])

const step = ref('connecting')
const linked = ref(null)
const picked = ref([])
const error = ref('')

const total = computed(() =>
  linked.value ? linked.value.holdings.filter((h) => picked.value.includes(h.symbol)).reduce((sum, h) => sum + h.value, 0) : 0,
)
const overLimit = computed(() => props.limit !== null && picked.value.length > props.limit)

function pickDefaults(connection) {
  linked.value = connection
  const symbols = connection.holdings.map((h) => h.symbol)
  picked.value = props.limit !== null ? symbols.slice(0, props.limit) : symbols
  step.value = 'select'
}

async function connect() {
  step.value = 'connecting'
  error.value = ''
  try {
    const connection = await portfolioService.link(props.brokerage.id)
    emit('linked', connection)
    pickDefaults(connection)
  } catch (err) {
    error.value = err.message
    step.value = 'error'
  }
}

watch(
  () => props.open,
  (open) => {
    if (!open) return
    if (props.connection) pickDefaults(props.connection)
    else connect()
  },
)

function toggle(symbol) {
  picked.value = picked.value.includes(symbol) ? picked.value.filter((s) => s !== symbol) : [...picked.value, symbol]
}

function confirm() {
  emit('confirm', {
    connectionId: linked.value.id,
    holdings: linked.value.holdings.filter((h) => picked.value.includes(h.symbol)).map((h) => ({ symbol: h.symbol, value: h.value })),
  })
}

const brokerName = computed(() => props.connection?.brokerageName ?? props.brokerage?.name ?? 'your brokerage')
const brokerColor = computed(() => props.connection?.color ?? props.brokerage?.color ?? '#999')
</script>

<template>
  <UiModal :open="open" size="md" label="Link your portfolio" :dismissible="step !== 'connecting'" @close="emit('close')">
    <div v-if="step === 'connecting'" class="connect">
      <div class="connect__visual">
        <span class="connect__broker" :style="{ background: brokerColor }">{{ brokerName[0] }}</span>
        <span class="connect__dots"><span /><span /><span /></span>
        <BrandLogo :size="52" :show-wordmark="false" />
      </div>
      <h2 class="connect__title">Connecting to {{ brokerName }}…</h2>
      <p class="muted">This usually takes a few seconds.</p>
      <ul class="connect__promises">
        <li><Eye :size="18" /> <span><strong>Read-only.</strong> We can see what you own, never trade or move money.</span></li>
        <li><Lock :size="18" /> <span><strong>Encrypted.</strong> Your login goes straight to {{ brokerName }}, never to us.</span></li>
        <li><Unplug :size="18" /> <span><strong>Your call.</strong> Disconnect anytime from Settings.</span></li>
      </ul>
    </div>

    <div v-else-if="step === 'error'" class="connect">
      <span class="connect__error-icon"><TriangleAlert :size="26" /></span>
      <h2 class="connect__title">That didn't go through</h2>
      <p class="muted">{{ error || `We couldn't reach ${brokerName}. Nothing was changed.` }}</p>
      <button type="button" class="btn btn-primary" @click="connect"><RefreshCw :size="16" /> Try again</button>
    </div>

    <div v-else-if="linked" class="select">
      <p class="eyebrow"><ShieldCheck :size="15" /> Connected to {{ linked.brokerageName }}</p>
      <h2 class="select__title">Which holdings should we check?</h2>
      <p class="muted">
        We found {{ linked.holdings.length }} holdings worth {{ formatMoney(linked.totalValue) }}.
        <template v-if="limit !== null">Your Free plan covers up to {{ limit }} per scan.</template>
      </p>

      <ul class="select__list">
        <li v-for="h in linked.holdings" :key="h.symbol">
          <label class="select__row" :class="{ 'is-off': !picked.includes(h.symbol) }">
            <input type="checkbox" :checked="picked.includes(h.symbol)" @change="toggle(h.symbol)" />
            <SecurityLogo :symbol="h.symbol" :name="h.name" :color="h.color" :type="h.type" :size="36" />
            <span class="select__id">
              <span class="select__symbol">{{ h.symbol }} <span v-if="h.type === 'etf'" class="badge badge-etf">ETF</span></span>
              <span class="select__name">{{ h.name }}</span>
            </span>
            <span class="select__value num">{{ formatMoney(h.value) }}</span>
          </label>
        </li>
      </ul>

      <div v-if="overLimit" class="callout callout-sun select__limit">
        <TriangleAlert :size="18" />
        <span>
          Free scans include up to {{ limit }} holdings. Untick {{ picked.length - limit }} more, or
          <RouterLink to="/app/plan" class="link" @click="emit('close')">upgrade for unlimited</RouterLink>.
        </span>
      </div>

      <button type="button" class="btn btn-primary btn-lg btn-block" :disabled="!picked.length || overLimit" @click="confirm">
        Scan {{ picked.length }} {{ picked.length === 1 ? 'holding' : 'holdings' }}
        <span v-if="picked.length" class="select__total">· {{ formatMoney(total) }}</span>
        <ArrowRight :size="18" />
      </button>
    </div>
  </UiModal>
</template>

<style scoped>
.connect {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0 4px;
  text-align: center;
}
.connect__visual {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 18px;
}
.connect__broker {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  color: #fff;
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
}
.connect__dots {
  display: flex;
  gap: 6px;
}
.connect__dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-400);
  animation: dot 1.2s ease-in-out infinite;
}
.connect__dots span:nth-child(2) {
  animation-delay: 0.15s;
}
.connect__dots span:nth-child(3) {
  animation-delay: 0.3s;
}
@keyframes dot {
  0%,
  100% {
    opacity: 0.25;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}
.connect__title {
  font-size: 26px;
}
.connect__promises {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 20px;
  padding: 18px;
  border-radius: 18px;
  background: var(--surface-muted);
  text-align: left;
  font-size: 14px;
  color: var(--ink-2);
}
.connect__promises li {
  display: flex;
  gap: 12px;
}
.connect__promises svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--brand-600);
}
.connect__error-icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  margin-bottom: 8px;
  border-radius: 18px;
  background: var(--coral-50);
  color: var(--coral-500);
}
.connect .btn {
  margin-top: 16px;
}
.select__title {
  margin-top: 10px;
  font-size: 26px;
}
.select .muted {
  margin-top: 6px;
}
.select__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 18px 0;
}
.select__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  cursor: pointer;
  transition:
    opacity 0.2s,
    border-color 0.2s;
}
.select__row:hover {
  border-color: var(--line-strong);
}
.select__row.is-off {
  opacity: 0.55;
}
.select__id {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.select__symbol {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 750;
}
.select__name {
  font-size: 13px;
  color: var(--muted);
}
.select__value {
  font-weight: 650;
}
.select__limit {
  margin-bottom: 14px;
}
.select__total {
  opacity: 0.75;
  font-weight: 600;
}
</style>
