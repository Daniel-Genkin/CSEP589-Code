<script setup>
import BrandLogo from '@/components/ui/BrandLogo.vue';
import { ArrowLeft, Compass } from '@lucide/vue';
</script>

<template>
  <div class="not-found">
    <RouterLink to="/" aria-label="outvest home"><BrandLogo /></RouterLink>
    <div class="not-found__body">
      <span class="not-found__icon"><Compass :size="30" /></span>
      <h1 class="h-1">This page wandered off.</h1>
      <p class="lead">The link might be old, or the page moved. Let's get you back somewhere calm.</p>
      <div class="not-found__actions">
        <RouterLink to="/" class="btn btn-primary btn-lg"><ArrowLeft :size="18" /> Back home</RouterLink>
        <RouterLink to="/app" class="btn btn-secondary btn-lg">Open the app</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 28px 40px;
}
.not-found__body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  max-width: 560px;
  margin: 0 auto;
  text-align: center;
}
.not-found__icon {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin-bottom: 8px;
  border-radius: 24px;
  background: var(--lilac-100);
  color: var(--lilac-700);
}
.not-found__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 16px;
}
@media (max-width: 640px) {
  .not-found {
    padding: 20px;
  }
}
</style>
