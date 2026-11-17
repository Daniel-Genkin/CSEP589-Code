// The category list, loaded once through the provider and shared by every screen.
import { provider } from '@/data'
import type { Category, CategoryId } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useDemoStore } from './demo'

export const useCatalogStore = defineStore('catalog', () => {
  const categories = ref<Category[]>([])
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  let loading: Promise<void> | null = null

  const featured = computed(() => categories.value.filter((c) => c.featured))
  const others = computed(() => categories.value.filter((c) => !c.featured))
  const featuredIds = computed(() => featured.value.map((c) => c.id))
  const byId = computed(() => new Map(categories.value.map((c) => [c.id, c])))

  /**
   * The categories in force: what the user chose, or the featured seven until they choose.
   * Kept in the catalog's order so chips, receipts and tables always list them the same way.
   */
  const selectedIds = computed<CategoryId[]>(() => {
    const chosen = useDemoStore().selectedCategories
    if (!chosen) return featuredIds.value
    return categories.value.filter((c) => chosen.includes(c.id)).map((c) => c.id)
  })
  const selected = computed(() => selectedIds.value.map((id) => byId.value.get(id)!).filter(Boolean))

  function load(): Promise<void> {
    if (status.value === 'ready') return Promise.resolve()
    loading ??= (async () => {
      status.value = 'loading'
      try {
        categories.value = await provider.getCategories()
        status.value = 'ready'
      } catch (error) {
        status.value = 'error'
        throw error
      } finally {
        loading = null
      }
    })()
    return loading
  }

  /** Switch one category on or off, starting from the featured defaults the first time. */
  function toggle(id: CategoryId) {
    useDemoStore().toggleCategory(id, featuredIds.value)
  }

  const label = (id: CategoryId) => byId.value.get(id)?.label ?? id
  const color = (id: CategoryId) => byId.value.get(id)?.color ?? 'var(--bar-muted)'

  return { categories, status, featured, others, featuredIds, byId, selectedIds, selected, load, toggle, label, color }
})
