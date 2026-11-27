// What the V7 screens show, worked out from the real portfolio data and the selected lines:
// how much crosses the lines, the receipt rows, the dot grid and the flagged companies.
//
// Every share here is a share of your money (dollars over the amount you put in), so the
// percentages always match the dollar figures next to them. The domain's own `share` is of the
// holdings the source lists, which is higher when a fund's list is incomplete; `coverage` says
// how much of the fund that list covers.
import { categoriesByTicker } from '@/domain/exposure'
import { shortName } from '@/domain/portfolio'
import { useCatalogStore } from '@/state/catalog'
import { computed } from 'vue'
import type { PortfolioData } from './usePortfolioData'

export interface FlaggedCompany {
  ticker: string
  name: string
  weight: number
  usd: number
  lines: string[]
}

export const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const whole = (n: number) => '$' + Math.round(n).toLocaleString('en-US')
export const share = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`
export const bigPct = (n: number) => (n > 0 && n < 0.005 ? '<1%' : `${Math.round(n * 100)}%`)

export function useLinesResult(data: PortfolioData) {
  const catalog = useCatalogStore()

  const ready = computed(() => data.status.value === 'ready')
  const fund = computed(() => (data.portfolio.value ? shortName(data.portfolio.value) : ''))
  const totalUsd = computed(() => data.portfolio.value?.totalUsd ?? 0)
  const ofMoney = (usd: number) => (totalUsd.value > 0 ? usd / totalUsd.value : 0)
  /** Share of the fund the holdings list covers (the rest is cash or unlisted). */
  const coverage = computed(() => Math.min(1, ofMoney(data.rows.value.reduce((s, r) => s + r.valueUsd, 0))))
  const flagged = computed(() => ({ ...data.flagged.value, share: ofMoney(data.flagged.value.usd) }))
  const lines = computed(() =>
    data.exposures.value
      .filter((e) => e.usd > 0)
      .sort((a, b) => b.usd - a.usd)
      .map((e) => ({ ...e, share: ofMoney(e.usd), label: catalog.label(e.category), color: catalog.color(e.category) })),
  )

  const companies = computed<FlaggedCompany[]>(() => {
    const byTicker = categoriesByTicker(data.tags.value, data.selectedIds.value)
    return data.rows.value
      .filter((row) => byTicker.has(row.ticker))
      .map((row) => ({ ticker: row.ticker, name: data.nameOf(row.ticker), weight: row.weight, usd: row.valueUsd, lines: byTicker.get(row.ticker) ?? [] }))
      .sort((a, b) => b.weight - a.weight)
  })

  /** Receipt rows: the three biggest lines, then the rest together. */
  const receiptRows = computed(() => {
    const top = lines.value.slice(0, 3).map((l) => {
      const lead = l.top[0]
      return { label: l.label, sub: lead ? `${data.nameOf(lead.ticker)} · ${share(lead.weight ?? 0)}` : `${l.count} companies`, amount: money(l.usd) }
    })
    const rest = lines.value.slice(3)
    if (rest.length) {
      const usd = rest.reduce((s, l) => s + l.usd, 0)
      top.push({ label: `${rest.length} more line${rest.length > 1 ? 's' : ''}`, sub: rest.map((l) => l.label).join(', '), amount: money(usd) })
    }
    return top
  })

  /** 1 dot = 1% of the money, coloured by line. A company on two lines counts once, on its first. */
  const dots = computed(() => {
    const out: { n: number; color: string }[] = []
    let left = Math.round(flagged.value.share * 100)
    for (const l of lines.value) {
      const n = Math.min(left, Math.max(l.share > 0 ? 1 : 0, Math.round(l.share * 100)))
      if (n > 0) out.push({ n, color: l.color })
      left -= n
      if (left <= 0) break
    }
    return out
  })

  return { ready, fund, totalUsd, coverage, ofMoney, flagged, lines, companies, receiptRows, dots }
}
