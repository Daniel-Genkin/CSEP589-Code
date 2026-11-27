<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppShell from '@/components/v7/AppShell.vue'
import Row from '@/components/v7/Row.vue'
import { brokerById, CAPABILITY_LABEL } from '@/config/brokers'
import { planPriceLabel } from '@/config/plan'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const demo = useDemoStore()
const catalog = useCatalogStore()
const toast = useToast()
onMounted(() => void catalog.load().catch(() => {}))
const broker = computed(() => (demo.isConnected ? brokerById(demo.portfolio?.brokerId) : null))

function disconnect() {
  const name = broker.value?.name ?? 'Your broker'
  demo.disconnect()
  toast.info(`${name} disconnected.`)
}
function signOut() {
  demo.signOut()
  router.push('/')
}
function reset() {
  demo.reset()
  router.push('/')
}
</script>

<template>
  <AppShell title="Account." body="Your sign-in, plan and connected accounts.">
    <div class="grid">
      <div class="col">
        <div class="grp">
          <div class="section-head"><h3>Profile</h3></div>
          <div class="list">
            <template v-if="demo.account">
              <Row title="Email" :right="demo.account.email" />
              <Row title="Sign-in" right="Email code" />
            </template>
            <Row v-else title="No account yet" sub="Save your lines with just an email" right="Sign In" right-tone="link" to="/signin" />
          </div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Connected accounts</h3></div>
          <div class="list">
            <Row v-if="broker" :tk="broker.id.slice(0, 4).toUpperCase()" :title="broker.name" :sub="`${demo.isLive ? 'Paper account' : 'Demo account'} · ${CAPABILITY_LABEL[broker.capability]}`">
              <template #right><button class="btn-link" @click="disconnect">Disconnect</button></template>
            </Row>
            <Row v-else title="Nothing connected" :sub="demo.isPaid ? 'Read-only. The money stays at your broker.' : 'Connecting an account is on Plus'" right="Connect" right-tone="link" to="/connect" />
          </div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Your fund</h3></div>
          <div class="list">
            <Row v-if="demo.portfolio" :tk="shortName(demo.portfolio).slice(0, 5)" :title="demo.portfolio.name" :sub="`${catalog.selectedIds.length} lines`" icon="chev" to="/home" />
            <Row v-else title="No fund checked yet" right="Check a Fund" right-tone="link" to="/check" />
          </div>
        </div>
      </div>
      <aside class="col">
        <div class="grp">
          <div class="section-head"><h3>Plan</h3></div>
          <div class="list">
            <Row :title="demo.isPaid ? 'Plus' : 'Free'" :sub="demo.isPaid ? `${planPriceLabel()} a month · demo, no payment` : 'Check one fund at a time'" right="See Plans" right-tone="link" to="/upgrade?next=/account" />
          </div>
        </div>
        <div class="grp">
          <div class="section-head"><h3>Demo states</h3></div>
          <div class="list">
            <Row title="Data unavailable" sub="What Home looks like when a check fails" icon="chev" to="/home?state=unavailable" />
            <Row title="Fund we can’t check" sub="VXUS, a fund outside the US" icon="chev" to="/check/unsupported?ticker=VXUS&reason=holdings" />
            <Row title="Example alert email" sub="What an update looks like" icon="chev" to="/alerts" />
          </div>
        </div>
        <div class="btns">
          <button v-if="demo.account" class="btn btn-secondary btn-block" @click="signOut">Sign Out</button>
          <button class="btn btn-secondary btn-block" @click="reset">Reset Demo</button>
        </div>
        <p class="caption">Reset clears your lines, fund, plan and account from this device.</p>
      </aside>
    </div>
  </AppShell>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: 800px 456px; justify-content: space-between; gap: 24px; }
.col { display: flex; flex-direction: column; gap: 32px; }
.grp { display: flex; flex-direction: column; gap: 12px; }
.btns { display: flex; flex-direction: column; gap: 10px; }
</style>
