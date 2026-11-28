<script setup>
import StepBar from './StepBar.vue'
import AppFooter from './AppFooter.vue'

defineProps({
  title: String,
  body: String,
  steps: Number,
  step: Number,
  label: String,
  back: { type: [Boolean, String], default: true },
  close: String,
  logoTo: { type: String, default: '/' },
})
</script>

<template>
  <div class="flow">
    <StepBar :steps="steps" :step="step" :label="label" :back="back" :close="close" :logo-to="logoTo" />
    <main class="main">
      <section class="left">
        <slot name="title"><h1 class="display title">{{ title }}</h1></slot>
        <p class="body">{{ body }}</p>
        <slot name="left" />
      </section>
      <section class="right">
        <slot />
      </section>
    </main>
    <AppFooter />
    <slot name="overlay" />
  </div>
</template>

<style scoped>
.flow { width: min(var(--app-w), calc(100% - 48px)); margin: 0 auto; padding: 24px 0 40px; display: flex; flex-direction: column; gap: 40px; }
.main { display: flex; gap: 64px; align-items: flex-start; justify-content: space-between; }
.left { flex: 0 1 696px; padding-top: 32px; display: flex; flex-direction: column; gap: 14px; }
.title { font-size: 88px; color: var(--cream); }
.body { font-size: 17px; line-height: 1.45; color: var(--dim); max-width: 696px; }
.right { flex: 0 0 520px; display: flex; flex-direction: column; gap: 20px; }
</style>
