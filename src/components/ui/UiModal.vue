<script setup>
import { X } from '@lucide/vue'
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  size: { type: String, default: 'md' },
  dismissible: { type: Boolean, default: true },
  label: { type: String, default: 'Dialog' },
})
const emit = defineEmits(['close'])

const dialog = ref(null)
let returnTo = null
let openedAt = 0

/** A press on the scrim this soon after opening is the tail of a double click, not a dismissal. */
const DOUBLE_CLICK_MS = 500
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function onKeydown(event) {
  if (event.key === 'Escape' && props.dismissible) emit('close')
  if (event.key !== 'Tab' || !dialog.value) return
  // Keep Tab inside the dialog.
  const stops = [...dialog.value.querySelectorAll(FOCUSABLE)]
  const first = stops[0] ?? dialog.value
  const last = stops[stops.length - 1] ?? dialog.value
  const at = document.activeElement
  if (!dialog.value.contains(at) || at === dialog.value) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  } else if (event.shiftKey ? at === first : at === last) {
    event.preventDefault()
    ;(event.shiftKey ? last : first).focus()
  }
}

function onScrim() {
  if (props.dismissible && performance.now() - openedAt > DOUBLE_CLICK_MS) emit('close')
}

/** Everything behind the dialog (the app root) cannot be focused, clicked or read while it is open. */
const setBackgroundInert = (inert) => document.getElementById('app')?.toggleAttribute('inert', inert)

/** Put focus on the dialog itself, for when the control that had it is removed. */
const focus = () => nextTick(() => dialog.value?.focus())
defineExpose({ focus })

watch(
  () => props.open,
  async (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    setBackgroundInert(open)
    if (open) {
      openedAt = performance.now()
      window.addEventListener('keydown', onKeydown)
      // Move focus into the dialog, and remember where it was so it can go back on close.
      // (Some browsers do not focus a button on click; the opener can restore focus itself.)
      returnTo = document.activeElement
      await nextTick()
      dialog.value?.focus()
    } else {
      window.removeEventListener('keydown', onKeydown)
      if (returnTo?.isConnected && returnTo !== document.body) returnTo.focus()
      returnTo = null
    }
  },
)

onBeforeUnmount(() => {
  if (props.open) {
    document.body.style.overflow = ''
    setBackgroundInert(false)
  }
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="open" class="modal-root" @pointerdown.self="onScrim">
        <div ref="dialog" class="modal" :class="`modal--${size}`" role="dialog" aria-modal="true" :aria-label="label" tabindex="-1">
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
  background: rgba(10, 9, 14, 0.72);
  overflow-y: auto;
}
.modal {
  position: relative;
  width: 100%;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding: 30px;
  background: var(--surface);
  border: var(--outline);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-float);
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
  color: var(--text);
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
