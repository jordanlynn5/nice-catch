import type { ParsedLabel } from '@/types/species'

interface GreenPTVisionResponse {
  species?: string
  area?: string
  method?: string
  production_method?: string
  certifications?: string[]
  raw_text?: string
}

export function parseGreenPTResponse(response: GreenPTVisionResponse): ParsedLabel {
  return {
    speciesRaw: response.species,
    faoArea: response.area,
    fishingMethod: response.method,
    productionMethod: response.production_method as ParsedLabel['productionMethod'],
    certifications: response.certifications ?? [],
  }
}

export function imageToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
