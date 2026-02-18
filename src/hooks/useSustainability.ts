import { useState, useCallback } from 'react'
import type { SustainabilityResult, CO2Data, AlternativeOption } from '@/types/scoring'
import type { ParsedLabel, IUCNStatus } from '@/types/species'
import { resolveSpeciesId, getSpeciesById } from '@/services/parsers/synonymResolver'
import { computeScore } from '@/services/scoring/scoreEngine'
import { fetchIUCNStatus } from '@/services/api/iucn'
import { fetchFishBaseData } from '@/services/api/fishBase'
import { fetchCO2 } from '@/services/api/wolframAlpha'
import { getSpeciesCache, setSpeciesCache } from '@/services/cache/speciesCache'
import co2Fallback from '@/data/co2-fallback.json'
import type { Species } from '@/types/species'
import speciesDb from '@/data/species-db.json'
import { resolveMethodKey } from '@/services/scoring/methodScore'
import { useI18n } from '@/hooks/useI18n'

export function useSustainability() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t, language } = useI18n()

  const resolve = useCallback(
    async (
      input: { speciesName?: string; label?: ParsedLabel; barcode?: string }
    ): Promise<SustainabilityResult | null> => {
      setLoading(true)
      setError(null)

      try {
        // Resolve species ID
        const rawName =
          input.speciesName ?? input.label?.speciesRaw ?? ''
        const speciesId = resolveSpeciesId(rawName)
        if (!speciesId) {
          setError(t('errors.not_found'))
          return null
        }

        const species = getSpeciesById(speciesId)
        if (!species) {
          setError(t('errors.not_found'))
          return null
        }

        // Check cache (use species+method+area as compound key for now, just species id)
        const cached = await getSpeciesCache(speciesId)
        if (cached) {
          setLoading(false)
          return cached
        }

        // Run API calls in parallel (non-fatal failures)
        const [liveIUCN, fishBaseData, co2Wolfram] = await Promise.allSettled([
          fetchIUCNStatus(species.names.scientific),
          fetchFishBaseData(species.names.scientific),
          fetchCO2(species.names.scientific),
        ])

        const iucnStatus: IUCNStatus =
          (liveIUCN.status === 'fulfilled' && liveIUCN.value) ||
          species.iucnStatus

        const fishBase =
          fishBaseData.status === 'fulfilled' ? fishBaseData.value : null

        let co2Value: number | null =
          co2Wolfram.status === 'fulfilled' ? co2Wolfram.value : null

        // CO2 fallback
        if (co2Value === null) {
          const methodKey = resolveMethodKey(input.label?.fishingMethod)
          const byMethod = (co2Fallback.by_method as Record<string, number>)[methodKey]
          const bySpecies = (co2Fallback.by_species as Record<string, number>)[speciesId]
          co2Value = bySpecies ?? byMethod ?? co2Fallback.global_average_seafood
        }

        const co2: CO2Data = {
          value: co2Value,
          unit: 'kg_co2_per_kg',
          source: co2Wolfram.status === 'fulfilled' && co2Wolfram.value ? 'wolfram' : 'fallback',
          comparison: buildCO2Comparison(co2Value, t),
        }

        // Compute score
        const scoreBreakdown = computeScore({
          speciesId,
          iucnStatus,
          fishingMethod: input.label?.fishingMethod,
          faoArea: input.label?.faoArea,
          certifications: input.label?.certifications,
          productionMethod: input.label?.productionMethod,
        })

        // Alternatives
        const alternatives = buildAlternatives(
          species,
          scoreBreakdown.finalScore,
          input.label?.fishingMethod,
          input.label?.productionMethod,
          language,
          t
        )

        const displayName =
          (language === 'en' ? (species.names.en[0] ?? species.names.es[0]) : species.names.es[0]) ??
          species.names.eu_commercial

        const result: SustainabilityResult = {
          speciesId,
          scientificName: species.names.scientific,
          displayName,
          score: scoreBreakdown,
          co2,
          productionMethod: input.label?.productionMethod ?? 'unknown',
          faoArea: input.label?.faoArea,
          fishingMethod: input.label?.fishingMethod,
          certifications: input.label?.certifications,
          iucnStatus,
          alternatives,
          hasAlternative: alternatives.length > 0,
          fishBaseData: fishBase
            ? {
                family: fishBase.family,
                habitat: fishBase.habitat,
                maxLength: fishBase.maxLength,
                trophicLevel: fishBase.trophicLevel,
                vulnerability: fishBase.vulnerability,
              }
            : undefined,
          timestamp: Date.now(),
          barcode: input.barcode,
        }

        await setSpeciesCache(result)
        return result
      } catch (err) {
        setError(t('errors.fetch_failed'))
        console.error(err)
        return null
      } finally {
        setLoading(false)
      }
    },
    [t, language]
  )

  return { resolve, loading, error }
}

function buildCO2Comparison(co2: number, t: (key: string, vars?: Record<string, string | number>) => string): string {
  const chicken = 4.5
  const ratio = chicken / co2
  if (ratio >= 2) return t('result.co2_vs_chicken', { ratio: ratio.toFixed(1) })
  const beef = 27
  const beefRatio = beef / co2
  return t('result.co2_vs_beef', { ratio: beefRatio.toFixed(0) })
}

function buildAlternatives(
  species: Species,
  currentScore: number,
  fishingMethod?: string,
  productionMethod?: string,
  language: string = 'es',
  t: (key: string) => string = (k) => k
): AlternativeOption[] {
  const alts: AlternativeOption[] = []
  const allSpecies = speciesDb as Species[]

  const speciesName =
    language === 'en' ? (species.names.en[0] ?? species.names.es[0]) : species.names.es[0]

  // 1. Same species, better production method
  if (productionMethod === 'farmed') {
    const wildScore = currentScore + 15
    if (wildScore - currentScore >= 15) {
      alts.push({
        speciesId: species.id,
        displayName: `${speciesName} (${t('result.better_method_wild')})`,
        score: Math.min(wildScore, species.scoreRange[1]),
        reason: 'same_species_better_method',
        productionMethodSuggestion: 'wild',
      })
    }
  }

  if (fishingMethod === 'bottom_trawl' || fishingMethod === 'midwater_trawl') {
    const betterScore = currentScore + 20
    if (betterScore - currentScore >= 15) {
      alts.push({
        speciesId: species.id,
        displayName: `${speciesName} (${t('result.better_method_gear')})`,
        score: Math.min(betterScore, species.scoreRange[1]),
        reason: 'same_species_better_method',
        productionMethodSuggestion: 'wild',
      })
    }
  }

  // 2. Same category, higher scoring species (delta ≥ 15)
  for (const altId of species.goodAlternatives) {
    const altSpecies = allSpecies.find((s) => s.id === altId)
    if (!altSpecies) continue
    const altScore = altSpecies.defaultScore
    if (altScore - currentScore >= 15) {
      const altName =
        language === 'en' ? (altSpecies.names.en[0] ?? altSpecies.names.es[0]) : altSpecies.names.es[0]
      alts.push({
        speciesId: altId,
        displayName: altName,
        score: altScore,
        reason: 'same_category_higher_score',
      })
    }
  }

  return alts.slice(0, 3)
}
