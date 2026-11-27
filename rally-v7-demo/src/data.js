import { reactive } from 'vue'

// The nine lines from the Rally Investor Survey (question 11), in short form.
// `desc` is the one-line explanation shown under each line name.
export const LINES = [
  { id: 'military', name: 'Military & defense', desc: 'Weapons makers and military contracts', color: 'var(--flare)', pill: 'var(--flare)' },
  { id: 'environment', name: 'Environment & climate', desc: 'Pollution, emissions and environmental violations', color: 'var(--sun)', pill: 'var(--sun)' },
  { id: 'humanRights', name: 'Human rights & conflict', desc: 'Ties to detention, surveillance or war zones', color: 'var(--violet)', pill: 'var(--violet)' },
  { id: 'labor', name: 'Labor practices', desc: 'Safety violations, wage cases and how workers are treated', color: 'var(--signal)', pill: 'var(--link)' },
  { id: 'privacy', name: 'Data privacy', desc: 'Privacy fines and misuse of personal data', color: 'var(--pink)', pill: 'var(--pink)' },
  { id: 'political', name: 'Political donations', desc: 'Company PAC donations and lobbying', color: 'var(--cream)', pill: 'var(--cream)' },
  { id: 'diversity', name: 'Diversity & inclusion', desc: 'Discrimination cases and fair hiring and pay', color: 'var(--dim)', pill: 'var(--cream)' },
  { id: 'taxes', name: 'Corporate taxes', desc: 'Tax avoidance and use of tax havens', color: 'var(--dim)', pill: 'var(--cream)' },
  { id: 'animal', name: 'Animal welfare', desc: 'Animal testing and factory farming', color: 'var(--dim)', pill: 'var(--cream)' },
]

export const line = (id) => LINES.find((l) => l.id === id)
export const lineByName = (name) => LINES.find((l) => l.name === name)

export const DEFAULT_LINES = ['military', 'environment', 'humanRights', 'labor', 'privacy']

// Demo state shared across screens. Sample data only; nothing is saved.
export const state = reactive({
  lines: [...DEFAULT_LINES],
  amount: 2000,
  customLines: [],
})

export function toggleLine(id) {
  const i = state.lines.indexOf(id)
  if (i >= 0) state.lines.splice(i, 1)
  else state.lines.push(id)
}

export const FUNDS = [
  { tk: 'VOO', name: 'Vanguard S&P 500 ETF', sub: 'Vanguard · S&P 500 index' },
  { tk: 'SPY', name: 'SPDR S&P 500 ETF Trust', sub: 'State Street · S&P 500 index' },
  { tk: 'IVV', name: 'iShares Core S&P 500 ETF', sub: 'BlackRock · S&P 500 index' },
]

// Sample result for VOO: 13% of the fund crosses the demo user's lines.
export const RECEIPT_ROWS = [
  { label: 'Data privacy', sub: 'Microsoft · 4.0%', pct: 4 },
  { label: 'Environment & climate', sub: 'ExxonMobil · 3.0%', pct: 3 },
  { label: 'Other lines', sub: '3 more companies · 6.0%', pct: 6 },
]

export const money = (n) => '$' + Math.round(n).toLocaleString('en-US')

export const TICKER = [
  { tk: 'LMT', what: 'Federal contract', src: 'USAspending.gov', color: 'var(--flare)' },
  { tk: 'XOM', what: 'Enforcement case', src: 'EPA ECHO', color: 'var(--sun)' },
  { tk: 'TSN', what: 'Workplace inspection', src: 'OSHA', color: 'var(--signal)' },
  { tk: 'META', what: 'Consent order', src: 'Federal Register', color: 'var(--pink)' },
  { tk: 'MSFT', what: 'PAC filing', src: 'FEC', color: 'var(--cream)' },
  { tk: 'PLTR', what: 'Federal contract', src: 'USAspending.gov', color: 'var(--violet)' },
  { tk: 'RTX', what: 'Federal contract', src: 'USAspending.gov', color: 'var(--flare)' },
  { tk: 'CVX', what: 'Annual report', src: 'SEC EDGAR', color: 'var(--sun)' },
]

// Share of each sample fund tied to each line, in percent. VOO's five default lines add up to 13%.
export const FUND_MIX = {
  VOO: { name: 'Vanguard S&P 500 ETF', military: 3.1, environment: 3.0, humanRights: 1.4, labor: 1.5, privacy: 4.0, political: 2.5, diversity: 2.8, taxes: 1.2, animal: 6.2 },
  VTI: { name: 'Vanguard Total Stock Market ETF', military: 1.8, environment: 3.4, humanRights: 0.6, labor: 1.2, privacy: 3.6, political: 2.3, diversity: 2.6, taxes: 1.1, animal: 5.9 },
  QQQ: { name: 'Invesco QQQ Trust', military: 0.9, environment: 0.3, humanRights: 1.5, labor: 0.4, privacy: 8.9, political: 0, diversity: 4.2, taxes: 2.4, animal: 7.4 },
  SCHD: { name: 'Schwab US Dividend Equity ETF', military: 3.4, environment: 9.8, humanRights: 0, labor: 4.1, privacy: 0, political: 1.9, diversity: 1.1, taxes: 0.6, animal: 4.0 },
}

