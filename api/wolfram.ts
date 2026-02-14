import type { VercelRequest, VercelResponse } from '@vercel/node'

const WOLFRAM_BASE = 'https://api.wolframalpha.com/v1/result'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const query = req.query.query as string
  if (!query) {
    return res.status(400).json({ error: 'query param required' })
  }

  const appId = process.env.WOLFRAM_APP_ID
  if (!appId) {
    return res.status(503).json({ error: 'Wolfram App ID not configured' })
  }

  try {
    const params = new URLSearchParams({
      appid: appId,
      i: query,
      units: 'metric',
    })

    const response = await fetch(`${WOLFRAM_BASE}?${params}`, {
      signal: AbortSignal.timeout(8000),
    })

    const text = await response.text()

    // Wolfram returns plain text for the /result endpoint
    res.setHeader('Cache-Control', 's-maxage=604800, stale-while-revalidate')
    return res.status(200).json({ raw: text, query })
  } catch (err) {
    console.error('Wolfram error:', err)
    return res.status(500).json({ error: 'Internal error', raw: '' })
  }
}
