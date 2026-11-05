// Demo data: Maya Okafor (the demo account) plus community members and their published theses.
// Built through the same copilot functions the API uses, so the seeded workshops read like real ones.
// Must not import ./model or ./db: this module runs while the database is still being created.
import { getCompany, getTopic, weightBasket } from './catalog'
import { acceptSuggestionNote, draftFromIdea, introMessage, publishNote, respond } from './copilot'
import { DAY, HOUR, MINUTE, isoAgo, randomId } from './utils'

export function defaultPreferences() {
  return { strengthens: true, weakens: true, rebalance: true, productEmails: false }
}

// Turns an item from a topic's news pool into an alert about one of the user's theses.
export function alertFromNews(userId, thesis, index, createdAt, readAt = null) {
  const item = getTopic(thesis.topicKey).news[index]
  return {
    id: randomId('alr', 6),
    userId,
    thesisId: thesis.id,
    newsKey: `${thesis.topicKey}:${index}`,
    kind: item.kind,
    title: item.title,
    summary: item.summary,
    whatHappened: item.whatHappened,
    claimId: item.claimId,
    companies: item.companies,
    source: item.source,
    action: item.action,
    createdAt,
    readAt,
  }
}

export function createThesisRecord({ id, userId, draft, createdAt }) {
  const thesis = {
    id,
    userId,
    ...draft,
    status: 'draft',
    createdAt,
    updatedAt: createdAt,
    publishedAt: null,
    publishedBasket: null,
    messages: [],
    followerIds: [],
    baseFollowers: 0,
    comments: [],
  }
  thesis.messages.push({ id: randomId('msg', 6), role: 'copilot', text: introMessage(thesis), at: createdAt })
  return thesis
}

const MAYA = 'usr_maya'

function member(id, name, handle, bio, joinedDaysAgo) {
  return {
    id,
    name,
    email: `${handle.replace(/_/g, '.')}@example.com`,
    handle,
    bio,
    createdAt: isoAgo(joinedDaysAgo * DAY),
    referralCode: `${handle.slice(0, 4).toUpperCase()}X2`,
    referredBy: null,
    preferences: defaultPreferences(),
    brokerage: null,
  }
}

function thesisFrom(id, userId, idea, createdAgo, baseFollowers = 0) {
  const thesis = createThesisRecord({ id, userId, draft: draftFromIdea(idea), createdAt: isoAgo(createdAgo) })
  thesis.baseFollowers = baseFollowers
  return thesis
}

function say(thesis, text, ago) {
  thesis.messages.push({ id: randomId('msg', 6), role: 'user', text, at: isoAgo(ago) })
  thesis.messages.push({ id: randomId('msg', 6), role: 'copilot', text: respond(thesis, text), at: isoAgo(ago - 20_000) })
  thesis.updatedAt = isoAgo(ago)
}

function note(thesis, text, ago) {
  thesis.messages.push({ id: randomId('msg', 6), role: 'copilot', text, at: isoAgo(ago) })
  thesis.updatedAt = isoAgo(ago)
}

function publish(thesis, ago) {
  thesis.status = 'published'
  thesis.publishedAt = isoAgo(ago)
  thesis.publishedBasket = weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting)
  note(thesis, publishNote(thesis), ago - 10_000)
}

function comment(thesis, userId, kind, text, ago, extra = {}) {
  thesis.comments.push({ id: randomId('cmt', 6), userId, kind, text, createdAt: isoAgo(ago), status: null, ...extra })
}

function monthsFrom(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d.toISOString()
}

