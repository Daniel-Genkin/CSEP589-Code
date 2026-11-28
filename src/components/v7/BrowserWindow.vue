<script setup>
// A desktop window that shows a real screen of the app, scaled down and not clickable.
defineProps({
  label: String,
  width: { type: Number, default: 1200 }, // rendered width
  height: { type: Number, default: 600 }, // rendered height, including the bar
  designWidth: { type: Number, default: 1470 },
})
</script>

<template>
  <div class="win" :style="{ width: width + 'px', height: height + 'px' }">
    <div class="bar">
      <span class="dots"><i /><i /><i /></span>
      <span class="name mono">{{ label }}</span>
    </div>
    <div class="view" inert>
      <div :style="{ width: designWidth + 'px', zoom: width / designWidth }">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.win { border-radius: 16px; background: var(--ink); border: 1px solid #3a3744; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5); }
.bar { position: relative; height: 40px; flex: none; display: flex; align-items: center; justify-content: center; background: #1c1b22; border-bottom: 1px solid #2c2a35; }
.dots { position: absolute; left: 16px; display: flex; gap: 8px; }
.dots i { width: 11px; height: 11px; border-radius: 50%; background: #3a3744; }
.name { font-weight: 500; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--dim); background: #2c2a35; padding: 5px 12px; border-radius: 6px; }
.view { flex: 1; overflow: hidden; pointer-events: none; }
</style>
