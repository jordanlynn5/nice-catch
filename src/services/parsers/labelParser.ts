import type { ParsedLabel } from '@/types/species'

// EU fish label regex patterns
const FAO_AREA_PATTERN = /(?:FAO\s*)?(?:zona|area|catch area)?\s*(\d{2}(?:\.\d+)*)/gi
const METHOD_KEYWORDS: Record<string, string> = {
  arrastre: 'bottom_trawl',
  trawl: 'bottom_trawl',
  palangre: 'longline_pelagic',
  longline: 'longline_pelagic',
  cerco: 'purse_seine',
  'purse seine': 'purse_seine',
  anzuelo: 'hook_and_line',
  'hook and line': 'hook_and_line',
  caña: 'pole_and_line',
  'pole and line': 'pole_and_line',
  nasa: 'trap_pot',
  trap: 'trap_pot',
  pot: 'trap_pot',
  draga: 'dredge',
  dredge: 'dredge',
  acuicultura: 'aquaculture_standard',
  aquaculture: 'aquaculture_standard',
  cultivo: 'aquaculture_standard',
  asc: 'aquaculture_certified',
  msc: 'aquaculture_certified',
}

const CERTIFICATION_PATTERNS = ['MSC', 'ASC', 'GlobalGAP', 'Friend of Sea', 'BRC', 'IFS']

export function parseEULabel(text: string): ParsedLabel {
  const result: ParsedLabel = {}
  const lower = text.toLowerCase()

  // FAO area
  const areaMatches = [...text.matchAll(FAO_AREA_PATTERN)]
  if (areaMatches.length > 0) {
    result.faoArea = areaMatches[0][1]
  }

  // Fishing method
  for (const [keyword, method] of Object.entries(METHOD_KEYWORDS)) {
    if (lower.includes(keyword)) {
      result.fishingMethod = method
      break
    }
  }

  // Production method
  if (lower.includes('acuicultura') || lower.includes('aquaculture') || lower.includes('cultivado') || lower.includes('criado')) {
    result.productionMethod = 'farmed'
  } else if (lower.includes('salvaje') || lower.includes('silvestre') || lower.includes('wild') || lower.includes('capturado')) {
    result.productionMethod = 'wild'
  }

  // Certifications
  result.certifications = CERTIFICATION_PATTERNS.filter((cert) =>
    text.toUpperCase().includes(cert.toUpperCase())
  )

  // Try to extract species name (first significant line or word group)
  const lines = text.split(/[\n,;]+/).map((l) => l.trim()).filter(Boolean)
  if (lines.length > 0) {
    result.speciesRaw = lines[0]
  }

  return result
}

export function parseBarcodeProduct(productData: Record<string, unknown>): ParsedLabel {
  const result: ParsedLabel = {}

  // Species name — prefer 'species' field, then localised product name, then generic
  const speciesField =
    (productData.species as string) ||
    (productData['product_name_es'] as string) ||
    (productData.product_name as string) ||
    ''
  if (speciesField) result.speciesRaw = speciesField

  // Production method from categories_tags (e.g. "en:wild-fish", "en:farmed-fish")
  const cats = (productData.categories_tags as string[] | undefined) ?? []
  if (cats.some((c) => /wild|salvaje|silvestre/.test(c))) {
    result.productionMethod = 'wild'
  } else if (cats.some((c) => /farmed|aquaculture|acuicultura|cultivo/.test(c))) {
    result.productionMethod = 'farmed'
  }

  // Fishing method keywords from product name text
  const nameText = [
    (productData.product_name as string) ?? '',
    (productData['product_name_es'] as string) ?? '',
  ].join(' ').toLowerCase()
  for (const [keyword, method] of Object.entries(METHOD_KEYWORDS)) {
    if (nameText.includes(keyword)) {
      result.fishingMethod = method
      break
    }
  }

  // FAO area — first try origins_tags (e.g. "en:fao-27"), then origin text
  const originsTags = (productData.origins_tags as string[] | undefined) ?? []
  const faoTag = originsTags.find((t) => /fao[-_]?\d+/i.test(t))
  if (faoTag) {
    const m = faoTag.match(/fao[-_]?(\d+(?:[._]\d+)*)/i)
    if (m) result.faoArea = m[1].replace('_', '.')
  } else {
    const origin = (productData.origin as string) || (productData.origins as string) || ''
    const areaMatch = origin.match(/(?:FAO\s*)?(\d{2}(?:\.\d+)*)/)
    if (areaMatch) result.faoArea = areaMatch[1]
  }

  return result
}
