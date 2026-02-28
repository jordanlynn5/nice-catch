import { useI18n } from '@/hooks/useI18n'

export function AboutPage() {
  const { t } = useI18n()

  const scoreBands = [
    { range: '76–100', label: t('result.best_choice'), color: '#106c72' },
    { range: '51–75', label: t('result.good_choice'), color: '#80b8a2' },
    { range: '26–50', label: t('result.think_twice'), color: '#b97f5f' },
    { range: '0–25', label: t('result.avoid'), color: '#ef4444' },
  ]

  const sources = [
    {
      icon: '•',
      label: 'IUCN Red List',
      desc: t('about.iucn_source'),
      citation: t('about.iucn_citation'),
      url: 'https://www.iucnredlist.org',
    },
    { icon: '•', label: 'FishBase', desc: t('about.fishbase_source'), citation: null, url: null },
    { icon: '•', label: 'Wolfram Alpha', desc: t('about.wolfram_source'), citation: null, url: null },
    { icon: '•', label: 'FAO ASFIS', desc: t('about.fao_source'), citation: null, url: null },
    { icon: '•', label: 'Open Food Facts', desc: t('about.off_source'), citation: null, url: null },
  ]

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Underwater gradient background */}
      <div className="absolute inset-0" style={{
        background: 'var(--ocean-gradient)'
      }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
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
      <div className="relative z-10 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-5 pb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{t('about.title')}</h1>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--glass-secondary-bg)',
            backdropFilter: 'var(--glass-secondary-blur)',
            border: '1px solid var(--glass-secondary-border)',
            boxShadow: 'var(--glass-secondary-shadow)'
          }}
        >
          <h2 className="font-semibold text-white">{t('about.how_it_works')}</h2>
          <p className="text-sm text-white/80 leading-relaxed">
            {t('about.scoring_explanation')}
          </p>

          <div className="space-y-2">
            {scoreBands.map(({ range, label, color }) => (
              <div key={range} className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-white">
                  {range}
                </span>
                <span className="text-sm text-white/80">— {label}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{
            background: 'var(--glass-secondary-bg)',
            backdropFilter: 'var(--glass-secondary-blur)',
            border: '1px solid var(--glass-secondary-border)',
            boxShadow: 'var(--glass-secondary-shadow)'
          }}
        >
          <h2 className="font-semibold text-white">{t('about.data_sources')}</h2>
          <div className="space-y-3">
            {sources.map(({ icon, label, desc, citation, url }) => (
              <div key={label} className="flex gap-3">
                <span className="text-xl shrink-0 text-white/50">{icon}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-white/80">{desc}</p>
                  {citation && url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] sm:text-xs text-white/80 break-all leading-tight mt-0.5 block hover:underline"
                    >
                      {citation}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="rounded-2xl p-4 space-y-1"
          style={{
            background: 'var(--glass-primary-bg)',
            backdropFilter: 'var(--glass-primary-blur)',
            border: '1px solid var(--glass-primary-border)'
          }}
        >
          <p className="text-sm font-semibold text-white">Nice Catch</p>
          <p className="text-xs text-white/80">
            Desarrollado para un hackathon medioambiental. Datos actualizados periódicamente.
            La puntuación es orientativa — siempre es mejor preguntar al pescadero.
          </p>
        </div>
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
