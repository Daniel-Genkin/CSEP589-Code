<script setup>
import { useClickOutside } from '@/composables/useClickOutside'
import { useAlertsStore } from '@/stores/alerts'
import { useSessionStore } from '@/stores/session'
import { initialsOf } from '@/utils/format'
import { ChevronDown, LogOut, Settings, UserRound } from '@lucide/vue'
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
            <span class="user-menu__email">@{{ session.user.handle }} · {{ session.user.email }}</span>
          </span>
        </div>
        <RouterLink :to="`/u/${session.user.handle}`" class="user-menu__item"><UserRound :size="17" /> Public profile</RouterLink>
        <RouterLink to="/app/settings" class="user-menu__item"><Settings :size="17" /> Settings</RouterLink>
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
  background: rgba(23, 22, 29, 0.07);
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
  border: var(--outline);
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
