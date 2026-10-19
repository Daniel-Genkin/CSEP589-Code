<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import PlanBadge from '@/components/ui/PlanBadge.vue'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { Bell, CreditCard, House, Plus, Radar, ScanSearch, Settings, Sparkles } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NotificationBell from './NotificationBell.vue'
import UserMenu from './UserMenu.vue'

const route = useRoute()
const session = useSessionStore()
const alerts = useAlertsStore()

const nav = computed(() => [
  { label: 'Home', to: '/app', icon: House, match: (p) => p === '/app' },
  { label: 'Scans', to: '/app/scan/new', icon: ScanSearch, match: (p) => p.startsWith('/app/scan') },
  {
    label: 'Monitoring',
    short: 'Monitor',
    to: '/app/monitoring',
    icon: Radar,
    match: (p) => p.startsWith('/app/monitoring'),
    tag: session.isPro ? null : 'Pro',
  },
  {
    label: 'Alerts',
    to: '/app/alerts',
    icon: Bell,
    match: (p) => p.startsWith('/app/alerts'),
    count: alerts.unreadCount,
  },
  { label: 'Plan & billing', short: 'Plan', to: '/app/plan', icon: CreditCard, match: (p) => p.startsWith('/app/plan') },
  { label: 'Settings', to: '/app/settings', icon: Settings, match: (p) => p.startsWith('/app/settings'), desktopOnly: true },
])
</script>

<template>
  <div class="app-shell">
    <aside class="sidebar">
      <RouterLink to="/app" class="sidebar__logo" aria-label="outvest home"><BrandLogo /></RouterLink>
      <RouterLink to="/app/scan/new" class="btn btn-primary btn-block sidebar__cta"><Plus :size="18" /> New scan</RouterLink>

      <nav class="sidebar__nav" aria-label="App">
        <RouterLink
          v-for="item in nav"
          :key="item.label"
          :to="item.to"
          class="sidebar__link"
          :class="{ 'is-active': item.match(route.path) }"
        >
          <component :is="item.icon" :size="19" />
          <span class="grow">{{ item.label }}</span>
          <span v-if="item.count" class="sidebar__count">{{ item.count }}</span>
          <span v-if="item.tag" class="sidebar__tag">{{ item.tag }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar__bottom">
        <RouterLink v-if="!session.isPro" to="/app/plan" class="upsell">
          <span class="upsell__icon"><Sparkles :size="16" /></span>
          <span class="upsell__title">Let us keep watch</span>
          <span class="upsell__text">Pro monitors your holdings and emails you when something changes.</span>
          <span class="upsell__link">See Pro →</span>
        </RouterLink>
        <div v-else class="sidebar__plan">
          <span class="muted text-sm">Your plan</span>
          <PlanBadge :plan-id="session.planId" />
        </div>
      </div>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <RouterLink to="/app" class="topbar__logo" aria-label="outvest home"><BrandLogo :size="28" /></RouterLink>
        <div class="topbar__actions">
          <RouterLink to="/app/scan/new" class="btn btn-soft btn-sm topbar__scan hide-sm"><Plus :size="16" /> New scan</RouterLink>
          <NotificationBell />
          <UserMenu />
        </div>
      </header>

      <main class="app-content">
        <RouterView v-slot="{ Component, route: viewRoute }">
          <Transition name="page" mode="out-in">
            <component :is="Component" :key="viewRoute.path" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <nav class="tabbar" aria-label="App">
      <RouterLink
        v-for="item in nav.filter((n) => !n.desktopOnly)"
        :key="item.label"
        :to="item.to"
        class="tabbar__link"
        :class="{ 'is-active': item.match(route.path) }"
      >
        <span class="tabbar__icon">
          <component :is="item.icon" :size="21" />
          <span v-if="item.count" class="tabbar__dot" />
        </span>
        {{ item.short || item.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  min-height: 100vh;
}

/* Sidebar */
.sidebar {
  position: sticky;
  top: 0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  width: 264px;
  height: 100vh;
  padding: 22px 18px;
  border-right: 1px solid var(--line);
  background: var(--surface-muted);
}
.sidebar__logo {
  padding: 4px 10px 22px;
}
.sidebar__cta {
  margin-bottom: 18px;
}
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--ink-2);
  transition:
    background-color 0.2s,
    color 0.2s;
}
.sidebar__link:hover {
  background: rgba(22, 36, 29, 0.045);
  color: var(--ink);
}
.sidebar__link.is-active {
  background: var(--surface);
  color: var(--brand-700);
  box-shadow: var(--shadow-xs), inset 0 0 0 1px var(--line);
}
.sidebar__count {
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  display: grid;
  place-items: center;
  border-radius: var(--radius-pill);
  background: var(--coral-500);
  color: #fff;
  font-size: 11.5px;
  font-weight: 800;
}
.sidebar__tag {
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: var(--brand-100);
  color: var(--brand-700);
  font-size: 11px;
  font-weight: 750;
}
.sidebar__bottom {
  margin-top: auto;
}
.sidebar__plan {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 12px;
  border-radius: 16px;
  border: 1px solid var(--line);
  background: var(--surface);
}
.upsell {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 18px;
  border-radius: 20px;
  background:
    radial-gradient(circle at 100% 0%, rgba(128, 197, 157, 0.45), transparent 55%),
    linear-gradient(160deg, var(--brand-700), var(--brand-900));
  color: #fff;
  transition: transform 0.25s var(--ease);
}
.upsell:hover {
  transform: translateY(-2px);
}
.upsell__icon {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  margin-bottom: 6px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.14);
}
.upsell__title {
  font-weight: 750;
}
.upsell__text {
  font-size: 13px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.78);
}
.upsell__link {
  margin-top: 6px;
  font-size: 13.5px;
  font-weight: 700;
  color: var(--brand-200);
}

/* Main */
.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.topbar {
  position: sticky;
  top: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  height: 68px;
  padding: 0 32px;
  background: rgba(247, 245, 239, 0.85);
  backdrop-filter: saturate(1.4) blur(12px);
}
.topbar__logo {
  display: none;
}
.topbar__scan {
  display: none;
}
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.app-content {
  flex: 1;
  width: 100%;
  max-width: 1120px;
  margin: 0 auto;
  padding: 8px 40px 48px;
}

/* Mobile tab bar */
.tabbar {
  display: none;
}

@media (max-width: 1023px) {
  .sidebar {
    display: none;
  }
  .topbar {
    padding: 0 16px 0 20px;
    border-bottom: 1px solid var(--line);
  }
  .topbar__logo {
    display: inline-flex;
  }
  .topbar__scan {
    display: inline-flex;
  }
  .app-content {
    padding: 20px 20px calc(100px + env(safe-area-inset-bottom));
  }
  .tabbar {
    position: fixed;
    inset: auto 0 0 0;
    z-index: 45;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.94);
    backdrop-filter: blur(14px);
  }
  .tabbar__link {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 6px 0;
    border-radius: 12px;
    font-size: 11.5px;
    font-weight: 650;
    color: var(--muted);
  }
  .tabbar__link.is-active {
    color: var(--brand-700);
  }
  .tabbar__icon {
    position: relative;
    display: grid;
    place-items: center;
    width: 46px;
    height: 28px;
    border-radius: var(--radius-pill);
    transition: background-color 0.2s;
  }
  .tabbar__link.is-active .tabbar__icon {
    background: var(--brand-100);
  }
  .tabbar__dot {
    position: absolute;
    top: 2px;
    right: 10px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 2px solid #fff;
    background: var(--coral-500);
    box-sizing: content-box;
  }
}

@media (max-width: 640px) {
  .app-content {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
