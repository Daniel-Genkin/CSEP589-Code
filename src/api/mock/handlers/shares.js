import { ERROR_CODES } from '../../errors'
import { BAND_LABELS, bandOf, getSecurity, toSummary } from '../catalog'
import { db } from '../db'
import { fail, requireSecurity } from '../model'
import { randomId } from '../utils'

function highlights(sec) {
  const own = sec.news.filter((n) => !n.via)
  const good = own.filter((n) => n.sentiment === 'positive').sort((a, b) => b.impact - a.impact)[0]
  const bad = own.filter((n) => n.sentiment === 'negative').sort((a, b) => a.impact - b.impact)[0]
  return [good, bad].filter(Boolean)
}

export default [
  {
    method: 'POST',
    path: '/shares',
    handler: ({ user, body }) => {
      const scan = db.scans.find((s) => s.id === body.scanId && s.userId === user.id)
      if (!scan) fail(404, ERROR_CODES.NOT_FOUND, "We couldn't find that scan.")
      const sec = requireSecurity(body.symbol)
      const note = String(body.note ?? '').trim()
      if (note.length > 280) fail(422, ERROR_CODES.VALIDATION, 'Notes can be up to 280 characters.')

      const share = {
        id: randomId('', 8),
        userId: user.id,
        scanId: scan.id,
        symbol: sec.symbol,
        note,
        createdAt: new Date().toISOString(),
        views: 0,
      }
      db.shares.push(share)
      return { id: share.id, path: `/s/${share.id}`, createdAt: share.createdAt }
    },
  },
  {
    method: 'GET',
    path: '/public/shares/:shareId',
    public: true,
    handler: ({ params }) => {
      const share = db.shares.find((s) => s.id === params.shareId)
      if (!share) fail(404, ERROR_CODES.NOT_FOUND, 'This shared analysis has expired or never existed.')
      share.views += 1

      const sharer = db.users.find((u) => u.id === share.userId)
      const firstName = sharer?.name.split(' ')[0] ?? 'A friend'
      const sec = getSecurity(share.symbol)
      return {
        id: share.id,
        createdAt: share.createdAt,
        note: share.note,
        sharer: { firstName, initial: firstName[0] },
        referralCode: sharer?.referralCode ?? null,
        security: {
          ...toSummary(sec),
          blurb: sec.blurb,
          score: sec.score,
          band: bandOf(sec.score),
          bandLabel: BAND_LABELS[bandOf(sec.score)],
          trend: sec.trend,
          flags: sec.flags,
          summary: sec.summary,
          categories: sec.categories,
          highlights: highlights(sec),
          newsCount: sec.news.length,
          holdingsCount: sec.holdingsCount ?? null,
          topHoldings: sec.fund ? sec.fund.constituents.slice(0, 5) : null,
        },
      }
    },
  },
]
