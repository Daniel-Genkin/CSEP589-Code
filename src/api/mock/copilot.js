// Mock AI co-investor. A real backend would call a language model plus research data; this stand-in matches the idea
// to a topic template, then answers follow-up messages with simple intent rules so the workshop feels interactive.
import {
  MAX_BASKET,
  MIN_BASKET,
  basketView,
  exposureOf,
  getCompany,
  getTopic,
  mentionedCompanies,
  topicMeta,
  weightBasket,
  whyOf,
} from './catalog'
import { BEARISH_HINT, BEARISH_NOTICE, CLIMATE_HINT, TOPICS, TRANSITION } from './data/topics'
import { performance } from './market'
import { clone, joinWords } from './utils'

const STATUS_RANK = { weak: 0, mixed: 1, supported: 2 }
const STATUS_PHRASE = { supported: 'holds up', mixed: 'has mixed evidence', weak: 'isn’t proven yet' }
const STATUS_LABEL = { supported: 'Holds up', mixed: 'Mixed evidence', weak: 'Not proven yet' }

const sign = (n) => (n > 0 ? '+' : n < 0 ? '−' : '')
export const fmtPct = (n) => `${sign(n)}${Math.abs(n).toFixed(1)}%`
const fmtPts = (n) => `${sign(n)}${Math.abs(n).toFixed(1)} pts`
const lowerFirst = (s) => (/^[A-Z]{2}/.test(s) ? s : s[0].toLowerCase() + s.slice(1))

// Most keyword hits wins. The topic mentioned first gets a bonus point, since the subject usually leads the sentence.
export function detectTopic(idea) {
  const scored = TOPICS.map((topic) => {
    const hits = [...idea.matchAll(topic.keywords)]
    return { topic, score: hits.length, first: hits.length ? hits[0].index : Infinity }
  })
  const earliest = Math.min(...scored.map((s) => s.first))
  let best = null
  let bestScore = 0
  for (const { topic, score, first } of scored) {
    const total = score + (score && first === earliest ? 1 : 0)
    if (total > bestScore) {
      best = topic
      bestScore = total
    }
  }
  if (best) return best
  return CLIMATE_HINT.test(idea) ? TRANSITION : null
}

const WORD_NUMBERS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }

export function horizonOf(idea) {
  const text = idea.toLowerCase()
  const year = text.match(/\b(?:by|before|in) (20[3-9]\d)\b/)
  if (year) return `by ${year[1]}`
  const span = text.match(/\b(?:in|within|over)(?: the next)? (\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten) years?\b/)
  if (span) {
    const years = WORD_NUMBERS[span[1]] ?? Number(span[1])
    return years === 1 ? 'over the next year' : `over the next ${years} years`
  }
  if (/\bnext decade\b/.test(text)) return 'over the next decade'
  if (/\bthis decade\b/.test(text)) return 'by the end of the decade'
  return 'over the next 3–5 years'
}

// Turns a plain-language idea into the pieces of a thesis. Returns null when the idea isn't about climate.
export function draftFromIdea(idea) {
  const clean = String(idea || '').trim().replace(/\s+/g, ' ')
  const topic = detectTopic(clean)
  if (!topic) return null
  const horizon = horizonOf(clean)
  let notice = topic.key === TRANSITION.key ? TRANSITION.notice : null
  if (BEARISH_HINT.test(clean)) notice = BEARISH_NOTICE
  return {
    idea: clean,
    topicKey: topic.key,
    title: topic.title,
    statement: topic.statement.replace('{horizon}', horizon),
    horizon,
    claims: clone(topic.claims),
    counterarguments: clone(topic.counterarguments),
    symbols: [...topic.basket],
    weighting: 'exposure',
    notice,
  }
}

export const backtestOf = (thesis) => performance(weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting))

export function introMessage(thesis) {
  const backtest = backtestOf(thesis)
  const count = (status) => thesis.claims.filter((c) => c.status === status).length
  const parts = [
    [count('supported'), 'holds up', 'hold up'],
    [count('mixed'), 'has mixed evidence', 'have mixed evidence'],
    [count('weak'), 'isn’t proven yet', 'aren’t proven yet'],
  ]
    .filter(([n]) => n)
    .map(([n, one, many]) => `${n} ${n === 1 ? one : many}`)
  const [first, second] = thesis.counterarguments.map((c) => lowerFirst(c.title))
  return (
    `I turned your take into a thesis you can test. It rests on ${thesis.claims.length} claims: ${joinWords(parts)}. ` +
    `I found the ${thesis.symbols.length} companies most exposed to it. A similar basket returned ${fmtPct(backtest.basketReturn)} ` +
    `over the past 5 years vs ${fmtPct(backtest.benchmarkReturn)} for the S&P 500. ` +
    `The two risks I’d take most seriously are “${first}” and “${second}.” Push back on anything, or ask me to swap companies in or out.`
  )
}

