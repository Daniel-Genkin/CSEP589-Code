const relative = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
const UNITS = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function timeAgo(iso) {
  if (!iso) return ''
  const seconds = (Date.parse(iso) - Date.now()) / 1000
  const abs = Math.abs(seconds)
  if (abs < 60) return seconds <= 0 ? 'just now' : 'in a moment'
  for (const [unit, size] of UNITS) {
    if (abs >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return ''
}

export const formatDate = (iso, options = { month: 'short', day: 'numeric' }) =>
  iso ? new Date(iso).toLocaleDateString('en-US', options) : ''

export const formatDateLong = (iso) => formatDate(iso, { month: 'long', day: 'numeric', year: 'numeric' })

export const formatMoney = (amount) =>
  amount.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: amount % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  })

export const formatPercent = (value) => `${Number.isInteger(value) ? value : value.toFixed(1)}%`

export const pluralize = (count, word, plural = `${word}s`) => `${count.toLocaleString('en-US')} ${count === 1 ? word : plural}`

export const daysUntil = (iso) => Math.max(0, Math.ceil((Date.parse(iso) - Date.now()) / 86_400_000))

export const firstNameOf = (name) => (name ? name.trim().split(/\s+/)[0] : '')

export const initialsOf = (name) =>
  (name || '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
