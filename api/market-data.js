import { handleMarketDataRequest } from '../server/alpaca-market-data.js'

export const config = { runtime: 'nodejs', maxDuration: 60 }

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET')
    response.status(405).json({ error: { code: 'method_not_allowed', message: 'Use GET for market data.' } })
    return
  }

  const url = new URL(request.url ?? '/api/market-data', 'http://localhost')
  const result = await handleMarketDataRequest(url, process.env)
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value)
  response.status(result.status).json(result.body)
}
