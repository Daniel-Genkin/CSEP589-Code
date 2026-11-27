<script setup>
import { onMounted, onBeforeUnmount } from 'vue'
import { X } from '@lucide/vue'

defineProps({ title: String, width: { type: Number, default: 460 } })
const emit = defineEmits(['close'])
const onKey = (e) => e.key === 'Escape' && emit('close')
onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <div class="overlay" @click.self="emit('close')">
      <div class="dialog" role="dialog" aria-modal="true" :aria-label="title" :style="{ width: width + 'px' }">
        <header class="head">
          <h2>{{ title }}</h2>
          <button class="close" aria-label="Close" @click="emit('close')"><X :size="20" /></button>
        </header>
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay { position: fixed; inset: 0; z-index: 100; background: rgba(9, 8, 12, 0.72); display: grid; place-items: center; padding: 24px; overflow-y: auto; animation: fade 0.18s ease-out; }
.dialog { max-width: 100%; background: #26242e; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 28px; padding: 28px 29px; display: flex; flex-direction: column; gap: 20px; box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6); animation: rise 0.22s ease-out; }
.head { display: flex; align-items: center; justify-content: space-between; }
.head h2 { font-weight: 600; font-size: 20px; color: var(--white); }
.close { width: 44px; height: 44px; border-radius: 50%; display: grid; place-items: center; background: rgba(255, 255, 255, 0.06); border: 1px solid rgba(255, 255, 255, 0.1); color: var(--white); }
@keyframes fade { from { opacity: 0; } }
@keyframes rise { from { opacity: 0; transform: translateY(12px); } }
</style>
