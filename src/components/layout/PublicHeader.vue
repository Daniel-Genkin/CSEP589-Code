<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { BRAND_NAME } from '@/config/brand'
import { useSessionStore } from '@/stores/session'

const session = useSessionStore()

const steps = [
  { n: '01', label: 'Pick a fund', hash: '#fund', color: '#F7C54E' },
  { n: '02', label: 'Draw your lines', hash: '#lines', color: '#F07AB6' },
  { n: '03', label: 'See who crosses them', hash: '#receipt', color: '#E85A2A' },
]
</script>

<template>
  <header class="site-header ground-blue">
    <div class="container site-header__inner">
      <RouterLink to="/" class="site-header__logo" :aria-label="`${BRAND_NAME} home`"><BrandLogo :size="38" inverse /></RouterLink>

      <nav class="site-header__steps" aria-label="How it works">
        <RouterLink v-for="s in steps" :key="s.n" :to="{ path: '/', hash: s.hash }" class="step-pill">
          <span :style="{ color: s.color }">{{ s.n }}</span> {{ s.label }}
        </RouterLink>
      </nav>

      <div class="site-header__actions">
        <RouterLink v-if="session.isAuthed" to="/app" class="btn btn-primary">Open my dashboard ↗</RouterLink>
        <template v-else>
          <RouterLink to="/browse" class="site-header__login">Browse</RouterLink>
          <RouterLink to="/login" class="site-header__login">Log in</RouterLink>
          <RouterLink to="/check" class="btn btn-primary">Check my holdings ↗</RouterLink>
        </template>
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
.site-header__login {
  color: var(--cream);
  font-weight: 700;
}
.site-header__login:hover {
  text-decoration: underline;
  text-underline-offset: 4px;
}
@media (max-width: 1080px) {
  .site-header__steps {
    display: none;
  }
}
</style>
