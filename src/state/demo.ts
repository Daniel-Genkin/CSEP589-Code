// Everything the demo remembers: plan, account, chosen categories, the active portfolio and
// what-if exclusions. Persisted to localStorage; "Reset demo" clears all of it.
import { brokerById } from '@/config/brokers'
import type { Account, CategoryId, Exclusions, Plan, Portfolio } from '@/types'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export const STORAGE_KEY = 'rally.demo.v1'
// Keys written by earlier builds. Reset removes them too so nothing stale survives.
const LEGACY_KEYS = ['rally.lines.v1', 'rally.session', 'rally.waitlist.v1', 'rally.mock-db.v1']

export interface DemoState {
  plan: Plan
  account: Account | null
  /** null until the user (or the first load of the category list) chooses */
  selectedCategories: CategoryId[] | null
  portfolio: Portfolio | null
  /** The portfolio in use before a brokerage was connected; "Disconnect" restores it */
  previousPortfolio: Portfolio | null
  exclusions: Exclusions
  readAlertIds: string[]
}

export const emptyExclusions = (): Exclusions => ({ categories: [], tickers: [], swaps: {} })

export const initialState = (): DemoState => ({
  plan: 'free',
  account: null,
  selectedCategories: null,
  portfolio: null,
  previousPortfolio: null,
  exclusions: emptyExclusions(),
  readAlertIds: [],
})
const INITIAL_JSON = JSON.stringify(initialState())

/** Read saved state, falling back field by field so a damaged or older save never breaks the app. */
export function loadState(storage: Pick<Storage, 'getItem'> | undefined): DemoState {
  const base = initialState()
  let saved: Partial<DemoState> | null = null
  try {
    saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return base
  }
  if (!saved || typeof saved !== 'object') return base
  const list = (value: unknown): string[] | null => (Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : null)
  const ex = (saved.exclusions ?? {}) as Partial<Exclusions>
  const swaps: Record<string, string> = {}
  if (ex.swaps && typeof ex.swaps === 'object' && !Array.isArray(ex.swaps)) {
    for (const [from, to] of Object.entries(ex.swaps)) if (typeof to === 'string') swaps[from] = to
  }
  let portfolio = validPortfolio(saved.portfolio)
  // Only meaningful while a connected portfolio is active.
  let previousPortfolio = portfolio?.origin === 'connected' ? validPortfolio(saved.previousPortfolio) : null
  if (previousPortfolio?.origin === 'connected') previousPortfolio = null
  // A connected portfolio whose broker is not one we know cannot be labelled or disconnected: go back to what was there before.
  if (portfolio?.origin === 'connected' && !brokerById(portfolio.brokerId)) {
    portfolio = previousPortfolio
    previousPortfolio = null
  }
  return {
    plan: saved.plan === 'paid' ? 'paid' : 'free',
    account: saved.account && typeof saved.account.email === 'string' ? { email: saved.account.email } : null,
    selectedCategories: list(saved.selectedCategories),
    portfolio,
    previousPortfolio,
    exclusions: { categories: list(ex.categories) ?? [], tickers: list(ex.tickers) ?? [], swaps },
    readAlertIds: list(saved.readAlertIds) ?? [],
  }
}

const ORIGINS = ['fund', 'tickers', 'connected']
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** A saved portfolio is used only if every field the screens read is there and well-formed. */
function validPortfolio(value: unknown): Portfolio | null {
  const p = value as Portfolio | null
  if (!p || typeof p !== 'object') return null
  if (typeof p.id !== 'string' || typeof p.name !== 'string' || !isNumber(p.totalUsd) || !ORIGINS.includes(p.origin)) return null
  if (!Array.isArray(p.holdings)) return null
  const holdingsOk = p.holdings.every((h) => h && typeof h.ticker === 'string' && isNumber(h.weight) && isNumber(h.valueUsd) && isNumber(h.shares))
  return holdingsOk ? p : null
}

const browserStorage = (): Storage | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined // storage blocked: state lasts for this visit only
  }
}

const toggled = <T>(list: T[], item: T): T[] => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item])

