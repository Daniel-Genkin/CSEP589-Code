<script setup lang="ts">
// Connect an account (paid). Pick a broker; Alpaca can read a real paper account, the others load
// a live-priced demo account. Rally only reads what you hold: the money stays at your broker, and
// trades need your approval one by one.
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowShell from '@/components/v7/FlowShell.vue'
import Row from '@/components/v7/Row.vue'
import { BROKERS, CAPABILITY_LABEL, CONNECT_MS, type Broker, brokerById } from '@/config/brokers'
import { loadAlpaca } from '@/data/alpaca'
import { provider } from '@/data'
import { whole } from '@/composables/useLinesResult'
import { useDemoStore } from '@/state/demo'
import type { BrokerId } from '@/types'
import { plural } from '@/utils/format'

const props = defineProps<{ step?: string }>()
const route = useRoute()
const router = useRouter()
const demo = useDemoStore()

const n = computed(() => Number(props.step || 1))
const picked = computed<Broker>(() => brokerById(route.query.b as BrokerId) ?? brokerById(demo.portfolio?.brokerId) ?? BROKERS[0])
const connected = computed(() => (demo.isConnected ? brokerById(demo.portfolio?.brokerId) : null))
const TILE: Record<string, string> = { alpaca: 'ALP', webull: 'WB', schwab: 'SCHW', robinhood: 'RH', fidelity: 'FID' }

const connecting = ref(false)
const failure = ref('')
/** Set when the live Alpaca account couldn't be reached and the demo account was loaded instead. */
const fellBack = ref('')
const refreshing = ref(false)
const notice = ref('')
let attempt = 0

/** The paper account answered but holds nothing: that needs fixing at Alpaca, so it is shown, not hidden by a fallback. */
class EmptyAccount extends Error {}

async function connect() {
  const broker = picked.value
  const mine = ++attempt
  connecting.value = true
  failure.value = ''
  fellBack.value = ''
  try {
    let fell = ''
    const load = async () => {
      if (broker.id === 'alpaca') {
        try {
          const live = await loadAlpaca()
          if (live.configured) {
            if (!live.portfolio) throw new EmptyAccount('Your Alpaca paper account holds no positions yet. Buy a few stocks there, or run "npm run seed:alpaca".')
            return live.portfolio
          }
        } catch (error) {
          if (error instanceof EmptyAccount) throw error
          fell = error instanceof Error ? error.message : 'no answer'
        }
      }
      return { ...(await provider.getSamplePortfolio('connected')), brokerId: broker.id }
    }
    const [account] = await Promise.all([load(), new Promise((resolve) => setTimeout(resolve, CONNECT_MS))])
    if (mine !== attempt) return
    demo.connect(account)
    fellBack.value = fell
    connecting.value = false
    router.replace({ path: '/connect/3', query: { b: broker.id } })
  } catch (error) {
    if (mine !== attempt) return
    connecting.value = false
    failure.value = error instanceof Error ? error.message : 'The account didn’t answer.'
  }
}

async function refresh() {
  refreshing.value = true
  try {
    const live = await loadAlpaca()
    if (live.configured && live.portfolio) {
      demo.updatePortfolio(live.portfolio)
      notice.value = `Refreshed: ${plural(live.portfolio.holdings.length, 'holding')}.`
    }
  } catch (error) {
    notice.value = error instanceof Error ? error.message : 'Couldn’t read the account.'
  } finally {
    refreshing.value = false
  }
}
function disconnect() {
  const name = connected.value?.name ?? 'Your broker'
  demo.disconnect()
  notice.value = demo.portfolio ? `${name} disconnected. Back to ${demo.portfolio.name}.` : `${name} disconnected.`
  router.replace('/connect')
}
onBeforeUnmount(() => (attempt += 1))

const top = computed(() => [...(demo.portfolio?.holdings ?? [])].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, 5))
</script>

