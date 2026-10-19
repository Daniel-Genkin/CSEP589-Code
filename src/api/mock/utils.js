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
