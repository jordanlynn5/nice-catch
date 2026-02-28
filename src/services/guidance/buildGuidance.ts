import type { Species } from '@/types/species'
import type { ScoreBreakdown, GuidanceItem, BuyingGuidance } from '@/types/scoring'
import fishingMethods from '@/data/fishing-methods.json'
import faoAreas from '@/data/fao-areas.json'
import seasonalityData from '@/data/seasonality.json'

interface CurrentState {
  fishingMethod?: string
  faoArea?: string
  certifications?: string[]
  productionMethod?: string
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function buildBuyingGuidance(
  species: Species,
  scoreBreakdown: ScoreBreakdown,
  currentState: CurrentState
): BuyingGuidance {
  const items: GuidanceItem[] = []

  // Generate all possible guidance items
  const methodGuidance = buildMethodGuidance(scoreBreakdown, currentState)
  const areaGuidance = buildAreaGuidance(scoreBreakdown, currentState)
  const certGuidance = buildCertificationGuidance(scoreBreakdown, currentState)
  const productionGuidance = buildProductionMethodGuidance(species, scoreBreakdown, currentState)
  const seasonalGuidance = buildSeasonalityGuidance(species)

  // Collect all items
  if (methodGuidance) items.push(methodGuidance)
  if (areaGuidance) items.push(areaGuidance)
  if (certGuidance) items.push(certGuidance)
  if (productionGuidance) items.push(productionGuidance)
  if (seasonalGuidance) items.push(seasonalGuidance)

  // Filter by minimum impact threshold (8 points)
  const significantItems = items.filter(item => item.potentialImpact >= 8)

  // Sort by priority (highest impact first)
  significantItems.sort((a, b) => b.priority - a.priority)

  // Take top 3
  const topItems = significantItems.slice(0, 3)

  const targetScore = scoreBreakdown.finalScore + (topItems[0]?.potentialImpact || 0)

  return {
    items: topItems,
    currentScore: scoreBreakdown.finalScore,
    targetScore: Math.min(targetScore, species.scoreRange[1])
  }
}

function buildMethodGuidance(
  scoreBreakdown: ScoreBreakdown,
  currentState: CurrentState
): GuidanceItem | null {
  const currentMethod = currentState.fishingMethod || 'unknown'
  const currentModifier = scoreBreakdown.methodModifier

  // Find best possible method improvement
  const methodData = fishingMethods as Record<string, { modifier: number; name: string; name_en: string }>

  // Best methods
  const bestMethods = ['handline', 'pole_and_line', 'hook_and_line', 'trap_pot']
  const bestModifier = Math.max(...bestMethods.map(m => methodData[m]?.modifier || 0))

  const potentialImpact = bestModifier - currentModifier

  if (potentialImpact < 8) return null

  // Determine what to avoid based on current method
  const avoid: string[] = []
  if (['bottom_trawl', 'beam_trawl', 'dredge'].includes(currentMethod)) {
    avoid.push('guidance.avoid_bottom_trawl')
  } else if (currentMethod === 'midwater_trawl') {
    avoid.push('guidance.avoid_midwater_trawl')
  }

  return {
    type: 'fishing_method',
    priority: potentialImpact,
    icon: '🎣',
    lookFor: [
      'guidance.lookfor_pole_line',
      'guidance.lookfor_handline',
      'guidance.lookfor_hook_line',
      'guidance.lookfor_trap'
    ],
    avoid: avoid.length > 0 ? avoid : undefined,
    potentialImpact
  }
}

function buildAreaGuidance(
  scoreBreakdown: ScoreBreakdown,
  currentState: CurrentState
): GuidanceItem | null {
  const currentArea = currentState.faoArea
  const currentModifier = scoreBreakdown.areaModifier

  const areaData = faoAreas as Record<string, { modifier: number; name: string }>

  // Check if this is an origin code (farmed fish) vs FAO area (wild fish)
  const isOriginCode = ['ES', 'GR', 'NO', 'TR', 'EU', 'NON_EU'].includes(currentArea || '')

  if (isOriginCode) {
    // Farmed fish origin guidance
    const bestOrigins = ['ES', 'GR', 'EU']
    const bestModifier = Math.max(...bestOrigins.map(o => areaData[o]?.modifier || 0))
    const potentialImpact = bestModifier - currentModifier

    if (potentialImpact < 8) return null

    const avoid: string[] = []
    if (currentArea === 'NON_EU') {
      avoid.push('guidance.avoid_non_eu_farmed')
    }

    return {
      type: 'fao_area',
      priority: potentialImpact,
      icon: '🇪🇺',
      lookFor: [
        'guidance.lookfor_spain_farmed',
        'guidance.lookfor_greece_farmed',
        'guidance.lookfor_eu_farmed'
      ],
      avoid: avoid.length > 0 ? avoid : undefined,
      potentialImpact
    }
  } else {
    // Wild fish FAO area guidance
    const bestAreas = ['27.4', '27.6', '27.8', '48', '58']
    const bestModifier = Math.max(...bestAreas.map(a => areaData[a]?.modifier || 0))
    const potentialImpact = bestModifier - currentModifier

    if (potentialImpact < 8) return null

    const avoid: string[] = []
    if (currentArea?.startsWith('37')) {
      avoid.push('guidance.avoid_mediterranean')
    }

    return {
      type: 'fao_area',
      priority: potentialImpact,
      icon: '🌊',
      lookFor: [
        'guidance.lookfor_fao_27',
        'guidance.lookfor_atlantic_ne',
        'guidance.lookfor_cantabrico'
      ],
      avoid: avoid.length > 0 ? avoid : undefined,
      potentialImpact
    }
  }
}

function buildCertificationGuidance(
  scoreBreakdown: ScoreBreakdown,
  currentState: CurrentState
): GuidanceItem | null {
  const hasCerts = currentState.certifications && currentState.certifications.length > 0

  if (hasCerts) return null // Already certified

  // Certification can add +10 to +15 points
  const potentialImpact = 10

  return {
    type: 'certification',
    priority: potentialImpact,
    icon: '✅',
    lookFor: [
      'guidance.lookfor_msc',
      'guidance.lookfor_asc',
      'guidance.lookfor_organic'
    ],
    potentialImpact
  }
}

function buildProductionMethodGuidance(
  species: Species,
  scoreBreakdown: ScoreBreakdown,
  currentState: CurrentState
): GuidanceItem | null {
  const currentMethod = currentState.productionMethod

  // Only suggest wild if currently farmed and wild is better
  if (currentMethod !== 'farmed') return null

  const potentialImpact = 15 // Typical wild vs farmed delta

  // Check if this species benefits from wild production
  const wildBenefitsSpecies = ['dorada', 'lubina', 'salmon']
  if (!wildBenefitsSpecies.includes(species.id)) return null

  return {
    type: 'production_method',
    priority: potentialImpact,
    icon: '🐟',
    lookFor: [
      'guidance.lookfor_wild',
      'guidance.lookfor_line_caught'
    ],
    avoid: ['guidance.avoid_farmed_uncertified'],
    potentialImpact
  }
}

function buildSeasonalityGuidance(species: Species): GuidanceItem | null {
  const seasonality = seasonalityData as Record<string, { mediterranean: { best: string[]; avoid: string[] }; atlantic: { best: string[]; avoid: string[] } }>

  const data = seasonality[species.id]
  if (!data) return null

  const region = 'mediterranean' // Default to Mediterranean for Spanish users
  const regionalData = data[region]

  if (!regionalData || regionalData.best.length === 0) return null

  const currentMonth = MONTHS[new Date().getMonth()]
  const isAvoidMonth = regionalData.avoid.includes(currentMonth)

  if (!isAvoidMonth) return null // Not in avoid season, no need for guidance

  const potentialImpact = 8 // Seasonal timing impact

  return {
    type: 'seasonality',
    priority: potentialImpact,
    icon: '📅',
    lookFor: regionalData.best.map(month => `guidance.month_${month.toLowerCase()}`),
    avoid: regionalData.avoid.map(month => `guidance.avoid_month_${month.toLowerCase()}`),
    potentialImpact
  }
}
