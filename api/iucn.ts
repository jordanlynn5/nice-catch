import type { VercelRequest, VercelResponse } from '@vercel/node'

const IUCN_BASE = 'https://apiv3.iucnredlist.org/api/v3'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const species = req.query.species as string
  if (!species) {
    return res.status(400).json({ error: 'species query param required' })
  }

  const apiKey = process.env.IUCN_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'IUCN API key not configured' })
  }

  try {
    const url = `${IUCN_BASE}/species/${encodeURIComponent(species)}?token=${apiKey}`
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'IUCN API error' })
    }

    const data = await response.json() as {
      result?: Array<{ category?: string }>
    }

    const category = data.result?.[0]?.category
    if (!category) {
      return res.status(404).json({ error: 'Species not found' })
    }

    // IUCN uses e.g. "LC", "VU", etc.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate')
    return res.status(200).json({ status: category })
  } catch (err) {
    console.error('IUCN error:', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
