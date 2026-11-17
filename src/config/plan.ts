// The paid plan. One flat monthly price, no percentage-of-assets fees.

/**
 * PLACEHOLDER price in US dollars a month. Surveys land at $5 to $7; about 1 in 7 respondents
 * would pay $9.99. Change this one number and every screen follows.
 */
export const PLAN_PRICE_USD = 5

/** "$5" or "$9.99": the price as written on screen. */
export const planPriceLabel = (price = PLAN_PRICE_USD) => (Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`)

export const FREE_FEATURES = [
  'The one-line conflict count, with no signup',
  'Every holding, with the reason and source for each tag',
  'What-if: exclusions, back-tested against the S&P 500',
  'Alternatives for what you exclude',
  'Your own choice of values categories',
]

/** What the paid plan adds (PRD F5). */
export const PAID_FEATURES = [
  { title: 'Connect your brokerage', detail: 'Read-only. Rally checks what you actually hold; the money stays at your broker.' },
  { title: 'Live monitoring', detail: 'Alerts when a company you hold is newly tagged, loses a tag, files, or drifts.' },
  { title: 'Approval-gated trades', detail: 'Review the trades for your what-if. Nothing is sent until you approve it.' },
]
