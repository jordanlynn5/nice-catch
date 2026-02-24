import type { BuyingGuidance as BuyingGuidanceType, GuidanceItem } from '@/types/scoring'
import type { Species } from '@/types/species'
import { useI18n } from '@/hooks/useI18n'

interface BuyingGuidanceProps {
  guidance: BuyingGuidanceType
  species: Species
  region: 'mediterranean' | 'atlantic'
}

export function BuyingGuidance({ guidance, species, region }: BuyingGuidanceProps) {
  const { t } = useI18n()

  if (guidance.items.length === 0) return null

  return (
    <div className="mt-6 space-y-4">
      <h3 className="text-lg font-semibold text-deep">
        {t('guidance.title')}
      </h3>
      <p className="text-sm text-gray-600">
        {t('guidance.subtitle')}
      </p>

      <div className="space-y-3">
        {guidance.items.map((item, index) => (
          item.type === 'seasonality' ? (
            <SeasonalityGuidanceCard
              key={index}
              item={item}
              species={species}
              region={region}
            />
          ) : (
            <GuidanceCard key={index} item={item} />
          )
        ))}
      </div>

      <p className="mt-4 text-xs text-gray-500 italic">
        {t('guidance.footer_legal')}
      </p>
    </div>
  )
}

function GuidanceCard({ item }: { item: GuidanceItem }) {
  const { t } = useI18n()

  return (
    <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-4 relative">
      {/* Potential impact badge */}
      <div className="absolute top-3 right-3 bg-deep text-white text-xs font-bold px-2 py-1 rounded">
        +{item.potentialImpact}
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{item.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-deep">
            {t(`guidance.${item.type}_title`)}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {t(`guidance.${item.type}_desc`)}
          </p>
        </div>
      </div>

      {/* Look for */}
      {item.lookFor && item.lookFor.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('guidance.lookfor_label')}
          </p>
          <ul className="space-y-1">
            {item.lookFor.map((key, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-green-600 font-bold">✓</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Avoid */}
      {item.avoid && item.avoid.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('guidance.avoid_label')}
          </p>
          <ul className="space-y-1">
            {item.avoid.map((key, index) => (
              <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                <span className="text-red-600 font-bold">✗</span>
                <span>{t(key)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SeasonalityGuidanceCard({
  item,
  species,
  region
}: {
  item: GuidanceItem
  species: Species
  region: 'mediterranean' | 'atlantic'
}) {
  const { t } = useI18n()

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = MONTHS[new Date().getMonth()]

  // Extract month names from i18n keys
  const bestMonths = item.lookFor?.map(key => {
    const match = key.match(/month_(\w+)/)
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null
  }).filter(Boolean) as string[] || []

  const avoidMonths = item.avoid?.map(key => {
    const match = key.match(/avoid_month_(\w+)/)
    return match ? match[1].charAt(0).toUpperCase() + match[1].slice(1) : null
  }).filter(Boolean) as string[] || []

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 relative border border-orange-200">
      {/* Potential impact badge */}
      <div className="absolute top-3 right-3 bg-earth text-white text-xs font-bold px-2 py-1 rounded">
        +{item.potentialImpact}
      </div>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{item.icon}</span>
        <div className="flex-1">
          <h4 className="font-semibold text-deep">
            {t('guidance.seasonality_title')}
          </h4>
          <p className="text-sm text-gray-600 mt-1">
            {t('guidance.seasonality_desc')}
          </p>
        </div>
      </div>

      {/* Best months */}
      {bestMonths.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-700 mb-2">
            {t('guidance.best_months')}
          </p>
          <div className="flex flex-wrap gap-2">
            {MONTHS.map(month => {
              const isBest = bestMonths.includes(month)
              const isAvoid = avoidMonths.includes(month)
              const isCurrent = month === currentMonth

              if (!isBest && !isAvoid && !isCurrent) return null

              return (
                <span
                  key={month}
                  className={`
                    px-2 py-1 rounded text-xs font-medium
                    ${isBest ? 'bg-green-100 text-green-800 border border-green-300' : ''}
                    ${isAvoid ? 'bg-red-100 text-red-800 border border-red-300' : ''}
                    ${isCurrent && !isBest && !isAvoid ? 'bg-gray-200 text-gray-700 border border-gray-400' : ''}
                    ${isCurrent ? 'ring-2 ring-offset-1 ring-deep' : ''}
                  `}
                >
                  {t(`months.${month.toLowerCase()}`)}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
