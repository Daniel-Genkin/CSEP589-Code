import {
  ChartLine,
  CircleAlert,
  CircleCheck,
  CircleDot,
  FileText,
  Landmark,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from '@lucide/vue'

// Shown as one-tap starters under every prompt bar.
export const EXAMPLE_IDEAS = [
  'Heat pumps will replace gas furnaces faster than Wall Street expects',
  'AI data centers will make grid equipment the next bottleneck',
  'Sodium-ion batteries will undercut lithium for home storage',
  'Electric delivery trucks will win before electric cars do',
  'Nuclear is coming back to power AI',
  'Water reuse will go mainstream in the drought-hit West',
]

export const CLAIM_STATUS = {
  supported: { label: 'Holds up', tone: 'great', icon: CircleCheck },
  mixed: { label: 'Mixed evidence', tone: 'mixed', icon: CircleDot },
  weak: { label: 'Not proven yet', tone: 'low', icon: CircleAlert },
}

export const SOURCES = {
  filings: { label: 'Company filings', icon: FileText },
  policy: { label: 'Government policy', icon: Landmark },
  adoption: { label: 'Adoption data', icon: ChartLine },
}

export const WEIGHTINGS = [
  { value: 'exposure', label: 'Most exposed', hint: 'Bigger slices for the companies most tied to your idea.' },
  { value: 'equal', label: 'Equal', hint: 'Every company gets the same slice.' },
  { value: 'bold', label: 'Bolder', hint: 'Leans into smaller companies: more upside, bigger swings.' },
  { value: 'steady', label: 'Steadier', hint: 'Leans into larger companies: smaller swings.' },
]

export const SCHEDULES = [
  { value: 'monthly', label: 'Monthly', description: 'Back to target weights every month.' },
  { value: 'quarterly', label: 'Quarterly', description: 'Every three months. A good default.' },
  { value: 'semiannual', label: 'Twice a year', description: 'Every six months.' },
  { value: 'yearly', label: 'Yearly', description: 'Once a year, the lowest-touch option.' },
]

export const scheduleLabel = (value) => SCHEDULES.find((s) => s.value === value)?.label ?? value

export const ALERT_KINDS = {
  strengthens: { label: 'Strengthens a claim', tone: 'up', icon: TrendingUp },
  weakens: { label: 'Weakens a claim', tone: 'down', icon: TrendingDown },
  rebalance: { label: 'Rebalance coming up', tone: 'lilac', icon: RefreshCw },
}

const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '')
export const formatReturn = (n) => `${sign(n)}${Math.abs(n).toFixed(1)}%`
export const formatPts = (n) => `${sign(n)}${Math.abs(n).toFixed(1)} pts`

export function trackRecordLine(record) {
  if (!record?.calls) return 'No published calls yet'
  if (!record.scored) return `${record.calls} ${record.calls === 1 ? 'call' : 'calls'}, too early to score`
  return `${record.beating} of ${record.scored} ${record.scored === 1 ? 'call' : 'calls'} beating the S&P 500`
}

// Splits a dollar amount across percentage weights (summing to 100) so the cents add up exactly.
export function splitDollars(amount, weights) {
  const cents = Math.round(amount * 100)
  const raw = weights.map((w) => (cents * w) / 100)
  const parts = raw.map(Math.floor)
  let left = cents - parts.reduce((sum, v) => sum + v, 0)
  const byRemainder = raw.map((v, i) => [v - parts[i], i]).sort((a, b) => b[0] - a[0])
  for (const [, i] of byRemainder) {
    if (left <= 0) break
    parts[i]++
    left--
  }
  return parts.map((c) => c / 100)
}
