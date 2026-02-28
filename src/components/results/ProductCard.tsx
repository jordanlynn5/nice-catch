import type { SustainabilityResult } from '@/types/scoring'
import type { ScoreBand } from '@/types/scoring'
import { SustainabilityGauge } from './SustainabilityGauge'
import { CO2Badge } from './CO2Badge'
import { ScoreBreakdown } from './ScoreBreakdown'
import { ScoreExplanation } from './ScoreExplanation'
import { BuyingGuidance } from './BuyingGuidance'
import { ReduceMessage } from './ReduceMessage'
import { SpeciesDetail } from './SpeciesDetail'
import { AlternativesList } from './AlternativesList'
import { useI18n } from '@/hooks/useI18n'
import { getSpeciesById } from '@/services/parsers/synonymResolver'
import { getBandColor } from '@/services/scoring/scoreEngine'
import { getAreaName } from '@/services/scoring/areaScore'

interface Props {
  result: SustainabilityResult
  onChooseAlternative?: (altSpeciesId: string) => void
}

/**
 * Returns opaque gradient for score band headers
 * CRITICAL: Ensures predictable contrast on white text (not semi-transparent)
 */
function getBandGradient(band: ScoreBand): string {
  const gradients = {
    best: 'linear-gradient(135deg, #1e5f6fdd, #1e5f6f)',
    good: 'linear-gradient(135deg, #5a7c59dd, #5a7c59)',
    think: 'linear-gradient(135deg, #9a5238dd, #9a5238)',
    avoid: 'linear-gradient(135deg, #dc2626dd, #dc2626)'
  }
  return gradients[band]
}

export function ProductCard({ result, onChooseAlternative }: Props) {
  const { t, language } = useI18n()
  const species = getSpeciesById(result.speciesId)
  const bandColor = getBandColor(result.score.band)

  return (
    <div className="space-y-5 pb-8">
      {/* Header card — elegant and spacious */}
      <div
        className="rounded-2xl p-5 sm:p-8 text-white"
        style={{ background: getBandGradient(result.score.band) }}
      >
        <p className="text-sm font-medium uppercase tracking-wider mb-3" style={{ opacity: 0.9 }}>
          {t('result.sustainability_score')}
        </p>
        <h2 className="font-serif text-3xl mb-2">{result.displayName}</h2>
        <p className="text-base font-serif italic" style={{ opacity: 0.85 }}>{result.scientificName}</p>
      </div>

      {/* Gauge — clean and centered */}
      <div
        className="rounded-2xl p-4 sm:p-8 flex flex-col items-center gap-6"
        style={{
          background: 'var(--glass-primary-bg)',
          backdropFilter: 'var(--glass-primary-blur)',
          border: '1px solid var(--glass-primary-border)',
          boxShadow: 'var(--glass-primary-shadow)'
        }}
      >
        {/* Gauge container with lighter background for better contrast */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255, 255, 255, 0.15)',
            border: '1px solid rgba(255, 255, 255, 0.25)'
          }}
        >
          <SustainabilityGauge
            score={result.score.finalScore}
            band={result.score.band}
            size={260}
          />
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <CO2Badge co2={result.co2} />
          {result.iucnStatus && (
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base"
              style={{
                background: 'var(--glass-secondary-bg)',
                backdropFilter: 'var(--glass-secondary-blur)',
                border: '1px solid var(--glass-secondary-border)'
              }}
            >
              <span className="text-sm text-white">IUCN</span>
              <span className="font-semibold text-white">{t(`iucn.${result.iucnStatus}`)}</span>
            </span>
          )}
        </div>
      </div>

      {/* Key facts — larger text, better spacing */}
      {(result.fishingMethod || result.faoArea || result.productionMethod !== 'unknown') && (
        <div
          className="rounded-2xl p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4"
          style={{
            background: 'var(--glass-secondary-bg)',
            backdropFilter: 'var(--glass-secondary-blur)',
            border: '1px solid var(--glass-secondary-border)',
            boxShadow: 'var(--glass-secondary-shadow)'
          }}
        >
          {result.productionMethod !== 'unknown' && (
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--glass-tertiary-bg)',
                backdropFilter: 'var(--glass-tertiary-blur)',
                border: '1px solid var(--glass-tertiary-border)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2 text-white/80">{t('result.production')}</p>
              <p className="text-base font-semibold text-white">
                {result.productionMethod === 'farmed' ? t('result.farmed') : t('result.wild')}
              </p>
            </div>
          )}
          {result.faoArea && (
            <div
              className="rounded-xl p-4"
              style={{
                background: 'var(--glass-tertiary-bg)',
                backdropFilter: 'var(--glass-tertiary-blur)',
                border: '1px solid var(--glass-tertiary-border)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2 text-white/80">{t('result.catch_area')}</p>
              <p className="text-base font-semibold mb-1 text-white">
                FAO {result.faoArea}
              </p>
              <p className="text-sm text-white/80">{getAreaName(result.faoArea)}</p>
            </div>
          )}
          {result.fishingMethod && (
            <div
              className="rounded-xl p-4 col-span-2"
              style={{
                background: 'var(--glass-tertiary-bg)',
                backdropFilter: 'var(--glass-tertiary-blur)',
                border: '1px solid var(--glass-tertiary-border)'
              }}
            >
              <p className="text-sm uppercase tracking-wider mb-2 text-white/80">{t('result.fishing_method')}</p>
              <p className="text-base font-semibold text-white">
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

      {/* Alternatives */}
      {result.alternatives.length > 0 && (
        <AlternativesList
          alternatives={result.alternatives}
          onChoose={(alt) => onChooseAlternative?.(alt.speciesId)}
        />
      )}

      {/* Buying guidance - always show, collapsed when alternatives exist */}
      {result.buyingGuidance && result.buyingGuidance.items.length > 0 && (
        <BuyingGuidance
          guidance={result.buyingGuidance}
          species={species!}
          region="mediterranean"
          defaultCollapsed={result.alternatives.length > 0}
        />
      )}

      {/* Reduce message - only show if no alternatives and no guidance */}
      {result.alternatives.length === 0 &&
       (!result.buyingGuidance || result.buyingGuidance.items.length === 0) &&
       result.score.finalScore >= 75 &&
       species && (
        <ReduceMessage species={species} />
      )}

      {/* Species detail */}
      <SpeciesDetail
        fishBaseData={result.fishBaseData}
        scientificName={result.scientificName}
      />
    </div>
  )
}
