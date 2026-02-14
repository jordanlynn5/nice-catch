import type { SustainabilityResult } from '@/types/scoring'
import { SustainabilityGauge } from './SustainabilityGauge'
import { CO2Badge } from './CO2Badge'
import { ScoreBreakdown } from './ScoreBreakdown'
import { AlternativesList } from './AlternativesList'
import { ReduceMessage } from './ReduceMessage'
import { SpeciesDetail } from './SpeciesDetail'
import { useI18n } from '@/hooks/useI18n'
import { getSpeciesById } from '@/services/parsers/synonymResolver'
import { getBandColor } from '@/services/scoring/scoreEngine'
import { getAreaName } from '@/services/scoring/areaScore'

interface Props {
  result: SustainabilityResult
  onChooseAlternative?: (altSpeciesId: string) => void
}

export function ProductCard({ result, onChooseAlternative }: Props) {
  const { t, language } = useI18n()
  const species = getSpeciesById(result.speciesId)
  const bandColor = getBandColor(result.score.band)

  return (
    <div className="space-y-3 pb-8">
      {/* Header card */}
      <div
        className="rounded-2xl p-5 text-white space-y-1"
        style={{ background: `linear-gradient(135deg, ${bandColor}dd, ${bandColor})` }}
      >
        <p className="text-xs font-medium uppercase tracking-wide opacity-80">
          {t('result.sustainability_score')}
        </p>
        <h2 className="text-2xl font-bold">{result.displayName}</h2>
        <p className="text-sm opacity-75 italic">{result.scientificName}</p>
      </div>

      {/* Gauge */}
      <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col items-center">
        <SustainabilityGauge
          score={result.score.finalScore}
          band={result.score.band}
          size={240}
        />
        <div className="flex gap-3 flex-wrap justify-center mt-2">
          <CO2Badge co2={result.co2} />
          {result.iucnStatus && (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 text-sm">
              <span className="text-gray-500 text-xs">IUCN</span>
              <span className="font-semibold text-gray-800">{t(`iucn.${result.iucnStatus}`)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Key facts */}
      {(result.fishingMethod || result.faoArea || result.productionMethod !== 'unknown') && (
        <div className="bg-white rounded-2xl p-4 shadow-sm grid grid-cols-2 gap-3">
          {result.productionMethod !== 'unknown' && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.production')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {result.productionMethod === 'farmed' ? t('result.farmed') : t('result.wild')}
              </p>
            </div>
          )}
          {result.faoArea && (
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.catch_area')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                FAO {result.faoArea}
              </p>
              <p className="text-[10px] text-gray-500">{getAreaName(result.faoArea)}</p>
            </div>
          )}
          {result.fishingMethod && (
            <div className="bg-gray-50 rounded-xl p-3 col-span-2">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">{t('result.fishing_method')}</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">
                {result.fishingMethod.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Score breakdown */}
      <ScoreBreakdown
        breakdown={result.score}
        iucnStatus={result.iucnStatus}
        fishingMethod={result.fishingMethod}
        faoArea={result.faoArea}
      />

      {/* Alternatives or reduce message */}
      {result.hasAlternative ? (
        <AlternativesList
          alternatives={result.alternatives}
          onChoose={(alt) => onChooseAlternative?.(alt.speciesId)}
        />
      ) : species ? (
        <ReduceMessage species={species} />
      ) : null}

      {/* Species detail */}
      <SpeciesDetail
        fishBaseData={result.fishBaseData}
        scientificName={result.scientificName}
      />
    </div>
  )
}
