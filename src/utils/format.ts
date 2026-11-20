// How numbers are written on screen. One place, so every screen agrees.

const whole = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const cents = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "$1,240": whole dollars. Amounts under $1 that are not zero read "<$1" rather than "$0". */
export const usd = (value: number) => (value > 0 && value < 0.5 ? '<$1' : whole.format(value))

/** "$1,240.50": dollars and cents, for trades and per-holding values. */
export const usdCents = (value: number) => cents.format(value)

/** A share of the portfolio (0 to 1) as "12.4%". */
export const pct = (share: number, digits = 1) => `${(share * 100).toFixed(digits)}%`

/** A whole-number headline percentage that never rounds a real exposure down to "0%". */
export const headlinePct = (share: number) => (share > 0 && share < 0.005 ? '<1%' : `${Math.round(share * 100)}%`)

/** "+0.42" / "−1.10": a signed difference in points, with a real minus sign. One that rounds to zero is "0.00". */
export function signed(value: number, digits = 2): string {
  const text = Math.abs(value).toFixed(digits)
  if (Number(text) === 0) return text
  return `${value < 0 ? '−' : '+'}${text}`
}

/** "1 holding" / "5 holdings" */
export const plural = (count: number, one: string, many = `${one}s`) => `${count.toLocaleString('en-US')} ${count === 1 ? one : many}`

/** "ExxonMobil, Chevron and 3 more" */
export function listNames(names: string[], max = 2): string {
  if (names.length <= max) return names.length === 2 ? names.join(' and ') : names.join(', ')
  return `${names.slice(0, max).join(', ')} and ${names.length - max} more`
}

/** "35 minutes ago", "3 hours ago", "2 days ago": for alert timestamps stored as offsets from now. */
export function agoFromMinutes(minutes: number): string {
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${plural(Math.round(minutes), 'minute')} ago`
  if (minutes < 60 * 24) return `${plural(Math.round(minutes / 60), 'hour')} ago`
  return `${plural(Math.round(minutes / (60 * 24)), 'day')} ago`
}
