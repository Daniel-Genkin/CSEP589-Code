<script setup>
// The pill navigation bar from the Figma frames: wordmark, links, actions.
// Tabs are data so the same bar serves the landing page and the app.
import { BRAND_NAME } from '@/config/brand'
import { Lock } from '@lucide/vue'

defineProps({
  homeTo: { type: [String, Object], default: '/' },
  // [{ label, to?, href?, active?, count?, locked? }]
  tabs: { type: Array, default: () => [] },
  label: { type: String, default: 'Main' },
})
</script>

<template>
  <header class="nav-pill">
    <RouterLink :to="homeTo" class="nav-pill__brand" :aria-label="`${BRAND_NAME} home`">{{ BRAND_NAME.toUpperCase() }}</RouterLink>

    <nav class="tabs" :aria-label="label">
      <template v-for="tab in tabs" :key="tab.label">
        <a v-if="tab.href" :href="tab.href" class="tab" target="_blank" rel="noopener">{{ tab.label }}</a>
        <RouterLink v-else :to="tab.to" class="tab" :class="{ 'is-active': tab.active }" :aria-current="tab.active ? 'page' : undefined">
          {{ tab.label }}<template v-if="tab.count"> · {{ tab.count }}<span class="sr-only"> unread</span></template
          ><template v-if="tab.locked"><Lock class="tab__lock" :size="13" aria-hidden="true" /><span class="sr-only"> (preview, paid plan)</span></template>
        </RouterLink>
      </template>
    </nav>

    <div class="nav-pill__actions"><slot /></div>
  </header>
</template>

<style scoped>
.tab__lock {
  margin-left: 6px;
  vertical-align: -1px;
  color: var(--sun);
}
.nav-pill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  min-height: 62px;
  padding: 10px 10px 10px 28px;
  border-radius: var(--radius-pill);
  background: var(--surface);
}
.nav-pill__brand {
  font-family: var(--font-display);
  font-size: 28px;
  line-height: 42px;
  letter-spacing: 0.02em;
  color: var(--cream);
}
.nav-pill__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
