import type { ScoreBreakdown } from '@/types/scoring'
import type { IUCNStatus } from '@/types/species'
import { useI18n } from '@/hooks/useI18n'
import { useState } from 'react'

interface Props {
  breakdown: ScoreBreakdown
  iucnStatus: IUCNStatus
  fishingMethod?: string
  faoArea?: string
  band: string
}

// Educational explanations for IUCN statuses
const IUCN_EXPLANATIONS: Record<IUCNStatus, { en: string; es: string }> = {
  LC: {
    en: 'Least Concern species are widespread and abundant with healthy populations.',
    es: 'Las especies de Preocupación Menor son abundantes y tienen poblaciones saludables.',
  },
  NT: {
    en: 'Near Threatened species are close to qualifying for threatened status and need monitoring.',
    es: 'Las especies Casi Amenazadas están cerca de calificar como amenazadas y necesitan monitoreo.',
  },
  VU: {
    en: 'Vulnerable species face a high risk of extinction in the wild due to declining populations.',
    es: 'Las especies Vulnerables enfrentan alto riesgo de extinción debido a poblaciones en declive.',
  },
  EN: {
    en: 'Endangered species face a very high risk of extinction. Consuming them accelerates their decline.',
    es: 'Las especies En Peligro enfrentan muy alto riesgo de extinción. Consumirlas acelera su declive.',
  },
  CR: {
    en: 'Critically Endangered species are at extremely high risk of extinction. Avoid consuming these.',
    es: 'Las especies En Peligro Crítico están en riesgo extremo de extinción. Evita consumirlas.',
  },
  EX: {
    en: 'This species is extinct in the wild.',
    es: 'Esta especie está extinta en estado salvaje.',
  },
  DD: {
    en: 'Data Deficient means we lack enough information about this species population status.',
    es: 'Datos Insuficientes significa que falta información sobre el estado de la población.',
  },
  NE: {
    en: 'Not Evaluated - this species has not yet been assessed by IUCN.',
    es: 'No Evaluado - esta especie aún no ha sido evaluada por la UICN.',
  },
}

// Fishing method impacts
const METHOD_IMPACTS: Record<string, { en: string; es: string; impact: 'negative' | 'neutral' | 'positive' }> = {
  bottom_trawl: {
    en: 'Bottom trawling drags heavy nets across the seafloor, destroying habitats and catching non-target species.',
    es: 'El arrastre de fondo arrastra redes pesadas por el lecho marino, destruyendo hábitats y capturando especies no objetivo.',
    impact: 'negative',
  },
  midwater_trawl: {
    en: 'Midwater trawling has less habitat damage but still catches significant bycatch.',
    es: 'El arrastre pelágico tiene menos daño al hábitat pero aún captura fauna no objetivo.',
    impact: 'neutral',
  },
  purse_seine: {
    en: 'Purse seining can be selective when used properly, minimizing bycatch.',
    es: 'La pesca de cerco puede ser selectiva cuando se usa apropiadamente, minimizando capturas no deseadas.',
    impact: 'neutral',
  },
  longline_pelagic: {
    en: 'Pelagic longlines can catch seabirds and sharks as bycatch.',
    es: 'Los palangres pelágicos pueden capturar aves marinas y tiburones como fauna acompañante.',
    impact: 'neutral',
  },
  longline_demersal: {
    en: 'Demersal longlines have moderate environmental impact with some bycatch.',
    es: 'Los palangres de fondo tienen impacto ambiental moderado con algo de captura incidental.',
    impact: 'neutral',
  },
  gillnet: {
    en: 'Gillnets can entangle marine mammals and turtles as bycatch.',
    es: 'Las redes de enmalle pueden atrapar mamíferos marinos y tortugas.',
    impact: 'neutral',
  },
  hook_and_line: {
    en: 'Hook and line fishing is selective with minimal habitat damage and low bycatch.',
    es: 'La pesca con anzuelo es selectiva con mínimo daño al hábitat y baja captura incidental.',
    impact: 'positive',
  },
  pole_and_line: {
    en: 'Pole and line is one of the most sustainable methods - highly selective with no bycatch.',
    es: 'La pesca con caña es uno de los métodos más sostenibles - muy selectivo sin capturas no deseadas.',
    impact: 'positive',
  },
  trap_pot: {
    en: 'Traps and pots are selective and cause minimal habitat damage.',
    es: 'Las trampas y nasas son selectivas y causan mínimo daño al hábitat.',
    impact: 'positive',
  },
  jig: {
    en: 'Jigging is very selective with virtually no bycatch or habitat damage.',
    es: 'La pesca con potera es muy selectiva sin apenas captura incidental ni daño al hábitat.',
    impact: 'positive',
  },
  aquaculture_certified: {
    en: 'Certified aquaculture meets environmental standards for feed, waste, and disease management.',
    es: 'La acuicultura certificada cumple estándares ambientales de alimento, residuos y manejo de enfermedades.',
    impact: 'positive',
  },
  aquaculture_standard: {
    en: 'Standard aquaculture can have environmental impacts from waste, chemicals, and escaped fish.',
    es: 'La acuicultura estándar puede tener impactos ambientales por residuos, químicos y peces escapados.',
    impact: 'neutral',
  },
}

