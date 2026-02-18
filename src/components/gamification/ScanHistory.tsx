import type { ScanHistoryEntry } from '@/types/gamification'
import { useI18n } from '@/hooks/useI18n'
import { getBandColor } from '@/services/scoring/scoreEngine'

interface Props {
  history: ScanHistoryEntry[]
}

export function ScanHistory({ history }: Props) {
  const { t, language } = useI18n()

  if (history.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-3xl mb-2">🐟</p>
        <p className="text-sm text-gray-500">{t('gamification.no_history')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {history.map((entry, i) => {
        const band =
          entry.score >= 76 ? 'best' : entry.score >= 51 ? 'good' : entry.score >= 26 ? 'think' : 'avoid'
        const color = getBandColor(band as Parameters<typeof getBandColor>[0])
        const locale = language === 'en' ? 'en-GB' : 'es-ES'
        const date = new Date(entry.timestamp).toLocaleDateString(locale, {
          day: 'numeric',
          month: 'short',
        })

        return (
          <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              {entry.score}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{entry.displayName}</p>
              <p className="text-xs text-gray-400">{date}</p>
            </div>
            {entry.choseAlternative && (
              <span className="text-xs bg-secondary/20 text-deep px-2 py-0.5 rounded-full shrink-0">
                {t('gamification.alternative_chosen')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
