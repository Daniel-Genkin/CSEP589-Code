export const MINUTE = 60_000
export const HOUR = 60 * MINUTE
export const DAY = 24 * HOUR

export const isoAgo = (ms) => new Date(Date.now() - ms).toISOString()
export const isoAhead = (ms) => new Date(Date.now() + ms).toISOString()

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const clone = (value) => (value === undefined ? undefined : JSON.parse(JSON.stringify(value)))

const ALPHABET = 'abcdefghijkmnpqrstuvwxyz23456789'
export function randomId(prefix, length = 8) {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  const id = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
  return prefix ? `${prefix}_${id}` : id
}

export const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length
export const round1 = (n) => Math.round(n * 10) / 10

export function joinWords(words) {
  if (words.length <= 1) return words.join('')
  return `${words.slice(0, -1).join(', ')} and ${words.at(-1)}`
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