// Everything the public landing-page preview needs, without saving anything.
export function previewOf(draft) {
  const backtest = backtestOf(draft)
  return {
    idea: draft.idea,
    topic: topicMeta(getTopic(draft.topicKey)),
    title: draft.title,
    statement: draft.statement,
    notice: draft.notice,
    claims: draft.claims,
    counterarguments: draft.counterarguments,
    basket: basketView(draft.symbols, draft.topicKey, draft.weighting),
    backtest,
    intro: introMessage(draft),
  }
}

// ---------- Chat ----------

const RE = {
  swap: /\b(swap|replace|switch|trade)\b/,
  remove: /\b(remove|drop|cut|exclude|take out|get rid of|ditch|lose|kick out|sell|no more|without|don'?t want|dump)\b/,
  add: /\b(add|include|swap in|put in|throw in|what about|how about|consider|bring in|buy)\b/,
  why: /\bwhy\b|\bexplain\b|what does .+ do/,
  equal: /\bequal(?:ly)?[- ]?weight/,
  bold: /\b(bolder|more aggressive|aggressive|riskier|more risk|small(?:er)?[- ]?caps?|smaller compan\w*|more upside|higher risk)\b/,
  steady: /\b(safer|conservative|less risk|lower risk|less volatile|steadier|bigger compan\w*|large(?:r)?[- ]?caps?|larger compan\w*|defensive)\b/,
  reset: /\b(reset|default|most exposed|by exposure|exposure[- ]weight\w*)\b/,
  benchmark: /s&p|\bsp ?500\b|s and p|benchmark|backtest/,
  risk: /\b(risks?|wrong|against|bear(?:ish)?|downside|fail\w*|worst|holes|devil|skeptic\w*|counter\w*|threats?|kill)\b/,
  backtest: /perform\w*|returns?|\bbeat\w*|histor\w*|\bpast\b|\bindex\b/,
  policy: /polic\w*|regulat\w*|subsid\w*|tax credits?|incentiv\w*|government|\blaws?\b|\brules?\b|rebates?|tariffs?|elections?/,
  evidence: /evidence|claims?|proof|\bdata\b|sources?|filings?|show (?:me )?(?:the|your) work/,
  timeline: /\bwhen\b|how long|timeline|horizon|time ?frame|\byears?\b/,
  thanks: /^(thanks|thank you|thx|cool|nice|great|awesome|ok|okay|perfect|love it|sounds good)\b/,
}

const WEIGHTING_REPLY = {
  bold: 'Done. I tilted the basket toward smaller companies, which raises both the upside and the swings.',
  steady: 'Done. I tilted the basket toward larger, steadier companies. You give up some upside for smaller swings.',
  equal: 'Done. Every company now gets an equal slice.',
  exposure: 'Done. The companies most tied to your idea get the biggest slices again.',
}
const WEIGHTING_NAME = {
  bold: 'tilted toward smaller companies',
  steady: 'tilted toward larger companies',
  equal: 'equal-weighted',
  exposure: 'weighted by exposure',
}

const backtestLine = (b) =>
  `Backtest: ${fmtPct(b.basketReturn)} over 5 years vs ${fmtPct(b.benchmarkReturn)} for the S&P 500, with a worst drop of ${fmtPct(b.maxDrawdown)}.`

const weightOf = (thesis, symbol) =>
  weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting).find((w) => w.symbol === symbol)?.weight ?? 0

function explainCompany(thesis, company) {
  const exposure = Math.round(exposureOf(company, thesis.topicKey) * 100)
  const weight = weightOf(thesis, company.symbol)
  const indirect = exposure < 30 ? ' That’s indirect exposure, so ask me to drop it if you want a purer basket.' : ''
  return `${company.name} (${company.symbol}) is ${weight}% of the basket. ${whyOf(company, thesis.topicKey)} About ${exposure}% of its business ties to this idea.${indirect}`
}

function fitNote(thesis, company) {
  const exposure = Math.round(exposureOf(company, thesis.topicKey) * 100)
  return exposure >= 10
    ? whyOf(company, thesis.topicKey)
    : 'Heads up: very little of its business ties to this idea, so it waters the thesis down a bit.'
}

