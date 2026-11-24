// Vercel function: GET /api/alpaca (paper account and positions) and POST /api/alpaca (place
// paper orders). Keys come from the ALPACA_KEY_ID and ALPACA_SECRET_KEY environment variables.
import { handleAlpaca } from '../server/alpaca.js'

export default async function handler(req, res) {
  const { status, json } = await handleAlpaca(req.method, req.body, process.env, req.headers)
  res.setHeader('Cache-Control', 'no-store')
  res.status(status).json(json)
}
