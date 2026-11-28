<script setup lang="ts">
import { House, FlaskConical, ShoppingBasket, ReceiptText, Flag, Search } from '@lucide/vue'
import { computed, onMounted } from 'vue'
import { useAlertsStore } from '@/state/alerts'
import { useDemoStore } from '@/state/demo'
import { brokerById } from '@/config/brokers'

defineProps<{ active?: string }>()
const demo = useDemoStore()
const alerts = useAlertsStore()
onMounted(() => void alerts.load().catch(() => {}))

const tabs = computed(() => [
  { id: 'home', label: 'Home', to: '/home', icon: House },
  { id: 'whatif', label: 'What-if', to: '/whatif', icon: FlaskConical },
  { id: 'basket', label: 'Basket', to: '/basket', icon: ShoppingBasket },
  { id: 'receipts', label: 'Receipts', to: '/receipts', icon: ReceiptText, badge: alerts.unreadCount },
  { id: 'lines', label: 'Lines', to: '/lines', icon: Flag },
  { id: 'explore', label: 'Explore', to: '/explore', icon: Search },
])
const initials = computed(() => (demo.account?.email ? demo.account.email.slice(0, 2).toUpperCase() : 'ME'))
const broker = computed(() => (demo.isConnected ? brokerById(demo.portfolio?.brokerId) : null))
</script>

<template>
  <nav class="nav nav-pill" aria-label="Rally">
    <RouterLink to="/home" class="display logo">Rally</RouterLink>
    <div class="tabs">
      <RouterLink v-for="t in tabs" :key="t.id" :to="t.to" class="tab" :class="{ on: active === t.id }" :aria-current="active === t.id ? 'page' : undefined">
        <span class="ic">
          <component :is="t.icon" :size="20" :stroke-width="2" />
          <span v-if="t.badge" class="badge" :aria-label="`${t.badge} unread`">{{ t.badge }}</span>
        </span>
        {{ t.label }}
      </RouterLink>
    </div>
    <div class="acct">
      <span v-if="broker" class="tag connected"><i class="dot" style="background: var(--green); width: 7px; height: 7px" />{{ broker.name }}</span>
      <RouterLink v-else to="/upgrade" class="tag"><i class="dot" style="background: var(--sun); width: 7px; height: 7px" />{{ demo.isPaid ? 'Plus' : 'Free' }}</RouterLink>
      <RouterLink to="/account" class="avatar" aria-label="Account">{{ initials }}</RouterLink>
    </div>
  </nav>
</template>

<style scoped>
.nav { position: sticky; top: 16px; z-index: 20; display: flex; align-items: center; justify-content: space-between; height: 62px; padding: 0 9px 0 28px; border-radius: 999px; background: rgba(38, 36, 46, 0.82); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 14px 36px rgba(0, 0, 0, 0.35); }
.logo { font-size: 26px; color: var(--cream); width: 170px; }
.tabs { display: flex; gap: 4px; }
.tab { display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 16px; border-radius: 999px; font-weight: 500; font-size: 15px; color: var(--dim); }
.tab:hover { color: var(--white); }
.tab.on { background: rgba(255, 255, 255, 0.07); color: var(--link); font-weight: 600; }
.ic { position: relative; display: inline-flex; }
.badge { position: absolute; top: -7px; right: -8px; min-width: 16px; height: 16px; border-radius: 8px; background: #ff4f4f; color: #fff; font-size: 10px; font-weight: 600; display: grid; place-items: center; }
.acct { display: flex; align-items: center; gap: 12px; width: 170px; justify-content: flex-end; }
.connected { color: var(--white); }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--pink); color: var(--ink); font-weight: 600; font-size: 13px; display: grid; place-items: center; flex: none; }
</style>