export const EXPLORE_ROWS = [
  { name: 'Human rights & conflict', mine: true, color: 'var(--violet)', v: ['1.4', '0.6', '1.5', null, '1.1', '0.3', '0.7'] },
  { name: 'Military & defense', mine: true, color: 'var(--flare)', v: ['3.1', '1.8', '0.9', '3.4', '0.4', '1.2', '2.1'] },
  { name: 'Environment & climate', mine: true, color: 'var(--sun)', v: ['3.0', '3.4', '0.3', '9.8', '0.2', '2.1', null] },
  { name: 'Data privacy', mine: true, color: 'var(--pink)', v: ['4.0', '3.6', '8.9', null, '9.4', '3.8', '4.1'] },
  { name: 'Political donations', mine: false, v: ['2.5', '2.3', null, '1.9', '0.8', '2.0', '2.6'] },
  { name: 'Labor practices', mine: true, color: 'var(--signal)', v: ['1.5', '1.2', '0.4', '4.1', null, null, '1.5'] },
  { name: 'Diversity & inclusion', mine: false, v: ['2.8', '2.6', '4.2', '1.1', '3.9', '1.7', '2.9'] },
  { name: 'Animal welfare', mine: false, v: ['6.2', '5.9', '7.4', '4.0', '6.8', '4.4', '6.4'] },
]

// What-if: sample VOO holdings that cross the demo user's lines. Weights add up to the 13% on the receipt.
// `impact` is how much excluding the company would have moved the 5-year back-test, in points a year.
export const WHATIF_COMPANIES = [
  { tk: 'MSFT', name: 'Microsoft', line: 'privacy', sector: 'tech', w: 4.0, impact: -0.35 },
  { tk: 'XOM', name: 'ExxonMobil', line: 'environment', sector: 'energy', w: 3.0, impact: -0.4 },
  { tk: 'AMZN', name: 'Amazon', line: 'labor', sector: 'consumer', w: 1.5, impact: -0.12 },
  { tk: 'LMT', name: 'Lockheed Martin', line: 'military', sector: 'industrials', w: 1.2, impact: 0.05 },
  { tk: 'RTX', name: 'RTX Corporation', line: 'military', sector: 'industrials', w: 1.0, impact: -0.04 },
  { tk: 'GD', name: 'General Dynamics', line: 'military', sector: 'industrials', w: 0.9, impact: 0.02 },
  { tk: 'MSI', name: 'Motorola Solutions', line: 'humanRights', sector: 'tech', w: 0.8, impact: -0.03 },
  { tk: 'PLTR', name: 'Palantir Technologies', line: 'humanRights', sector: 'tech', w: 0.6, impact: -0.18 },
]

// Same-sector holdings with nothing on the demo user's lines. Options, not recommendations.
export const ALTERNATIVES = {
  tech: [
    { tk: 'ADBE', name: 'Adobe', note: 'Software' },
    { tk: 'CRM', name: 'Salesforce', note: 'Software' },
    { tk: 'INTU', name: 'Intuit', note: 'Software' },
  ],
  energy: [
    { tk: 'NEE', name: 'NextEra Energy', note: 'Utilities' },
    { tk: 'FSLR', name: 'First Solar', note: 'Solar' },
    { tk: 'ENPH', name: 'Enphase Energy', note: 'Solar' },
  ],
  consumer: [
    { tk: 'COST', name: 'Costco', note: 'Retail' },
    { tk: 'TJX', name: 'TJX Companies', note: 'Retail' },
    { tk: 'BKNG', name: 'Booking Holdings', note: 'Travel' },
  ],
  industrials: [
    { tk: 'UNP', name: 'Union Pacific', note: 'Railroads' },
    { tk: 'DE', name: 'Deere & Company', note: 'Machinery' },
    { tk: 'ETN', name: 'Eaton', note: 'Electrical equipment' },
  ],
}

// Weekly growth of $10,000 in the S&P 500 from Nov 2021 to Nov 2026. Sample path, ends at $16,494.
export const BACKTEST = (() => {
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return seed / 2147483647 - 0.5
  }
  const weeks = 261
  const drift = (i) => (i < 48 ? -0.0042 : i < 100 ? 0.0034 : i < 152 ? 0.0039 : i < 205 ? 0.0021 : 0.0024)
  const lr = Array.from({ length: weeks - 1 }, (_, i) => drift(i) + rand() * 0.045)
  const fix = (Math.log(16494 / 10000) - lr.reduce((s, x) => s + x, 0)) / lr.length
  const out = [10000]
  for (const x of lr) out.push(out[out.length - 1] * Math.exp(x + fix))
  return out
})()
export const BACKTEST_START = new Date('2021-11-29')
