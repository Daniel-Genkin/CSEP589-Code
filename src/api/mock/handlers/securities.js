import { ERROR_CODES } from '../../errors'
import { allSecurities, getSecurity, popularSecurities, toSummary } from '../catalog'
import { BROKERAGES, SAMPLE_PORTFOLIO } from '../data/reference'
import { db } from '../db'
import { brokerageById, fail, monitoringOf, planOf, serializeConnection } from '../model'
import { randomId } from '../utils'

export default [
  {
    method: 'GET',
    path: '/securities/search',
    public: true,
    latency: 160,
    handler: ({ query }) => {
      const q = String(query.q || '').trim()
      if (!q) return []
      const upper = q.toUpperCase()
      const lower = q.toLowerCase()
      return allSecurities()
        .map((sec) => {
          const rank = sec.symbol === upper ? 0 : sec.symbol.startsWith(upper) ? 1 : sec.name.toLowerCase().startsWith(lower) ? 2 : sec.name.toLowerCase().includes(lower) || sec.sector.toLowerCase().includes(lower) ? 3 : -1
          return { sec, rank }
        })
        .filter((x) => x.rank >= 0)
        .sort((a, b) => a.rank - b.rank || a.sec.symbol.localeCompare(b.sec.symbol))
        .slice(0, 8)
        .map((x) => toSummary(x.sec))
    },
  },
  {
    method: 'GET',
    path: '/securities/popular',
    public: true,
    handler: () => popularSecurities().map(toSummary),
  },
  {
    method: 'GET',
    path: '/securities/lookup',
    public: true,
    handler: ({ query }) => {
      const symbols = [...new Set(String(query.symbols || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean))]
      const found = []
      const unknown = []
      for (const symbol of symbols) {
        const sec = getSecurity(symbol)
        if (sec) found.push(toSummary(sec))
        else unknown.push(symbol)
      }
      return { found, unknown }
    },
  },
  {
    method: 'GET',
    path: '/brokerages',
    public: true,
    handler: () => BROKERAGES,
  },
  {
    method: 'GET',
    path: '/portfolio/connections',
    handler: ({ user }) =>
      db.connections
        .filter((c) => c.userId === user.id)
        .sort((a, b) => Date.parse(b.syncedAt) - Date.parse(a.syncedAt))
        .map(serializeConnection),
  },
  {
    method: 'POST',
    path: '/portfolio/connections',
    latency: 2200,
    handler: ({ user, body }) => {
      const brokerage = brokerageById(body.brokerageId)
      if (!brokerage) fail(422, ERROR_CODES.VALIDATION, 'Please choose a supported brokerage.')
      const now = new Date().toISOString()
      let connection = db.connections.find((c) => c.userId === user.id && c.brokerageId === brokerage.id)
      if (connection) {
        connection.syncedAt = now
        connection.holdings = SAMPLE_PORTFOLIO
      } else {
        connection = { id: randomId('con'), userId: user.id, brokerageId: brokerage.id, linkedAt: now, syncedAt: now, holdings: SAMPLE_PORTFOLIO }
        db.connections.push(connection)
      }
      // Pro members get linked holdings watched automatically.
      const monitoring = monitoringOf(user)
      if (planOf(user).limits.monitoring && monitoring) {
        for (const h of connection.holdings) if (!monitoring.symbols.includes(h.symbol)) monitoring.symbols.push(h.symbol)
      }
      return serializeConnection(connection)
    },
  },
  {
    method: 'DELETE',
    path: '/portfolio/connections/:id',
    handler: ({ user, params }) => {
      const index = db.connections.findIndex((c) => c.id === params.id && c.userId === user.id)
      if (index === -1) fail(404, ERROR_CODES.NOT_FOUND, 'Connection not found.')
      db.connections.splice(index, 1)
      return null
    },
  },
]
