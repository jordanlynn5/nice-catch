import { useState, useEffect } from 'react'
import { searchSpecies } from '@/services/parsers/synonymResolver'
import { InfoDrawer } from './InfoDrawer'
import { useI18n } from '@/hooks/useI18n'
import type { Species, ParsedLabel, ProductionMethod } from '@/types/species'

interface Props {
  onSelect: (species: Species, label: ParsedLabel) => void
}

// Separate UI type so we can distinguish wild-sea vs wild-freshwater for highlighting
type ProductionChoice = 'wild_sea' | 'wild_freshwater' | 'farmed' | 'unknown'

type WizardStep = 1 | 2 | 3

interface WizardData {
  species: Species | null
  productionChoice: ProductionChoice | null
  faoArea: string | null
  fishingMethod: string | null
  certifications: string[]
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    white_fish: '🐟',
    fatty_fish: '🐠',
    small_pelagic: '🐟',
    large_pelagic: '🐡',
    shellfish: '🦐',
    bivalve: '🦪',
    cephalopod: '🦑',
  }
  return map[category] ?? '🐟'
}

function productionMethodFromChoice(choice: ProductionChoice): ProductionMethod {
  if (choice === 'farmed') return 'farmed'
  if (choice === 'unknown') return 'unknown'
  return 'wild'
}

