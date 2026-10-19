<script setup>
import { ERROR_CODES, portfolioService, scansService, securitiesService } from '@/api'
import BrokerageConnectModal from '@/components/scan/BrokerageConnectModal.vue'
import TickerSearch from '@/components/scan/TickerSearch.vue'
import CategoryIcon from '@/components/ui/CategoryIcon.vue'
import SecurityLogo from '@/components/ui/SecurityLogo.vue'
import { useAsync } from '@/composables/useAsync'
import { useToast } from '@/composables/useToast'
import { useSessionStore } from '@/stores/session'
import { formatDate, formatMoney, timeAgo } from '@/utils/format'
import { CATEGORIES } from '@/utils/scoring'
import {
    ArrowRight,
    CircleCheck,
    Layers,
    Link2,
    ListPlus,
    Lock,
    RefreshCw,
    ScanSearch,
    ShieldCheck,
    Sparkles,
    TriangleAlert,
    X,
} from '@lucide/vue'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const session = useSessionStore()
const toast = useToast()

const { data: connections } = useAsync(() => portfolioService.listConnections())
const { data: brokerages } = useAsync(() => portfolioService.listBrokerages())
const { data: popular } = useAsync(() => securitiesService.popular())

const mode = ref(route.query.mode === 'manual' ? 'manual' : 'link')
const list = ref([])
const submitting = ref(false)
const limitError = ref(null)

const usage = computed(() => session.user?.usage)
const limit = computed(() => usage.value?.symbolsPerScan ?? null)
const outOfScans = computed(() => usage.value?.scansLimit !== null && usage.value?.scansUsed >= usage.value?.scansLimit)
const overLimit = computed(() => limit.value !== null && list.value.length > limit.value)
const hasEtf = computed(() => list.value.some((s) => s.type === 'etf'))
const selectedSymbols = computed(() => list.value.map((s) => s.symbol))

function add(security) {
  if (!selectedSymbols.value.includes(security.symbol)) list.value.push(security)
}

function remove(symbol) {
  list.value = list.value.filter((s) => s.symbol !== symbol)
}

async function addBulk(tokens) {
  const { found, unknown } = await securitiesService.lookup(tokens)
  found.forEach(add)
  if (unknown.length) {
    toast.info(`We don't have research on ${unknown.join(', ')} yet`, { description: 'Double-check the ticker, or try searching by name.' })
  }
}

const connect = ref({ open: false, brokerage: null, connection: null })

function linkBrokerage(brokerage) {
  connect.value = { open: true, brokerage, connection: null }
}

function useConnection(connection) {
  connect.value = { open: true, brokerage: null, connection }
}

function onLinked(connection) {
  const others = (connections.value ?? []).filter((c) => c.id !== connection.id)
  connections.value = [connection, ...others]
}

async function runScan(payload) {
  submitting.value = true
  limitError.value = null
  try {
    const { id } = await scansService.create(payload)
    connect.value.open = false
    session.refresh()
    router.push(`/app/scan/${id}/progress`)
  } catch (err) {
    connect.value.open = false
    if ([ERROR_CODES.SCAN_LIMIT_REACHED, ERROR_CODES.SYMBOL_LIMIT_EXCEEDED].includes(err.code)) limitError.value = err
    else toast.error("Couldn't start your scan", { description: err.message })
  } finally {
    submitting.value = false
  }
}

const runManual = () => runScan({ source: 'manual', holdings: list.value.map((s) => ({ symbol: s.symbol })) })
const runLinked = ({ connectionId, holdings }) => runScan({ source: 'linked', connectionId, holdings })
</script>

