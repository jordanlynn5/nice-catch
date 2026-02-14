import type { ScoringInput, ScoreBreakdown, ScoreBand, ConfidenceLevel } from '@/types/scoring'
import type { IUCNStatus, ProductionMethod } from '@/types/species'
import { getIUCNBase } from './iucnScore'
import { getMethodModifier } from './methodScore'
import { getAreaModifier } from './areaScore'
import { clampToSpeciesRange } from './staticOverride'

const CERTIFICATION_MODIFIERS: Record<string, number> = {
  MSC: 10,
  ASC: 8,
  GlobalGAP: 5,
  'Friend of Sea': 4,
  'EU origin': 2,
  IUU: -10,
}

function getOriginModifier(
  certifications: string[] = [],
  productionMethod?: ProductionMethod
): number {
  let mod = 0
  for (const cert of certifications) {
    const key = Object.keys(CERTIFICATION_MODIFIERS).find((k) =>
      cert.toLowerCase().includes(k.toLowerCase())
    )
    if (key) mod += CERTIFICATION_MODIFIERS[key]
  }
  if (productionMethod === 'farmed' && certifications.length === 0) mod -= 5
  return Math.max(-10, Math.min(10, mod))
}

function getScoreBand(score: number): ScoreBand {
  if (score >= 76) return 'best'
  if (score >= 51) return 'good'
  if (score >= 26) return 'think'
  return 'avoid'
}

function getConfidence(input: ScoringInput): ConfidenceLevel {
  const hasIUCN = !!input.iucnStatus
  const hasMethod = !!input.fishingMethod
  const hasArea = !!input.faoArea

  const knownFactors = [hasIUCN, hasMethod, hasArea].filter(Boolean).length
  if (knownFactors === 3) return 'high'
  if (knownFactors >= 1) return 'medium'
  return 'low'
}

export function computeScore(input: ScoringInput): ScoreBreakdown {
  const iucnBase = getIUCNBase(input.iucnStatus as IUCNStatus | undefined)
  const methodModifier = getMethodModifier(input.fishingMethod)
  const areaModifier = getAreaModifier(input.faoArea)
  const originModifier = getOriginModifier(input.certifications, input.productionMethod)

  const rawScore = iucnBase + methodModifier + areaModifier + originModifier
  const finalScore = clampToSpeciesRange(input.speciesId, rawScore)
  const band = getScoreBand(finalScore)
  const confidence = getConfidence(input)

  return {
    iucnBase,
    methodModifier,
    areaModifier,
    originModifier,
    rawScore,
    finalScore,
    band,
    confidence,
  }
}

export function getBandColor(band: ScoreBand): string {
  const colors: Record<ScoreBand, string> = {
    best: '#106c72',
    good: '#80b8a2',
    think: '#b97f5f',
    avoid: '#ef4444',
  }
  return colors[band]
}

export function getBandLabel(band: ScoreBand, lang: 'es' | 'en' = 'es'): string {
  const labels: Record<ScoreBand, Record<string, string>> = {
    best: { es: 'Mejor opción', en: 'Best choice' },
    good: { es: 'Buena opción', en: 'Good choice' },
    think: { es: 'Piénsatelo', en: 'Think twice' },
    avoid: { es: 'Evitar', en: 'Avoid' },
  }
  return labels[band][lang]
}
