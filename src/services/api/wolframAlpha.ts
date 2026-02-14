import ky from 'ky'
import { getCO2Cache, setCO2Cache } from '@/services/cache/speciesCache'

interface WolframResult {
  co2: number | null
  raw: string
}

const CO2_REGEX = /(\d+(?:\.\d+)?)\s*kg\s*(?:co2|carbon\s*dioxide)/i
const NUMBER_REGEX = /(\d+(?:\.\d+)?)/

export async function fetchCO2(scientificName: string): Promise<number | null> {
  // Check IndexedDB cache first
  const cached = await getCO2Cache(scientificName)
  if (cached !== null) return cached

  try {
    const query = `carbon footprint of ${scientificName} per kilogram seafood`
    const data = await ky
      .get('/api/wolfram', {
        searchParams: { query },
        timeout: 8000,
        retry: 1,
      })
      .json<WolframResult>()

    const value = parseCO2Value(data.raw ?? '')
    if (value !== null) {
      await setCO2Cache(scientificName, value)
    }
    return value
  } catch {
    return null
  }
}

function parseCO2Value(text: string): number | null {
  const co2Match = text.match(CO2_REGEX)
  if (co2Match) return parseFloat(co2Match[1])

  // Try to find any number near "kg" or "carbon"
  const lines = text.split('\n')
  for (const line of lines) {
    if (/carbon|co2|emission/i.test(line)) {
      const numMatch = line.match(NUMBER_REGEX)
      if (numMatch) {
        const val = parseFloat(numMatch[1])
        if (val > 0 && val < 100) return val
      }
    }
  }

  return null
}
