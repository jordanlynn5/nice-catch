import type { IUCNStatus, ProductionMethod } from './species'

export type ScoreBand = 'best' | 'good' | 'think' | 'avoid'
export type ConfidenceLevel = 'high' | 'medium' | 'low'

export interface ScoreBreakdown {
  iucnBase: number
  methodModifier: number
  areaModifier: number
  originModifier: number
  rawScore: number
  finalScore: number
  band: ScoreBand
  confidence: ConfidenceLevel
}

export interface SustainabilityResult {
  speciesId: string
  scientificName: string
  displayName: string
  score: ScoreBreakdown
  co2: CO2Data
  productionMethod: ProductionMethod
  faoArea?: string
  fishingMethod?: string
  certifications?: string[]
  iucnStatus: IUCNStatus
  alternatives: AlternativeOption[]
  hasAlternative: boolean
  seasonality?: SeasonalityInfo
  fishBaseData?: Partial<FishBaseEnrichment>
  timestamp: number
  barcode?: string
}

export interface CO2Data {
  value: number
  unit: 'kg_co2_per_kg'
  source: 'wolfram' | 'fallback'
  comparison?: string
}

export interface AlternativeOption {
  speciesId: string
  displayName: string
  score: number
  reason: AlternativeReason
  productionMethodSuggestion?: ProductionMethod
}

export type AlternativeReason =
  | 'same_species_better_method'
  | 'same_category_higher_score'

export interface SeasonalityInfo {
  currentMonthStatus: 'best' | 'good' | 'avoid' | 'unknown'
  bestMonths: string[]
  avoidMonths: string[]
  region: 'mediterranean' | 'atlantic'
}

export interface FishBaseEnrichment {
  family: string
  habitat: string
  maxLength: number
  trophicLevel: number
  vulnerability: number
}

export interface ScoringInput {
  speciesId: string
  iucnStatus?: IUCNStatus
  fishingMethod?: string
  faoArea?: string
  certifications?: string[]
  productionMethod?: ProductionMethod
}
