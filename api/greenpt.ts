import type { VercelRequest, VercelResponse } from '@vercel/node'

const GREENPT_BASE = 'https://api.greenpt.ai/v1'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GREENPT_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'GreenPT API key not configured' })
  }

  const { action, image, prompt, message, system } = req.body as {
    action: 'vision' | 'chat'
    image?: string
    prompt?: string
    message?: string
    system?: string
  }

  try {
    if (action === 'vision' && image) {
      const response = await fetch(`${GREENPT_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'greenpt-vision',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${image}` },
                },
                { type: 'text', text: prompt ?? 'Analyze this seafood label and extract species, FAO area, fishing method, production method, and certifications as JSON.' },
              ],
            },
          ],
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(10000),
      })

      if (!response.ok) {
        throw new Error(`GreenPT vision error: ${response.status}`)
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content ?? '{}'
      const parsed = JSON.parse(content)
      return res.status(200).json(parsed)
    }

    if (action === 'chat' && message) {
      const messages: Array<{ role: string; content: string }> = []
      if (system) messages.push({ role: 'system', content: system })
      messages.push({ role: 'user', content: message })

      const response = await fetch(`${GREENPT_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'greenpt-chat', messages }),
        signal: AbortSignal.timeout(15000),
      })

      if (!response.ok) {
        throw new Error(`GreenPT chat error: ${response.status}`)
      }

      const data = await response.json() as {
        choices?: Array<{ message?: { content?: string } }>
      }
      const content = data.choices?.[0]?.message?.content ?? ''
      return res.status(200).json({ message: content })
    }

    return res.status(400).json({ error: 'Invalid action' })
  } catch (err) {
    console.error('GreenPT error:', err)
    return res.status(500).json({ error: 'Internal error', message: '' })
  }
}