export const useDemoStore = defineStore('demo', () => {
  const saved = loadState(browserStorage())
  const plan = ref<Plan>(saved.plan)
  const account = ref<Account | null>(saved.account)
  const selectedCategories = ref<CategoryId[] | null>(saved.selectedCategories)
  const portfolio = ref<Portfolio | null>(saved.portfolio)
  const previousPortfolio = ref<Portfolio | null>(saved.previousPortfolio)
  const exclusions = ref<Exclusions>(saved.exclusions)
  const readAlertIds = ref<string[]>(saved.readAlertIds)

  const isPaid = computed(() => plan.value === 'paid')
  const hasAccount = computed(() => account.value !== null)
  const isConnected = computed(() => portfolio.value?.origin === 'connected')
  /** The holdings come from a real paper-trading account. */
  const isLive = computed(() => portfolio.value?.live === true)
  /** What to call the data in a page eyebrow */
  const dataLabel = computed(() => (isLive.value ? 'live paper positions · dated sector lines' : 'live market data'))

  const snapshot = (): DemoState => ({
    plan: plan.value,
    account: account.value,
    selectedCategories: selectedCategories.value,
    portfolio: portfolio.value,
    previousPortfolio: previousPortfolio.value,
    exclusions: exclusions.value,
    readAlertIds: readAlertIds.value,
  })

  // Every action replaces a ref's value rather than mutating inside it, so a shallow watch is enough.
  watch(snapshot, (state) => {
    try {
      const json = JSON.stringify(state)
      // Nothing worth keeping (fresh or just reset): leave storage empty.
      if (json === INITIAL_JSON) browserStorage()?.removeItem(STORAGE_KEY)
      else browserStorage()?.setItem(STORAGE_KEY, json)
    } catch {
      // Storage full or blocked: keep going without persistence.
    }
  })

  /** Simulated upgrade: no payment form. */
  function upgrade() {
    plan.value = 'paid'
  }
  /** Simulated free account: email only. */
  function createAccount(email: string) {
    account.value = { email: email.trim() }
  }
  /** Forget the account on this device. Lines, the fund and the plan stay. */
  function signOut() {
    account.value = null
  }

  function setCategories(ids: CategoryId[]) {
    selectedCategories.value = [...ids]
    // A category that is no longer selected cannot stay excluded.
    exclusions.value = { ...exclusions.value, categories: exclusions.value.categories.filter((c) => ids.includes(c)) }
  }
  /**
   * Switch one category on or off. `defaults` is the selection in force while the user has not
   * chosen yet (the featured categories), so the first toggle changes one category, not all of them.
   */
  function toggleCategory(id: CategoryId, defaults: CategoryId[] = []) {
    setCategories(toggled(selectedCategories.value ?? defaults, id))
  }

  /** A new portfolio from Home. Ticker exclusions and swaps belonged to the old one. */
  function setPortfolio(next: Portfolio | null) {
    portfolio.value = next
    previousPortfolio.value = null
    exclusions.value = { ...exclusions.value, tickers: [], swaps: {} }
  }
  /** Edit the active portfolio in place (inline weights), keeping exclusions. */
  function updatePortfolio(next: Portfolio) {
    portfolio.value = next
  }
  /**
   * Load the connected demo account; remember what was there so Disconnect can restore it.
   * Exclusions stay as they are in both directions: category exclusions carry over, and ticker
   * exclusions and swaps only take effect for holdings the active portfolio contains (PRD F7).
   */
  function connect(connected: Portfolio) {
    if (!isConnected.value) previousPortfolio.value = portfolio.value
    portfolio.value = connected
  }
  function disconnect() {
    if (!isConnected.value) return
    portfolio.value = previousPortfolio.value
    previousPortfolio.value = null
  }

  function toggleExcludedCategory(id: CategoryId) {
    exclusions.value = { ...exclusions.value, categories: toggled(exclusions.value.categories, id) }
  }
  function setExcludedCategories(ids: CategoryId[]) {
    exclusions.value = { ...exclusions.value, categories: [...ids] }
  }
  function toggleExcludedTicker(ticker: string) {
    const tickers = toggled(exclusions.value.tickers, ticker)
    const swaps = { ...exclusions.value.swaps }
    if (!tickers.includes(ticker)) delete swaps[ticker]
    exclusions.value = { ...exclusions.value, tickers, swaps }
  }
  /**
   * Give an excluded holding's weight to an alternative. The holding may be excluded by ticker or
   * through a category; a swap for a holding that is not excluded has no effect (see activeSwaps).
   */
  function swap(from: string, to: string) {
    if (from === to) return
    exclusions.value = { ...exclusions.value, swaps: { ...exclusions.value.swaps, [from]: to } }
  }
  function undoSwap(from: string) {
    const swaps = { ...exclusions.value.swaps }
    delete swaps[from]
    exclusions.value = { ...exclusions.value, swaps }
  }
  function clearExclusions() {
    exclusions.value = emptyExclusions()
  }

  function markAlertsRead(ids: string[]) {
    readAlertIds.value = [...new Set([...readAlertIds.value, ...ids])]
  }

  /** How many times the demo was reset this visit. Not saved: it lets visit-only state (such as which trades were approved) start again. */
  const resets = ref(0)

  /** "Reset demo": back to the free plan with no portfolio, and nothing left in storage. */
  function reset() {
    const fresh = initialState()
    resets.value += 1
    plan.value = fresh.plan
    account.value = fresh.account
    selectedCategories.value = fresh.selectedCategories
    portfolio.value = fresh.portfolio
    previousPortfolio.value = fresh.previousPortfolio
    exclusions.value = fresh.exclusions
    readAlertIds.value = fresh.readAlertIds
    try {
      const storage = browserStorage()
      for (const key of [STORAGE_KEY, ...LEGACY_KEYS]) storage?.removeItem(key)
    } catch {
      // nothing to clear
    }
  }

  return {
    plan,
    account,
    selectedCategories,
    portfolio,
    previousPortfolio,
    exclusions,
    readAlertIds,
    resets,
    isPaid,
    hasAccount,
    isConnected,
    isLive,
    dataLabel,
    upgrade,
    createAccount,
    signOut,
    setCategories,
    toggleCategory,
    setPortfolio,
    updatePortfolio,
    connect,
    disconnect,
    toggleExcludedCategory,
    setExcludedCategories,
    toggleExcludedTicker,
    swap,
    undoSwap,
    clearExclusions,
    markAlertsRead,
    reset,
  }
})
