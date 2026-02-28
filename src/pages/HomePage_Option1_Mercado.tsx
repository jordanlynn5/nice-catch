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
  const { t, language } = useI18n()
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
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#faf6f0' }}>
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#faf6f0' }}>
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('barcode') }}
          className="self-start mb-4"
          style={{ color: '#1a5a7a', fontFamily: 'Caveat Brush, cursive', fontSize: '1.25rem' }}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#faf6f0' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4"
          style={{ color: '#1a5a7a', fontFamily: 'Caveat Brush, cursive', fontSize: '1.25rem' }}
        >
          {t('common.back')}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#faf6f0' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4"
          style={{ color: '#1a5a7a', fontFamily: 'Caveat Brush, cursive', fontSize: '1.25rem' }}
        >
          {t('common.back')}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#faf6f0' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4"
          style={{ color: '#1a5a7a', fontFamily: 'Caveat Brush, cursive', fontSize: '1.25rem' }}
        >
          {t('common.back')}
        </button>
        <h2 className="text-2xl mb-6" style={{ fontFamily: 'Caveat Brush, cursive', color: '#2c3e50' }}>
          {t('home.manual_search')}
        </h2>
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
  // MERCADO DEL MAR — Rustic Spanish Market Aesthetic
  // Handwritten signage, weathered textures, vibrant market energy
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#faf6f0' }}>
      {/* Header — Market Awning Style */}
      <div className="relative overflow-hidden pt-8 pb-12 px-6" style={{
        background: 'linear-gradient(135deg, #1a5a7a 0%, #2c7a9c 100%)',
        boxShadow: '0 4px 20px rgba(26, 90, 122, 0.3)'
      }}>
        {/* Rope border decoration */}
        <div className="absolute top-0 left-0 right-0 h-2" style={{
          background: 'repeating-linear-gradient(90deg, #d4725f 0px, #d4725f 20px, #c86550 20px, #c86550 40px)',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)'
        }} />

        {/* Wave pattern background */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="waves" x="0" y="0" width="100" height="50" patternUnits="userSpaceOnUse">
                <path d="M0 25 Q 25 15, 50 25 T 100 25" stroke="white" strokeWidth="2" fill="none" />
                <path d="M0 35 Q 25 25, 50 35 T 100 35" stroke="white" strokeWidth="1.5" fill="none" opacity="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#waves)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-md mx-auto text-center">
          {/* Logo and name — Handwritten market sign style */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-white opacity-20 rounded-full blur-sm" />
              <img
                src="/favicon.png"
                alt="Nice Catch"
                className="relative w-14 h-14 rounded-full object-cover border-3"
                style={{ borderColor: '#f4e4c1', boxShadow: '0 3px 10px rgba(0,0,0,0.3)' }}
              />
            </div>
            <h1
              className="relative"
              style={{
                fontFamily: 'Caveat Brush, cursive',
                fontSize: '3rem',
                color: '#faf6f0',
                textShadow: '3px 3px 6px rgba(0,0,0,0.4), -1px -1px 0 rgba(212, 114, 95, 0.3)',
                lineHeight: '1',
                transform: 'rotate(-2deg)'
              }}
            >
              {t('app_name')}
            </h1>
          </div>

          {/* Catchline — Chalkboard style */}
          <div
            className="inline-block px-6 py-3 mb-5 relative"
            style={{
              background: '#2c3e50',
              border: '3px solid #f4e4c1',
              borderRadius: '4px',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3), 0 3px 10px rgba(0,0,0,0.2)',
              transform: 'rotate(1deg)'
            }}
          >
            <p
              style={{
                fontFamily: 'Caveat Brush, cursive',
                fontSize: '1.5rem',
                color: '#f4e4c1',
                lineHeight: '1.3',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              {t('home.catchline')}
            </p>
          </div>

          {/* Question */}
          <p
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1.125rem',
              color: '#faf6f0',
              fontWeight: '600',
              textShadow: '1px 1px 3px rgba(0,0,0,0.3)'
            }}
          >
            {t('home.question')}
          </p>
        </div>

        {/* Bottom wave divider */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1200 60"
          preserveAspectRatio="none"
          style={{ height: '60px' }}
        >
          <path
            d="M0,30 Q300,10 600,30 T1200,30 L1200,60 L0,60 Z"
            fill="#faf6f0"
          />
        </svg>
      </div>

      {/* Main content — Market stall style */}
      <div className="flex-1 px-5 py-6 space-y-5">
        {/* Action buttons — Market product cards */}
        <div className="grid grid-cols-2 gap-4">
          {/* AI Assistant — Premium catch of the day */}
          <button
            onClick={() => setMode('ai_assistant')}
            className="relative col-span-2 p-6 rounded-lg overflow-hidden active:scale-95 transition-all"
            style={{
              background: 'linear-gradient(135deg, #d4725f 0%, #c86550 100%)',
              boxShadow: '0 4px 15px rgba(212, 114, 95, 0.4), inset 0 1px 0 rgba(255,255,255,0.3)',
              border: '2px solid rgba(255,255,255,0.2)'
            }}
          >
            {/* Rope accent */}
            <div className="absolute top-2 right-2 w-8 h-8 rounded-full opacity-30" style={{
              background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 4px)'
            }} />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0" style={{
                background: 'rgba(255,255,255,0.25)',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                  <circle cx="7" cy="12" r="2.5" fill="#faf6f0"/>
                  <circle cx="17" cy="12" r="2.5" fill="#faf6f0"/>
                  <path d="M8 16 Q12 18, 16 16" stroke="#faf6f0" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                </svg>
              </div>
              <div className="text-left flex-1">
                <h3 style={{
                  fontFamily: 'Caveat Brush, cursive',
                  fontSize: '1.75rem',
                  color: '#faf6f0',
                  lineHeight: '1.2',
                  textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                }}>
                  Ask AI Assistant
                </h3>
                <p style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '0.875rem',
                  color: 'rgba(250, 246, 240, 0.9)',
                  marginTop: '2px'
                }}>
                  Chat about any fish
                </p>
              </div>
            </div>
          </button>

          {/* Camera capture */}
          <button
            onClick={() => setMode('camera')}
            className="relative p-5 rounded-lg active:scale-95 transition-all"
            style={{
              background: '#ffffff',
              boxShadow: '0 3px 10px rgba(26, 90, 122, 0.2)',
              border: '3px solid #1a5a7a'
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{
              background: 'rgba(26, 90, 122, 0.1)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M3 8 L3 18 C3 19 4 20 5 20 L19 20 C20 20 21 19 21 18 L21 8 C21 7 20 6 19 6 L17 6 L16 4 L8 4 L7 6 L5 6 C4 6 3 7 3 8 Z" stroke="#1a5a7a" strokeWidth="2"/>
                <circle cx="12" cy="13" r="3" stroke="#1a5a7a" strokeWidth="2"/>
              </svg>
            </div>
            <h4 style={{
              fontFamily: 'Caveat Brush, cursive',
              fontSize: '1.25rem',
              color: '#1a5a7a',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              {t('home.capture_label')}
            </h4>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.75rem',
              color: '#5a7c65',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Snap a photo
            </p>
          </button>

          {/* Manual search */}
          <button
            onClick={() => setMode('manual')}
            className="relative p-5 rounded-lg active:scale-95 transition-all"
            style={{
              background: '#ffffff',
              boxShadow: '0 3px 10px rgba(26, 90, 122, 0.2)',
              border: '3px solid #5a7c65'
            }}
          >
            <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center" style={{
              background: 'rgba(90, 124, 101, 0.1)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#5a7c65" strokeWidth="2"/>
                <path d="M16 16 L21 21" stroke="#5a7c65" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4 style={{
              fontFamily: 'Caveat Brush, cursive',
              fontSize: '1.25rem',
              color: '#5a7c65',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              {t('home.manual_search')}
            </h4>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '0.75rem',
              color: '#5a7c65',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              Browse species
            </p>
          </button>
        </div>

        {/* Barcode scan — Secondary option */}
        <button
          onClick={() => setMode('barcode')}
          className="w-full p-4 rounded-lg active:scale-95 transition-all"
          style={{
            background: '#ffffff',
            boxShadow: '0 2px 8px rgba(26, 90, 122, 0.15)',
            border: '2px dashed #d4725f'
          }}
        >
          <div className="flex items-center gap-3 justify-center">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{
              background: 'rgba(212, 114, 95, 0.1)'
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#d4725f" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#d4725f" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-left">
              <h4 style={{
                fontFamily: 'Caveat Brush, cursive',
                fontSize: '1.125rem',
                color: '#d4725f',
                lineHeight: '1.2'
              }}>
                {t('home.scan_barcode')}
              </h4>
              <p style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '0.75rem',
                color: '#5a7c65',
                marginTop: '2px'
              }}>
                Quick barcode lookup
              </p>
            </div>
          </div>
        </button>

        {/* Recent scans — Market receipt style */}
        {profile.history.length > 0 && (
          <div className="relative p-5 rounded-lg mt-6" style={{
            background: '#ffffff',
            boxShadow: '0 3px 12px rgba(44, 62, 80, 0.15)',
            border: '2px solid #f4e4c1'
          }}>
            {/* Decorative corner tears */}
            <div className="absolute top-0 right-0 w-6 h-6 bg-transparent" style={{
              clipPath: 'polygon(100% 0, 0 0, 100% 100%)',
              background: '#faf6f0'
            }} />

            <h2 style={{
              fontFamily: 'Caveat Brush, cursive',
              fontSize: '1.5rem',
              color: '#2c3e50',
              marginBottom: '1rem',
              borderBottom: '2px dashed #d4725f',
              paddingBottom: '0.5rem'
            }}>
              Recent Catches
            </h2>

            <div className="space-y-3">
              {profile.history.slice(0, 3).map((entry, i) => {
                const scoreColor =
                  entry.score >= 76 ? '#1a5a7a' :
                  entry.score >= 51 ? '#5a7c65' :
                  entry.score >= 26 ? '#d4725f' : '#ff6b5a'

                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 pb-3 border-b-2 border-dashed last:border-0"
                    style={{ borderColor: '#f4e4c1' }}
                  >
                    {/* Score badge — Price tag style */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-16 h-16 rounded-lg flex items-center justify-center relative"
                        style={{
                          background: `${scoreColor}20`,
                          border: `3px solid ${scoreColor}`,
                          transform: 'rotate(-3deg)'
                        }}
                      >
                        <span style={{
                          fontFamily: 'Caveat Brush, cursive',
                          fontSize: '1.75rem',
                          color: scoreColor,
                          fontWeight: 'bold'
                        }}>
                          {entry.score}
                        </span>
                      </div>
                      {/* Price tag hole */}
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full" style={{
                        background: '#faf6f0',
                        border: `2px solid ${scoreColor}`
                      }} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: '1rem',
                        color: '#2c3e50',
                        fontWeight: '700',
                        marginBottom: '2px'
                      }}>
                        {entry.displayName}
                      </p>
                      <p style={{
                        fontFamily: 'Nunito, sans-serif',
                        fontSize: '0.875rem',
                        color: '#5a7c65'
                      }}>
                        {new Date(entry.timestamp).toLocaleDateString(
                          language === 'en' ? 'en-GB' : 'es-ES',
                          { day: 'numeric', month: 'long' }
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {profile.history.length === 0 && (
          <div className="text-center py-12 px-6 rounded-lg mt-6" style={{
            background: '#ffffff',
            border: '3px dashed #d4725f'
          }}>
            <div className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center" style={{
              background: 'rgba(26, 90, 122, 0.1)'
            }}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M6 20 Q12 16, 18 20 T30 20" stroke="#1a5a7a" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <path d="M6 26 Q12 22, 18 26 T30 26" stroke="#5a7c65" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
              </svg>
            </div>
            <p style={{
              fontFamily: 'Caveat Brush, cursive',
              fontSize: '1.5rem',
              color: '#2c3e50',
              marginBottom: '0.5rem'
            }}>
              {t('home.no_recent_scans')}
            </p>
            <p style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '1rem',
              color: '#5a7c65'
            }}>
              {t('home.start_scanning')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