<template>
  <div class="page">
    <header class="page-head">
      <div>
        <h1 class="page-title">New scan</h1>
        <p class="page-sub">See how your investments line up with what you care about. It takes about a minute.</p>
      </div>
    </header>

    <div v-if="outOfScans" class="out card">
      <span class="out__icon"><Lock :size="20" /></span>
      <div class="grow">
        <p class="out__title">You've used your free scan for this month</p>
        <p class="muted">It resets {{ formatDate(usage.resetsAt) }}. Premium gives you unlimited scans whenever you're curious.</p>
      </div>
      <div class="out__actions">
        <RouterLink to="/app/plan" class="btn btn-primary"><Sparkles :size="16" /> See Premium</RouterLink>
        <RouterLink to="/app" class="btn btn-ghost">View past scans</RouterLink>
      </div>
    </div>

    <div class="modes" role="radiogroup" aria-label="How do you want to add investments?">
      <button
        type="button"
        role="radio"
        class="mode"
        :class="{ 'is-active': mode === 'link' }"
        :aria-checked="mode === 'link'"
        @click="mode = 'link'"
      >
        <span class="mode__icon"><Link2 :size="22" /></span>
        <span class="mode__text">
          <span class="mode__title">Link a portfolio</span>
          <span class="mode__desc">Connect your brokerage (read-only) and we'll pull in what you own.</span>
        </span>
        <span class="mode__radio" />
      </button>
      <button
        type="button"
        role="radio"
        class="mode"
        :class="{ 'is-active': mode === 'manual' }"
        :aria-checked="mode === 'manual'"
        @click="mode = 'manual'"
      >
        <span class="mode__icon mode__icon--lilac"><ListPlus :size="22" /></span>
        <span class="mode__text">
          <span class="mode__title">Build a list</span>
          <span class="mode__desc">Type stocks or ETFs you own, or ones you're thinking about buying.</span>
        </span>
        <span class="mode__radio" />
      </button>
    </div>

    <div v-if="limitError" class="callout callout-coral limit-error">
      <TriangleAlert :size="18" />
      <span>
        <strong>{{ limitError.message }}</strong>
        Upgrade to Premium for unlimited scans and holdings.
        <RouterLink to="/app/plan" class="link">See plans</RouterLink>
      </span>
    </div>

    <!-- Link mode -->
    <div v-if="mode === 'link'" class="layout">
      <div class="layout__main">
        <section v-if="connections?.length" class="card card-pad">
          <p class="card-title">Your linked accounts</p>
          <ul class="conns">
            <li v-for="c in connections" :key="c.id" class="conn">
              <span class="broker-mark" :style="{ background: c.color }">{{ c.brokerageName[0] }}</span>
              <span class="grow">
                <span class="conn__name">{{ c.brokerageName }}</span>
                <span class="conn__meta">
                  {{ c.holdings.length }} holdings · {{ formatMoney(c.totalValue) }} · synced {{ timeAgo(c.syncedAt) }}
                </span>
              </span>
              <button type="button" class="btn btn-primary btn-sm" :disabled="outOfScans || submitting" @click="useConnection(c)">
                Scan holdings <ArrowRight :size="15" />
              </button>
            </li>
          </ul>
        </section>

        <section class="card card-pad">
          <p class="card-title">{{ connections?.length ? 'Link another account' : 'Choose your brokerage' }}</p>
          <p class="card-sub">Read-only access. We can see what you own, never trade or move money.</p>
          <div class="brokers">
            <button
              v-for="b in brokerages ?? []"
              :key="b.id"
              type="button"
              class="broker"
              :disabled="outOfScans"
              @click="linkBrokerage(b)"
            >
              <span class="broker-mark" :style="{ background: b.color }">{{ b.name[0] }}</span>
              <span class="broker__name">{{ b.name }}</span>
            </button>
          </div>
          <p class="secure"><ShieldCheck :size="16" /> Connections are encrypted and handled by a regulated data partner.</p>
        </section>
      </div>

      <aside class="layout__side card card-pad">
        <p class="card-title">What happens next</p>
        <ol class="next">
          <li><span>1</span><p><strong>We read your holdings.</strong> Just tickers and amounts, nothing else.</p></li>
          <li><span>2</span><p><strong>ETFs get unpacked</strong> into every company inside them.</p></li>
          <li><span>3</span><p><strong>We score six values</strong> using filings, watchdogs and news.</p></li>
        </ol>
        <div class="next__values">
          <CategoryIcon v-for="cat in CATEGORIES" :key="cat.key" :category="cat.key" :size="34" :title="cat.label" />
        </div>
      </aside>
    </div>

    <!-- Manual mode -->
    <div v-else class="layout">
      <div class="layout__main">
        <section class="card card-pad">
          <p class="card-title">Add stocks or ETFs</p>
          <p class="card-sub">Search by ticker or company name.</p>
          <div class="search">
            <TickerSearch :selected="selectedSymbols" @select="add" @bulk="addBulk" />
            <p class="search__tip">Tip: paste a list like <code>NOVA, VOLT, BMKT</code> and press Enter.</p>
          </div>
          <div v-if="popular?.length" class="popular">
            <p class="popular__label">Popular with first-time investors</p>
            <div class="popular__chips">
              <button
                v-for="sec in popular"
                :key="sec.symbol"
                type="button"
                class="chip popular__chip"
                :class="{ 'is-added': selectedSymbols.includes(sec.symbol) }"
                @click="add(sec)"
              >
                <SecurityLogo :symbol="sec.symbol" :name="sec.name" :color="sec.color" :type="sec.type" :size="20" />
                {{ sec.symbol }}
                <CircleCheck v-if="selectedSymbols.includes(sec.symbol)" :size="14" class="popular__check" />
              </button>
            </div>
          </div>
        </section>
      </div>

      <aside class="layout__side card card-pad basket">
        <div class="row-between">
          <p class="card-title">Your list</p>
          <span class="basket__count num" :class="{ 'is-over': overLimit }">
            {{ list.length }}<template v-if="limit !== null"> / {{ limit }}</template>
          </span>
        </div>

        <TransitionGroup v-if="list.length" tag="ul" name="list" class="basket__list">
          <li v-for="sec in list" :key="sec.symbol" class="basket__item">
            <SecurityLogo :symbol="sec.symbol" :name="sec.name" :color="sec.color" :type="sec.type" :size="36" />
            <span class="grow basket__id">
              <span class="basket__symbol">
                {{ sec.symbol }} <span v-if="sec.type === 'etf'" class="badge badge-etf">ETF</span>
              </span>
              <span class="basket__name">{{ sec.name }}</span>
            </span>
            <button type="button" class="basket__remove" :aria-label="`Remove ${sec.symbol}`" @click="remove(sec.symbol)">
              <X :size="16" />
            </button>
          </li>
        </TransitionGroup>
        <div v-else class="basket__empty">
          <ScanSearch :size="22" />
          <p>Search or tap a popular pick to start your list.</p>
        </div>

        <div v-if="hasEtf" class="callout callout-lilac basket__note">
          <Layers :size="17" />
          <span>We'll unpack your ETFs and check every company inside.</span>
        </div>
        <div v-if="overLimit" class="callout callout-sun basket__note">
          <TriangleAlert :size="17" />
          <span>
            Free scans include up to {{ limit }}. Remove {{ list.length - limit }}, or
            <RouterLink to="/app/plan" class="link">go unlimited</RouterLink>.
          </span>
        </div>

        <button
          type="button"
          class="btn btn-primary btn-lg btn-block"
          :disabled="!list.length || overLimit || outOfScans || submitting"
          @click="runManual"
        >
          <span v-if="submitting" class="spinner" />
          <RefreshCw v-else :size="18" />
          {{ submitting ? 'Starting…' : `Run scan${list.length ? ` on ${list.length}` : ''}` }}
        </button>
        <p v-if="usage && usage.scansLimit !== null" class="basket__plan">
          Free plan · {{ Math.max(0, usage.scansLimit - usage.scansUsed) }} of {{ usage.scansLimit }} scan left this month
        </p>
      </aside>
    </div>

    <BrokerageConnectModal
      :open="connect.open"
      :brokerage="connect.brokerage"
      :connection="connect.connection"
      :limit="limit"
      @close="connect.open = false"
      @linked="onLinked"
      @confirm="runLinked"
    />
  </div>