export function createSeed() {
  const users = [
    {
      id: MAYA,
      name: 'Maya Okafor',
      email: 'maya@outvest.app',
      handle: 'mayaokafor',
      bio: 'Building energy engineer in Seattle. I spec heat pumps for a living.',
      createdAt: isoAgo(330 * DAY),
      referralCode: 'MAYA7Q',
      referredBy: null,
      preferences: defaultPreferences(),
      brokerage: {
        status: 'open',
        accountNumber: '73114821',
        openedAt: isoAgo(300 * DAY),
        legalName: 'Maya Okafor',
        bank: { name: 'Evergreen Credit Union', last4: '6789' },
        cash: 0,
      },
    },
    member('usr_devon', 'Devon Park', 'devonbuilds', 'HVAC contractor in Phoenix. Ask me about compressors.', 420),
    member('usr_priya', 'Priya Raman', 'priyagrid', 'Power systems PhD student. Grid nerd.', 380),
    member('usr_lena', 'Lena Fischer', 'lenaonwheels', 'Battery engineer at an EV startup in Detroit.', 300),
    member('usr_theo', 'Theo Nakamura', 'theo_h2', 'Chemical engineer. Still bullish on molecules.', 400),
    member('usr_sofia', 'Sofia Alvarez', 'sofiawater', 'Water resources engineer in Tucson.', 200),
    member('usr_ana', 'Ana Costa', 'anacircular', 'Supply chain analyst. Recycling over mining.', 90),
    member('usr_marcus', 'Marcus Bell', 'marcusfarms', 'Fourth-generation farmer in Iowa.', 160),
  ]

  // Maya's heat pump thesis, the story from the launch announcement.
  const heat = thesisFrom('th_heatpumps', MAYA, 'Heat pumps will replace gas furnaces faster than Wall Street expects.', 190 * DAY, 214)
  say(heat, 'Why is Chillwell in here? I think of them as an AC company.', 190 * DAY - 6 * MINUTE)
  say(heat, 'What would prove me wrong?', 190 * DAY - 14 * MINUTE)
  publish(heat, 190 * DAY - 22 * MINUTE)
  comment(
    heat,
    'usr_devon',
    'suggestion',
    'Have you looked at Coilbridge? They make the compressors inside half the heat pumps I install. Every brand’s growth runs through them.',
    181 * DAY,
    { symbol: 'COIL', status: 'accepted' },
  )
  note(heat, acceptSuggestionNote(heat, getCompany('COIL'), 'devonbuilds'), 180 * DAY)
  say(heat, 'Drop Copperline, it feels too indirect.', 180 * DAY - 5 * MINUTE)
  comment(
    heat,
    'usr_priya',
    'challenge',
    'Winter peaks worry me. If utilities need new transformers for heat pump load, rate hikes could slow adoption in exactly the cold states you’re counting on.',
    150 * DAY,
    { claimId: 'c2' },
  )
  comment(
    heat,
    MAYA,
    'comment',
    'Fair point, and it’s why claim 2 is marked mixed. I’m watching winter rates in Washington and Massachusetts before adding more.',
    149 * DAY,
  )
  comment(heat, 'usr_lena', 'comment', 'Following. Curious how the cold-climate units hold up this winter.', 41 * DAY)
  comment(
    heat,
    'usr_theo',
    'challenge',
    'Margins look fine now, but compressor prices are climbing. Thermiq can’t pass all of that on to customers.',
    12 * DAY,
    { claimId: 'c4' },
  )
  comment(
    heat,
    'usr_marcus',
    'suggestion',
    'Cascade Power & Light pays rebates when its customers switch to heat pumps. Indirect, but it also wins from the extra winter load.',
    6 * DAY,
    { symbol: 'CSPL', status: 'open' },
  )
  heat.followerIds = ['usr_devon', 'usr_priya', 'usr_lena', 'usr_sofia']

  // An older call of Maya's that hasn't worked out (track records show the bad calls too).
  const roof = thesisFrom('th_rooftop', MAYA, 'Rooftop solar plus a home battery will be standard on new homes by 2030.', 298 * DAY, 63)
  publish(roof, 297 * DAY)
  comment(
    roof,
    'usr_sofia',
    'challenge',
    'Interconnection queues in Arizona are brutal. Plenty of these farms won’t connect until 2029.',
    270 * DAY,
    { claimId: 'c3' },
  )
  comment(roof, MAYA, 'comment', 'Rooftop is my main bet, not utility-scale, but noted. That’s probably why Solara drags the basket.', 269 * DAY)
  comment(roof, 'usr_ana', 'comment', 'Panel prices keep falling. Great for buyers, rough for Helio.', 60 * DAY)
  roof.followerIds = ['usr_ana']

  const cooling = thesisFrom('th_cooling', MAYA, 'Cities will spend big on cooling and shade as heat waves get worse.', 3 * DAY)

  // Community theses.
  const grid = thesisFrom('th_grid', 'usr_devon', 'AI data centers will make grid equipment the next bottleneck.', 336 * DAY, 486)
  publish(grid, 335 * DAY)
  comment(
    grid,
    'usr_priya',
    'challenge',
    'Rate cases are getting harder to win as bills climb. Regulators might slow-walk some of this spending.',
    300 * DAY,
    { claimId: 'c3' },
  )
  comment(grid, MAYA, 'comment', 'Transformer lead times on our projects went from months to years. This one matches what I see at work.', 200 * DAY)
  comment(grid, 'usr_theo', 'comment', 'Already up a lot. How much of this is priced in now?', 90 * DAY)
  grid.followerIds = [MAYA, 'usr_lena', 'usr_ana']

  const nuclear = thesisFrom('th_nuclear', 'usr_priya', 'Nuclear is coming back to power AI.', 212 * DAY, 341)
  publish(nuclear, 211 * DAY)
  comment(nuclear, 'usr_theo', 'challenge', 'Small reactor timelines always slip. I’d weight Corefield lower.', 180 * DAY, { claimId: 'c3' })
  comment(nuclear, 'usr_devon', 'comment', 'Following. The existing-reactor names feel safer than the new builds.', 95 * DAY)
  nuclear.followerIds = ['usr_devon', 'usr_theo']

  const sodium = thesisFrom('th_sodium', 'usr_priya', 'Sodium-ion batteries will undercut lithium for home storage.', 98 * DAY, 72)
  publish(sodium, 97 * DAY)
  comment(
    sodium,
    'usr_lena',
    'challenge',
    'Sodium cells are still heavier and bulkier. Fine for the grid, a harder sell in a garage.',
    80 * DAY,
    { claimId: 'c2' },
  )

  const fleets = thesisFrom('th_fleets', 'usr_lena', 'Electric delivery trucks will win before electric cars do.', 242 * DAY, 158)
  publish(fleets, 240 * DAY)
  comment(fleets, 'usr_devon', 'comment', 'Saw three electric delivery vans on my street this week. Anecdote, but still.', 100 * DAY)
  comment(fleets, 'usr_marcus', 'challenge', 'Rural depots don’t have the power capacity for fleet charging yet.', 60 * DAY, { claimId: 'c3' })

  const hydrogen = thesisFrom('th_hydrogen', 'usr_theo', 'Green hydrogen will win in steel and fertilizer, not cars.', 368 * DAY, 97)
  publish(hydrogen, 366 * DAY)
  comment(hydrogen, 'usr_priya', 'challenge', 'The cost gap with gas-made hydrogen is still huge. What closes it?', 300 * DAY, { claimId: 'c1' })
  comment(hydrogen, 'usr_theo', 'comment', 'Fair. This one has been a bad call so far. Keeping it public anyway.', 40 * DAY)

  const water = thesisFrom('th_water', 'usr_sofia', 'Water reuse will go mainstream in the drought-hit West.', 153 * DAY, 133)
  publish(water, 152 * DAY)
  comment(water, MAYA, 'comment', 'Love this. Our buildings are starting to spec greywater systems too.', 120 * DAY)
  water.followerIds = [MAYA]

  const recycling = thesisFrom('th_recycling', 'usr_ana', 'Battery recycling will be bigger than lithium mining by 2032.', 13 * DAY, 41)
  publish(recycling, 12 * DAY)
  comment(recycling, 'usr_lena', 'comment', 'Our scrap rates are falling though. Less factory scrap means less for recyclers to process.', 5 * DAY)

  const fertilizer = thesisFrom('th_fertilizer', 'usr_marcus', 'Low-carbon fertilizer will be the next big food story.', 122 * DAY, 58)
  publish(fertilizer, 120 * DAY)
  comment(
    fertilizer,
    'usr_ana',
    'suggestion',
    'Greenport makes the green ammonia that low-carbon fertilizer needs.',
    30 * DAY,
    { symbol: 'GPAM', status: 'open' },
  )

  const heatWeights = weightBasket(heat.symbols, heat.topicKey, heat.weighting)
  const positions = [
    {
      id: 'pos_heat',
      userId: MAYA,
      thesisId: heat.id,
      weights: heatWeights,
      lots: [
        { amount: 400, at: isoAgo(178 * DAY) },
        { amount: 150, at: isoAgo(64 * DAY) },
      ],
      schedule: 'quarterly',
      createdAt: isoAgo(178 * DAY),
      // Next quarterly rebalance lands five days from now, matching the rebalance alert below.
      lastRebalancedAt: monthsFrom(Date.now() + 5 * DAY, -3),
      status: 'open',
    },
    {
      id: 'pos_roof',
      userId: MAYA,
      thesisId: roof.id,
      weights: weightBasket(roof.symbols, roof.topicKey, roof.weighting),
      lots: [{ amount: 100, at: isoAgo(290 * DAY) }],
      schedule: 'semiannual',
      createdAt: isoAgo(290 * DAY),
      lastRebalancedAt: isoAgo(108 * DAY),
      status: 'open',
    },
  ]

  const airwell = heatWeights.find((w) => w.symbol === 'AIRW').weight
  const alerts = [
    alertFromNews(MAYA, heat, 1, isoAgo(2 * DAY)),
    {
      id: randomId('alr', 6),
      userId: MAYA,
      thesisId: heat.id,
      newsKey: null,
      kind: 'rebalance',
      title: `“${heat.title}” rebalances in 6 days`,
      summary: `Airwell Climate has grown past its ${airwell}% target, so the quarterly rebalance will trim it back.`,
      whatHappened: `Airwell Climate rose faster than the rest of the basket since the last rebalance and now makes up about ${Math.round(airwell + 3)}% of it, above its ${airwell}% target. On your quarterly schedule, Outvest will sell a little Airwell and buy the companies that fell below their targets.`,
      claimId: null,
      companies: ['AIRW'],
      source: 'Outvest',
      action: 'Nothing to do. You can change your rebalancing schedule in Portfolio.',
      createdAt: isoAgo(1 * DAY),
      readAt: null,
    },
    alertFromNews(MAYA, heat, 0, isoAgo(9 * DAY), isoAgo(9 * DAY - 2 * HOUR)),
    alertFromNews(MAYA, roof, 1, isoAgo(16 * DAY), isoAgo(15 * DAY)),
  ]

  return {
    version: 2,
    users,
    sessions: {},
    theses: [heat, roof, cooling, grid, nuclear, sodium, fleets, hydrogen, water, recycling, fertilizer],
    positions,
    alerts,
  }
}
