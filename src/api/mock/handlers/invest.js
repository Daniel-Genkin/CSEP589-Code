import { ERROR_CODES } from '../../errors'
import { MIN_BASKET, getCompany, toSummary } from '../catalog'
import { db } from '../db'
import { priceOf } from '../market'
import {
  SCHEDULE_MONTHS,
  fail,
  findThesis,
  openPosition,
  positionSummary,
  serializeAccount,
  weightsOf,
} from '../model'
import { randomId, splitDollars } from '../utils'

const MIN_AMOUNT = 10
const MAX_AMOUNT = 50_000
// Fictional banks for the mock funding step. A real integration would use a bank-linking provider.
const BANKS = [
  { id: 'evergreen', name: 'Evergreen Credit Union' },
  { id: 'harborview', name: 'Harborview Bank' },
  { id: 'summit', name: 'Summit National Bank' },
  { id: 'pioneer', name: 'Pioneer Savings' },
]
const EMPLOYMENT = ['employed', 'self-employed', 'student', 'unemployed', 'retired']
const EXPERIENCE = ['none', 'some', 'experienced']

const round2 = (n) => Math.round(n * 100) / 100
const digits = (n) => Array.from(crypto.getRandomValues(new Uint8Array(n)), (b) => b % 10).join('')

function ageOn(dateOfBirth) {
  const dob = new Date(`${dateOfBirth}T00:00:00`)
  if (Number.isNaN(dob.getTime())) return null
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--
  return age
}

function ownPosition(user, positionId) {
  const position = db.positions.find((p) => p.id === positionId && p.userId === user.id && p.status === 'open')
  if (!position) fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that basket in your portfolio.')
  return position
}

