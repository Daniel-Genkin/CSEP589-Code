<script setup lang="ts">
// F6 Connect brokerage (paid). Pick a broker; a short simulated connection loads the connected
// sample account. Rally only reads what you own: the money stays at your broker, and trades
// need separate approval. No Figma frame: built from docs/STYLE.md.
import ConnectedBadge from '@/components/rally/ConnectedBadge.vue'
import UiModal from '@/components/ui/UiModal.vue'
import { BROKERS, CAPABILITY_LABEL, CONNECT_MS, type Broker, brokerById } from '@/config/brokers'
import { provider } from '@/data'
import { useDemoStore } from '@/state/demo'
import { plural, usd } from '@/utils/format'
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'

const demo = useDemoStore()
const router = useRouter()

const connecting = ref<Broker | null>(null)
const failed = ref(false)
let attempt = 0
/** The button that opened the dialog, so focus can go back to it. */
let trigger: HTMLElement | null = null
const modal = ref<{ focus: () => void } | null>(null)
const brokersTitle = ref<HTMLElement | null>(null)
/** What just happened, for a screen reader: the section it describes may have been removed. */
const notice = ref('')

const connected = computed(() => (demo.isConnected ? brokerById(demo.portfolio?.brokerId) : null))
const DOT: Record<Broker['capability'], string> = { trades: 'var(--pass)', case_by_case: 'var(--sun)', list_only: 'var(--brand-400)' }

async function connect(broker: Broker, event?: Event) {
  const mine = ++attempt
  if (event?.currentTarget instanceof HTMLElement && !connecting.value) trigger = event.currentTarget
  connecting.value = broker
  failed.value = false
  notice.value = ''
  try {
    // The connection is simulated: wait about a second and a half, then load the sample account.
    const [account] = await Promise.all([provider.getSamplePortfolio('connected'), new Promise((resolve) => setTimeout(resolve, CONNECT_MS))])
    if (mine !== attempt) return // cancelled, or another broker was picked meanwhile
    demo.connect({ ...account, brokerId: broker.id })
    connecting.value = null
    router.push('/portfolio')
  } catch {
    if (mine === attempt) failed.value = true
  }
}

function cancel() {
  attempt += 1
  connecting.value = null
  failed.value = false
  const back = trigger
  trigger = null
  void nextTick(() => back?.isConnected && back.focus())
}

/** "Try again" is removed when the attempt restarts, so move focus to the dialog. */
function retry(broker: Broker) {
  void connect(broker)
  modal.value?.focus()
}

function disconnect() {
  const name = connected.value?.name ?? 'Your broker'
  demo.disconnect()
  notice.value = demo.portfolio ? `${name} disconnected. Back to ${demo.portfolio.name}.` : `${name} disconnected.`
  // The card that held the button is gone.
  void nextTick(() => brokersTitle.value?.focus())
}
onBeforeUnmount(() => (attempt += 1))
</script>

