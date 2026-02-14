import type { Species } from '@/types/species'
import seasonalityData from '@/data/seasonality.json'
import { useI18n } from '@/hooks/useI18n'

interface Props {
  species: Species
  region?: 'mediterranean' | 'atlantic'
}

const MONTH_NAMES_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const MONTH_KEYS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function translateMonth(eng: string, lang: 'es' | 'en'): string {
  if (lang === 'en') return eng
  const idx = MONTH_KEYS.indexOf(eng)
  return idx >= 0 ? MONTH_NAMES_ES[idx] : eng
}

export function ReduceMessage({ species, region = 'mediterranean' }: Props) {
  const { t, language } = useI18n()
  const seasonality = (seasonalityData as Record<string, { mediterranean: { best: string[]; avoid: string[] }; atlantic: { best: string[]; avoid: string[] } }>)[species.id]
  const seasonal = seasonality?.[region]
  const currentMonth = MONTH_KEYS[new Date().getMonth()]
  const isGoodMonth = seasonal?.best.includes(currentMonth)
  const isBadMonth = seasonal?.avoid.includes(currentMonth)

  return (
    <div className="bg-earth/10 border border-earth/30 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-2">
        <span className="text-xl">⚠️</span>
        <div>
          <h3 className="font-semibold text-earth text-sm">{t('result.no_alternative_title')}</h3>
          <p className="text-xs text-gray-600 mt-1">{species.notes_es}</p>
        </div>
      </div>

      {seasonal && seasonal.best.length > 0 && (
        <div className="border-t border-earth/20 pt-3">
          <p className="text-xs font-medium text-gray-700 mb-1">
            🗓️ {t('result.best_season')}
          </p>
          <div className="flex flex-wrap gap-1">
            {seasonal.best.map((m) => (
              <span
                key={m}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  m === currentMonth && isGoodMonth
                    ? 'bg-primary text-white'
                    : 'bg-secondary/30 text-deep'
                }`}
              >
                {translateMonth(m, language as 'es' | 'en')}
              </span>
            ))}
          </div>
        </div>
      )}

      {seasonal && seasonal.avoid.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-700 mb-1">
            🚫 {t('result.avoid_season')}
          </p>
          <div className="flex flex-wrap gap-1">
            {seasonal.avoid.map((m) => (
              <span
                key={m}
                className={`text-xs px-2 py-0.5 rounded-full ${
                  m === currentMonth && isBadMonth
                    ? 'bg-danger/20 text-danger'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {translateMonth(m, language as 'es' | 'en')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white/60 rounded-xl p-3 border border-earth/20">
        <p className="text-xs text-gray-700">
          💡 {t('result.reduce_consumption')}
        </p>
      </div>
    </div>
  )
}
