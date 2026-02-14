import { resolveSpeciesId, searchSpecies } from '../services/parsers/synonymResolver'

jest.mock('../data/species-db.json', () => [
  {
    id: 'merluza',
    names: {
      es: ['Merluza', 'Pescadilla'],
      en: ['European hake', 'Hake'],
      fr: ['Merlu'],
      scientific: 'Merluccius merluccius',
      eu_commercial: 'Merluza',
    },
    iucnStatus: 'LC', defaultScore: 55, scoreRange: [20, 75],
    goodAlternatives: [], category: 'white_fish', notes_es: '',
  },
  {
    id: 'dorada',
    names: {
      es: ['Dorada', 'Orada'],
      en: ['Gilt-head bream'],
      fr: ['Daurade'],
      scientific: 'Sparus aurata',
      eu_commercial: 'Dorada',
    },
    iucnStatus: 'LC', defaultScore: 60, scoreRange: [40, 80],
    goodAlternatives: [], category: 'white_fish', notes_es: '',
  },
])

describe('synonymResolver', () => {
  describe('resolveSpeciesId', () => {
    test('exact Spanish match', () => {
      expect(resolveSpeciesId('Merluza')).toBe('merluza')
    })

    test('case insensitive', () => {
      expect(resolveSpeciesId('merluza')).toBe('merluza')
      expect(resolveSpeciesId('MERLUZA')).toBe('merluza')
    })

    test('synonym match (orada → dorada)', () => {
      expect(resolveSpeciesId('orada')).toBe('dorada')
    })

    test('scientific name match', () => {
      expect(resolveSpeciesId('Sparus aurata')).toBe('dorada')
    })

    test('English name match', () => {
      expect(resolveSpeciesId('hake')).toBe('merluza')
    })

    test('null for unknown species', () => {
      expect(resolveSpeciesId('xyznonsense123')).toBeNull()
    })

    test('empty string returns null', () => {
      expect(resolveSpeciesId('')).toBeNull()
    })
  })

  describe('searchSpecies', () => {
    test('returns matching species', () => {
      const results = searchSpecies('dorada')
      expect(results.length).toBeGreaterThan(0)
      expect(results[0].id).toBe('dorada')
    })

    test('partial match', () => {
      const results = searchSpecies('merlu')
      expect(results.some((s) => s.id === 'merluza')).toBe(true)
    })

    test('empty query returns empty array', () => {
      expect(searchSpecies('')).toEqual([])
    })
  })
})
