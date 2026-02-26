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
            'Extract from this EU fish label:\n' +
            '1. species name (common or scientific name)\n' +
            '2. FAO catch area code (e.g., "FAO 27", "FAO 37")\n' +
            '3. fishing method (ONLY the GEAR TYPE used to catch the fish):\n' +
            '   - VALID methods: "trawl" (arrastre), "longline" (palangre), "seine" (cerco), "gillnet" (enmalle), "trap" (trampa), "hook and line" (anzuelo), "dredge" (draga)\n' +
            '   - IGNORE these (NOT fishing methods): "gutted", "eviscerado", "filleted", "frozen", "congelado", "fresh", "fresco", "skinless", "descabezado"\n' +
            '   - If no fishing gear is mentioned, leave method empty or null\n' +
            '4. production_method: Look carefully for these keywords:\n' +
            '   - If you see "acuicultura", "criado", "farmed", "aquaculture", "de cría", or similar → return "farmed"\n' +
            '   - If you see "pescado", "salvaje", "wild", "caught", "capturado" or fishing gear terms → return "wild"\n' +
            '   - If unclear, return "unknown"\n' +
            '5. certifications (MSC, ASC, etc.)\n\n' +
            'IMPORTANT: \n' +
            '- production_method is REQUIRED\n' +
            '- "method" should ONLY contain fishing GEAR types, not fish preparation/processing terms\n' +
            '- Check the label text carefully for farming/aquaculture keywords\n\n' +
            'Respond as JSON: {"species": "...", "area": "...", "method": "...", "production_method": "farmed|wild|unknown", "certifications": [...]}',
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
