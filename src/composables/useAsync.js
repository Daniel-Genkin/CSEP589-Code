import { ref, shallowRef } from 'vue'

// Wraps a service call with loading/error state for views.
export function useAsync(fn, { immediate = true } = {}) {
  const data = shallowRef(null)
  const error = ref(null)
  const loading = ref(immediate)

  async function run(...args) {
    loading.value = true
    error.value = null
    try {
      data.value = await fn(...args)
      return data.value
    } catch (err) {
      error.value = err
      return null
    } finally {
      loading.value = false
    }
  }

  if (immediate) run()
  return { data, error, loading, run }
}