export default [
  {
    method: 'GET',
    path: '/invest/banks',
    latency: 120,
    handler: () => BANKS,
  },
  {
    method: 'GET',
    path: '/invest/account',
    handler: ({ user }) => serializeAccount(user),
  },
  {
    // The real flow hands identity verification to the brokerage partner. The mock only checks the form.
    method: 'POST',
    path: '/invest/account',
    latency: 1400,
    handler: ({ user, body }) => {
      if (user.brokerage) fail(409, ERROR_CODES.VALIDATION, 'You already have a brokerage account.')
      const errors = {}
      const legalName = String(body.legalName ?? '').trim()
      if (legalName.split(/\s+/).length < 2) errors.legalName = 'Enter your full legal name.'
      const age = ageOn(String(body.dateOfBirth ?? ''))
      if (age === null) errors.dateOfBirth = 'Enter your date of birth.'
      else if (age < 18) errors.dateOfBirth = 'You need to be 18 or older to open a brokerage account.'
      else if (age > 120) errors.dateOfBirth = 'Check your date of birth.'
      if (String(body.street ?? '').trim().length < 3) errors.street = 'Enter your street address.'
      if (String(body.city ?? '').trim().length < 2) errors.city = 'Enter your city.'
      if (!/^[A-Z]{2}$/.test(String(body.state ?? ''))) errors.state = 'Pick your state.'
      if (!/^\d{5}$/.test(String(body.zip ?? '').trim())) errors.zip = 'Enter a 5-digit ZIP code.'
      if (!EMPLOYMENT.includes(body.employment)) errors.employment = 'Pick one.'
      if (!EXPERIENCE.includes(body.experience)) errors.experience = 'Pick one.'
      const bank = BANKS.find((b) => b.id === body.bankId)
      if (!bank) errors.bankId = 'Pick the bank you’ll fund your account from.'
      if (body.agreed !== true) errors.agreed = 'Please accept the account agreements to continue.'
      if (Object.keys(errors).length) fail(422, ERROR_CODES.VALIDATION, 'Please check the highlighted fields.', errors)

      user.brokerage = {
        status: 'open',
        accountNumber: digits(8),
        openedAt: new Date().toISOString(),
        legalName,
        bank: { name: bank.name, last4: digits(4) },
        cash: 0,
      }
      return serializeAccount(user)
    },
  },
  {
    method: 'POST',
    path: '/theses/:thesisId/invest',
    latency: 1200,
    handler: ({ user, params, body }) => {
      const thesis = findThesis(params.thesisId)
      if (!thesis) fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that thesis.')
      if (thesis.userId !== user.id) {
        fail(403, ERROR_CODES.FORBIDDEN, 'You can invest in theses you’ve built. Follow this one to see how it holds up.')
      }
      if (!user.brokerage) fail(409, ERROR_CODES.ACCOUNT_REQUIRED, 'Open your brokerage account first. It takes about five minutes.')
      if (thesis.symbols.length < MIN_BASKET) fail(422, ERROR_CODES.VALIDATION, `A basket needs at least ${MIN_BASKET} companies.`)
      const amount = round2(Number(body.amount))
      if (!Number.isFinite(amount) || amount < MIN_AMOUNT) {
        fail(422, ERROR_CODES.MIN_INVESTMENT, `The minimum is $${MIN_AMOUNT}.`, { amount: `The minimum is $${MIN_AMOUNT}.` })
      }
      if (amount > MAX_AMOUNT) fail(422, ERROR_CODES.VALIDATION, 'This demo caps orders at $50,000.', { amount: 'Keep it under $50,000.' })
      if (!(body.schedule in SCHEDULE_MONTHS)) fail(422, ERROR_CODES.VALIDATION, 'Pick a rebalancing schedule.', { schedule: 'Pick one.' })

      const placedAt = new Date().toISOString()
      const weights = weightsOf(thesis)
      const dollars = splitDollars(amount, weights.map((w) => w.weight))
      let position = openPosition(user.id, thesis.id)
      if (position) {
        // New money buys the latest basket, which also rebalances what's already there.
        position.lots.push({ amount, at: placedAt })
        position.weights = weights
        position.schedule = body.schedule
        position.lastRebalancedAt = placedAt
      } else {
        position = {
          id: randomId('pos', 6),
          userId: user.id,
          thesisId: thesis.id,
          weights,
          lots: [{ amount, at: placedAt }],
          schedule: body.schedule,
          createdAt: placedAt,
          lastRebalancedAt: placedAt,
          status: 'open',
        }
        db.positions.push(position)
      }

      return {
        position: positionSummary(position),
        order: {
          amount,
          placedAt,
          allocations: weights
            .map(({ symbol, weight }, i) => {
              const price = priceOf(symbol)
              return {
                ...toSummary(getCompany(symbol)),
                weight,
                dollars: dollars[i],
                price,
                shares: Math.round((dollars[i] / price) * 10000) / 10000,
              }
            })
            .sort((a, b) => b.weight - a.weight),
        },
      }
    },
  },
  {
    method: 'GET',
    path: '/portfolio',
    handler: ({ user }) => {
      const positions = db.positions
        .filter((p) => p.userId === user.id && p.status === 'open')
        .map(positionSummary)
        .sort((a, b) => b.value - a.value)
      const invested = positions.reduce((sum, p) => sum + p.invested, 0)
      const value = positions.reduce((sum, p) => sum + p.value, 0)
      const benchmarkValue = positions.reduce((sum, p) => sum + p.invested * (1 + p.benchmarkGainPct / 100), 0)
      return {
        account: serializeAccount(user),
        summary: {
          positions: positions.length,
          invested: round2(invested),
          value: round2(value),
          gain: round2(value - invested),
          gainPct: invested ? Math.round((value / invested - 1) * 1000) / 10 : 0,
          benchmarkGainPct: invested ? Math.round((benchmarkValue / invested - 1) * 1000) / 10 : 0,
        },
        positions,
      }
    },
  },
  {
    method: 'PATCH',
    path: '/portfolio/positions/:positionId',
    handler: ({ user, params, body }) => {
      const position = ownPosition(user, params.positionId)
      if (!(body.schedule in SCHEDULE_MONTHS)) fail(422, ERROR_CODES.VALIDATION, 'Pick a rebalancing schedule.')
      position.schedule = body.schedule
      return positionSummary(position)
    },
  },
  {
    method: 'POST',
    path: '/portfolio/positions/:positionId/sell',
    latency: 1000,
    handler: ({ user, params }) => {
      const position = ownPosition(user, params.positionId)
      const { value } = positionSummary(position)
      position.status = 'closed'
      position.closedAt = new Date().toISOString()
      position.proceeds = value
      user.brokerage.cash = round2(user.brokerage.cash + value)
      return { proceeds: value, account: serializeAccount(user) }
    },
  },
]
