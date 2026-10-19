<script setup>
import PlanBadge from '@/components/ui/PlanBadge.vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { initialsOf } from '@/utils/format'
import { ChevronDown, CreditCard, LogOut, Settings } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const session = useSessionStore()
const alerts = useAlertsStore()
const router = useRouter()
const route = useRoute()
const open = ref(false)
const root = ref(null)

useClickOutside(root, () => (open.value = false))
watch(
  () => route.fullPath,
  () => (open.value = false),
)

async function logout() {
  await session.logout()
  alerts.reset()
  router.push('/')
}
</script>

<template>
  <div v-if="session.user" ref="root" class="user-menu">
    <button type="button" class="user-menu__button" :aria-expanded="open" aria-label="Account menu" @click="open = !open">
      <span class="avatar">{{ initialsOf(session.user.name) }}</span>
      <ChevronDown :size="16" class="user-menu__chevron hide-sm" />
    </button>
    <Transition name="pop">
      <div v-if="open" class="user-menu__panel">
        <div class="user-menu__who">
          <span class="avatar">{{ initialsOf(session.user.name) }}</span>
          <span class="user-menu__id">
            <span class="user-menu__name">{{ session.user.name }}</span>
            <span class="user-menu__email">{{ session.user.email }}</span>
          </span>
        </div>
        <div class="user-menu__plan">
          <span class="muted text-sm">Your plan</span>
          <PlanBadge :plan-id="session.planId" />
        </div>
        <RouterLink to="/app/settings" class="user-menu__item"><Settings :size="17" /> Settings</RouterLink>
        <RouterLink to="/app/plan" class="user-menu__item"><CreditCard :size="17" /> Plan & billing</RouterLink>
        <button type="button" class="user-menu__item" @click="logout"><LogOut :size="17" /> Log out</button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.user-menu {
  position: relative;
}
.user-menu__button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px;
  border-radius: var(--radius-pill);
  transition: background-color 0.2s;
}
.user-menu__button:hover {
  background: rgba(22, 36, 29, 0.06);
}
.user-menu__chevron {
  margin-right: 6px;
  color: var(--muted);
}
.user-menu__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  width: 270px;
  padding: 8px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 20px;
  box-shadow: var(--shadow-lg);
}
.user-menu__who {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
}
.user-menu__id {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.user-menu__name {
  font-weight: 700;
  font-size: 14.5px;
}
.user-menu__email {
  font-size: 13px;
  color: var(--muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-menu__plan {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 2px 4px 6px;
  padding: 10px 8px;
  border-radius: 12px;
  background: var(--surface-muted);
}
.user-menu__item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 11px 10px;
  border-radius: 12px;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-2);
  text-align: left;
  transition: background-color 0.2s;
}
.user-menu__item:hover {
  background: var(--surface-muted);
  color: var(--ink);
}
</style>
