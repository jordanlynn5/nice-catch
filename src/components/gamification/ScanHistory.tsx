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
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <span className="text-white/50 text-xl font-bold">0</span>
        </div>
        <p className="text-sm text-white/80">{t('gamification.no_history')}</p>
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
          <div
            key={i}
            className="rounded-xl p-3 flex items-center gap-3"
            style={{
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              {entry.score}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{entry.displayName}</p>
              <p className="text-xs text-white/50">{date}</p>
            </div>
            {entry.choseAlternative && (
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0 text-white"
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)'
                }}
              >
                {t('gamification.alternative_chosen')}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
