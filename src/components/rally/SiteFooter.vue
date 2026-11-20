<script setup>
// Footer row shared by every screen: wordmark, the demo disclaimer, the tagline.
import { BRAND_NAME, BRAND_TAGLINE } from '@/config/brand'

defineProps({
  note: {
    type: String,
    default: 'Design demo only. No account connected. Sample holdings and weights are illustrative, not actual fund holdings. Rally shares information, not investment advice.',
  },
})
</script>

<template>
  <footer class="site-foot">
    <p class="site-foot__brand">{{ BRAND_NAME.toUpperCase() }}</p>
    <p class="site-foot__note">
      {{ note }}
      <slot />
    </p>
    <p class="site-foot__tagline">{{ BRAND_TAGLINE }}</p>
  </footer>
</template>

<style scoped>
.site-foot {
  display: flex;
  align-items: flex-start;
  gap: 64px;
  width: 100%;
  padding-top: 32px;
  border-top: 1px solid var(--hairline);
}
.site-foot__brand {
  font-family: var(--font-display);
  font-size: 24px;
  line-height: 36px;
  letter-spacing: 0.02em;
  color: var(--cream);
}
.site-foot__note {
  flex: 1 1 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}
.site-foot__tagline {
  font-size: 15px;
  font-weight: 500;
  line-height: 18px;
  white-space: nowrap;
}
</style>
