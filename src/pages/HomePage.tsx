import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UnifiedScanner } from '@/components/scanner/UnifiedScanner'
import { ManualSearch } from '@/components/scanner/ManualSearch'
import { ChatAssistant } from '@/components/ai/ChatAssistant'
import { useI18n } from '@/hooks/useI18n'
import { useAppStore } from '@/store/appStore'
import { useSustainability } from '@/hooks/useSustainability'
import { useGameification } from '@/hooks/useGameification'
import { getProductCache } from '@/services/cache/productCache'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { isMobileDevice } from '@/utils/deviceDetection'
import type { Species, ParsedLabel } from '@/types/species'

type ScanMode = 'home' | 'unified_scan' | 'barcode_wizard' | 'manual' | 'ai_assistant' | 'history' | 'profile'

export function HomePage() {
  const [mode, setMode] = useState<ScanMode>('home')
  const [barcodeSpecies, setBarcodeSpecies] = useState<Species | null>(null)
  const [barcodeLabel, setBarcodeLabel] = useState<ParsedLabel | null>(null)
  const [looking, setLooking] = useState(false)
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const { resolve, loading } = useSustainability()
  const { recordScan } = useGameification()
  const setCurrentResult = useAppStore((s) => s.setCurrentResult)
  const addToast = useAppStore((s) => s.addToast)
  const setLanguage = useAppStore((s) => s.setLanguage)

  const handleBarcodeSuccess = async (barcode: string, species?: Species, label?: ParsedLabel) => {
    const cached = await getProductCache(barcode)
    if (cached) {
      setCurrentResult(cached)
      navigate('/result')
      return
    }

    if (species && label) {
      // Barcode resolved to a known species
      setBarcodeSpecies(species)
      setBarcodeLabel(label)
      setMode('barcode_wizard')
    } else {
      // Barcode lookup failed, fallback to manual
      addToast(t('errors.barcode_failed'), 'error')
      setMode('manual')
    }
  }

  const handleLabelSuccess = async (label: ParsedLabel) => {
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

  const handleStartExploring = () => {
    // On mobile: open camera scanner
    // On desktop: go straight to AI chat (no camera needed)
    if (isMobileDevice()) {
      setMode('unified_scan')
    } else {
      setMode('ai_assistant')
    }
  }

  if (loading || looking) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{
        background: 'var(--ocean-gradient)'
      }}>
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col px-4 py-4 sm:p-6" style={{
        background: 'var(--ocean-gradient)'
      }}>
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('home') }}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors text-sm sm:text-base"
          style={{ fontFamily: 'Source Sans Pro, sans-serif' }}
        >
          ← {t('common.back')}
        </button>
        <ManualSearch
          onSelect={handleSpeciesSelect}
          initialSpecies={barcodeSpecies}
          initialLabel={barcodeLabel}
        />
      </div>
    )
  }

  if (mode === 'unified_scan') {
    return (
      <div className="flex-1 flex flex-col px-4 py-4 sm:p-6" style={{
        background: 'var(--ocean-gradient)'
      }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors text-sm sm:text-base"
          style={{ fontFamily: 'Source Sans Pro, sans-serif' }}
        >
          ← {t('common.back')}
        </button>
        <UnifiedScanner
          onBarcodeSuccess={handleBarcodeSuccess}
          onLabelSuccess={handleLabelSuccess}
          onAIFallback={() => setMode('ai_assistant')}
          onManualFallback={() => setMode('manual')}
        />
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div className="flex-1 flex flex-col px-4 py-4 sm:p-6" style={{
        background: 'var(--ocean-gradient)'
      }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors text-sm sm:text-base"
          style={{ fontFamily: 'Source Sans Pro, sans-serif' }}
        >
          ← {t('common.back')}
        </button>
        <ManualSearch onSelect={handleSpeciesSelect} />
      </div>
    )
  }

  if (mode === 'ai_assistant') {
    return (
      <ChatAssistant
        onComplete={handleLabelSuccess}
        onBack={() => setMode('home')}
      />
    )
  }

  if (mode === 'history') {
    navigate('/profile')
    return null
  }

  if (mode === 'profile') {
    navigate('/profile')
    return null
  }

  // ═══════════════════════════════════════════════════════════════
  // OCEAN DIVE — Immersive Underwater Experience
  // Centered hero, side navigation, diving into the deep
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="relative w-full min-h-dvh overflow-hidden">
      {/* Underwater gradient background */}
      <div className="absolute inset-0" style={{
        background: 'var(--ocean-gradient)'
      }} />

      {/* Top navigation bar */}
      <nav className="absolute top-0 left-0 right-0 z-40 flex items-center justify-end px-4 py-4 sm:px-6 sm:py-5 md:px-8 md:py-6 safe-area-inset-top">
        <div className="flex items-center gap-2 sm:gap-4 md:gap-6">
          <button
            onClick={() => navigate('/about')}
            className="text-white/90 hover:text-white transition-colors"
            style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: '500',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            About
          </button>
          <button
            onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg transition-all hover:bg-white/10"
            style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: 'white',
              border: '1.5px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              background: 'rgba(255,255,255,0.05)'
            }}
          >
            {language === 'en' ? 'ES' : 'EN'}
          </button>
        </div>
      </nav>

      {/* Side navigation */}
      <div className="hidden md:flex absolute left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 flex-col space-y-3">
        <NavButton
          onClick={() => setMode('manual')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 16 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
          label="Search"
        />
        <div className="h-px bg-white/20 my-4" />
        <NavButton
          onClick={() => navigate('/profile')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 6 L12 12 L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="Previous scans"
        />
        <NavButton
          onClick={() => navigate('/profile')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="10" r="6" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 7 L13 9.5 L15.5 9.5 L13.5 11 L14.5 13.5 L12 11.5 L9.5 13.5 L10.5 11 L8.5 9.5 L11 9.5 Z" fill="currentColor"/>
              <path d="M9 16 L9 22 L12 20 L15 22 L15 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="Badges"
        />
      </div>

      {/* Center content — Hero */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-6 sm:px-8 md:px-16 lg:px-24">
        <div className="text-center max-w-3xl">
          {/* App Icon */}
          <div className="flex justify-center mb-8">
            <img
              src="/favicon.png"
              alt="Nice Catch"
              className="rounded-full object-cover"
              style={{
                width: 'clamp(5rem, 15vw, 9rem)',
                height: 'clamp(5rem, 15vw, 9rem)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.2)',
                border: '4px solid rgba(255,255,255,0.3)'
              }}
            />
          </div>

          {/* Main title */}
          <h1 className="mb-6" style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            color: 'white',
            fontWeight: '600',
            lineHeight: '1.1',
            textShadow: '0 4px 24px rgba(0,0,0,0.4)',
            letterSpacing: '0.02em'
          }}>
            {t('app_name')}
          </h1>

          {/* Catchline */}
          <p className="mb-8" style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 'clamp(1.25rem, 3vw, 2rem)',
            color: 'rgba(255,255,255,0.9)',
            fontStyle: 'italic',
            fontWeight: '400',
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
            lineHeight: '1.5'
          }}>
            {t('home.catchline')}
          </p>

          {/* Question */}
          <p className="mb-8 md:mb-12" style={{
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: 'clamp(1rem, 2vw, 1.375rem)',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: '400',
            textShadow: '0 1px 8px rgba(0,0,0,0.2)'
          }}>
            {t('home.question')}
          </p>

          {/* CTA — Dive in (hidden on phones where mobile action bar replaces it) */}
          <button
            onClick={handleStartExploring}
            className="hidden sm:inline-flex group relative px-6 py-4 sm:px-10 sm:py-5 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <div className="flex items-center gap-4">
              <span style={{
                fontFamily: 'Source Sans Pro, sans-serif',
                fontSize: '1.125rem',
                color: 'white',
                fontWeight: '600',
                letterSpacing: '0.02em'
              }}>
                Score with AI Assistant
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12 L19 12 M19 12 L12 5 M19 12 L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile action bar — phones only */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 z-30 safe-area-inset-bottom">
        <div className="flex items-center justify-center gap-3 px-4 py-4" style={{
          background: 'linear-gradient(0deg, rgba(10,37,64,0.95) 0%, rgba(10,37,64,0.7) 70%, transparent 100%)',
          paddingTop: '2.5rem'
        }}>
          {/* Main CTA */}
          <button
            onClick={handleStartExploring}
            className="flex items-center gap-3 px-8 py-4 rounded-full text-white font-semibold text-base active:scale-95 transition-all shadow-xl"
            style={{
              background: 'rgba(255,255,255,0.2)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          >
            Score with AI Assistant
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M5 12 L19 12 M19 12 L12 5 M19 12 L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Secondary option - Manual search */}
          <button
            onClick={() => setMode('manual')}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white/80 active:scale-95 transition-all"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(255,255,255,0.2)'
            }}
            aria-label="Manual search"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 16 L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom wave/depth indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none md:block hidden" style={{
        background: 'linear-gradient(0deg, rgba(10,37,64,0.8) 0%, transparent 100%)'
      }} />
    </div>
  )
}

interface NavButtonProps {
  onClick: () => void
  icon: React.ReactNode
  label: string
}

function NavButton({ onClick, icon, label }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-center gap-3 px-4 py-3 rounded-lg transition-all hover:bg-white/10"
      style={{
        backdropFilter: 'blur(10px)',
        border: '1.5px solid rgba(255,255,255,0.15)'
      }}
    >
      <div className="w-6 h-6 text-white/80 group-hover:text-white transition-colors">
        {icon}
      </div>
      <span style={{
        fontFamily: 'Source Sans Pro, sans-serif',
        fontSize: '0.875rem',
        color: 'rgba(255,255,255,0.8)',
        fontWeight: '500',
        whiteSpace: 'nowrap'
      }}
      className="hidden lg:inline group-hover:text-white transition-colors"
      >
        {label}
      </span>
    </button>
  )
}

