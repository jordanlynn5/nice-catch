import { useState, useCallback } from 'react'
import { searchSpecies } from '@/services/parsers/synonymResolver'
import { useI18n } from '@/hooks/useI18n'
import type { Species } from '@/types/species'

interface Props {
  onSelect: (species: Species) => void
}

export function ManualSearch({ onSelect }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Species[]>([])
  const [searching, setSearching] = useState(false)
  const { t } = useI18n()

  const handleChange = useCallback((value: string) => {
    setQuery(value)
    if (value.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    // Debounce via setTimeout
    const timer = setTimeout(() => {
      const found = searchSpecies(value)
      setResults(found)
      setSearching(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto space-y-3">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
        <input
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={t('scanner.search_placeholder')}
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 bg-white text-sm"
          autoFocus
          autoCapitalize="none"
          autoCorrect="off"
        />
        {searching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {t('scanner.searching')}
          </span>
        )}
      </div>

      {results.length > 0 && (
        <ul className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
          {results.map((species) => (
            <li key={species.id}>
              <button
                onClick={() => onSelect(species)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 border-gray-50"
              >
                <span className="text-lg">{getCategoryEmoji(species.category)}</span>
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 text-sm">{species.names.es[0]}</p>
                  <p className="text-xs text-gray-400 italic truncate">{species.names.scientific}</p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {query.length >= 2 && !searching && results.length === 0 && (
        <p className="text-center text-sm text-gray-500 py-4">
          {t('scanner.no_results')}
        </p>
      )}
    </div>
  )
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    white_fish: '🐟',
    fatty_fish: '🐠',
    small_pelagic: '🐟',
    large_pelagic: '🐡',
    shellfish: '🦐',
    bivalve: '🦪',
    cephalopod: '🦑',
  }
  return map[category] ?? '🐟'
}
