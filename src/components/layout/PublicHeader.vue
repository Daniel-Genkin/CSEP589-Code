<script setup>
// Landing navigation (Figma "Landing" nav): section links, waitlist, and the main call to action.
import NavPill from '@/components/rally/NavPill.vue'
import { SURVEY_URL } from '@/config/brand'

const tabs = [
  { label: 'How it works', to: { path: '/', hash: '#how-it-works' } },
  { label: 'The lineup', to: { path: '/', hash: '#lineup' } },
  { label: 'See an example', to: '/s/demo' },
]
</script>

<template>
  <div class="site-header">
    <NavPill :tabs="tabs" label="Site">
      <a :href="SURVEY_URL" target="_blank" rel="noopener" class="btn btn-outline btn-sm">Join the waitlist</a>
      <RouterLink to="/receipt" class="btn btn-primary site-header__cta">Check my fund</RouterLink>
    </NavPill>
  </div>
</template>

<style scoped>
.site-header {
  position: relative;
  z-index: 50;
  width: 100%;
  max-width: calc(var(--container) + 48px);
  margin-inline: auto;
  padding: 32px 24px 0;
}
.site-header :deep(.nav-pill__actions) {
  gap: 10px;
}
.site-header__cta {
  padding: 12px 20px;
  font-size: 14px;
  line-height: 16px;
}
</style>
