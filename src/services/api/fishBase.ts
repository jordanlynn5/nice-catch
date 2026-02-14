import ky from 'ky'
import type { FishBaseData } from '@/types/species'

const BASE_URL = 'https://fishbase.ropensci.org'

interface FBSpeciesResponse {
  data?: Array<{
    SpecCode?: number
    Genus?: string
    Species?: string
    FamCode?: number
    Family?: string
    DemersPelag?: string
    DepthRangeShallow?: number
    DepthRangeDeep?: number
    Length?: number
    Weight?: number
    TrophicLevel?: number
    Vulnerability?: number
  }>
}

export async function fetchFishBaseData(
  scientificName: string
): Promise<Partial<FishBaseData> | null> {
  try {
    const [genus, species] = scientificName.split(' ')
    if (!genus || !species) return null

    const data = await ky
      .get(`${BASE_URL}/species`, {
        searchParams: { Genus: genus, Species: species, limit: 1 },
        timeout: 3000,
        retry: 0,
      })
      .json<FBSpeciesResponse>()

    const sp = data?.data?.[0]
    if (!sp) return null

    return {
      scientificName,
      family: sp.Family ?? '',
      habitat: sp.DemersPelag ?? '',
      maxLength: sp.Length,
      maxWeight: sp.Weight,
      trophicLevel: sp.TrophicLevel,
      vulnerability: sp.Vulnerability,
    }
  } catch {
    // FishBase has no SLA — treat failure as non-fatal
    return null
  }
}
