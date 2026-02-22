import type { AlternativeOption } from '@/types/scoring'
import { useI18n } from '@/hooks/useI18n'
import { getBandColor } from '@/services/scoring/scoreEngine'

interface Props {
  alternatives: AlternativeOption[]
  onChoose?: (alt: AlternativeOption) => void
}

export function AlternativesList({ alternatives, onChoose }: Props) {
  const { t } = useI18n()

  if (alternatives.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <h3 className="font-semibold text-gray-800 text-sm">{t('result.alternatives')}</h3>
      <div className="space-y-2">
        {alternatives.map((alt, i) => {
          const band =
            alt.score >= 76 ? 'best' : alt.score >= 51 ? 'good' : alt.score >= 26 ? 'think' : 'avoid'
          const color = getBandColor(band as Parameters<typeof getBandColor>[0])
          const label =
            alt.reason === 'same_species_better_method'
              ? t('result.same_species_better')
              : t('result.better_species')

          return (
            <button
              key={i}
              onClick={() => onChoose?.(alt)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: color }}
              >
                {alt.score}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{alt.displayName}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
              <span className="text-primary text-xs font-medium shrink-0">{t('result.choose')}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