<template>
  <!-- Already connected: what's linked, and how to undo it -->
  <FlowShell
    v-if="n === 1 && connected"
    :steps="3"
    :step="3"
    label="Connect"
    back="/home"
    logo-to="/home"
    :title="`Connected to ${connected.name}.`"
    :body="demo.isLive ? 'Rally reads your Alpaca paper account. Disconnect any time.' : 'Rally reads a live-priced demo account for this broker. Disconnect any time.'"
  >
    <div class="section-head"><h3>{{ connected.name }}{{ demo.isLive ? ' · Paper account' : ' · Demo account' }}</h3><span class="meta">{{ CAPABILITY_LABEL[connected.capability] }}</span></div>
    <div class="list">
      <Row v-for="h in top" :key="h.ticker" :tk="h.ticker" :title="h.ticker" :sub="`${(h.weight * 100).toFixed(1)}% of the account`" :right="whole(h.valueUsd)" />
    </div>
    <p v-if="notice" class="caption" role="status">{{ notice }}</p>
    <RouterLink to="/home" class="btn btn-primary btn-block">See What Crosses Your Lines</RouterLink>
    <button v-if="demo.isLive" class="btn btn-secondary btn-block" :disabled="refreshing" @click="refresh">{{ refreshing ? 'Refreshing…' : 'Refresh From Alpaca' }}</button>
    <button class="btn-link" style="align-self: flex-start" @click="disconnect">Disconnect {{ connected.name }}</button>
  </FlowShell>

  <FlowShell v-else-if="n === 1" :steps="3" :step="1" label="Connect · Step 1 of 3" back="/home" logo-to="/home" title="Where do you invest?" body="Rally reads what you hold. It can’t move money, and every trade needs your approval.">
    <div class="section-head"><h3>Choose your app</h3></div>
    <div class="list">
      <RouterLink v-for="b in BROKERS" :key="b.id" :to="{ path: '/connect', query: { b: b.id } }" replace class="pick" :aria-current="picked.id === b.id">
        <Row :tk="TILE[b.id]" :title="b.name" :sub="`${CAPABILITY_LABEL[b.capability]} · ${b.note}`" :icon="picked.id === b.id ? 'check' : undefined" />
      </RouterLink>
    </div>
    <p v-if="notice" class="caption" role="status">{{ notice }}</p>
    <RouterLink :to="{ path: '/connect/2', query: { b: picked.id } }" class="btn btn-primary btn-block">Continue With {{ picked.name }}</RouterLink>
    <RouterLink to="/check" class="btn-link" style="align-self: flex-start">Type a Fund Instead</RouterLink>
  </FlowShell>

  <FlowShell v-else-if="n === 2" :steps="3" :step="2" label="Connect · Step 2 of 3" :back="`/connect?b=${picked.id}`" logo-to="/home" title="Here’s what Rally sees." :body="`You sign in on ${picked.name}’s own site, so Rally never sees your password. You can disconnect any time.`">
    <div class="section-head"><h3>Rally can see</h3></div>
    <div class="list">
      <Row title="Which funds and stocks you hold" icon="check" />
      <Row title="How much is in each one" icon="check" />
    </div>
    <div class="section-head"><h3>Rally can’t</h3></div>
    <div class="list">
      <Row title="Move money in or out" icon="close" />
      <Row title="Place a trade without your approval" icon="close" />
      <Row title="See your password" icon="close" />
    </div>
    <div v-if="failure" class="note" role="alert"><p class="label" style="color: var(--flare)">Couldn’t connect</p><p>{{ failure }}</p></div>
    <button class="btn btn-primary btn-block" :disabled="connecting" @click="connect">{{ connecting ? `Connecting to ${picked.name}…` : failure ? 'Try Again' : `Continue to ${picked.name}` }}</button>
    <RouterLink to="/home" class="btn-link" style="align-self: flex-start">Not Now</RouterLink>
    <p class="caption">{{ picked.id === 'alpaca' ? 'Reads your Alpaca paper account when this server has keys for one; otherwise a live-priced demo account.' : 'Demo: loads a live-priced sample account for this broker.' }}</p>
  </FlowShell>

  <FlowShell
    v-else
    :steps="3"
    :step="3"
    label="Connect · Step 3 of 3"
    :back="false"
    logo-to="/home"
    :title="demo.portfolio ? `We found ${plural(demo.portfolio.holdings.length, 'holding')}.` : 'Nothing connected yet.'"
    :body="demo.portfolio ? `In your ${picked.name} account, worth ${whole(demo.portfolio.totalUsd)}. Rally checks them all against your lines.` : 'Pick an app to connect first.'"
  >
    <div v-if="fellBack" class="note" role="status"><p class="label" style="color: var(--sun)">Demo account loaded</p><p>Couldn’t reach your Alpaca paper account ({{ fellBack }}). Rally loaded the live-priced demo account instead.</p></div>
    <template v-if="demo.portfolio">
      <div class="section-head"><h3>{{ picked.name }} · {{ demo.isLive ? 'Paper account' : 'Demo account' }}</h3></div>
      <div class="list">
        <Row v-for="h in top" :key="h.ticker" :tk="h.ticker" :title="h.ticker" :sub="`${(h.weight * 100).toFixed(1)}% of the account`" :right="whole(h.valueUsd)" />
      </div>
      <p class="caption">Connected to {{ picked.name }}. {{ CAPABILITY_LABEL[picked.capability] }}.</p>
      <RouterLink to="/home" class="btn btn-primary btn-block">See What Crosses Your Lines</RouterLink>
    </template>
    <RouterLink v-else to="/connect" class="btn btn-primary btn-block">Choose an App</RouterLink>
  </FlowShell>
</template>

<style scoped>
.pick { display: block; }
.pick :deep(.row) { border-bottom: 1px solid var(--line); }
.pick:last-child :deep(.row) { border-bottom: 0; }
.pick:hover :deep(.title) { color: var(--link); }
.note { background: var(--surf); border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; font-size: 15px; color: var(--white); line-height: 1.45; }
.btn:disabled { opacity: 0.6; pointer-events: none; }
</style>
