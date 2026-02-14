import { useState } from 'react'
import { useGameification } from '@/hooks/useGameification'
import { OceanScore } from '@/components/gamification/OceanScore'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { ScanHistory } from '@/components/gamification/ScanHistory'
import { useI18n } from '@/hooks/useI18n'

type Tab = 'badges' | 'history'

export function ProfilePage() {
  const { getProfile } = useGameification()
  const profile = getProfile()
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('badges')

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto pb-8">
      <OceanScore score={profile.oceanScore} />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: t('profile.total_scans'), value: profile.totalScans },
          { label: t('profile.high_score_scans'), value: profile.highScoreScans },
          { label: t('profile.alternatives_chosen'), value: profile.alternativesChosen },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl p-3 text-center shadow-sm">
            <p className="text-2xl font-bold text-primary">{value}</p>
            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Tab switcher */}
      <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
        {(['badges', 'history'] as Tab[]).map((tabId) => (
          <button
            key={tabId}
            onClick={() => setTab(tabId)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === tabId ? 'bg-white text-deep shadow-sm' : 'text-gray-500'
            }`}
          >
            {tabId === 'badges' ? t('gamification.your_badges') : t('gamification.scan_history')}
          </button>
        ))}
      </div>

      {tab === 'badges' && <BadgeGrid earnedBadges={profile.badges} />}
      {tab === 'history' && <ScanHistory history={profile.history} />}
    </div>
  )
}
