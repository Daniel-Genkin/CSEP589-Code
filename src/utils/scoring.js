import { HardHat, Landmark, Leaf, PawPrint, ShieldCheck, Users } from '@lucide/vue'

export const CATEGORIES = [
  {
    key: 'climate',
    label: 'Planet & Climate',
    short: 'Climate',
    icon: Leaf,
    description: 'Emissions, fossil-fuel ties, pollution and clean-energy commitments.',
  },
  {
    key: 'labor',
    label: 'Workers & Fair Pay',
    short: 'Workers',
    icon: HardHat,
    description: 'Wages, safety, the right to unionize and labor in the supply chain.',
  },
  {
    key: 'equity',
    label: 'Diversity & Inclusion',
    short: 'Inclusion',
    icon: Users,
    description: 'Representation, pay equity, civil rights and access for everyone.',
  },
  {
    key: 'privacy',
    label: 'Privacy & Data',
    short: 'Privacy',
    icon: ShieldCheck,
    description: 'How personal data is collected, shared, sold and protected.',
  },
  {
    key: 'animals',
    label: 'Animal Welfare',
    short: 'Animals',
    icon: PawPrint,
    description: 'Animal testing, factory farming and how materials are sourced.',
  },
  {
    key: 'governance',
    label: 'Transparency & Lobbying',
    short: 'Transparency',
    icon: Landmark,
    description: 'Lobbying, political spending, executive pay and honesty with the public.',
  },
]

export const CATEGORY_MAP = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]))

export const BANDS = {
  great: { key: 'great', label: 'Strongly aligned', short: 'Aligned', group: 'strongly aligned', color: 'var(--score-great)', bg: 'var(--score-great-bg)' },
  good: { key: 'good', label: 'Mostly aligned', short: 'Mostly', group: 'mostly aligned', color: 'var(--score-good)', bg: 'var(--score-good-bg)' },
  mixed: { key: 'mixed', label: 'Mixed bag', short: 'Mixed', group: 'mixed', color: 'var(--score-mixed)', bg: 'var(--score-mixed-bg)' },
  low: { key: 'low', label: 'Concerning', short: 'Concerning', group: 'concerning', color: 'var(--score-low)', bg: 'var(--score-low-bg)' },
}

export const BAND_ORDER = ['great', 'good', 'mixed', 'low']

export function bandKey(score) {
  if (score >= 80) return 'great'
  if (score >= 65) return 'good'
  if (score >= 45) return 'mixed'
  return 'low'
}

export const band = (score) => BANDS[bandKey(score)]
