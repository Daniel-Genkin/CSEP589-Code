<script setup>
import { useToast } from '@/composables/useToast'
import { CircleCheck, Info, TriangleAlert, X } from '@lucide/vue'

const { toasts, dismiss } = useToast()
const icons = { success: CircleCheck, info: Info, error: TriangleAlert }

function runAction(toast) {
  toast.action?.onClick?.()
  dismiss(toast.id)
}
</script>

<template>
  <div class="toasts" aria-live="polite" aria-atomic="false">
    <TransitionGroup name="toast">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="`toast--${toast.tone}`" role="status">
        <component :is="icons[toast.tone]" :size="19" class="toast__icon" />
        <div class="toast__body">
          <p class="toast__message">{{ toast.message }}</p>
          <p v-if="toast.description" class="toast__description">{{ toast.description }}</p>
        </div>
        <RouterLink v-if="toast.action?.to" :to="toast.action.to" class="toast__action" @click="dismiss(toast.id)">
          {{ toast.action.label }}
        </RouterLink>
        <button v-else-if="toast.action" type="button" class="toast__action" @click="runAction(toast)">
          {{ toast.action.label }}
        </button>
        <button type="button" class="toast__close" aria-label="Dismiss" @click="dismiss(toast.id)">
          <X :size="15" />
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  width: min(420px, calc(100vw - 32px));
  pointer-events: none;
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 100%;
  padding: 14px 14px 14px 16px;
  border-radius: 18px;
  background: var(--ink);
  color: #fff;
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}
.toast__icon {
  flex-shrink: 0;
  margin-top: 1px;
  color: var(--brand-300);
}
.toast--error .toast__icon {
  color: #f6a493;
}
.toast--info .toast__icon {
  color: #a9cdf0;
}
.toast__body {
  flex: 1;
  min-width: 0;
}
.toast__message {
  font-size: 14.5px;
  font-weight: 650;
  line-height: 1.4;
}
.toast__description {
  margin-top: 2px;
  font-size: 13.5px;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.45;
}
.toast__action {
  flex-shrink: 0;
  align-self: center;
  padding: 6px 12px;
  border-radius: var(--radius-pill);
  background: rgba(255, 255, 255, 0.12);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  transition: background-color 0.2s;
}
.toast__action:hover {
  background: rgba(255, 255, 255, 0.2);
}
.toast__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.6);
}
.toast__close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.3s var(--ease),
    transform 0.3s var(--ease);
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 1023px) {
  .toasts {
    right: 16px;
    bottom: calc(84px + env(safe-area-inset-bottom));
    align-items: stretch;
  }
}
</style>
