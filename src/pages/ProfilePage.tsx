import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameification } from '@/hooks/useGameification'
import { OceanScore } from '@/components/gamification/OceanScore'
import { BadgeGrid } from '@/components/gamification/BadgeGrid'
import { ScanHistory } from '@/components/gamification/ScanHistory'
import { useI18n } from '@/hooks/useI18n'

type Tab = 'badges' | 'history'

export function ProfilePage() {
  const navigate = useNavigate()
  const { getProfile } = useGameification()
  const profile = getProfile()
  const { t } = useI18n()
  const [tab, setTab] = useState<Tab>('badges')

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Underwater gradient background */}
      <div className="absolute inset-0" style={{
        background: 'var(--ocean-gradient)'
      }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              animation: `float-up ${10 + Math.random() * 15}s linear infinite`,
              animationDelay: `${Math.random() * 10}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col p-3 sm:p-4 md:p-6 space-y-4 overflow-y-auto pb-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/')}
          className="self-start text-white/90 hover:text-white transition-colors text-sm font-medium"
        >
          ← {t('common.back')}
        </button>

        <OceanScore score={profile.oceanScore} />

        {/* Stats row - glassmorphism */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: t('profile.total_scans'), value: profile.totalScans },
            { label: t('profile.high_score_scans'), value: profile.highScoreScans },
            { label: t('profile.alternatives_chosen'), value: profile.alternativesChosen },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="rounded-xl p-3 text-center"
              style={{
                background: 'var(--glass-secondary-bg)',
                backdropFilter: 'var(--glass-secondary-blur)',
                border: '1px solid var(--glass-secondary-border)',
                boxShadow: 'var(--glass-secondary-shadow)'
              }}
            >
              <p className="text-xl sm:text-2xl font-bold text-white">{value}</p>
              <p className="text-[11px] sm:text-xs text-white/80 leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher - glassmorphism */}
        <div
          className="flex rounded-xl p-1 gap-1"
          style={{
            background: 'var(--glass-tertiary-bg)',
            backdropFilter: 'var(--glass-tertiary-blur)',
            border: '1px solid var(--glass-tertiary-border)'
          }}
        >
          {(['badges', 'history'] as Tab[]).map((tabId) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === tabId ? 'shadow-sm' : ''
              }`}
              style={{
                background: tab === tabId ? 'var(--glass-primary-hover-bg)' : 'transparent',
                color: 'white',
                border: tab === tabId ? '1px solid var(--glass-primary-border)' : '1px solid transparent'
              }}
            >
              {tabId === 'badges' ? t('gamification.your_badges') : t('gamification.scan_history')}
            </button>
          ))}
        </div>

        {tab === 'badges' && <BadgeGrid earnedBadges={profile.badges} />}
        {tab === 'history' && <ScanHistory history={profile.history} />}
      </div>

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 30 - 15}px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
