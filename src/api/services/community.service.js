import { api } from '../client'

export const communityService = {
  /** GET /community/theses?sort=trending|new|top&topic=&limit= -> ThesisSummary[] (published only; no auth) */
  list: ({ sort = 'trending', topic, limit } = {}) => api.get('/community/theses', { sort, topic, limit }),

  /** GET /people/:handle -> { name, handle, initials, bio, joinedAt, isYou, record, theses } (public track record) */
  person: (handle) => api.get(`/people/${handle}`),

  /** GET /companies/search?q=&topic= -> Company[] (with exposure to the topic when given) */
  searchCompanies: (q, topic) => api.get('/companies/search', { q, topic }),
}
