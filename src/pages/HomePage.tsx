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
    // Return cached result immediately (no wizard needed for repeat scans)
    const cached = await getProductCache(barcode)
    if (cached) {
      setCurrentResult(cached)
      navigate('/result')
      return
    }

    // Phase 1: identify species from barcode via Open Food Facts
    setLooking(true)
    try {
      const label = await lookupBarcode(barcode)
      const speciesRaw = label?.speciesRaw ?? ''
      const speciesId = resolveSpeciesId(speciesRaw)
      const species = speciesId ? getSpeciesById(speciesId) : null

      if (species) {
        // Species identified — hand off to wizard steps 2-3 for context
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
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col p-4">
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('barcode') }}
          className="self-start text-primary mb-4"
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
      <div className="flex-1 flex flex-col p-4">
        <button onClick={() => setMode('home')} className="self-start text-primary mb-4">{t('common.back')}</button>
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
      <div className="flex-1 flex flex-col p-4">
        <button onClick={() => setMode('home')} className="self-start text-primary mb-4">{t('common.back')}</button>
        <CameraCapture
          onResult={handleCameraLabel}
          onFallback={() => setMode('manual')}
        />
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div className="flex-1 flex flex-col p-4">
        <button onClick={() => setMode('home')} className="self-start text-primary mb-4">{t('common.back')}</button>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('home.manual_search')}</h2>
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

  // Home screen
  return (
    <div className="flex-1 flex flex-col p-5 space-y-6">
      {/* Hero */}
      <div className="text-center space-y-2 pt-4">
        <h1 className="text-2xl font-bold text-deep">{t('home.title')}</h1>
        <p className="text-sm text-gray-500">{t('home.subtitle')}</p>
      </div>

      {/* Main scan button */}
      <button
        onClick={() => setMode('barcode')}
        className="w-full bg-gradient-to-r from-primary to-deep text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 shadow-lg active:scale-98 transition-transform"
      >
        <span className="text-2xl">📷</span>
        {t('home.scan_barcode')}
      </button>

      {/* Secondary actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode('camera')}
          className="bg-secondary/20 text-deep py-4 rounded-xl font-medium text-sm flex flex-col items-center gap-1"
        >
          <span className="text-xl">🏷️</span>
          {t('home.capture_label')}
        </button>
        <button
          onClick={() => setMode('manual')}
          className="bg-warm text-deep py-4 rounded-xl font-medium text-sm flex flex-col items-center gap-1"
        >
          <span className="text-xl">🔍</span>
          {t('home.manual_search')}
        </button>
      </div>

      {/* AI Assistant - prominent placement */}
      <button
        onClick={() => setMode('ai_assistant')}
        className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white py-4 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform"
      >
        <span className="text-xl">🤖</span>
        Ask AI Assistant
      </button>

      {/* Recent scans */}
      {profile.history.length > 0 && (
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 text-sm">{t('home.recent_scans')}</h2>
          <div className="space-y-2">
            {profile.history.slice(0, 3).map((entry, i) => (
              <div key={i} className="bg-white rounded-xl p-3 flex items-center gap-3 shadow-sm">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                  style={{
                    backgroundColor:
                      entry.score >= 76 ? '#106c72' :
                      entry.score >= 51 ? '#80b8a2' :
                      entry.score >= 26 ? '#b97f5f' : '#ef4444',
                  }}
                >
                  {entry.score}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{entry.displayName}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(entry.timestamp).toLocaleDateString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile.history.length === 0 && (
        <div className="text-center py-6">
          <p className="text-4xl mb-2">🌊</p>
          <p className="text-sm text-gray-500">{t('home.no_recent_scans')}</p>
          <p className="text-sm font-medium text-primary mt-1">{t('home.start_scanning')}</p>
        </div>
      )}
    </div>
  )
}
