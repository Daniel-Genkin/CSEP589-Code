export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Dip a toe in.',
    description: 'For checking a few stocks before you buy.',
    prices: { month: 0, year: 0 },
    limits: { scansPerMonth: 1, symbolsPerScan: 5, monitoring: false },
    features: [
      { label: '1 ad-hoc scan per month', included: true },
      { label: 'Up to 5 stocks or ETFs per scan', included: true },
      { label: 'Full values breakdown & news', included: true },
      { label: 'ETF unpacking & rebalance outlook', included: true },
      { label: 'Share analyses with friends', included: true },
      { label: 'Continuous monitoring & email alerts', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    tagline: 'Scan anything, anytime.',
    description: 'For curious investors who like to check before every move.',
    prices: { month: 4.99, year: 47.88 },
    limits: { scansPerMonth: null, symbolsPerScan: null, monitoring: false },
    features: [
      { label: 'Unlimited ad-hoc scans', included: true },
      { label: 'Unlimited stocks & ETFs per scan', included: true },
      { label: 'Full values breakdown & news', included: true },
      { label: 'ETF unpacking & rebalance outlook', included: true },
      { label: 'Share analyses with friends', included: true },
      { label: 'Continuous monitoring & email alerts', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'We keep watch for you.',
    description: 'For hands-off investors who want a heads-up when things change.',
    popular: true,
    prices: { month: 9.99, year: 95.88 },
    limits: { scansPerMonth: null, symbolsPerScan: null, monitoring: true },
    features: [
      { label: 'Everything in Premium', included: true },
      { label: 'Continuous monitoring of every holding', included: true },
      { label: 'Email alerts when something changes', included: true },
      { label: 'Plain-English summaries of score impact', included: true },
      { label: 'Heads-ups before ETF rebalances', included: true },
      { label: 'Instant, daily or weekly digests', included: true },
    ],
  },
]

export const BROKERAGES = [
  { id: 'robinhood', name: 'Robinhood', color: '#2EBD59' },
  { id: 'fidelity', name: 'Fidelity', color: '#4C8A2E' },
  { id: 'schwab', name: 'Charles Schwab', color: '#0DA2DB' },
  { id: 'vanguard', name: 'Vanguard', color: '#9B2335' },
  { id: 'webull', name: 'Webull', color: '#1E5BD8' },
  { id: 'public', name: 'Public', color: '#2B2B2B' },
  { id: 'sofi', name: 'SoFi Invest', color: '#1C9AC0' },
  { id: 'cashapp', name: 'Cash App Investing', color: '#14B84B' },
  { id: 'etrade', name: 'E*TRADE', color: '#6B3FD1' },
]

// Holdings returned by any mock brokerage connection (dollar values).
export const SAMPLE_PORTFOLIO = [
  { symbol: 'BMKT', value: 1240 },
  { symbol: 'NOVA', value: 620 },
  { symbol: 'VOLT', value: 410 },
  { symbol: 'CLNE', value: 380 },
  { symbol: 'QUIK', value: 350 },
  { symbol: 'GRNB', value: 210 },
  { symbol: 'LOOP', value: 190 },
]
