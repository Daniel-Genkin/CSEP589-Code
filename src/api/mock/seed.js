import { CATEGORY_KEYS } from './catalog'
import { SAMPLE_PORTFOLIO } from './data/reference'
import { DAY, HOUR, MINUTE, isoAgo, isoAhead } from './utils'

// "Check now" on the monitoring page pulls the next unseen item from this pool (only for watched symbols).
export const ALERT_POOL = [
  {
    symbol: 'LOOP',
    kind: 'negative',
    title: 'Regulators open investigation into how Loopline targets ads at teens',
    summary: 'Its Privacy & Data score fell 3 points, already one of the lowest we track.',
    whatHappened:
      "Regulators opened a formal investigation into how Loopline uses teens' activity to target ads, just days after it paid $90M to settle a lawsuit over collecting data from kids under 13.",
    scoreBefore: 43,
    scoreAfter: 42,
    categoryChanges: [
      { key: 'privacy', before: 18, after: 15 },
      { key: 'governance', before: 31, after: 28 },
    ],
    sourceNewsIds: ['loop-1', 'loop-2'],
  },
  {
    symbol: 'CLNE',
    kind: 'forecast',
    title: 'Evergreen Clean Energy ETF will drop Chipworks at its next rebalance',
    summary: 'Good news ahead of time: the projected score ticks up once Chipworks is removed.',
    whatHappened:
      "Evergreen announced that Chipworks no longer earns enough of its revenue from clean energy to stay in the fund. It will be removed at the next rebalance, and its slice will be spread across the remaining companies.",
    sourceNewsIds: ['clne-1'],
  },
  {
    symbol: 'NOVA',
    kind: 'negative',
    title: 'Novabyte suppliers cited for excessive overtime',
    summary: 'Its Workers & Fair Pay score fell 3 points.',
    whatHappened:
      "Workers at two of Novabyte's assembly suppliers reported 70-hour weeks as factories ramped up for the holiday rush. Novabyte says it is sending auditors and will cap overtime hours.",
    scoreBefore: 68,
    scoreAfter: 67,
    categoryChanges: [{ key: 'labor', before: 55, after: 52 }],
    sourceNewsIds: ['nova-1'],
  },
]

export function defaultMonitoringSettings() {
  return {
    frequency: 'instant',
    sensitivity: 'balanced',
    categories: [...CATEGORY_KEYS],
    includeRebalances: true,
  }
}

