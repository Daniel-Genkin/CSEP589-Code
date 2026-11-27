<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDemoStore } from '@/state/demo'

const demo = useDemoStore()
const router = useRouter()
function reset() {
  demo.reset()
  router.push('/')
}
</script>

<template>
  <footer class="app-footer">
    <RouterLink to="/" class="display logo">Rally</RouterLink>
    <p class="note sample-banner">Live market data · Sample values tags. Not investment advice.</p>
    <button class="reset" @click="reset">Reset demo</button>
    <p class="tagline">Know what you own.</p>
  </footer>
</template>

<style scoped>
.app-footer { display: flex; align-items: center; gap: 32px; border-top: 1px solid var(--line); padding: 28px 0 0; margin-top: 8px; }
.logo { font-size: 24px; color: var(--cream); }
.note { flex: 1; font-size: 14px; color: var(--mute); }
.reset { font-weight: 500; font-size: 14px; color: var(--link); }
.reset:hover { text-decoration: underline; text-underline-offset: 3px; }
.tagline { font-weight: 500; font-size: 15px; color: var(--white); }
</style>
