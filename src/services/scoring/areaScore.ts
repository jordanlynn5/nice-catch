import faoAreas from '@/data/fao-areas.json'

type FaoAreaData = { name: string; modifier: number; description: string }

export function getAreaModifier(faoArea: string | undefined): number {
  if (!faoArea) return 0
  const areas = faoAreas as Record<string, FaoAreaData>

  // Exact match
  if (faoArea in areas) return areas[faoArea].modifier

  // Prefix match (e.g. "27.8.a" → "27.8")
  const parts = faoArea.split('.')
  for (let i = parts.length; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('.')
    if (prefix in areas) return areas[prefix].modifier
  }

  return 0
}

export function getAreaName(faoArea: string | undefined, lang: 'es' | 'en' = 'es'): string {
  if (!faoArea) return lang === 'es' ? 'Zona desconocida' : 'Unknown area'
  const areas = faoAreas as Record<string, FaoAreaData>
  if (faoArea in areas) return areas[faoArea].name

  const parts = faoArea.split('.')
  for (let i = parts.length; i >= 1; i--) {
    const prefix = parts.slice(0, i).join('.')
    if (prefix in areas) return areas[prefix].name
  }

  return faoArea
}
