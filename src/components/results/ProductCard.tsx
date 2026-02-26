import type { SustainabilityResult } from '@/types/scoring'
import { SustainabilityGauge } from './SustainabilityGauge'
import { CO2Badge } from './CO2Badge'
import { ScoreBreakdown } from './ScoreBreakdown'
import { ScoreExplanation } from './ScoreExplanation'
import { BuyingGuidance } from './BuyingGuidance'
import { ReduceMessage } from './ReduceMessage'
import { SpeciesDetail } from './SpeciesDetail'
import { useI18n } from '@/hooks/useI18n'
import { getSpeciesById } from '@/services/parsers/synonymResolver'
import { getBandColor } from '@/services/scoring/scoreEngine'
import { getAreaName } from '@/services/scoring/areaScore'

interface Props {
  result: SustainabilityResult
  onChooseAlternative?: (altSpeciesId: string) => void // deprecated
}

export function ProductCard({ result, onChooseAlternative }: Props) {
  const { t, language } = useI18n()
  const species = getSpeciesById(result.speciesId)
  const bandColor = getBandColor(result.score.band)

  return (
    <div className="space-y-5 pb-8">
      {/* Header card — elegant and spacious */}
      <div
        className="rounded-2xl p-8 text-white"
        style={{ background: `linear-gradient(135deg, ${bandColor}dd, ${bandColor})` }}
      >
        <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ opacity: 0.9 }}>
          {t('result.sustainability_score')}
        </p>
        <h2 className="font-serif text-3xl mb-2">{result.displayName}</h2>
        <p className="text-base font-serif italic" style={{ opacity: 0.85 }}>{result.scientificName}</p>
      </div>

      {/* Gauge — clean and centered */}
      <div className="bg-white rounded-2xl p-8 shadow-md flex flex-col items-center">
        <SustainabilityGauge
          score={result.score.finalScore}
          band={result.score.band}
          size={260}
        />
        <div className="flex gap-3 flex-wrap justify-center mt-6">
          <CO2Badge co2={result.co2} />
          {result.iucnStatus && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-base" style={{ borderColor: '#f5e6d3' }}>
              <span className="text-sm" style={{ color: '#1e3a5f99' }}>IUCN</span>
              <span className="font-semibold" style={{ color: '#1e3a5f' }}>{t(`iucn.${result.iucnStatus}`)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Key facts — larger text, better spacing */}
      {(result.fishingMethod || result.faoArea || result.productionMethod !== 'unknown') && (
        <div className="bg-white rounded-2xl p-6 shadow-md grid grid-cols-2 gap-4">
          {result.productionMethod !== 'unknown' && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#faf8f5' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1e3a5f99' }}>{t('result.production')}</p>
              <p className="text-base font-semibold" style={{ color: '#1e3a5f' }}>
                {result.productionMethod === 'farmed' ? t('result.farmed') : t('result.wild')}
              </p>
            </div>
          )}
          {result.faoArea && (
            <div className="rounded-xl p-4" style={{ backgroundColor: '#faf8f5' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1e3a5f99' }}>{t('result.catch_area')}</p>
              <p className="text-base font-semibold mb-1" style={{ color: '#1e3a5f' }}>
                FAO {result.faoArea}
              </p>
              <p className="text-sm" style={{ color: '#1e3a5f99' }}>{getAreaName(result.faoArea)}</p>
            </div>
          )}
          {result.fishingMethod && (
            <div className="rounded-xl p-4 col-span-2" style={{ backgroundColor: '#faf8f5' }}>
              <p className="text-sm uppercase tracking-wider mb-2" style={{ color: '#1e3a5f99' }}>{t('result.fishing_method')}</p>
              <p className="text-base font-semibold" style={{ color: '#1e3a5f' }}>
                {result.fishingMethod.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Score explanation */}
      <ScoreExplanation
        breakdown={result.score}
        iucnStatus={result.iucnStatus}
        fishingMethod={result.fishingMethod}
        faoArea={result.faoArea}
        band={result.score.band}
      />

      {/* Score breakdown */}
      <ScoreBreakdown
        breakdown={result.score}
        iucnStatus={result.iucnStatus}
        fishingMethod={result.fishingMethod}
        faoArea={result.faoArea}
      />

      {/* Buying guidance or reduce message */}
      {result.buyingGuidance && result.buyingGuidance.items.length > 0 ? (
        <BuyingGuidance
          guidance={result.buyingGuidance}
          species={species!}
          region="mediterranean"
        />
      ) : result.score.finalScore >= 75 && species ? (
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
