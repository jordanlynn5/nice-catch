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
      icon: '🔴',
      label: 'IUCN Red List',
      desc: t('about.iucn_source'),
      citation: t('about.iucn_citation'),
      url: 'https://www.iucnredlist.org',
    },
    { icon: '🐟', label: 'FishBase', desc: t('about.fishbase_source'), citation: null, url: null },
    { icon: '🌀', label: 'Wolfram Alpha', desc: t('about.wolfram_source'), citation: null, url: null },
    { icon: '🎣', label: 'FAO ASFIS', desc: t('about.fao_source'), citation: null, url: null },
    { icon: '📦', label: 'Open Food Facts', desc: t('about.off_source'), citation: null, url: null },
  ]

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-8">
      <h1 className="text-xl font-bold text-deep">{t('about.title')}</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-800">{t('about.how_it_works')}</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {t('about.scoring_explanation')}
        </p>

        <div className="space-y-2">
          {scoreBands.map(({ range, label, color }) => (
            <div key={range} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span className="text-sm font-medium" style={{ color }}>
                {range}
              </span>
              <span className="text-sm text-gray-600">— {label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
        <h2 className="font-semibold text-gray-800">{t('about.data_sources')}</h2>
        <div className="space-y-3">
          {sources.map(({ icon, label, desc, citation, url }) => (
            <div key={label} className="flex gap-3">
              <span className="text-xl shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-500">{desc}</p>
                {citation && url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-primary/80 break-all leading-tight mt-0.5 block hover:underline"
                  >
                    {citation}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/10 rounded-2xl p-4 space-y-1">
        <p className="text-sm font-semibold text-deep">Nice Catch</p>
        <p className="text-xs text-gray-600">
          Desarrollado para un hackathon medioambiental. Datos actualizados periódicamente.
          La puntuación es orientativa — siempre es mejor preguntar al pescadero.
        </p>
      </div>
    </div>
  )
}
