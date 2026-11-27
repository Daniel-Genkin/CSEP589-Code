<script setup>
defineProps({ value: { type: String, default: '13%' }, size: { type: Number, default: 112 } })
</script>

<template>
  <div class="stamp" :style="{ width: size + 'px', height: size + 'px' }">
    <p class="display v">{{ value }}</p>
    <p class="t">Crosses<br />your lines</p>
  </div>
</template>

<style scoped>
.stamp { border-radius: 50%; border: 3px solid var(--flare); box-shadow: inset 0 0 0 5px transparent, inset 0 0 0 6.5px var(--flare); display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-14deg); color: var(--flare); opacity: 0.92; }
.v { font-size: 36px; line-height: 0.95; }
.t { font-family: var(--mono); font-weight: 500; font-size: 10px; line-height: 1.15; letter-spacing: 0.08em; text-transform: uppercase; text-align: center; margin-top: 2px; }
</style>
