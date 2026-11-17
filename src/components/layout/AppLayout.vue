<script setup>
// App frame from the Figma dashboard: pill nav on top, 1280 px column, footer row.
import NavPill from '@/components/rally/NavPill.vue'
import SiteFooter from '@/components/rally/SiteFooter.vue'
import { useAlertsStore } from '@/stores/alerts'
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import UserMenu from './UserMenu.vue'

const route = useRoute()
const alerts = useAlertsStore()

onMounted(() => alerts.ensureLoaded().catch(() => {}))

const tabs = computed(() => {
  const path = route.path
  return [
    { label: 'Dashboard', to: '/app', active: path === '/app' || path.startsWith('/app/scan') },
    { label: 'Your basket', to: '/app/baskets', active: path.startsWith('/app/baskets') },
    { label: 'Receipts', to: '/app/alerts', active: path.startsWith('/app/alerts'), count: alerts.unreadCount },
    { label: 'How it works ↗', to: { path: '/', hash: '#how-it-works' } },
  ]
})
</script>

<template>
  <div class="app-frame">
    <NavPill home-to="/app" :tabs="tabs" label="App">
      <span class="tag"><span class="dot" style="--dot: var(--sun)" />Demo mode</span>
      <UserMenu />
    </NavPill>

    <main class="app-frame__main">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <Transition name="page" mode="out-in">
          <component :is="Component" :key="viewRoute.path" />
        </Transition>
      </RouterView>
    </main>

    <SiteFooter />
  </div>
</template>

<style scoped>
.app-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  width: 100%;
  max-width: calc(var(--container) + 48px);
  min-height: 100vh;
  margin-inline: auto;
  padding: 24px 24px 40px;
}
.app-frame__main {
  flex: 1 0 auto;
  width: 100%;
}
</style>
