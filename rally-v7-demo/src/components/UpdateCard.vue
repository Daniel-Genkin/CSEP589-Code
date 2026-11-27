<script setup>
import { ref } from 'vue'
defineProps({ line: String, color: String, text: String, tk: String, held: String, source: String, href: String })
const read = ref(false)
</script>

<template>
  <article class="card-pad upd" :class="{ read }">
    <div class="top">
      <p class="label"><span class="dot" :style="{ background: color }" /> {{ line }} · New source</p>
      <button class="mark" @click="read = !read">{{ read ? 'Read' : 'Mark Read' }}</button>
    </div>
    <p class="text">{{ text }}</p>
    <div class="chips">
      <span class="chip chip-s"><b class="mono">{{ tk }}</b> {{ held }}</span>
      <span class="chip chip-s"><span class="dot" :style="{ background: color }" /> {{ line }}</span>
    </div>
    <a class="src mono" :href="href" target="_blank" rel="noopener">{{ source }} ↗</a>
  </article>
</template>

<style scoped>
.upd { padding: 20px; gap: 14px; transition: opacity 0.2s; }
.upd.read { opacity: 0.55; }
.top { display: flex; justify-content: space-between; align-items: center; }
.label { display: inline-flex; align-items: center; gap: 8px; }
.mark { color: var(--link); font-weight: 600; font-size: 15px; }
.text { font-weight: 500; font-size: 18px; color: var(--white); line-height: 1.4; }
.chips { display: flex; gap: 8px; flex-wrap: wrap; }
.chip-s { height: 32px; font-size: 13px; color: var(--dim); }
.chip-s b { color: var(--white); font-weight: 500; }
.src { font-size: 12px; color: var(--link); margin-top: 6px; }
</style>
