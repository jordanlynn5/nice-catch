import type { EarnedBadge } from '@/types/gamification'
import { BADGES } from '@/types/gamification'
import { useI18n } from '@/hooks/useI18n'
import { useGameification } from '@/hooks/useGameification'
import { useAppStore } from '@/store/appStore'

interface Props {
  earnedBadges: EarnedBadge[]
}

export function BadgeGrid({ earnedBadges }: Props) {
  const { t, language } = useI18n()
  const { recordShare } = useGameification()
  const addToast = useAppStore((s) => s.addToast)
  const earnedIds = new Set(earnedBadges.map((b) => b.id))

  const handleShare = async (badgeId: string) => {
    const badge = BADGES.find((b) => b.id === badgeId)
    if (!badge) return

    const text =
      language === 'es'
        ? `¡Acabo de ganar el badge "${badge.name_es}" en Nice Catch! #NiceCatch #Sostenibilidad`
        : `Just earned the "${badge.name_en}" badge in Nice Catch! #NiceCatch #Sustainability`

    if (navigator.share) {
      try {
        await navigator.share({ text, url: window.location.origin })
        recordShare()
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      addToast(t('common.copied'), 'success')
      recordShare()
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-white text-sm">{t('gamification.your_badges')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {BADGES.map((badge) => {
          const earned = earnedIds.has(badge.id)
          return (
            <div
              key={badge.id}
              className="rounded-2xl p-3 flex flex-col items-center gap-1.5 text-center transition-all"
              style={
                earned
                  ? {
                      background: 'var(--glass-secondary-bg)',
                      backdropFilter: 'var(--glass-secondary-blur)',
                      border: '1px solid var(--glass-secondary-border)',
                      boxShadow: 'var(--glass-secondary-shadow)'
                    }
                  : {
                      background: 'var(--glass-tertiary-bg)',
                      backdropFilter: 'var(--glass-tertiary-blur)',
                      border: '1px solid var(--glass-tertiary-border)',
                      opacity: 0.5
                    }
              }
            >
              <span className="text-2xl">{badge.icon}</span>
              <p className={`text-xs font-semibold ${earned ? 'text-white' : 'text-white/50'}`}>
                {language === 'es' ? badge.name_es : badge.name_en}
              </p>
              {earned ? (
                <button
                  onClick={() => handleShare(badge.id)}
                  className="text-[10px] text-white/90 font-medium hover:text-white transition-colors"
                >
                  {t('gamification.share_badge')} ↗
                </button>
              ) : (
                <p className="text-[10px] text-white/50">{t('gamification.locked')}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
