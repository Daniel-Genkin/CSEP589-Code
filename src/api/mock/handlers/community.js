import { ERROR_CODES } from '../../errors'
import { searchCompanies } from '../catalog'
import { db } from '../db'
import { fail, initialsOf, recordOf, thesisSummary, trackRecord } from '../model'

const DAY = 24 * 60 * 60 * 1000

function trendingScore(thesis) {
  const daysLive = (Date.now() - Date.parse(thesis.publishedAt)) / DAY
  const recentComments = thesis.comments.filter((c) => Date.now() - Date.parse(c.createdAt) < 60 * DAY).length
  return thesis.baseFollowers + thesis.followerIds.length + recentComments * 25 + Math.max(0, 90 - daysLive) * 2
}

function topScore(thesis) {
  const record = recordOf(thesis)
  return record.tooEarly ? -Infinity : record.excess
}

export default [
  {
    method: 'GET',
    path: '/community/theses',
    public: true,
    handler: ({ user, query }) => {
      const limit = Math.min(50, Math.max(1, Number(query.limit) || 24))
      const published = db.theses.filter((t) => t.status === 'published' && (!query.topic || t.topicKey === query.topic))
      const score = query.sort === 'top' ? topScore : query.sort === 'new' ? (t) => Date.parse(t.publishedAt) : trendingScore
      return published
        .map((t) => ({ t, s: score(t) }))
        .sort((a, b) => b.s - a.s)
        .slice(0, limit)
        .map(({ t }) => thesisSummary(t, user))
    },
  },
  {
    method: 'GET',
    path: '/people/:handle',
    public: true,
    handler: ({ user: viewer, params }) => {
      const person = db.users.find((u) => u.handle === params.handle.toLowerCase())
      if (!person) fail(404, ERROR_CODES.NOT_FOUND, 'We couldn’t find that member.')
      return {
        name: person.name,
        handle: person.handle,
        initials: initialsOf(person.name),
        bio: person.bio,
        joinedAt: person.createdAt,
        isYou: viewer?.id === person.id,
        record: trackRecord(person.id),
        theses: db.theses
          .filter((t) => t.userId === person.id && t.status === 'published')
          .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
          .map((t) => thesisSummary(t, viewer)),
      }
    },
  },
  {
    method: 'GET',
    path: '/companies/search',
    public: true,
    latency: 140,
    handler: ({ query }) => searchCompanies(query.q, query.topic || null),
  },
]
