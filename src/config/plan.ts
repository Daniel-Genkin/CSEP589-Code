// The paid plan. One flat monthly price, no percentage-of-assets fees.

/**
 * PLACEHOLDER price in US dollars a month. Surveys land at $5 to $7; about 1 in 7 respondents
 * would pay $9.99. Change this one number and every screen follows.
 */
export const PLAN_PRICE_USD = 5

/** "$5" or "$9.99": the price as written on screen. */
export const planPriceLabel = (price = PLAN_PRICE_USD) => (Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`)

export const FREE_FEATURES = [
  'Check a fund, no signup',
  'Every company, flag and source',
  'What-if, back-tested against the S&P 500',
  'Options for what you switch off',
  'Pick your own lines',
]

/** What Plus adds (PRD F5): a connected account, updates on it, and trades you approve. */
export const PAID_FEATURES = [
  { title: 'Connect your account', detail: 'Read-only. Rally checks what you actually hold; the money stays at your broker.' },
  { title: 'Updates on what you own', detail: 'Hear when a company you hold has something new on file.' },
  { title: 'Build a basket', detail: 'Drop the companies you pick and approve every trade. Nothing is sent without you.' },
]