</template>

<style scoped>
.out {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  padding: 20px 22px;
  background: linear-gradient(120deg, var(--sun-50), var(--surface));
}
.out__icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--sun-100);
  color: var(--sun-700);
}
.out__title {
  font-weight: 750;
}
.out__actions {
  display: flex;
  gap: 8px;
}
.modes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 22px;
}
.mode {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  border: 1.5px solid var(--line);
  border-radius: 22px;
  background: var(--surface);
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    background-color 0.2s;
}
.mode:hover {
  border-color: var(--line-strong);
}
.mode.is-active {
  border-color: var(--brand-400);
  background: var(--brand-25);
  box-shadow: var(--ring);
}
.mode__icon {
  display: grid;
  place-items: center;
  width: 50px;
  height: 50px;
  flex-shrink: 0;
  border-radius: 16px;
  background: var(--brand-50);
  color: var(--brand-600);
}
.mode__icon--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.mode__text {
  display: flex;
  flex-direction: column;
  flex: 1;
}
.mode__title {
  font-weight: 750;
  font-size: 16.5px;
}
.mode__desc {
  margin-top: 2px;
  font-size: 14px;
  color: var(--muted);
}
.mode__radio {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  border: 2px solid var(--line-strong);
  transition: all 0.2s;
}
.mode.is-active .mode__radio {
  border: 7px solid var(--brand-600);
}
.limit-error {
  margin-bottom: 18px;
}
.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 18px;
  align-items: start;
}
.layout__main {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.layout__side {
  position: sticky;
  top: 84px;
}
.conns {
  margin-top: 12px;
}
.conn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-top: 1px solid var(--line);
}
.conn:first-child {
  border-top: 0;
}
.conn__name {
  display: block;
  font-weight: 700;
}
.conn__meta {
  display: block;
  font-size: 13.5px;
  color: var(--muted);
}
.broker-mark {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 13px;
  color: #fff;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
}
.brokers {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}
.broker {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--surface);
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s var(--ease);
}
.broker:hover:not(:disabled) {
  border-color: var(--line-strong);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.broker:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.broker__name {
  font-weight: 650;
  font-size: 14.5px;
  line-height: 1.3;
}
.secure {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 18px;
  font-size: 13px;
  color: var(--muted);
}
.secure svg {
  color: var(--brand-500);
}
.next {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin: 16px 0 18px;
}
.next li {
  display: flex;
  gap: 12px;
  font-size: 14px;
  color: var(--ink-2);
}
.next li > span {
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--brand-50);
  color: var(--brand-700);
  font-size: 12.5px;
  font-weight: 750;
}
.next strong {
  color: var(--ink);
}
.next__values {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
}
.search {
  margin-top: 18px;
}
.search__tip {
  margin-top: 10px;
  font-size: 13px;
  color: var(--muted);
}
.search__tip code {
  padding: 2px 6px;
  border-radius: 6px;
  background: var(--bg-tint);
  font-size: 12.5px;
  color: var(--ink-2);
}
.popular {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
}
.popular__label {
  font-size: 13px;
  font-weight: 700;
  color: var(--muted);
}
.popular__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}
.popular__chip {
  height: 36px;
  padding-left: 7px;
}
.popular__chip.is-added {
  border-color: var(--brand-200);
  background: var(--brand-25);
}
.popular__check {
  color: var(--brand-600);
}
.basket {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.basket__count {
  padding: 3px 10px;
  border-radius: var(--radius-pill);
  background: var(--bg-tint);
  font-size: 13px;
  font-weight: 750;
}
.basket__count.is-over {
  background: var(--sun-100);
  color: var(--sun-700);
}
.basket__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.basket__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px;
  border-radius: 14px;
  background: var(--surface-muted);
}
.basket__id {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.basket__symbol {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 750;
  font-size: 14.5px;
}
.basket__name {
  font-size: 12.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.basket__remove {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  color: var(--muted);
}
.basket__remove:hover {
  background: var(--bg-tint);
  color: var(--ink);
}
.basket__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 28px 12px;
  border: 1.5px dashed var(--line-strong);
  border-radius: 18px;
  text-align: center;
  font-size: 14px;
  color: var(--muted);
}
.basket__note {
  font-size: 13.5px;
}
.basket__plan {
  font-size: 12.5px;
  color: var(--muted);
  text-align: center;
}

.list-enter-active,
.list-leave-active {
  transition:
    opacity 0.25s var(--ease),
    transform 0.25s var(--ease);
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(-8px);
}

@media (max-width: 1100px) {
  .brokers {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .layout__side {
    position: static;
  }
}
@media (max-width: 640px) {
  .modes {
    grid-template-columns: minmax(0, 1fr);
  }
  .mode {
    padding: 16px;
  }
  .conn {
    flex-wrap: wrap;
  }
  .conn .btn {
    width: 100%;
  }
}
</style>
