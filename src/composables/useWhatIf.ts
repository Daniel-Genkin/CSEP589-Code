// The what-if for the active portfolio: which holdings the exclusions remove, the back-test
// for original, filtered and benchmark, and flagged exposure before and after.
// Data comes from the provider; the arithmetic is the domain's.
import { provider } from '@/data'
import { filteredRows, planRedistribution } from '@/domain/exclusions'
import { exposureByCategory, totalFlagged } from '@/domain/exposure'
import { fundsIn } from '@/domain/portfolio'
import { useDemoStore } from '@/state/demo'
import type { BacktestResult, ValuesTag } from '@/types'
import { computed, ref, shallowRef, watch } from 'vue'
import type { PortfolioData } from './usePortfolioData'

export function useWhatIf(data: PortfolioData) {
  const demo = useDemoStore()

  const backtest = shallowRef<BacktestResult | null>(null)
  const status = ref<'idle' | 'loading' | 'ready' | 'error'>('idle')
  /** True from a change until its result arrives: what is on screen belongs to the previous inputs. */
  const pending = ref(false)
  /** Milliseconds the last recalculation took, provider call included */
  const lastMs = ref(0)
  // Tags for swapped-in alternatives, which are not in the portfolio's own tag list.
  const swapTags = shallowRef<ValuesTag[]>([])
  let request = 0

  const rows = computed(() => data.rows.value)
  const allTags = computed(() => [...data.tags.value, ...swapTags.value])
  const heldFunds = computed(() => (data.portfolio.value ? fundsIn(data.portfolio.value, data.funds.value) : []))

  const plan = computed(() => planRedistribution(rows.value, data.tags.value, demo.exclusions, heldFunds.value))
  const excluded = computed(() => plan.value.excluded)

  const before = computed(() => totalFlagged(rows.value, data.tags.value, data.selectedIds.value))
  const afterRows = computed(() => filteredRows(rows.value, data.tags.value, demo.exclusions, data.portfolio.value?.totalUsd ?? 0, heldFunds.value))
  const after = computed(() => totalFlagged(afterRows.value, allTags.value, data.selectedIds.value))
  const exposuresBefore = computed(() => exposureByCategory(rows.value, data.tags.value, data.selectedIds.value))
  const exposuresAfter = computed(() => exposureByCategory(afterRows.value, allTags.value, data.selectedIds.value))

  /** Drop what is on screen and anything still in flight: it belongs to another portfolio. */
  function discard() {
    request += 1
    backtest.value = null
    swapTags.value = []
    pending.value = false
    status.value = 'idle'
  }

  async function recalculate() {
    const portfolio = data.portfolio.value
    if (!portfolio || data.status.value !== 'ready') {
      request += 1 // whatever is in flight was asked for inputs that no longer hold
      pending.value = false
      return
    }
    const mine = ++request
    const started = performance.now()
    pending.value = true
    if (!backtest.value) status.value = 'loading'
    try {
      const swapTargets = Object.values(plan.value.swaps)
      const [result, tags] = await Promise.all([provider.getBacktest(portfolio, demo.exclusions), swapTargets.length ? provider.getTags(swapTargets) : Promise.resolve([])])
      if (mine !== request) return // a newer change already asked again
      backtest.value = result
      swapTags.value = tags
      lastMs.value = performance.now() - started
      status.value = 'ready'
      pending.value = false
    } catch {
      if (mine !== request) return
      status.value = 'error'
      pending.value = false
    }
  }

  // A different set of holdings is a different back-test: never show the old one under the new name.
  watch(
    () => `${data.portfolio.value?.origin}:${data.portfolio.value?.id}:${data.portfolio.value?.holdings.map((h) => h.ticker).join(',')}`,
    discard,
  )
  // Recalculate when the portfolio (holdings or weights) or the exclusions change.
  watch([() => data.status.value, () => data.portfolio.value, () => demo.exclusions], recalculate, { immediate: true })

  // An alternative qualifies only while it carries no tag in any selected category. If the
  // user later selects a category the swapped-in company is tagged in, the swap is undone.
  watch([swapTags, () => data.selectedIds.value], () => {
    const selected = new Set(data.selectedIds.value)
    const tagged = new Set(swapTags.value.filter((tag) => selected.has(tag.category)).map((tag) => tag.ticker))
    for (const [from, to] of Object.entries(demo.exclusions.swaps)) if (tagged.has(to)) demo.undoSwap(from)
  })

  const points = computed(() => (backtest.value ? backtest.value.annualizedPct.filtered - backtest.value.annualizedPct.original : 0))

  return { backtest, status, pending, lastMs, plan, excluded, before, after, exposuresBefore, exposuresAfter, points, recalculate }
}
