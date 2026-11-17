<script setup lang="ts">
// The one frame every screen sits in: sample-data banner, pill nav, the routed screen with a
// view transition, and the footer with "Reset demo".
import NavPill from '@/components/rally/NavPill.vue'
import SiteFooter from '@/components/rally/SiteFooter.vue'
import { useDemoStore } from '@/state/demo'
import { useLinesStore } from '@/stores/lines'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const demo = useDemoStore()

const tabs = computed(() => [
  { label: 'Portfolio', to: '/portfolio', active: route.name === 'portfolio' },
  { label: 'What-if', to: '/whatif', active: route.name === 'whatif' || route.name === 'trades' },
  { label: 'Alerts', to: '/alerts', active: route.name === 'alerts' },
  { label: 'Values', to: '/settings', active: route.name === 'settings' },
])

const initials = computed(() => demo.account?.email.slice(0, 2).toUpperCase() ?? '')

// Bumped on reset so the current screen remounts with fresh local state, even on Home.
const epoch = ref(0)

async function reset() {
  const lines = useLinesStore()
  demo.reset()
  lines.reset()
  await router.push('/')
  // A timer on the screen we just left (a running scan) may have fired while Home loaded.
  lines.reset()
  epoch.value += 1
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <div class="shell">
    <p class="sample-banner" role="note">
      <span class="dot" style="--dot: var(--sun)" />
      <strong>Sample data.</strong>
      Prices are real market history. Holdings, weights, tags and alerts are samples, and nothing here is live.
    </p>

    <div class="shell__bar">
      <NavPill home-to="/" :tabs="tabs" label="Screens">
        <RouterLink to="/connect" class="btn btn-outline btn-sm">Connect brokerage</RouterLink>
        <span class="tag"><span class="dot" style="--dot: var(--sun)" />{{ demo.isPaid ? 'Paid plan · demo' : 'Free plan · demo' }}</span>
        <span v-if="demo.account" class="avatar" :title="demo.account.email">{{ initials }}</span>
      </NavPill>
    </div>

    <main class="shell__main">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="`${viewRoute.path}:${epoch}`" />
        </Transition>
      </RouterView>
    </main>

    <div class="shell__bar shell__foot">
      <SiteFooter note="Design demo. Sample data throughout: nothing connects to a real brokerage, payment or market-data service. Rally shares information, not investment advice.">
        <button type="button" class="reset" @click="reset">Reset demo</button>
      </SiteFooter>
    </div>
  </div>
</template>

<style scoped>
.shell {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.sample-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 24px;
  background: var(--surface);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.04em;
  text-align: center;
  color: var(--text-muted);
}
.sample-banner strong {
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sun);
}
.shell__bar {
  width: 100%;
  max-width: calc(var(--container) + 48px);
  margin-inline: auto;
  padding: 24px 24px 0;
}
.shell__main {
  flex: 1 0 auto;
  padding-top: 40px;
}
.shell__foot {
  padding: 40px 24px;
}
.reset {
  margin-left: 6px;
  color: var(--text);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.reset:hover {
  color: var(--sun);
}
</style>
