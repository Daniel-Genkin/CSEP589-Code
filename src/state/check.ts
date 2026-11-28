// The check flow in progress: what the person typed, the amount, and any lines of their own.
// It lives for this visit only; the result lands in the demo store as the active portfolio.
import { DEFAULT_PORTFOLIO_USD } from '@/config/defaults'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCheckStore = defineStore('check', () => {
  /** A fund ticker, or several tickers separated by commas */
  const input = ref('VOO')
  /** Dollars in the fund; null when the person skipped the amount (results show per $100) */
  const amount = ref<number | null>(null)
  /** Lines the person added themselves. Rally has no records for these yet. */
  const customLines = ref<string[]>([])
  /** The email typed on Sign in, waiting for its code. Never put in the URL. */
  const signInEmail = ref('')

  const totalUsd = () => amount.value ?? DEFAULT_PORTFOLIO_USD
  return { input, amount, customLines, signInEmail, totalUsd }
})
