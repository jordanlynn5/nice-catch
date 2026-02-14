import { computeScore, getBandColor, getBandLabel } from '../services/scoring/scoreEngine'

// Mock data modules
jest.mock('../data/fishing-methods.json', () => ({
  bottom_trawl: { name: 'Arrastre de fondo', name_en: 'Bottom trawl', modifier: -20 },
  pole_and_line: { name: 'Caña y sedal', name_en: 'Pole and line', modifier: 15 },
  unknown: { name: 'Desconocido', name_en: 'Unknown', modifier: 0 },
}))

jest.mock('../data/fao-areas.json', () => ({
  '27.8': { name: 'Golfo de Vizcaya', modifier: 5 },
  '37.1': { name: 'Mediterráneo occidental', modifier: -15 },
}))

jest.mock('../data/species-db.json', () => [
  {
    id: 'merluza',
    names: { es: ['Merluza'], en: ['Hake'], fr: ['Merlu'], scientific: 'Merluccius merluccius', eu_commercial: 'Merluza' },
    iucnStatus: 'LC',
    defaultScore: 55,
    scoreRange: [20, 75],
    goodAlternatives: ['abadejo'],
    category: 'white_fish',
    notes_es: 'Test note',
  },
  {
    id: 'atun_rojo',
    names: { es: ['Atún rojo'], en: ['Bluefin tuna'], fr: ['Thon rouge'], scientific: 'Thunnus thynnus', eu_commercial: 'Atún rojo' },
    iucnStatus: 'EN',
    defaultScore: 15,
    scoreRange: [0, 30],
    goodAlternatives: ['caballa'],
    category: 'large_pelagic',
    notes_es: 'En peligro',
  },
])

describe('scoreEngine', () => {
  describe('computeScore', () => {
    test('LC + pole_and_line + Bay of Biscay = high score', () => {
      const result = computeScore({
        speciesId: 'merluza',
        iucnStatus: 'LC',
        fishingMethod: 'pole_and_line',
        faoArea: '27.8',
      })
      // iucnBase=50, method=+15, area=+5 = 70, clamped to [20,75] = 70
      expect(result.finalScore).toBe(70)
      expect(result.band).toBe('good')
      expect(result.confidence).toBe('high')
    })

    test('LC + bottom_trawl + Mediterranean = low score', () => {
      const result = computeScore({
        speciesId: 'merluza',
        iucnStatus: 'LC',
        fishingMethod: 'bottom_trawl',
        faoArea: '37.1',
      })
      // 50 - 20 - 15 = 15, clamped to [20,75] = 20
      expect(result.finalScore).toBe(20)
      expect(result.band).toBe('avoid')
    })

    test('EN species is clamped to scoreRange max', () => {
      const result = computeScore({
        speciesId: 'atun_rojo',
        iucnStatus: 'EN',
        fishingMethod: 'pole_and_line',
        faoArea: '27.8',
      })
      // iucnBase=10, method=+15, area=+5 = 30, clamped to [0,30] = 30
      expect(result.finalScore).toBe(30)
    })

    test('unknown inputs use defaults', () => {
      const result = computeScore({ speciesId: 'merluza' })
      // iucnBase=30 (DD/NE default), method=0, area=0 = 30, clamped [20,75] = 30
      expect(result.finalScore).toBe(30)
      expect(result.confidence).toBe('low')
    })

    test('MSC certification adds +10', () => {
      const result = computeScore({
        speciesId: 'merluza',
        iucnStatus: 'LC',
        certifications: ['MSC'],
      })
      // 50 + 0 + 0 + 10 = 60
      expect(result.finalScore).toBe(60)
    })
  })

  describe('getBandColor', () => {
    test('best = deep teal', () => expect(getBandColor('best')).toBe('#106c72'))
    test('avoid = red', () => expect(getBandColor('avoid')).toBe('#ef4444'))
  })

  describe('getBandLabel', () => {
    test('Spanish labels', () => {
      expect(getBandLabel('best', 'es')).toBe('Mejor opción')
      expect(getBandLabel('avoid', 'es')).toBe('Evitar')
    })
    test('English labels', () => {
      expect(getBandLabel('good', 'en')).toBe('Good choice')
    })
  })
})
