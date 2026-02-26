import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarcodeScanner } from '@/components/scanner/BarcodeScanner'
import { CameraCapture } from '@/components/scanner/CameraCapture'
import { ManualSearch } from '@/components/scanner/ManualSearch'
import { ChatAssistant } from '@/components/ai/ChatAssistant'
import { useI18n } from '@/hooks/useI18n'
import { useAppStore } from '@/store/appStore'
import { useSustainability } from '@/hooks/useSustainability'
import { useGameification } from '@/hooks/useGameification'
import { getProductCache } from '@/services/cache/productCache'
import { lookupBarcode } from '@/services/api/openFoodFacts'
import { resolveSpeciesId, getSpeciesById } from '@/services/parsers/synonymResolver'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { Species, ParsedLabel } from '@/types/species'

type ScanMode = 'home' | 'barcode' | 'barcode_wizard' | 'camera' | 'manual' | 'ai_assistant'

export function HomePage() {
  const [mode, setMode] = useState<ScanMode>('home')
  const [barcodeSpecies, setBarcodeSpecies] = useState<Species | null>(null)
  const [barcodeLabel, setBarcodeLabel] = useState<ParsedLabel | null>(null)
  const [looking, setLooking] = useState(false)
  const { t } = useI18n()
  const navigate = useNavigate()
  const { resolve, loading } = useSustainability()
  const { recordScan } = useGameification()
  const setCurrentResult = useAppStore((s) => s.setCurrentResult)
  const addToast = useAppStore((s) => s.addToast)
  const profile = useGameification().getProfile()

  const handleBarcode = async (barcode: string) => {
    const cached = await getProductCache(barcode)
    if (cached) {
      setCurrentResult(cached)
      navigate('/result')
      return
    }

    setLooking(true)
    try {
      const label = await lookupBarcode(barcode)
      const speciesRaw = label?.speciesRaw ?? ''
      const speciesId = resolveSpeciesId(speciesRaw)
      const species = speciesId ? getSpeciesById(speciesId) : null

      if (species) {
        setBarcodeSpecies(species)
        setBarcodeLabel(label)
        setMode('barcode_wizard')
      } else {
        addToast(t('errors.barcode_failed'), 'error')
        setMode('manual')
      }
    } finally {
      setLooking(false)
    }
  }

  const handleCameraLabel = async (label: ParsedLabel) => {
    const result = await resolve({ label })
    if (result) {
      setCurrentResult(result)
      await recordScan(result)
      navigate('/result')
    } else {
      addToast(t('errors.not_found'), 'error')
      setMode('manual')
    }
  }

  const handleSpeciesSelect = async (species: Species, label: ParsedLabel) => {
    const result = await resolve({ speciesName: species.names.scientific, label })
    if (result) {
      setCurrentResult(result)
      await recordScan(result)
      navigate('/result')
    } else {
      addToast(t('errors.not_found'), 'error')
    }
  }

  if (loading || looking) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream">
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col p-6 bg-cream">
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('barcode') }}
          className="self-start text-ocean mb-4 font-serif italic"
        >
          {t('common.back')}
        </button>
        <ManualSearch
          onSelect={handleSpeciesSelect}
          initialSpecies={barcodeSpecies}
          initialLabel={barcodeLabel}
        />
      </div>
    )
  }

  if (mode === 'barcode') {
    return (
      <div className="flex-1 flex flex-col p-6 bg-cream">
        <button onClick={() => setMode('home')} className="self-start text-ocean mb-4 font-serif italic">{t('common.back')}</button>
        <BarcodeScanner
          onDetected={handleBarcode}
          onFallbackCamera={() => setMode('camera')}
          onFallbackManual={() => setMode('manual')}
        />
      </div>
    )
  }

  if (mode === 'camera') {
    return (
      <div className="flex-1 flex flex-col p-6 bg-cream">
        <button onClick={() => setMode('home')} className="self-start text-ocean mb-4 font-serif italic">{t('common.back')}</button>
        <CameraCapture
          onResult={handleCameraLabel}
          onFallback={() => setMode('manual')}
        />
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div className="flex-1 flex flex-col p-6 bg-cream">
        <button onClick={() => setMode('home')} className="self-start text-ocean mb-4 font-serif italic">{t('common.back')}</button>
        <h2 className="text-2xl font-serif text-navy mb-6">{t('home.manual_search')}</h2>
        <ManualSearch onSelect={handleSpeciesSelect} />
      </div>
    )
  }

  if (mode === 'ai_assistant') {
    return (
      <ChatAssistant
        onComplete={handleCameraLabel}
        onBack={() => setMode('home')}
      />
    )
  }

  // ═══════════════════════════════════════════════════════════════
  // HOME SCREEN — MINIMALIST MEDITERRANEAN
  // Clean hierarchy, maximum legibility, elegant spacing
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col bg-cream">
      {/* Simplified header — clean gradient */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] to-[#0891b2] pt-10 pb-10 px-8">
        {/* Subtle wave decoration */}
        <div className="absolute inset-0 opacity-10">
          <svg className="absolute bottom-0 w-full h-24" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,90 600,30 900,60 L900,120 L0,120 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="font-display text-4xl text-white leading-tight mb-3">
            {t('home.title')}
          </h1>
          <p className="text-white/95 text-lg leading-relaxed">
            {t('home.subtitle')}
          </p>
        </div>
      </div>

      {/* Main content — generous spacing */}
      <div className="flex-1 px-6 pt-6 pb-8 space-y-5">

        {/* AI Assistant — primary action, prominent */}
        <button
          onClick={() => setMode('ai_assistant')}
          className="w-full text-white rounded-2xl p-8 active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl"
          style={{
            background: 'linear-gradient(to right, #2563eb, #0891b2)'
          }}
        >
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 shadow-lg">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="7" cy="12" r="2.5" fill="white"/>
                <circle cx="17" cy="12" r="2.5" fill="white"/>
                <path d="M8 16 Q12 18, 16 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <h3 className="font-serif text-2xl text-white mb-2">
                Ask AI Assistant
              </h3>
              <p className="text-base text-white/90">Conversational fish identification</p>
            </div>
            <div className="text-3xl text-white group-hover:translate-x-1 transition-transform flex-shrink-0">→</div>
          </div>
        </button>

        {/* Secondary actions — balanced grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setMode('camera')}
            className="bg-white rounded-xl p-6 text-left border-2 active:scale-95 transition-all hover:shadow-lg group"
            style={{ borderColor: '#f5e6d3' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#dc6b4a26' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 8 L3 18 C3 19 4 20 5 20 L19 20 C20 20 21 19 21 18 L21 8 C21 7 20 6 19 6 L17 6 L16 4 L8 4 L7 6 L5 6 C4 6 3 7 3 8 Z" stroke="#dc6b4a" strokeWidth="2"/>
                <circle cx="12" cy="13" r="3" stroke="#dc6b4a" strokeWidth="2"/>
              </svg>
            </div>
            <h4 className="font-serif text-lg mb-2 leading-tight" style={{ color: '#1e3a5f' }}>
              {t('home.capture_label')}
            </h4>
            <p className="text-sm" style={{ color: '#1e3a5fb3' }}>Photo analysis</p>
          </button>

          <button
            onClick={() => setMode('manual')}
            className="bg-white rounded-xl p-6 text-left border-2 active:scale-95 transition-all hover:shadow-lg group"
            style={{ borderColor: '#f5e6d3' }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: '#0891b226' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#0891b2" strokeWidth="2"/>
                <path d="M16 16 L21 21" stroke="#0891b2" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4 className="font-serif text-lg mb-2 leading-tight" style={{ color: '#1e3a5f' }}>
              {t('home.manual_search')}
            </h4>
            <p className="text-sm" style={{ color: '#1e3a5fb3' }}>Search by name</p>
          </button>
        </div>

        {/* Scan barcode — tertiary option, less prominent */}
        <button
          onClick={() => setMode('barcode')}
          className="w-full bg-white rounded-xl p-5 border-2 active:scale-95 transition-all hover:shadow-md group"
          style={{ borderColor: '#f5e6d3' }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#0891b226' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0891b2" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#0891b2" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <h4 className="font-serif text-lg mb-1" style={{ color: '#1e3a5f' }}>
                {t('home.scan_barcode')}
              </h4>
              <p className="text-sm" style={{ color: '#1e3a5f99' }}>Quick barcode scan</p>
            </div>
          </div>
        </button>

        {/* Recent scans — clean list */}
        {profile.history.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-md mt-8">
            <h2 className="font-serif text-xl mb-5" style={{ color: '#1e3a5f' }}>Recent Scans</h2>

            <div className="space-y-4">
              {profile.history.slice(0, 3).map((entry, i) => {
                const scoreColor =
                  entry.score >= 76 ? '#1e3a5f' :
                  entry.score >= 51 ? '#6b7c59' :
                  entry.score >= 26 ? '#dc6b4a' : '#ff6b6b'

                return (
                  <div
                    key={i}
                    className="flex items-center gap-5 pb-4 border-b border-sand/50 last:border-0"
                  >
                    {/* Score badge — clear and bold */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center relative flex-shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${scoreColor}20, ${scoreColor}10)`
                      }}
                    >
                      <div
                        className="absolute inset-2 rounded-lg border-2"
                        style={{ borderColor: scoreColor }}
                      />
                      <span
                        className="font-display text-2xl font-medium relative z-10"
                        style={{ color: scoreColor }}
                      >
                        {entry.score}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-lg truncate mb-1" style={{ color: '#1e3a5f' }}>
                        {entry.displayName}
                      </p>
                      <p className="text-sm" style={{ color: '#1e3a5f99' }}>
                        {new Date(entry.timestamp).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — clean and minimal */}
        {profile.history.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm mt-8">
            <div className="inline-flex w-24 h-24 rounded-2xl items-center justify-center mb-6" style={{
              background: 'linear-gradient(to bottom right, #0891b21a, #2563eb1a)'
            }}>
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                <path d="M6 20 Q12 16, 18 20 T30 20" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <path d="M6 26 Q12 22, 18 26 T30 26" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
              </svg>
            </div>
            <p className="font-serif text-xl mb-2" style={{ color: '#1e3a5f' }}>
              {t('home.no_recent_scans')}
            </p>
            <p className="text-base" style={{ color: '#1e3a5f99' }}>
              {t('home.start_scanning')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