function addCompanies(thesis, companies, before) {
  if (thesis.symbols.length + companies.length > MAX_BASKET) {
    return `Baskets top out at ${MAX_BASKET} companies. Take one out first, then I’ll add ${companies[0].name}.`
  }
  thesis.symbols.push(...companies.map((c) => c.symbol))
  const after = backtestOf(thesis)
  const notes = companies.map(
    (c) => `Added ${c.name} (${c.symbol}). ${fitNote(thesis, c)} It’s now ${weightOf(thesis, c.symbol)}% of the basket.`,
  )
  return `${notes.join(' ')} The 5-year backtest moved from ${fmtPct(before.basketReturn)} to ${fmtPct(after.basketReturn)} (S&P 500: ${fmtPct(after.benchmarkReturn)}).`
}

function removeCompanies(thesis, companies, before) {
  if (thesis.symbols.length - companies.length < MIN_BASKET) {
    return `A basket needs at least ${MIN_BASKET} companies, so I kept ${companies[0].name}. Add another company first if you want to swap it out.`
  }
  const symbols = companies.map((c) => c.symbol)
  thesis.symbols = thesis.symbols.filter((s) => !symbols.includes(s))
  const after = backtestOf(thesis)
  return (
    `Took out ${joinWords(companies.map((c) => c.name))}. The basket now holds ${thesis.symbols.length} companies, ` +
    `and the 5-year backtest moved from ${fmtPct(before.basketReturn)} to ${fmtPct(after.basketReturn)} (S&P 500: ${fmtPct(after.benchmarkReturn)}).`
  )
}

function closestClaim(thesis, lower) {
  const words = new Set(lower.match(/[a-z]{4,}/g) ?? [])
  let best = thesis.claims[0]
  let bestScore = -1
  for (const claim of thesis.claims) {
    const text = `${claim.text} ${claim.checks.map((c) => c.finding).join(' ')}`.toLowerCase()
    const score = [...words].filter((w) => text.includes(w)).length
    if (score > bestScore) {
      best = claim
      bestScore = score
    }
  }
  return best
}

