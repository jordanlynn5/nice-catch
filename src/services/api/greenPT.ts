import ky from 'ky'
import type { ParsedLabel } from '@/types/species'
import { parseGreenPTResponse, imageToBase64 } from '@/services/parsers/aiLabelParser'

interface GreenPTVisionResponse {
  species?: string
  area?: string
  method?: string
  production_method?: string
  certifications?: string[]
  raw_text?: string
}

interface GreenPTChatResponse {
  message: string
}

export async function analyzeLabel(imageBlob: Blob): Promise<ParsedLabel | null> {
  try {
    const base64 = await imageToBase64(imageBlob)
    const data = await ky
      .post('/api/greenpt', {
        json: {
          action: 'vision',
          image: base64,
          prompt:
            'Extract from this EU fish label: species name, FAO catch area code, fishing method, production method (wild/farmed), any certifications (MSC/ASC). Respond as JSON with keys: species, area, method, production_method, certifications.',
        },
        timeout: 10000,
      })
      .json<GreenPTVisionResponse>()

    return parseGreenPTResponse(data)
  } catch {
    return null
  }
}

export async function chatWithContext(
  message: string,
  speciesContext?: string
): Promise<string | null> {
  try {
    const systemPrompt = speciesContext
      ? `You are a seafood sustainability assistant. The user is asking about: ${speciesContext}. Answer concisely in the user's language.`
      : 'You are a seafood sustainability assistant. Answer concisely.'

    const data = await ky
      .post('/api/greenpt', {
        json: { action: 'chat', message, system: systemPrompt },
        timeout: 15000,
      })
      .json<GreenPTChatResponse>()

    return data.message ?? null
  } catch {
    return null
  }
}
