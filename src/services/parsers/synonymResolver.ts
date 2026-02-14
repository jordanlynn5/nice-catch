import speciesDb from '@/data/species-db.json'
import type { Species } from '@/types/species'

const species = speciesDb as Species[]

// Build flat lookup maps
const exactMap = new Map<string, string>()   // lowercase name → species.id
const partialList: Array<{ pattern: string; id: string }> = []

for (const sp of species) {
  const allNames = [
    ...sp.names.es,
    ...sp.names.en,
    ...sp.names.fr,
    sp.names.scientific,
    sp.names.eu_commercial,
    sp.id,
  ]

  for (const name of allNames) {
    if (!name) continue
    exactMap.set(name.toLowerCase().trim(), sp.id)
    // Also index each word (for partial matching)
    for (const word of name.toLowerCase().split(/\s+/)) {
      if (word.length >= 4) {
        partialList.push({ pattern: word, id: sp.id })
      }
    }
  }
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function resolveSpeciesId(input: string): string | null {
  if (!input?.trim()) return null
  const normalized = input.toLowerCase().trim()

  // 1. Exact match
  if (exactMap.has(normalized)) return exactMap.get(normalized)!

  // 2. Case-insensitive partial — check if any known name is contained or contains
  for (const [name, id] of exactMap) {
    if (name.includes(normalized) || normalized.includes(name)) return id
  }

  // 3. Fuzzy: Levenshtein distance ≤ 3 on all known names
  let bestId: string | null = null
  let bestDist = 4

  for (const [name, id] of exactMap) {
    if (Math.abs(name.length - normalized.length) > 5) continue
    const dist = levenshtein(normalized, name)
    if (dist < bestDist) {
      bestDist = dist
      bestId = id
    }
  }

  return bestId
}

export function getSpeciesById(id: string): Species | undefined {
  return species.find((s) => s.id === id)
}

export function searchSpecies(query: string): Species[] {
  if (!query.trim()) return []
  const q = query.toLowerCase().trim()
  const results: Array<{ species: Species; score: number }> = []

  for (const sp of species) {
    const allNames = [
      ...sp.names.es,
      ...sp.names.en,
      sp.names.scientific,
      sp.names.eu_commercial,
    ]

    let bestScore = 0
    for (const name of allNames) {
      if (!name) continue
      const lower = name.toLowerCase()
      if (lower === q) bestScore = Math.max(bestScore, 100)
      else if (lower.startsWith(q)) bestScore = Math.max(bestScore, 80)
      else if (lower.includes(q)) bestScore = Math.max(bestScore, 60)
      else {
        const dist = levenshtein(q, lower)
        if (dist <= 3) bestScore = Math.max(bestScore, 40 - dist * 10)
      }
    }

    if (bestScore > 0) results.push({ species: sp, score: bestScore })
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((r) => r.species)
}
