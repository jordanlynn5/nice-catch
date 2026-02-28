import { buildBuyingGuidance } from '@/services/guidance/buildGuidance'
import type { Species } from '@/types/species'
import type { ScoreBreakdown } from '@/types/scoring'

describe('buildBuyingGuidance', () => {
  const mockSpecies: Species = {
    id: 'merluza',
    names: {
      es: ['Merluza'],
      en: ['European hake'],
      fr: ['Merlu'],
      scientific: 'Merluccius merluccius',
      eu_commercial: 'Merluza'
    },
    iucnStatus: 'LC',
    defaultScore: 55,
    scoreRange: [20, 75],
    goodAlternatives: ['bacalao_atlantico'],
    category: 'white_fish',
    notes_es: 'Test species'
  }

  test('generates guidance for low-scoring Mediterranean fish with bottom trawl', () => {
    const scoreBreakdown: ScoreBreakdown = {
      iucnBase: 45,
      methodModifier: -20, // bottom trawl
      areaModifier: -15, // Mediterranean
      originModifier: 0,
      rawScore: 10,
      finalScore: 25,
      band: 'avoid',
      confidence: 'high'
    }

    const guidance = buildBuyingGuidance(mockSpecies, scoreBreakdown, {
      fishingMethod: 'bottom_trawl',
      faoArea: '37.1',
      productionMethod: 'wild'
    })

    // Should generate guidance items
    expect(guidance.items.length).toBeGreaterThan(0)
    expect(guidance.currentScore).toBe(25)

    // Should have fishing method guidance (highest impact)
    const methodGuidance = guidance.items.find(item => item.type === 'fishing_method')
    expect(methodGuidance).toBeDefined()
    expect(methodGuidance?.potentialImpact).toBeGreaterThan(15)

    // Should have FAO area guidance
    const areaGuidance = guidance.items.find(item => item.type === 'fao_area')
    expect(areaGuidance).toBeDefined()
  })

  test('generates certification guidance for non-certified fish', () => {
    const scoreBreakdown: ScoreBreakdown = {
      iucnBase: 45,
      methodModifier: 10,
      areaModifier: 5,
      originModifier: 0,
      rawScore: 60,
      finalScore: 60,
      band: 'good',
      confidence: 'high'
    }

    const guidance = buildBuyingGuidance(mockSpecies, scoreBreakdown, {
      fishingMethod: 'pole_and_line',
      faoArea: '27.8',
      productionMethod: 'wild',
      certifications: []
    })

    const certGuidance = guidance.items.find(item => item.type === 'certification')
    expect(certGuidance).toBeDefined()
  })

  test('generates no guidance for high-scoring certified fish', () => {
    const scoreBreakdown: ScoreBreakdown = {
      iucnBase: 45,
      methodModifier: 15,
      areaModifier: 10,
      originModifier: 5,
      rawScore: 75,
      finalScore: 75,
      band: 'best',
      confidence: 'high'
    }

    const guidance = buildBuyingGuidance(mockSpecies, scoreBreakdown, {
      fishingMethod: 'pole_and_line',
      faoArea: '27.8',
      productionMethod: 'wild',
      certifications: ['MSC']
    })

    // High-scoring fish with good practices should have minimal or no guidance
    expect(guidance.items.length).toBeLessThanOrEqual(1)
  })

  test('filters out low-impact guidance (< 8 points)', () => {
    const scoreBreakdown: ScoreBreakdown = {
      iucnBase: 45,
      methodModifier: 12,
      areaModifier: 8,
      originModifier: 0,
      rawScore: 65,
      finalScore: 65,
      band: 'good',
      confidence: 'high'
    }

    const guidance = buildBuyingGuidance(mockSpecies, scoreBreakdown, {
      fishingMethod: 'trap_pot',
      faoArea: '27.4',
      productionMethod: 'wild'
    })

    // All items should have at least 8 points impact
    guidance.items.forEach(item => {
      expect(item.potentialImpact).toBeGreaterThanOrEqual(8)
    })
  })

  test('limits guidance to maximum 3 items', () => {
    const scoreBreakdown: ScoreBreakdown = {
      iucnBase: 30,
      methodModifier: -20,
      areaModifier: -15,
      originModifier: 0,
      rawScore: -5,
      finalScore: 20,
      band: 'avoid',
      confidence: 'high'
    }

    const guidance = buildBuyingGuidance(mockSpecies, scoreBreakdown, {
      fishingMethod: 'bottom_trawl',
      faoArea: '37.1',
      productionMethod: 'wild',
      certifications: []
    })

    expect(guidance.items.length).toBeLessThanOrEqual(3)
  })
})
