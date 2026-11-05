<script setup>
import { useClickOutside } from '@/composables/useClickOutside'
import { useAlertsStore } from '@/stores/alerts'
import { timeAgo } from '@/utils/format'
import { ALERT_KINDS } from '@/utils/thesis'
import { ArrowRight, Bell, CheckCheck } from '@lucide/vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const alerts = useAlertsStore()
const route = useRoute()
const open = ref(false)
const root = ref(null)

const latest = computed(() => alerts.items.slice(0, 4))

useClickOutside(root, () => (open.value = false))
onMounted(() => alerts.ensureLoaded().catch(() => {}))
watch(
  () => route.fullPath,
  () => (open.value = false),
)
</script>

<template>
  <div ref="root" class="bell">
    <button
      type="button"
      class="bell__button"
      :class="{ 'is-open': open }"
      :aria-label="`Alerts, ${alerts.unreadCount} unread`"
      :aria-expanded="open"
      @click="open = !open"
    >
      <Bell :size="20" />
      <span v-if="alerts.unreadCount" class="bell__count">{{ alerts.unreadCount }}</span>
    </button>

    <Transition name="pop">
      <div v-if="open" class="bell__panel">
        <div class="bell__head">
          <p class="bell__title">Alerts</p>
          <button v-if="alerts.unreadCount" type="button" class="bell__mark" @click="alerts.markAllRead()">
            <CheckCheck :size="15" /> Mark all read
          </button>
        </div>

        <ul v-if="latest.length" class="bell__list">
          <li v-for="alert in latest" :key="alert.id">
            <RouterLink :to="`/app/alerts/${alert.id}`" class="bell__item" :class="{ 'is-unread': !alert.readAt }">
              <span class="bell__kind" :class="`bell__kind--${ALERT_KINDS[alert.kind].tone}`">
                <component :is="ALERT_KINDS[alert.kind].icon" :size="17" />
              </span>
              <span class="bell__text">
                <span class="bell__item-title">{{ alert.title }}</span>
                <span class="bell__meta">{{ alert.thesis?.title ?? ALERT_KINDS[alert.kind].label }} · {{ timeAgo(alert.createdAt) }}</span>
              </span>
            </RouterLink>
          </li>
        </ul>
        <p v-else class="bell__empty">You’re all caught up. We only alert you when news affects one of your theses.</p>

        <RouterLink to="/app/alerts" class="bell__all">View all alerts <ArrowRight :size="15" /></RouterLink>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.bell {
  position: relative;
}
.bell__button {
  position: relative;
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  color: var(--ink-2);
  transition: background-color 0.2s;
}
.bell__button:hover,
.bell__button.is-open {
  background: rgba(23, 22, 29, 0.07);
}
.bell__count {
  position: absolute;
  top: 3px;
  right: -1px;
  display: grid;
  place-items: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: var(--radius-pill);
  border: 2px solid var(--ink-solid);
  background: var(--flare);
  color: var(--ink);
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}
.bell__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: -8px;
  z-index: 60;
  width: min(400px, calc(100vw - 24px));
  padding: 8px;
  background: var(--surface);
  border: var(--outline);
  border-radius: 22px;
  box-shadow: var(--shadow-lg);
}
.bell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px 8px;
}
.bell__title {
  font-weight: 750;
}
.bell__mark {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  font-weight: 650;
  color: var(--brand-600);
}
.bell__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 14px;
  transition: background-color 0.2s;
}
.bell__item:hover {
  background: var(--surface-muted);
}
.bell__item.is-unread::before {
  content: '';
  position: absolute;
  left: 3px;
  top: 50%;
  width: 6px;
  height: 6px;
  margin-top: -3px;
  border-radius: 50%;
  background: var(--flare);
}
.bell__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.bell__kind {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: 1.5px solid var(--ink-solid);
  border-radius: 11px;
}
.bell__kind--up {
  background: var(--score-great-bg);
  color: var(--score-great);
}
.bell__kind--down {
  background: var(--score-low-bg);
  color: var(--score-low);
}
.bell__kind--lilac {
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.bell__item-title {
  font-size: 14px;
  font-weight: 650;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.bell__meta {
  margin-top: 2px;
  font-size: 12.5px;
  color: var(--muted);
}
.bell__empty {
  padding: 20px 12px;
  font-size: 14px;
  color: var(--muted);
  text-align: center;
}
.bell__all {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 4px;
  padding: 12px;
  border-top: 1px solid var(--line);
  font-size: 14px;
  font-weight: 650;
  color: var(--brand-700);
}
</style>
