<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { useSessionStore } from '@/stores/session'
import { Menu, X } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const session = useSessionStore()
const route = useRoute()
const menuOpen = ref(false)

const steps = [
  { n: '01', label: 'Pitch it', hash: '#how-it-works', color: '#F7C54E' },
  { n: '02', label: 'AI workshop', hash: '#workshop', color: '#F07AB6' },
  { n: '03', label: 'Community', hash: '#community', color: '#E85A2A' },
  { n: '04', label: 'Invest', hash: '#invest', color: '#8A6CF2' },
]

watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)
</script>

<template>
  <header class="site-header ground-blue">
    <div class="container site-header__inner">
      <RouterLink to="/" class="site-header__logo" aria-label="Outvest home"><BrandLogo :size="38" inverse /></RouterLink>

      <nav class="site-header__steps" aria-label="How it works">
        <RouterLink
          v-for="step in steps"
          :key="step.n"
          :to="{ path: '/', hash: step.hash }"
          class="step-pill"
          active-class=""
          exact-active-class=""
        >
          <span :style="{ color: step.color }">{{ step.n }}</span> {{ step.label }}
        </RouterLink>
      </nav>

      <div class="site-header__actions">
        <RouterLink to="/pricing" class="site-header__link hide-sm">Pricing</RouterLink>
        <RouterLink v-if="session.isAuthed" to="/app" class="btn btn-primary">Open app ↗</RouterLink>
        <template v-else>
          <RouterLink to="/login" class="btn btn-primary hide-sm">Log in</RouterLink>
          <RouterLink to="/signup" class="btn btn-flare">Get started ↗</RouterLink>
        </template>
        <button
          type="button"
          class="btn btn-light btn-icon site-header__toggle"
          :aria-expanded="menuOpen"
          aria-label="Toggle menu"
          @click="menuOpen = !menuOpen"
        >
          <X v-if="menuOpen" :size="20" />
          <Menu v-else :size="20" />
        </button>
      </div>
    </div>

    <Transition name="pop">
      <nav v-if="menuOpen" class="mobile-nav container" aria-label="Mobile">
        <RouterLink v-for="step in steps" :key="step.n" :to="{ path: '/', hash: step.hash }" class="step-pill mobile-nav__link">
          <span :style="{ color: step.color }">{{ step.n }}</span> {{ step.label }}
        </RouterLink>
        <RouterLink to="/pricing" class="step-pill mobile-nav__link">
          <span class="mobile-nav__star">✦</span> Pricing
        </RouterLink>
        <RouterLink v-if="!session.isAuthed" to="/login" class="step-pill mobile-nav__link">
          <span class="mobile-nav__star">✦</span> Log in
        </RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.site-header {
  position: relative;
  z-index: 50;
}
.site-header__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 24px;
  max-width: 1388px;
  min-height: 92px;
  padding-block: 14px;
}
.site-header__logo {
  display: inline-flex;
}
.site-header__steps {
  display: flex;
  flex: 1;
  justify-content: center;
  gap: 10px;
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
  transition: background-color 0.2s;
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
.site-header__link {
  font-size: 15px;
  font-weight: 700;
  color: var(--cream);
  text-decoration: underline;
  text-decoration-color: transparent;
  text-decoration-thickness: 2px;
  text-underline-offset: 5px;
  transition: text-decoration-color 0.2s;
}
.site-header__link:hover {
  text-decoration-color: var(--sun);
}
.site-header__toggle {
  display: none;
}
.mobile-nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding-bottom: 22px;
}
.mobile-nav__link {
  min-height: 46px;
  font-size: 14px;
}
.mobile-nav__star {
  color: var(--sun);
}

@media (max-width: 1100px) {
  .site-header__steps {
    display: none;
  }
  .site-header__toggle {
    display: inline-flex;
  }
}
@media (max-width: 640px) {
  .site-header__inner {
    gap: 12px;
    min-height: 76px;
  }
  .site-header__actions {
    gap: 10px;
  }
  .site-header__actions .btn:not(.btn-icon) {
    padding: 0 16px;
  }
}
</style>
