<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue'
import { useSessionStore } from '@/stores/session'
import { ArrowRight, Menu, X } from '@lucide/vue'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const session = useSessionStore()
const route = useRoute()
const menuOpen = ref(false)
const scrolled = ref(false)

const links = [
  { label: 'How it works', to: { path: '/', hash: '#how-it-works' } },
  { label: 'Values', to: { path: '/', hash: '#values' } },
  { label: 'ETFs', to: { path: '/', hash: '#etfs' } },
  { label: 'Example', to: '/s/demo' },
  { label: 'Pricing', to: '/pricing' },
]

const onScroll = () => (scrolled.value = window.scrollY > 8)
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
watch(
  () => route.fullPath,
  () => (menuOpen.value = false),
)
</script>

<template>
  <header class="site-header" :class="{ 'is-scrolled': scrolled || menuOpen }">
    <div class="container site-header__inner">
      <RouterLink to="/" class="site-header__logo" aria-label="outvest home"><BrandLogo /></RouterLink>

      <nav class="site-header__nav" aria-label="Main">
        <RouterLink v-for="link in links" :key="link.label" :to="link.to" class="site-header__link" active-class="" exact-active-class="">
          {{ link.label }}
        </RouterLink>
      </nav>

      <div class="site-header__actions">
        <RouterLink v-if="session.isAuthed" to="/app" class="btn btn-primary btn-sm">
          Open app <ArrowRight :size="16" />
        </RouterLink>
        <template v-else>
          <RouterLink to="/login" class="btn btn-ghost btn-sm hide-sm">Log in</RouterLink>
          <RouterLink to="/signup" class="btn btn-primary btn-sm">Get started</RouterLink>
        </template>
        <button
          type="button"
          class="btn btn-ghost btn-sm btn-icon site-header__toggle"
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
        <RouterLink v-for="link in links" :key="link.label" :to="link.to" class="mobile-nav__link">{{ link.label }}</RouterLink>
        <RouterLink v-if="!session.isAuthed" to="/login" class="mobile-nav__link">Log in</RouterLink>
      </nav>
    </Transition>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(247, 245, 239, 0.72);
  backdrop-filter: saturate(1.4) blur(14px);
  border-bottom: 1px solid transparent;
  transition:
    border-color 0.3s,
    background-color 0.3s;
}
.site-header.is-scrolled {
  border-bottom-color: var(--line);
  background: rgba(247, 245, 239, 0.9);
}
.site-header__inner {
  display: flex;
  align-items: center;
  gap: 32px;
  height: 72px;
}
.site-header__nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
}
.site-header__link {
  padding: 8px 14px;
  border-radius: var(--radius-pill);
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink-2);
  transition:
    background-color 0.2s,
    color 0.2s;
}
.site-header__link:hover {
  background: rgba(22, 36, 29, 0.05);
  color: var(--ink);
}
.site-header__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}
.site-header__toggle {
  display: none;
}
.mobile-nav {
  display: flex;
  flex-direction: column;
  padding-top: 4px;
  padding-bottom: 16px;
}
.mobile-nav__link {
  padding: 14px 4px;
  border-bottom: 1px solid var(--line);
  font-size: 16px;
  font-weight: 650;
}

@media (max-width: 900px) {
  .site-header__nav {
    display: none;
  }
  .site-header__toggle {
    display: inline-flex;
  }
}
</style>
