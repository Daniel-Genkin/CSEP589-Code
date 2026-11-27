<script setup>
import { useRouter } from 'vue-router'
import { ChevronLeft } from '@lucide/vue'
import AppNav from './AppNav.vue'
import AppFooter from './AppFooter.vue'

defineProps({
  active: String,
  glow: { type: String, default: 'warm' },
  title: String,
  body: String,
  backLabel: String,
})
const router = useRouter()
</script>

<template>
  <div class="shell">
    <div class="glow" :class="glow" aria-hidden="true" />
    <div class="inner">
      <AppNav :active="active" />
      <div v-if="backLabel" class="back">
        <button class="circle" aria-label="Back" @click="router.back()"><ChevronLeft :size="22" /></button>
        <span>{{ backLabel }}</span>
      </div>
      <header v-if="title" class="head">
        <h1 class="display title">{{ title }}</h1>
        <p v-if="body" class="body">{{ body }}</p>
      </header>
      <slot />
      <AppFooter />
    </div>
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.shell { position: relative; min-height: 100vh; overflow-x: clip; }
.glow { position: absolute; inset: 0 0 auto 0; height: 560px; pointer-events: none; }
.glow.warm { background: radial-gradient(60% 90% at 18% -20%, rgba(247, 197, 78, 0.62), transparent 70%), radial-gradient(55% 90% at 82% -25%, rgba(232, 90, 42, 0.6), transparent 70%), radial-gradient(40% 60% at 50% -10%, rgba(255, 244, 214, 0.22), transparent 70%); }
.glow.green { background: radial-gradient(70% 90% at 30% -25%, rgba(75, 214, 126, 0.5), transparent 70%), radial-gradient(50% 80% at 80% -25%, rgba(32, 140, 110, 0.45), transparent 70%); }
.glow.grey { background: radial-gradient(80% 90% at 50% -30%, rgba(169, 164, 179, 0.28), transparent 70%); }
.glow::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, transparent 20%, var(--ink) 100%); }
.inner { position: relative; width: min(var(--app-w), calc(100% - 48px)); margin: 0 auto; padding: 24px 0 40px; display: flex; flex-direction: column; gap: 32px; }
.back { display: flex; align-items: center; gap: 14px; font-weight: 600; font-size: 20px; color: var(--white); margin-bottom: -8px; }
.circle { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.06); color: var(--white); }
.head { display: flex; flex-direction: column; gap: 12px; margin-top: 8px; }
.title { font-size: 88px; color: var(--cream); }
.body { font-size: 17px; color: var(--dim); }
</style>