// Replies to a message in the workshop. May change thesis.symbols or thesis.weighting.
export function respond(thesis, message) {
  const text = String(message).trim()
  const lower = text.toLowerCase()
  const topic = getTopic(thesis.topicKey)
  const before = backtestOf(thesis)
  const mentioned = mentionedCompanies(text)
  const inBasket = mentioned.filter((c) => thesis.symbols.includes(c.symbol))
  const outside = mentioned.filter((c) => !thesis.symbols.includes(c.symbol))

  if (RE.swap.test(lower) && inBasket.length && outside.length) {
    const [from] = inBasket
    const [to] = outside
    thesis.symbols = thesis.symbols.filter((s) => s !== from.symbol)
    thesis.symbols.push(to.symbol)
    const after = backtestOf(thesis)
    return (
      `Swapped ${from.name} for ${to.name}. ${fitNote(thesis, to)} ` +
      `The 5-year backtest moved from ${fmtPct(before.basketReturn)} to ${fmtPct(after.basketReturn)} (S&P 500: ${fmtPct(after.benchmarkReturn)}).`
    )
  }
  if (RE.swap.test(lower) && inBasket.length > 1 && !outside.length) {
    return `${inBasket[1].name} is already in your basket. Say “drop ${inBasket[0].name}” if you just want to take it out.`
  }
  if (RE.remove.test(lower) && inBasket.length) return removeCompanies(thesis, inBasket, before)
  if (RE.remove.test(lower) && outside.length) return `${outside[0].name} isn’t in your basket, so there’s nothing to take out.`
  if (outside.length && (RE.add.test(lower) || RE.swap.test(lower))) return addCompanies(thesis, outside, before)
  if (inBasket.length) return explainCompany(thesis, inBasket[0])
  if (outside.length) {
    const company = outside[0]
    const exposure = Math.round(exposureOf(company, thesis.topicKey) * 100)
    if (exposure < 10) {
      return `${company.name} (${company.symbol}) isn’t in your basket. ${company.blurb} Very little of its business ties to this idea, which is why I left it out. Say “add ${company.name}” if you want it anyway.`
    }
    return `${company.name} (${company.symbol}) isn’t in your basket yet. ${whyOf(company, thesis.topicKey)} About ${exposure}% of its business ties to this idea. Say “add ${company.name}” and I’ll put it in.`
  }

  const weighting = RE.equal.test(lower)
    ? 'equal'
    : RE.bold.test(lower)
      ? 'bold'
      : RE.steady.test(lower)
        ? 'steady'
        : RE.reset.test(lower)
          ? 'exposure'
          : null
  if (weighting) {
    if (thesis.weighting === weighting) return `The basket is already ${WEIGHTING_NAME[weighting]}. ${backtestLine(before)}`
    thesis.weighting = weighting
    return `${WEIGHTING_REPLY[weighting]} ${backtestLine(backtestOf(thesis))}`
  }

  const backtestReply = () =>
    `A basket like yours returned ${fmtPct(before.basketReturn)} over the past 5 years vs ${fmtPct(before.benchmarkReturn)} for the S&P 500 ` +
    `(${fmtPts(before.excess)}). It beat the index in ${before.monthsAhead} of ${before.months} months, and its worst drop was ${fmtPct(before.maxDrawdown)}.\n\n` +
    'Keep in mind it’s hypothetical: it uses today’s picks with hindsight, and past returns don’t predict future ones.'

  if (RE.benchmark.test(lower)) return backtestReply()

  if (RE.risk.test(lower)) {
    const [top, second] = thesis.counterarguments
    const weakest = [...thesis.claims].sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status])[0]
    return (
      `The strongest case against you is ${lowerFirst(top.title)}. ${top.text} Close behind: ${lowerFirst(second.title)}.\n\n` +
      `Your weakest claim is “${weakest.text}” It ${STATUS_PHRASE[weakest.status]}. ` +
      `Signposts worth watching: ${topic.watch}.`
    )
  }

  if (RE.backtest.test(lower)) return backtestReply()

  if (RE.policy.test(lower)) {
    const withPolicy = thesis.claims.filter((c) => c.checks.some((check) => check.source === 'policy'))
    const claim = withPolicy.find((c) => c.checks[0].source === 'policy') ?? withPolicy[0]
    if (!claim) return 'None of your claims leans hard on government policy, which makes this thesis less exposed to elections and rule changes.'
    const check = claim.checks.find((c) => c.source === 'policy')
    return `On policy, the claim that matters is “${claim.text}” It ${STATUS_PHRASE[claim.status]}. ${check.finding}`
  }

  if (RE.evidence.test(lower)) {
    const lines = thesis.claims.map((c, i) => `${i + 1}. ${c.text} ${STATUS_LABEL[c.status]}.`)
    return `Here’s where the evidence stands:\n${lines.join('\n')}\n\nEach claim lists the filings, policy and adoption data behind it.`
  }

  if (RE.timeline.test(lower)) {
    return `Your thesis is framed ${thesis.horizon}. Early signposts that it’s working: ${topic.watch}. If those move the wrong way for two or three quarters in a row, it’s worth revisiting.`
  }

  if (RE.thanks.test(lower)) {
    return thesis.status === 'published'
      ? 'Anytime. Keep an eye on the community tab: challenges and suggestions on your thesis show up there.'
      : 'Anytime. When it feels solid, publish it to get the community’s take, or invest in the basket from $10.'
  }

  const claim = closestClaim(thesis, lower)
  const smallest = weightBasket(thesis.symbols, thesis.topicKey, thesis.weighting).sort((a, b) => a.weight - b.weight)[0]
  return (
    `Good challenge. It mostly touches this claim: “${claim.text}” Right now it ${STATUS_PHRASE[claim.status]}. ${claim.checks[0].finding}\n\n` +
    `If that changes the picture for you, I can reshape the basket. Try “make it steadier” or “drop ${getCompany(smallest.symbol).name}”.`
  )
}

// Notes the copilot posts in the workshop when the author acts outside the chat.
export function acceptSuggestionNote(thesis, company, handle) {
  const before = backtestOf(thesis)
  thesis.symbols.push(company.symbol)
  const after = backtestOf(thesis)
  return (
    `Added ${company.name} (${company.symbol}) from @${handle}’s suggestion. ${fitNote(thesis, company)} ` +
    `It’s now ${weightOf(thesis, company.symbol)}% of the basket, and the 5-year backtest moved from ${fmtPct(before.basketReturn)} to ${fmtPct(after.basketReturn)}.`
  )
}

export function publishNote(thesis) {
  return (
    `Your thesis is live. Your track record starts today and follows this basket of ${thesis.symbols.length} companies against the S&P 500. ` +
    'Members can now challenge your claims and suggest companies. You’ll see their notes in the Community section.'
  )
}