export function ScoreExplanation({ breakdown, iucnStatus, fishingMethod, faoArea, band }: Props) {
  const { t, language } = useI18n()
  const [expanded, setExpanded] = useState(false)

  const bandExplanations: Record<string, { en: string; es: string; icon: string }> = {
    avoid: {
      en: 'This fish should be avoided. The environmental cost of consuming it is too high.',
      es: 'Este pescado debe evitarse. El costo ambiental de consumirlo es demasiado alto.',
      icon: '🚫',
    },
    think_twice: {
      en: 'Consider alternatives. This choice has significant environmental concerns.',
      es: 'Considera alternativas. Esta elección tiene importantes preocupaciones ambientales.',
      icon: '⚠️',
    },
    good_choice: {
      en: 'This is a reasonable choice with moderate environmental impact.',
      es: 'Esta es una elección razonable con impacto ambiental moderado.',
      icon: '👍',
    },
    best_choice: {
      en: 'Excellent choice! This is one of the most sustainable options available.',
      es: '¡Excelente elección! Esta es una de las opciones más sostenibles disponibles.',
      icon: '🌟',
    },
  }

  const bandInfo = bandExplanations[band] || bandExplanations.good_choice
  const iucnExplanation = IUCN_EXPLANATIONS[iucnStatus]
  const methodExplanation = fishingMethod ? METHOD_IMPACTS[fishingMethod] : null

  const lang = language === 'en' ? 'en' : 'es'

  return (
    <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{bandInfo.icon}</span>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800 text-sm mb-1">
            {t('result.why_this_score')}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {bandInfo[lang]}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-primary text-xs font-medium shrink-0"
        >
          {expanded ? t('common.less') : t('common.learn_more')}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-3 pt-2 border-t border-blue-100">
          {/* IUCN explanation */}
          <div className="bg-white/60 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">🐟</span>
              <h4 className="font-semibold text-xs text-gray-700">
                {t('result.population_status')}
              </h4>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              {iucnExplanation[lang]}
            </p>
            {breakdown.iucnBase < 30 && (
              <p className="text-xs text-danger font-medium mt-1">
                {language === 'en'
                  ? '⚠️ This species is under pressure - choose alternatives when possible.'
                  : '⚠️ Esta especie está bajo presión - elige alternativas cuando sea posible.'}
              </p>
            )}
          </div>

          {/* Method explanation */}
          {methodExplanation && (
            <div className="bg-white/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">
                  {methodExplanation.impact === 'positive' ? '✅' : methodExplanation.impact === 'negative' ? '❌' : '⚖️'}
                </span>
                <h4 className="font-semibold text-xs text-gray-700">
                  {t('result.fishing_method')}
                </h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {methodExplanation[lang]}
              </p>
            </div>
          )}

          {/* Area explanation */}
          {faoArea && breakdown.areaModifier !== 0 && (
            <div className="bg-white/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-base">🌊</span>
                <h4 className="font-semibold text-xs text-gray-700">
                  {t('result.catch_area')}
                </h4>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {breakdown.areaModifier > 0
                  ? language === 'en'
                    ? 'This fishing area has good management practices and healthy fish stocks.'
                    : 'Esta área de pesca tiene buenas prácticas de gestión y poblaciones saludables.'
                  : language === 'en'
                    ? 'This area faces overfishing or lacks strong management.'
                    : 'Esta área enfrenta sobrepesca o carece de gestión sólida.'}
              </p>
            </div>
          )}

          {/* Bottom line */}
          <div className="bg-white/80 rounded-xl p-3 border-l-4 border-primary">
            <p className="text-xs font-medium text-gray-800">
              {language === 'en'
                ? '💡 Your choices matter! Each sustainable purchase supports responsible fishing and healthy oceans.'
                : '💡 ¡Tus elecciones importan! Cada compra sostenible apoya la pesca responsable y océanos saludables.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
