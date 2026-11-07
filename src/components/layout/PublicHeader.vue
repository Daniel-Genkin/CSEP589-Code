<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { BRAND_NAME, SURVEY_URL } from '@/config/brand'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

// The same three steps live on the landing page and on /receipt; stay on the page you're on.
const steps = computed(() => {
  const onReceipt = route.name === 'receipt'
  return [
    { n: '01', label: 'Pick a fund', hash: onReceipt ? '#pick' : '#fund', color: '#F7C54E' },
    { n: '02', label: 'Draw your lines', hash: '#lines', color: '#F07AB6' },
    { n: '03', label: 'See who crosses them', hash: onReceipt ? '#print-step' : '#receipt', color: '#E85A2A' },
  ].map((s) => ({ ...s, path: onReceipt ? '/receipt' : '/' }))
})
</script>

<template>
  <header class="site-header ground-blue">
    <div class="container site-header__inner">
      <RouterLink to="/" class="site-header__logo" :aria-label="`${BRAND_NAME} home`"><BrandLogo :size="38" inverse /></RouterLink>

      <nav class="site-header__steps" aria-label="How it works">
        <RouterLink v-for="s in steps" :key="s.n" :to="{ path: s.path, hash: s.hash }" class="step-pill">
          <span :style="{ color: s.color }">{{ s.n }}</span> {{ s.label }}
        </RouterLink>
      </nav>

      <div class="site-header__actions">
        <a :href="SURVEY_URL" target="_blank" rel="noopener" class="btn btn-primary">Get early access</a>
        <RouterLink to="/receipt" class="btn btn-flare">Check my fund ↗</RouterLink>
      </div>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: relative;
  z-index: 50;
}
.site-header__inner {
  max-width: 1388px;
  display: flex;
  align-items: center;
  gap: 24px;
  min-height: 92px;
  flex-wrap: wrap;
  padding-block: 14px;
}
.site-header__steps {
  display: flex;
  gap: 10px;
  flex: 1;
  justify-content: center;
}
.step-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 42px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--ink-solid);
  color: var(--cream);
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  white-space: nowrap;
}
.step-pill:hover {
  background: #2a2833;
}
.site-header__actions {
  display: flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
}
@media (max-width: 1320px) {
  .site-header__steps {
    display: none;
  }
}
@media (max-width: 640px) {
  .site-header__actions {
    gap: 10px;
    margin-left: 0;
  }
  .site-header__actions .btn {
    padding: 0 14px;
  }
}
</style>
