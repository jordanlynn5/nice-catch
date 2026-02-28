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

type ScanMode = 'home' | 'barcode' | 'barcode_wizard' | 'camera' | 'manual' | 'ai_assistant' | 'history' | 'profile'

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
      <div className="flex-1 flex items-center justify-center" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 50%, #2a7a9e 100%)'
      }}>
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col p-6" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 100%)'
      }}>
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('home') }}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors"
          style={{ fontFamily: 'Source Sans Pro, sans-serif', fontSize: '1rem' }}
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

  if (mode === 'barcode') {
    return (
      <div className="flex-1 flex flex-col p-6" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 100%)'
      }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors"
          style={{ fontFamily: 'Source Sans Pro, sans-serif', fontSize: '1rem' }}
        >
          ← {t('common.back')}
        </button>
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
      <div className="flex-1 flex flex-col p-6" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 100%)'
      }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors"
          style={{ fontFamily: 'Source Sans Pro, sans-serif', fontSize: '1rem' }}
        >
          ← {t('common.back')}
        </button>
        <CameraCapture
          onResult={handleCameraLabel}
          onFallback={() => setMode('manual')}
        />
      </div>
    )
  }

  if (mode === 'manual') {
    return (
      <div className="flex-1 flex flex-col p-6" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 100%)'
      }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 text-white/80 hover:text-white transition-colors"
          style={{ fontFamily: 'Source Sans Pro, sans-serif', fontSize: '1rem' }}
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
        onComplete={handleCameraLabel}
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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Underwater gradient background */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, #0a2540 0%, #1a4d6f 40%, #2a7a9e 70%, #3a9fc9 100%)'
      }} />

      {/* Animated light rays */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/4 w-px h-full" style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)',
          animation: 'sway-1 8s ease-in-out infinite',
          transformOrigin: 'top'
        }} />
        <div className="absolute top-0 right-1/3 w-px h-full" style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
          animation: 'sway-2 10s ease-in-out infinite',
          transformOrigin: 'top'
        }} />
      </div>

      {/* Floating particles (bubbles/plankton) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              animation: `float-up ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`
            }}
          />
        ))}
      </div>

      {/* Top navigation bar */}
      <nav className="absolute top-0 left-0 right-0 z-40 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Nice Catch"
            className="w-10 h-10 rounded-full"
            style={{
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
              border: '2px solid rgba(255,255,255,0.3)'
            }}
          />
          <span style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: '1.5rem',
            color: 'white',
            fontWeight: '600',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)'
          }}>
            {t('app_name')}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => setMode('home')}
            className="text-white/90 hover:text-white transition-colors"
            style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '0.9375rem',
              fontWeight: '500',
              textShadow: '0 1px 4px rgba(0,0,0,0.3)'
            }}
          >
            Home
          </button>
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
            className="px-4 py-2 rounded-lg transition-all hover:bg-white/10"
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
      <div className="absolute left-8 top-1/2 -translate-y-1/2 z-30 space-y-3">
        <NavButton
          onClick={() => setMode('ai_assistant')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="7" cy="12" r="2" fill="currentColor"/>
              <circle cx="17" cy="12" r="2" fill="currentColor"/>
              <path d="M8 15 Q12 17, 16 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none"/>
            </svg>
          }
          label="Ask AI"
        />
        <NavButton
          onClick={() => setMode('camera')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 8 L3 18 C3 19 4 20 5 20 L19 20 C20 20 21 19 21 18 L21 8 C21 7 20 6 19 6 L17 6 L16 4 L8 4 L7 6 L5 6 C4 6 3 7 3 8 Z" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
          label="Photo"
        />
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
        <NavButton
          onClick={() => setMode('barcode')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
            </svg>
          }
          label="Barcode"
        />
        <div className="h-px bg-white/20 my-4" />
        <NavButton
          onClick={() => navigate('/profile')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M12 4 L12 20 M8 8 L12 4 L16 8 M12 4 C8 4 4 8 4 12 C4 16 8 20 12 20 C16 20 20 16 20 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }
          label="History"
        />
        <NavButton
          onClick={() => navigate('/profile')}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
              <path d="M6 20 C6 16 8 14 12 14 C16 14 18 16 18 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          }
          label="Profile"
        />
      </div>

      {/* Center content — Hero */}
      <div className="absolute inset-0 flex items-center justify-center z-20 px-8">
        <div className="text-center max-w-3xl">
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
          <p className="mb-12" style={{
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: 'clamp(1rem, 2vw, 1.375rem)',
            color: 'rgba(255,255,255,0.85)',
            fontWeight: '400',
            textShadow: '0 1px 8px rgba(0,0,0,0.2)'
          }}>
            {t('home.question')}
          </p>

          {/* CTA — Dive in */}
          <button
            onClick={() => setMode('ai_assistant')}
            className="group relative px-10 py-5 rounded-full transition-all hover:scale-105 active:scale-95"
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
                Start Exploring
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="transition-transform group-hover:translate-x-1">
                <path d="M5 12 L19 12 M19 12 L12 5 M19 12 L12 19" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Bottom wave/depth indicator */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{
        background: 'linear-gradient(0deg, rgba(10,37,64,0.8) 0%, transparent 100%)'
      }} />

      {/* CSS Animations */}
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.3; }
          90% { opacity: 0.3; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 40 - 20}px); opacity: 0; }
        }
        @keyframes sway-1 {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(30px) rotate(3deg); }
        }
        @keyframes sway-2 {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          50% { transform: translateX(-25px) rotate(-3deg); }
        }
      `}</style>
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
      className="group-hover:text-white transition-colors"
      >
        {label}
      </span>
    </button>
  )
}