export function ManualSearch({ onSelect }: Props) {
  const { t } = useI18n()
  const [step, setStep] = useState<WizardStep>(1)
  const [data, setData] = useState<WizardData>({
    species: null,
    productionChoice: null,
    faoArea: null,
    fishingMethod: null,
    certifications: [],
  })

  // Step 1 — search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Species[]>([])
  const [searching, setSearching] = useState(false)

  // Debounce in useEffect so cleanup fires correctly on unmount/re-render
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(() => {
      setResults(searchSpecies(query))
      setSearching(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  // Build translated option lists inside the component so they react to language changes
  const AREA_OPTIONS = [
    { label: t('wizard.area_med'), faoCode: '37.1' },
    { label: t('wizard.area_ibe'), faoCode: '27.9' },
    { label: t('wizard.area_n_atl'), faoCode: '27.7' },
    { label: t('wizard.area_nw_atl'), faoCode: '21' },
    { label: t('wizard.area_ec_atl'), faoCode: '34' },
    { label: t('wizard.area_se_atl'), faoCode: '47' },
    { label: t('wizard.area_pacific'), faoCode: '67' },
    { label: t('wizard.area_indian'), faoCode: '51' },
  ]

  const GEAR_OPTIONS = [
    { label: t('wizard.gear_bottom_trawl'), key: 'bottom_trawl', impact: t('wizard.impact_high') },
    { label: t('wizard.gear_midwater_trawl'), key: 'midwater_trawl', impact: t('wizard.impact_medium') },
    { label: t('wizard.gear_purse_seine'), key: 'purse_seine', impact: t('wizard.impact_medium') },
    { label: t('wizard.gear_gillnet'), key: 'gillnet', impact: t('wizard.impact_medium') },
    { label: t('wizard.gear_longline_demersal'), key: 'longline_demersal', impact: t('wizard.impact_low') },
    { label: t('wizard.gear_pole_and_line'), key: 'pole_and_line', impact: t('wizard.impact_very_low') },
    { label: t('wizard.gear_trap_pot'), key: 'trap_pot', impact: t('wizard.impact_very_low') },
  ]

  const CERT_OPTIONS = [
    { label: 'MSC', sublabel: t('wizard.cert_msc_sublabel'), key: 'MSC' },
    { label: 'ASC', sublabel: t('wizard.cert_asc_sublabel'), key: 'ASC' },
    { label: 'Dolphin Safe', sublabel: t('wizard.cert_dolphin_sublabel'), key: 'dolphin_safe' },
  ]

  const PRODUCTION_OPTIONS: { label: string; value: ProductionChoice }[] = [
    { label: t('wizard.production_wild_sea'), value: 'wild_sea' },
    { label: t('wizard.production_farmed'), value: 'farmed' },
    { label: t('wizard.production_wild_freshwater'), value: 'wild_freshwater' },
    { label: t('wizard.production_unknown'), value: 'unknown' },
  ]

  const selectSpecies = (species: Species) => {
    setData((d) => ({ ...d, species }))
    setStep(2)
  }

  const toggleCert = (key: string) => {
    setData((d) => ({
      ...d,
      certifications: d.certifications.includes(key)
        ? d.certifications.filter((c) => c !== key)
        : [...d.certifications, key],
    }))
  }

  const handleSubmit = () => {
    if (!data.species || !data.productionChoice) return

    const productionMethod = productionMethodFromChoice(data.productionChoice)

    // For farmed fish, translate certification into fishing method key
    let fishingMethod: string | undefined = data.fishingMethod ?? undefined
    if (productionMethod === 'farmed') {
      fishingMethod = data.certifications.includes('ASC')
        ? 'aquaculture_certified'
        : 'aquaculture_standard'
    }

    const label: ParsedLabel = {
      productionMethod,
      faoArea: data.faoArea ?? undefined,
      fishingMethod,
      certifications: data.certifications.length > 0 ? data.certifications : undefined,
    }

    onSelect(data.species, label)
  }

  // ── Step 1: Species search ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="w-full max-w-sm mx-auto space-y-4">
        <StepHeader
          step={1}
          total={3}
          title={t('wizard.step1_title')}
          subtitle={t('wizard.step1_subtitle')}
        />

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('scanner.search_placeholder')}
            className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-800 bg-white text-sm"
            autoFocus
            autoCapitalize="none"
            autoCorrect="off"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {t('scanner.searching')}
            </span>
          )}
        </div>

        {results.length > 0 && (
          <ul className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {results.map((species) => (
              <li key={species.id}>
                <button
                  onClick={() => selectSpecies(species)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b last:border-b-0 border-gray-50"
                >
                  <span className="text-lg">{getCategoryEmoji(species.category)}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-800 text-sm">{species.names.es[0]}</p>
                    <p className="text-xs text-gray-400 italic truncate">{species.names.scientific}</p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">{t('scanner.no_results')}</p>
        )}
      </div>
    )
  }

  // ── Step 2: Origin & Method ──────────────────────────────────────────────
  if (step === 2) {
    const isWild =
      data.productionChoice === 'wild_sea' || data.productionChoice === 'wild_freshwater'
    const isFarmed = data.productionChoice === 'farmed'
    const isUnknown = data.productionChoice === 'unknown'
    const canProceed = data.productionChoice !== null

    return (
      <div className="w-full max-w-sm mx-auto space-y-5">
        <StepHeader
          step={2}
          total={3}
          title={t('wizard.step2_title')}
          subtitle={t('wizard.step2_subtitle')}
          onBack={() => setStep(1)}
        />

        {/* Selected species pill */}
        <div className="flex items-center gap-2 bg-primary/10 rounded-xl px-3 py-2">
          <span>{data.species && getCategoryEmoji(data.species.category)}</span>
          <span className="font-medium text-primary text-sm">{data.species?.names.es[0]}</span>
          <span className="text-xs text-primary/60 italic ml-1">{data.species?.names.scientific}</span>
        </div>

        {/* Production method */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-gray-700">{t('wizard.production_label')}</p>
            <InfoDrawer
              title={t('wizard.info_production_title')}
              meaning={t('wizard.info_production_meaning')}
              whereToFind={t('wizard.info_production_where')}
              example={t('wizard.info_production_example')}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PRODUCTION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setData((d) => ({ ...d, productionChoice: opt.value }))}
                className={`py-3 px-2 rounded-xl border text-xs font-medium text-center transition-colors ${
                  data.productionChoice === opt.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Wild: catch area */}
        {isWild && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">{t('wizard.area_label')}</p>
              <InfoDrawer
                title={t('wizard.info_area_title')}
                meaning={t('wizard.info_area_meaning')}
                whereToFind={t('wizard.info_area_where')}
                example={t('wizard.info_area_example')}
              />
            </div>
            <div className="space-y-1.5">
              {AREA_OPTIONS.map((area) => (
                <button
                  key={area.faoCode}
                  onClick={() => setData((d) => ({ ...d, faoArea: area.faoCode }))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                    data.faoArea === area.faoCode
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                  }`}
                >
                  {area.label}
                </button>
              ))}
              <button
                onClick={() => setData((d) => ({ ...d, faoArea: null }))}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors text-gray-500 ${
                  data.faoArea === null
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-primary/40'
                }`}
              >
                {t('wizard.area_dont_know')}
              </button>
            </div>
          </div>
        )}

        {/* Wild: fishing gear */}
        {isWild && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-700">{t('wizard.gear_label')}</p>
              <InfoDrawer
                title={t('wizard.info_gear_title')}
                meaning={t('wizard.info_gear_meaning')}
                whereToFind={t('wizard.info_gear_where')}
                example={t('wizard.info_gear_example')}
              />
            </div>
            <div className="space-y-1.5">
              {GEAR_OPTIONS.map((gear) => (
                <button
                  key={gear.key}
                  onClick={() => setData((d) => ({ ...d, fishingMethod: gear.key }))}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors flex items-center justify-between ${
                    data.fishingMethod === gear.key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                  }`}
                >
                  <span>{gear.label}</span>
                  <span
                    className={`text-xs ml-2 shrink-0 ${
                      data.fishingMethod === gear.key ? 'text-white/70' : 'text-gray-400'
                    }`}
                  >
                    {gear.impact}
                  </span>
                </button>
              ))}
              <button
                onClick={() => setData((d) => ({ ...d, fishingMethod: null }))}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-colors text-gray-500 ${
                  data.fishingMethod === null
                    ? 'bg-gray-100 border-gray-300'
                    : 'bg-white border-gray-200 hover:border-primary/40'
                }`}
              >
                {t('wizard.gear_dont_know')}
              </button>
            </div>
          </div>
        )}

        {/* Farmed: hint for step 3 */}
        {isFarmed && (
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800 border border-amber-100">
            {t('wizard.farmed_hint')}
          </div>
        )}

        {/* Unknown: confidence note */}
        {isUnknown && (
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 border border-gray-200">
            {t('wizard.unknown_note')}
          </div>
        )}

        {canProceed && (
          <button
            onClick={() => setStep(3)}
            className="w-full bg-primary text-white py-3.5 rounded-xl font-semibold text-sm"
          >
            {t('wizard.submit').replace('🌊', '').trim()} →
          </button>
        )}
      </div>
    )
  }

  // ── Step 3: Certifications ───────────────────────────────────────────────
  const areaLabel = data.faoArea
    ? AREA_OPTIONS.find((a) => a.faoCode === data.faoArea)?.label
    : null
  const productionLabel =
    data.productionChoice === 'wild_sea'
      ? t('wizard.summary_wild_sea')
      : data.productionChoice === 'wild_freshwater'
      ? t('wizard.summary_wild_freshwater')
      : data.productionChoice === 'farmed'
      ? t('wizard.summary_farmed')
      : t('wizard.summary_unknown')

  return (
    <div className="w-full max-w-sm mx-auto space-y-5">
      <StepHeader
        step={3}
        total={3}
        title={t('wizard.step3_title')}
        subtitle={t('wizard.step3_subtitle')}
        onBack={() => setStep(2)}
      />

      {/* Summary of steps 1 & 2 */}
      <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-0.5 border border-gray-100">
        <p className="font-semibold text-gray-800">{data.species?.names.es[0]}</p>
        <p className="text-xs text-gray-500">
          {productionLabel}
          {areaLabel && ` · ${areaLabel}`}
        </p>
      </div>

      {/* Certifications */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-700">{t('wizard.cert_label')}</p>
          <InfoDrawer
            title={t('wizard.info_cert_title')}
            meaning={t('wizard.info_cert_meaning')}
            whereToFind={t('wizard.info_cert_where')}
            example={t('wizard.info_cert_example')}
          />
        </div>

        <div className="space-y-2">
          {CERT_OPTIONS.map((cert) => {
            const selected = data.certifications.includes(cert.key)
            return (
              <button
                key={cert.key}
                onClick={() => toggleCert(cert.key)}
                className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors flex items-center gap-3 ${
                  selected
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-primary/40'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 text-xs font-bold ${
                    selected ? 'border-white/60 bg-white/20 text-white' : 'border-gray-300 text-transparent'
                  }`}
                >
                  ✓
                </span>
                <div>
                  <p className="font-semibold">{cert.label}</p>
                  <p className={`text-xs ${selected ? 'text-white/70' : 'text-gray-400'}`}>
                    {cert.sublabel}
                  </p>
                </div>
              </button>
            )
          })}

          <button
            onClick={() => setData((d) => ({ ...d, certifications: [] }))}
            className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-colors text-gray-500 ${
              data.certifications.length === 0
                ? 'bg-gray-100 border-gray-300'
                : 'bg-white border-gray-200 hover:border-primary/40'
            }`}
          >
            {t('wizard.cert_none')}
          </button>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-gradient-to-r from-primary to-deep text-white py-4 rounded-xl font-semibold"
      >
        {t('wizard.submit')}
      </button>
    </div>
  )
}

// ── Shared step header ───────────────────────────────────────────────────────
function StepHeader({
  step,
  total,
  title,
  subtitle,
  onBack,
}: {
  step: number
  total: number
  title: string
  subtitle?: string
  onBack?: () => void
}) {
  const { t } = useI18n()

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {onBack ? (
          <button type="button" onClick={onBack} className="text-primary text-sm font-medium">
            {t('common.back')}
          </button>
        ) : (
          <div />
        )}
        <div className="flex gap-1 ml-auto">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i < step ? 'bg-primary w-6' : 'bg-gray-200 w-3'
              }`}
            />
          ))}
        </div>
      </div>
      <div>
        <h2 className="text-lg font-bold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  )
}
