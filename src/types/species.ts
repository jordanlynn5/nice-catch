export interface SpeciesNames {
  es: string[]
  en: string[]
  fr: string[]
  scientific: string
  eu_commercial: string
}

export type IUCNStatus = 'LC' | 'NT' | 'VU' | 'EN' | 'CR' | 'EX' | 'DD' | 'NE'

export interface Species {
  id: string
  names: SpeciesNames
  iucnStatus: IUCNStatus
  defaultScore: number
  scoreRange: [number, number]
  goodAlternatives: string[]
  category: SpeciesCategory
  notes_es: string
}

export type SpeciesCategory =
  | 'white_fish'
  | 'fatty_fish'
  | 'small_pelagic'
  | 'large_pelagic'
  | 'shellfish'
  | 'bivalve'
  | 'cephalopod'

export interface FishBaseData {
  scientificName: string
  commonNames: string[]
  family: string
  habitat: string
  maxLength?: number
  maxWeight?: number
  trophicLevel?: number
  vulnerability?: number
}

export interface SeasonalityData {
  mediterranean: { best: string[]; avoid: string[] }
  atlantic: { best: string[]; avoid: string[] }
}

export type ProductionMethod = 'wild' | 'farmed' | 'unknown'

export interface ParsedLabel {
  speciesRaw?: string
  faoArea?: string
  fishingMethod?: string
  origin?: string
  productionMethod?: ProductionMethod
  certifications?: string[]
}
