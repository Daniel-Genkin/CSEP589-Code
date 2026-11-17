// Turns a checkFund() result into ReceiptPaper props: dollars per $100 in the fund,
// the two biggest companies that cross a line, and everything else as "Not shown".
import { pct1 as pct, pluralize, usd2 as usd } from '@/utils/format'

export function receiptProps(result, shownCount = 2) {
  const { fund, crossers, crossingPct } = result
  const shown = crossers.slice(0, shownCount)
  const hidden = crossers.slice(shownCount)
  const hiddenPct = hidden.reduce((sum, r) => sum + r.weight, 0)
  const items = shown.map((r) => ({ name: r.crossed[0].label, note: `${r.name} · ${pct(r.weight)}`, value: usd(r.weight) }))
  if (hidden.length) {
    items.push({ name: 'Not shown', note: `${pluralize(hidden.length, 'more company', 'more companies')} · ${pct(hiddenPct)}`, value: usd(hiddenPct) })
  }
  return {
    subtitle: `Conflict receipt · ${fund.symbol}`,
    items,
    total: { label: 'Crosses your lines', note: `per $100 in ${fund.symbol}`, value: usd(crossingPct), tone: 'flare' },
    after: [{ label: 'Passes your lines', value: usd(100 - crossingPct) }],
    footer: 'Sample data · No judgment · Just receipts',
  }
}
