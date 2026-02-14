import type { ScoreBreakdown as ScoreBreakdownType } from '@/types/scoring'
import type { IUCNStatus } from '@/types/species'
import { useI18n } from '@/hooks/useI18n'

interface Props {
  breakdown: ScoreBreakdownType
  iucnStatus: IUCNStatus
  fishingMethod?: string
  faoArea?: string
}

function PillarBar({ label, value, max = 50, subtitle }: { label: string; value: number; max?: number; subtitle?: string }) {
  const pct = Math.abs(value) / max * 100
  const positive = value >= 0
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs text-gray-600">{label}</span>
        <span className={`text-xs font-semibold ${positive ? 'text-deep' : 'text-danger'}`}>
          {positive && value > 0 ? '+' : ''}{value}
        </span>
      </div>
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${positive ? 'bg-primary' : 'bg-danger'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {subtitle && <span className="text-[10px] text-gray-400">{subtitle}</span>}
    </div>
  )
}

export function ScoreBreakdown({ breakdown, iucnStatus, fishingMethod, faoArea }: Props) {
  const { t } = useI18n()
  const confidenceColors = {
    high: 'text-deep bg-deep/10',
    medium: 'text-earth bg-earth/10',
    low: 'text-gray-500 bg-gray-100',
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-sm">{t('result.score_breakdown')}</h3>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${confidenceColors[breakdown.confidence]}`}>
          {t(`result.${breakdown.confidence}`)} {t('result.confidence').toLowerCase()}
        </span>
      </div>

      <div className="space-y-2.5">
        <PillarBar
          label={`${t('result.iucn_status')}: ${t(`iucn.${iucnStatus}`)}`}
          value={breakdown.iucnBase}
          max={50}
          subtitle={iucnStatus}
        />
        <PillarBar
          label={t('result.method_impact')}
          value={breakdown.methodModifier}
          max={20}
          subtitle={fishingMethod}
        />
        <PillarBar
          label={t('result.area_impact')}
          value={breakdown.areaModifier}
          max={15}
          subtitle={faoArea ? `FAO ${faoArea}` : undefined}
        />
        {breakdown.originModifier !== 0 && (
          <PillarBar
            label={t('result.certification')}
            value={breakdown.originModifier}
            max={10}
          />
        )}
      </div>
    </div>
  )
}
