<script setup>
import { X } from '@lucide/vue'
import { onBeforeUnmount, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  dismissible: { type: Boolean, default: true },
  label: { type: String, default: 'Dialog' },
})
const emit = defineEmits(['close'])

function onKeydown(event) {
  if (event.key === 'Escape' && props.dismissible) emit('close')
}

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (open) window.addEventListener('keydown', onKeydown)
    else window.removeEventListener('keydown', onKeydown)
  },
)

onBeforeUnmount(() => {
  if (props.open) document.body.style.overflow = ''
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-root" @pointerdown.self="dismissible && emit('close')">
        <div class="modal" :class="`modal--${size}`" role="dialog" aria-modal="true" :aria-label="label">
          <button v-if="dismissible" type="button" class="modal__close" aria-label="Close" @click="emit('close')">
            <X :size="18" />
          </button>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(22, 36, 29, 0.36);
  backdrop-filter: blur(6px);
  overflow-y: auto;
}
.modal {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 30px;
  background: var(--surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}
.modal--sm {
  max-width: 420px;
}
.modal--md {
  max-width: 520px;
}
.modal--lg {
  max-width: 680px;
}
.modal__close {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  color: var(--muted);
  transition:
    background-color 0.2s,
    color 0.2s;
}
.modal__close:hover {
  background: var(--bg-tint);
  color: var(--ink);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s var(--ease);
}
.modal-enter-active .modal,
.modal-leave-active .modal {
  transition:
    transform 0.3s var(--ease),
    opacity 0.25s var(--ease);
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal,
.modal-leave-to .modal {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

@media (max-width: 640px) {
  .modal-root {
    place-items: end center;
    padding: 0;
  }
  .modal {
    max-height: 92vh;
    padding: 26px 20px calc(24px + env(safe-area-inset-bottom));
    border-radius: 26px 26px 0 0;
  }
  .modal-enter-from .modal,
  .modal-leave-to .modal {
    transform: translateY(40px);
  }
}
</style>
