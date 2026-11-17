// Eight sample alerts for the monitoring feed. SAMPLES: they show what the feed looks like and do
// not report real events. Timestamps are offsets from now, in minutes, so the feed always looks
// recent. Every alert names a seed holding and a category it is tagged in.
import type { Alert } from '@/types'

const HOUR = 60
const DAY = 24 * HOUR

export const ALERTS: Alert[] = [
  { id: 'alert-lmt-new-tag', type: 'new_tag', ticker: 'LMT', category: 'defense', offsetMinutes: 35, summary: 'Lockheed Martin is now tagged Defense and weapons in the sample data.' },
  { id: 'alert-xom-drift', type: 'drift', ticker: 'XOM', category: 'fossil_fuels', offsetMinutes: 3 * HOUR, summary: 'ExxonMobil’s share of your portfolio has drifted up since you last looked.' },
  { id: 'alert-pm-filing', type: 'filing', ticker: 'PM', category: 'tobacco', offsetMinutes: 1 * DAY, summary: 'Philip Morris International filed an annual report. Its Tobacco tag is unchanged.' },
  { id: 'alert-geo-new-tag', type: 'new_tag', ticker: 'GEO', category: 'private_prisons', offsetMinutes: 2 * DAY, summary: 'GEO Group is now tagged Private prisons in the sample data.' },
  { id: 'alert-slb-tag-removed', type: 'tag_removed', ticker: 'SLB', category: 'fossil_fuels', offsetMinutes: 3 * DAY, summary: 'Sample scenario: SLB’s Fossil fuels tag is removed after an industry relabel.' },
  { id: 'alert-lvs-filing', type: 'filing', ticker: 'LVS', category: 'gambling', offsetMinutes: 5 * DAY, summary: 'Las Vegas Sands filed a quarterly report. Its Gambling tag is unchanged.' },
  { id: 'alert-rtx-drift', type: 'drift', ticker: 'RTX', category: 'defense', offsetMinutes: 7 * DAY, summary: 'RTX’s share of your portfolio has drifted up since you last looked.' },
  { id: 'alert-stz-filing', type: 'filing', ticker: 'STZ', category: 'alcohol', offsetMinutes: 14 * DAY, summary: 'Constellation Brands filed an annual report. Its Alcohol tag is unchanged.' },
]
