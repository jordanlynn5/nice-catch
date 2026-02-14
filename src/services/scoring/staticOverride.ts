import speciesDb from '@/data/species-db.json'
import type { Species } from '@/types/species'

const speciesMap = new Map<string, Species>(
  (speciesDb as Species[]).map((s) => [s.id, s])
)

export function clampToSpeciesRange(speciesId: string, rawScore: number): number {
  const species = speciesMap.get(speciesId)
  if (!species) return Math.max(0, Math.min(100, rawScore))
  return Math.max(species.scoreRange[0], Math.min(species.scoreRange[1], rawScore))
}

export function getSpecies(id: string): Species | undefined {
  return speciesMap.get(id)
}

export function getAllSpecies(): Species[] {
  return speciesDb as Species[]
}
