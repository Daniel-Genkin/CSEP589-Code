// Everything a screen needs to show the active portfolio: the companies inside it (funds looked
// through), their details and tags, and exposure in the selected categories. Data comes from
// the provider; the arithmetic is the domain's.
import { provider } from '@/data'
import { exposureByCategory, largestExposure, totalFlagged } from '@/domain/exposure'
import { type FundMap, lookThrough } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { useDemoStore } from '@/state/demo'
import type { FundConstituents, Portfolio, Security, ValuesTag } from '@/types'
import { computed, ref, shallowRef, watch } from 'vue'

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface PortfolioDetails {
  funds: FundMap
  fundSources: Map<string, FundConstituents>
  securities: Map<string, Security>
  tags: ValuesTag[]
}

/** Fetch what a portfolio needs: the funds it holds, then details and tags for every company. */
export async function loadPortfolioDetails(portfolio: Portfolio): Promise<PortfolioDetails> {
  // A fund-origin portfolio's holdings are already companies; only a mixed one can hold funds.
  const held =
    portfolio.origin === 'fund'
      ? []
      : await provider.getSecurities(portfolio.holdings.map((h) => h.ticker))
  const fundTickers = held.filter((s) => s.kind === 'etf').map((s) => s.ticker)
  const funds: FundMap = {}
  const fundSources = new Map<string, FundConstituents>()
  if (portfolio.fundDetails) fundSources.set(portfolio.id, portfolio.fundDetails)
  await Promise.all(
    fundTickers.map(async (ticker) => {
      const fund = await provider.getFund(ticker)
      if (fund) {
        funds[ticker] = fund.holdings
        if (fund.fundDetails) fundSources.set(ticker, fund.fundDetails)
      }
    }),
  )
  const companies = lookThrough(portfolio, funds).map((row) => row.ticker)
  const positions = portfolio.origin === 'fund' ? [portfolio.id] : portfolio.holdings.map((h) => h.ticker)
  const [positionSecurities, companySecurities, tags] = await Promise.all([
    held.length ? Promise.resolve(held) : provider.getSecurities(positions),
    provider.getSecurityMetadata(companies),
    provider.getTags(companies),
  ])
  const securities = new Map(companySecurities.map((security) => [security.ticker, security]))
  for (const security of positionSecurities) securities.set(security.ticker, security)
  return { funds, fundSources, securities, tags }
}

export type PortfolioData = ReturnType<typeof usePortfolioData>

export function usePortfolioData() {
  const demo = useDemoStore()
  const catalog = useCatalogStore()

  const status = ref<LoadStatus>('idle')
  const details = shallowRef<PortfolioDetails>({ funds: {}, fundSources: new Map(), securities: new Map(), tags: [] })
  let request = 0

  async function load() {
    const portfolio = demo.portfolio
    const mine = ++request
    if (!portfolio) {
      status.value = 'idle'
      return
    }
    status.value = 'loading'
    try {
      const [loaded] = await Promise.all([loadPortfolioDetails(portfolio), catalog.load()])
      if (mine !== request) return // a newer portfolio replaced this one while it loaded
      details.value = loaded
      status.value = 'ready'
    } catch {
      if (mine === request) status.value = 'error'
    }
  }

  // Reload when the set of holdings changes, not when a weight is edited.
  watch(() => `${demo.portfolio?.id}|${demo.portfolio?.origin}|${demo.portfolio?.holdings.map((h) => h.ticker).join(',')}`, load, { immediate: true })

  const portfolio = computed(() => demo.portfolio)
  const rows = computed(() => (demo.portfolio && status.value === 'ready' ? lookThrough(demo.portfolio, details.value.funds) : []))
  const tags = computed(() => details.value.tags)
  const funds = computed(() => details.value.funds)
  const fundSources = computed(() => details.value.fundSources)
  const securities = computed(() => details.value.securities)
  const selectedIds = computed(() => catalog.selectedIds)

  const exposures = computed(() => exposureByCategory(rows.value, tags.value, selectedIds.value))
  const flagged = computed(() => totalFlagged(rows.value, tags.value, selectedIds.value))
  const largest = computed(() => largestExposure(exposures.value))

  const nameOf = (ticker: string) => securities.value.get(ticker)?.name ?? ticker

  return { status, portfolio, rows, tags, funds, fundSources, securities, selectedIds, exposures, flagged, largest, nameOf, reload: load }
}
