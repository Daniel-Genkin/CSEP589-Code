import { reactive } from 'vue'

const toasts = reactive([])
let sequence = 0

function dismiss(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}

function push(message, { tone = 'info', description = '', action = null, timeout = 4500 } = {}) {
  const id = ++sequence
  toasts.push({ id, message, tone, description, action })
  if (toasts.length > 3) toasts.shift()
  if (timeout) setTimeout(() => dismiss(id), timeout)
  return id
}

export function useToast() {
  return {
    toasts,
    dismiss,
    show: push,
    success: (message, options) => push(message, { ...options, tone: 'success' }),
    error: (message, options) => push(message, { ...options, tone: 'error' }),
    info: (message, options) => push(message, { ...options, tone: 'info' }),
  }
}