export function createSeed() {
  const userId = 'usr_maya'
  const linkedScanId = 'scn_7h2k9d'

  return {
    version: 1,
    users: [
      {
        id: userId,
        name: 'Maya Chen',
        email: 'maya@outvest.app',
        createdAt: isoAgo(140 * DAY),
        values: ['climate', 'labor', 'privacy'],
        referralCode: 'MAYA7Q',
        referredBy: null,
        subscription: {
          planId: 'pro',
          interval: 'month',
          status: 'active',
          startedAt: isoAgo(48 * DAY),
          renewsAt: isoAhead(12 * DAY),
        },
        paymentMethod: { brand: 'Visa', last4: '4242', expMonth: 8, expYear: 2029 },
        preferences: { productEmails: true, weeklyRecap: true },
      },
    ],
    sessions: {},
    connections: [
      {
        id: 'con_rh4821',
        userId,
        brokerageId: 'robinhood',
        linkedAt: isoAgo(60 * DAY),
        syncedAt: isoAgo(3 * DAY),
        holdings: SAMPLE_PORTFOLIO,
      },
    ],
    scans: [
      {
        id: linkedScanId,
        userId,
        source: 'linked',
        connectionId: 'con_rh4821',
        brokerageId: 'robinhood',
        holdings: SAMPLE_PORTFOLIO,
        createdAt: isoAgo(3 * DAY),
        durationMs: 9000,
      },
      {
        id: 'scn_4m8q1x',
        userId,
        source: 'manual',
        holdings: [{ symbol: 'SOLR' }, { symbol: 'PTCH' }, { symbol: 'KIND' }, { symbol: 'FSTF' }],
        createdAt: isoAgo(16 * DAY),
        durationMs: 8000,
      },
      {
        id: 'scn_9p3t6w',
        userId,
        source: 'manual',
        holdings: [{ symbol: 'TCHL' }, { symbol: 'MNTL' }, { symbol: 'BURG' }],
        createdAt: isoAgo(41 * DAY),
        durationMs: 8000,
      },
    ],
    shares: [
      {
        id: 'demo',
        userId,
        scanId: linkedScanId,
        symbol: 'VOLT',
        note: "I assumed EVs were automatically the ethical pick… turns out it's complicated. Worth a look before you buy!",
        createdAt: isoAgo(2 * DAY),
        views: 14,
      },
    ],
    monitoring: {
      [userId]: {
        symbols: ['BMKT', 'NOVA', 'VOLT', 'CLNE', 'QUIK', 'GRNB', 'LOOP'],
        settings: defaultMonitoringSettings(),
        lastCheckedAt: isoAgo(12 * MINUTE),
        poolCursor: 0,
      },
    },
    alerts: [
      {
        id: 'alt_quik_fine',
        userId,
        symbol: 'QUIK',
        kind: 'negative',
        title: 'Quikcart fined $14M over warehouse safety violations',
        summary: 'Its Workers & Fair Pay score fell 9 points, moving Quikcart from Mixed bag to Concerning.',
        whatHappened:
          'Federal inspectors fined Quikcart $14 million after finding injury rates at 11 of its warehouses were nearly double the industry average. A day earlier, regulators said the company had left hundreds of injuries out of its official safety logs.',
        scoreBefore: 46,
        scoreAfter: 44,
        categoryChanges: [
          { key: 'labor', before: 37, after: 28 },
          { key: 'governance', before: 43, after: 40 },
        ],
        sourceNewsIds: ['quik-1', 'quik-2', 'quik-3'],
        createdAt: isoAgo(2 * HOUR),
        readAt: null,
      },
      {
        id: 'alt_grnb_bcorp',
        userId,
        symbol: 'GRNB',
        kind: 'positive',
        title: 'Greenbloom Foods earns B Corp certification',
        summary: 'Its Transparency & Lobbying score rose 5 points, good news for one of your top-scoring holdings.',
        whatHappened:
          'Greenbloom Foods passed an independent review of its social and environmental practices and changed its legal charter to weigh workers, communities and the planet alongside profit.',
        scoreBefore: 82,
        scoreAfter: 84,
        categoryChanges: [
          { key: 'governance', before: 75, after: 80 },
          { key: 'labor', before: 73, after: 76 },
        ],
        sourceNewsIds: ['grnb-1'],
        createdAt: isoAgo(1 * DAY),
        readAt: null,
      },
      {
        id: 'alt_volt_cobalt',
        userId,
        symbol: 'VOLT',
        kind: 'negative',
        title: 'Voltway battery supplier linked to cobalt mines with child-labor reports',
        summary: 'Its Workers & Fair Pay score fell 10 points, though Voltway is still strong on climate.',
        whatHappened:
          "Human-rights researchers traced cobalt from two unregulated mines, where child labor has been reported, into one of Voltway's battery suppliers. Voltway says it is investigating and may switch suppliers.",
        scoreBefore: 62,
        scoreAfter: 60,
        categoryChanges: [
          { key: 'labor', before: 54, after: 44 },
          { key: 'governance', before: 45, after: 42 },
        ],
        sourceNewsIds: ['volt-1', 'volt-2'],
        createdAt: isoAgo(4 * DAY),
        readAt: isoAgo(4 * DAY - 3 * HOUR),
      },
      {
        id: 'alt_bmkt_rebalance',
        userId,
        symbol: 'BMKT',
        kind: 'forecast',
        title: "BMKT's next rebalance will likely add more Petrex Energy",
        summary: 'A forecast, not a change yet: the projected score dips slightly after the next rebalance.',
        whatHappened:
          "An oil rally pushed up Petrex Energy's market value. Because BMKT holds companies in proportion to their size, its next quarterly rebalance will likely grow its Petrex slice and add FastFit Fashion for the first time.",
        sourceNewsIds: ['bmkt-1', 'ptrx-3'],
        createdAt: isoAgo(6 * DAY),
        readAt: isoAgo(5 * DAY),
      },
      {
        id: 'alt_nova_renewable',
        userId,
        symbol: 'NOVA',
        kind: 'positive',
        title: 'Novabyte data centers hit 100% renewable energy',
        summary: 'Its Planet & Climate score rose 4 points.',
        whatHappened:
          'Novabyte signed new wind and solar contracts on three continents, so all of its data centers now run on renewable power. Data centers are the biggest part of its own carbon footprint.',
        scoreBefore: 67,
        scoreAfter: 68,
        categoryChanges: [{ key: 'climate', before: 72, after: 76 }],
        sourceNewsIds: ['nova-2'],
        createdAt: isoAgo(12 * DAY),
        readAt: isoAgo(11 * DAY),
      },
    ],
    invoices: [
      { id: 'inv_3k8d1a', userId, date: isoAgo(18 * DAY), description: 'Pro · Monthly', amount: 9.99, status: 'paid' },
      { id: 'inv_7q2m5c', userId, date: isoAgo(48 * DAY), description: 'Pro · Monthly', amount: 9.99, status: 'paid' },
      { id: 'inv_1x9p4f', userId, date: isoAgo(78 * DAY), description: 'Premium · Monthly', amount: 4.99, status: 'paid' },
    ],
  }
}