<template>
  <div class="page">
    <header class="page-head">
      <p class="eyebrow">Your Rally · Connect brokerage · paid plan · sample data</p>
      <h1 class="page-title">Bring your<br />account.</h1>
      <p class="lead">Rally reads what you own. The money stays at your broker.</p>
      <ul class="trust">
        <li class="tag"><span class="dot" />Read-only connection</li>
        <li class="tag"><span class="dot" />Rally never holds your money</li>
        <li class="tag"><span class="dot" />Trades need your approval, every time</li>
      </ul>
    </header>

    <section v-if="connected" class="card linked">
      <div class="linked__text">
        <ConnectedBadge :portfolio="demo.portfolio" />
        <h2 class="title-lg">{{ connected.name }} is connected.</h2>
        <p class="body-muted">
          {{ plural(demo.portfolio!.holdings.length, 'holding') }} · {{ usd(demo.portfolio!.totalUsd) }} · sample account · {{ CAPABILITY_LABEL[connected.capability].toLowerCase() }}
        </p>
      </div>
      <div class="linked__actions">
        <RouterLink to="/portfolio" class="btn btn-primary">See connected holdings</RouterLink>
        <RouterLink to="/trades" class="btn btn-outline">Review trades</RouterLink>
        <button type="button" class="btn btn-outline" @click="disconnect">Disconnect</button>
      </div>
    </section>

    <div class="page-cols">
      <section class="col-main card card-pad brokers">
        <header class="row-between">
          <h2 ref="brokersTitle" class="title-card" tabindex="-1">{{ connected ? 'Switch broker' : 'Choose your broker' }}</h2>
          <p class="label-mono">{{ BROKERS.length }} brokers · simulated</p>
        </header>
        <p class="body-muted brokers__notice" role="status">{{ notice }}</p>
        <ul>
          <li v-for="broker in BROKERS" :key="broker.id" class="broker rule-top">
            <span class="ticker-tile ticker-tile-lg broker__tile">{{ broker.name.slice(0, 2).toUpperCase() }}</span>
            <div class="broker__text">
              <h3 class="broker__name">{{ broker.name }}</h3>
              <p class="broker__can"><span class="dot" :style="{ '--dot': DOT[broker.capability] }" />{{ CAPABILITY_LABEL[broker.capability] }}</p>
              <p class="small">{{ broker.note }}</p>
            </div>
            <span v-if="connected?.id === broker.id" class="label-mono">Connected</span>
            <button v-else type="button" class="btn btn-outline btn-md" :aria-label="`Connect ${broker.name}`" @click="connect(broker, $event)">Connect</button>
          </li>
        </ul>
      </section>

      <aside class="col-side">
        <section class="card card-pad facts">
          <h2 class="title-card">What connecting does.</h2>
          <ul>
            <li class="rule-top">
              <b>Reads what you hold</b>
              <span>So the portfolio, what-if and trades are about your real account, not a sample you typed.</span>
            </li>
            <li class="rule-top">
              <b>Never moves money</b>
              <span>Rally is not a broker, a fund or an adviser. Your money and your shares stay where they are.</span>
            </li>
            <li class="rule-top">
              <b>Sends nothing unapproved</b>
              <span>Where the broker allows it, Rally places the trades you approve. Otherwise you get a list to place yourself.</span>
            </li>
          </ul>
          <p class="small">In this demo every broker loads the same sample account, and no real connection is made.</p>
        </section>
      </aside>
    </div>

    <UiModal ref="modal" :open="connecting !== null" size="sm" :label="connecting ? `Connecting to ${connecting.name}` : 'Connecting'" @close="cancel">
      <div v-if="connecting" class="dialog">
        <template v-if="failed">
          <span class="tag"><span class="dot" style="--dot: var(--flare)" />Not connected</span>
          <div role="alert">
            <h2 class="title-lg">That didn’t connect.</h2>
            <p class="body-muted">Nothing was loaded and nothing changed.</p>
          </div>
          <div class="dialog__actions">
            <button type="button" class="btn btn-primary" @click="retry(connecting)">Try again</button>
            <button type="button" class="btn btn-outline" @click="cancel">Close</button>
          </div>
        </template>
        <template v-else>
          <span class="tag"><span class="dot" />Read-only · simulated</span>
          <h2 class="title-lg">Connecting to {{ connecting.name }}…</h2>
          <p class="body-muted">Reading the holdings in your account. Rally can see what you own; it cannot move it.</p>
          <div class="dialog__bar" role="progressbar" :aria-label="`Connecting to ${connecting.name}`"><span /></div>
          <button type="button" class="btn btn-outline btn-md" @click="cancel">Cancel</button>
        </template>
      </div>
    </UiModal>
  </div>
</template>

<style scoped>
.brokers__notice:empty {
  display: none;
}
.title-card:focus {
  outline: none;
}
.trust {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 6px;
}
.linked {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 28px 36px;
}
.linked__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}
.linked__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
}
.brokers {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 12px;
}
.broker {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px 0;
}
.broker:first-child {
  border-top: 0;
}
.broker__tile {
  background: var(--track);
}
.broker__text {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.broker__name {
  font-size: 19px;
  font-weight: 600;
  line-height: 1.25;
}
.broker__can {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 500;
}
.facts {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.facts li {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px 0;
}
.facts li:first-child {
  border-top: 0;
  padding-top: 4px;
}
.facts b {
  font-size: 17px;
  font-weight: 600;
}
.facts span {
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-muted);
}
.dialog {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 16px;
}
.dialog__actions {
  display: flex;
  gap: 12px;
}
.dialog__bar {
  position: relative;
  width: 100%;
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--track);
  overflow: hidden;
}
.dialog__bar span {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  border-radius: var(--radius-pill);
  background: var(--brand-400);
  animation: sweep 1.2s var(--ease) infinite alternate;
}
@keyframes sweep {
  from {
    left: 0;
  }
  to {
    left: 60%;
  }
}
</style>
