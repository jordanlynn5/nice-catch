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
      <div className="flex-1 flex items-center justify-center" style={{ backgroundColor: '#f8f4ed' }}>
        <LoadingSpinner message={looking ? t('scanner.searching') : t('scanner.calculating')} size="lg" />
      </div>
    )
  }

  if (mode === 'barcode_wizard' && barcodeSpecies) {
    return (
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#f8f4ed' }}>
        <button
          onClick={() => { setBarcodeSpecies(null); setBarcodeLabel(null); setMode('barcode') }}
          className="self-start mb-4 transition-colors"
          style={{
            color: '#003d5c',
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '1rem',
            fontWeight: '600'
          }}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#f8f4ed' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 transition-colors"
          style={{
            color: '#003d5c',
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '1rem',
            fontWeight: '600'
          }}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#f8f4ed' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 transition-colors"
          style={{
            color: '#003d5c',
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '1rem',
            fontWeight: '600'
          }}
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
      <div className="flex-1 flex flex-col p-6" style={{ backgroundColor: '#f8f4ed' }}>
        <button
          onClick={() => setMode('home')}
          className="self-start mb-4 transition-colors"
          style={{
            color: '#003d5c',
            fontFamily: 'Source Sans Pro, sans-serif',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          ← {t('common.back')}
        </button>
        <h2 className="text-2xl mb-6" style={{
          fontFamily: 'Playfair Display, serif',
          color: '#003d5c',
          fontWeight: '700'
        }}>
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
  // COSTA AZUL — Refined Coastal Mediterranean
  // Elegant, editorial, premium — like a luxury coastal restaurant
  // ═══════════════════════════════════════════════════════════════
  return (
    <div className="flex-1 flex flex-col" style={{ backgroundColor: '#f8f4ed' }}>
      {/* Header — Flowing sunset gradient */}
      <div className="relative overflow-hidden pt-12 pb-16 px-6" style={{
        background: 'linear-gradient(160deg, #003d5c 0%, #0077be 50%, #ff8c42 100%)',
        boxShadow: '0 8px 32px rgba(0, 61, 92, 0.25)'
      }}>
        {/* Animated wave layers */}
        <div className="absolute inset-0 opacity-20">
          <svg className="absolute bottom-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ffffff" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Multiple wave layers for depth */}
            <path
              d="M0,60 Q300,40 600,60 T1200,60 L1200,120 L0,120 Z"
              fill="url(#wave-gradient)"
              opacity="0.4"
              style={{
                animation: 'wave-animation-1 8s ease-in-out infinite'
              }}
            />
            <path
              d="M0,70 Q300,50 600,70 T1200,70 L1200,120 L0,120 Z"
              fill="url(#wave-gradient)"
              opacity="0.3"
              style={{
                animation: 'wave-animation-2 10s ease-in-out infinite'
              }}
            />
          </svg>
        </div>

        {/* Gradient mesh overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse at top, rgba(255,140,66,0.2) 0%, transparent 50%)',
          mixBlendMode: 'overlay'
        }} />

        <div className="relative z-10 max-w-md mx-auto text-center">
          {/* Logo and name — Premium yacht club style */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative group">
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full blur-xl opacity-50 transition-opacity group-hover:opacity-70" style={{
                background: 'radial-gradient(circle, #d4af37 0%, transparent 70%)'
              }} />

              <div className="relative">
                <img
                  src="/favicon.png"
                  alt="Nice Catch"
                  className="relative w-16 h-16 rounded-full object-cover transition-transform group-hover:scale-105"
                  style={{
                    boxShadow: '0 0 0 3px rgba(212, 175, 55, 0.5), 0 4px 20px rgba(0,0,0,0.3)',
                    border: '2px solid #ffffff'
                  }}
                />
              </div>
            </div>

            <h1
              className="relative"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '2.75rem',
                color: '#ffffff',
                fontWeight: '700',
                letterSpacing: '0.02em',
                textShadow: '0 2px 20px rgba(0,0,0,0.3)'
              }}
            >
              {t('app_name')}
            </h1>
          </div>

          {/* Catchline — Editorial subtitle */}
          <div className="mb-6">
            <p
              className="relative inline-block"
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.375rem',
                color: '#ffffff',
                fontStyle: 'italic',
                fontWeight: '400',
                letterSpacing: '0.01em',
                textShadow: '0 2px 12px rgba(0,0,0,0.3)'
              }}
            >
              {t('home.catchline')}
              {/* Decorative underline */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                height="4"
                viewBox="0 0 200 4"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,2 Q50,0 100,2 T200,2"
                  stroke="#d4af37"
                  strokeWidth="2"
                  fill="none"
                  opacity="0.6"
                />
              </svg>
            </p>
          </div>

          {/* Question */}
          <p
            style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '1.125rem',
              color: 'rgba(255, 255, 255, 0.95)',
              fontWeight: '400',
              letterSpacing: '0.01em'
            }}
          >
            {t('home.question')}
          </p>
        </div>

        {/* Elegant wave divider */}
        <svg
          className="absolute bottom-0 left-0 w-full"
          viewBox="0 0 1200 80"
          preserveAspectRatio="none"
          style={{ height: '80px' }}
        >
          <defs>
            <linearGradient id="divider-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8f4ed" stopOpacity="0" />
              <stop offset="50%" stopColor="#f8f4ed" stopOpacity="1" />
              <stop offset="100%" stopColor="#f8f4ed" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path
            d="M0,40 Q300,20 600,40 T1200,40 L1200,80 L0,80 Z"
            fill="url(#divider-gradient)"
          />
        </svg>
      </div>

      {/* Main content — Premium card layout */}
      <div className="flex-1 px-6 py-8 space-y-6 -mt-4">
        {/* AI Assistant — Primary premium action */}
        <button
          onClick={() => setMode('ai_assistant')}
          className="group relative w-full p-8 rounded-2xl overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #0077be 0%, #4a90a4 100%)',
            boxShadow: '0 8px 32px rgba(0, 119, 190, 0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
          }}
        >
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
            animation: 'shimmer 3s infinite'
          }} />

          <div className="relative flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110" style={{
              background: 'rgba(255,255,255,0.2)',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <circle cx="7" cy="12" r="2.5" fill="white"/>
                <circle cx="17" cy="12" r="2.5" fill="white"/>
                <path d="M8 16 Q12 18, 16 16" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              </svg>
            </div>

            <div className="text-left flex-1">
              <h3 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.75rem',
                color: '#ffffff',
                fontWeight: '600',
                lineHeight: '1.2',
                marginBottom: '4px'
              }}>
                Ask AI Assistant
              </h3>
              <p style={{
                fontFamily: 'Source Sans Pro, sans-serif',
                fontSize: '0.9375rem',
                color: 'rgba(255, 255, 255, 0.9)',
                fontWeight: '400'
              }}>
                Conversational fish identification
              </p>
            </div>

            <div className="text-2xl text-white transition-transform group-hover:translate-x-1 flex-shrink-0">→</div>
          </div>
        </button>

        {/* Secondary actions — Elegant grid */}
        <div className="grid grid-cols-2 gap-4">
          {/* Camera capture */}
          <button
            onClick={() => setMode('camera')}
            className="group relative p-6 rounded-xl transition-all hover:shadow-2xl active:scale-95"
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 61, 92, 0.12)',
              border: '1px solid rgba(0, 61, 92, 0.1)'
            }}
          >
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3" style={{
              background: 'linear-gradient(135deg, rgba(0, 119, 190, 0.1) 0%, rgba(74, 144, 164, 0.1) 100%)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M3 8 L3 18 C3 19 4 20 5 20 L19 20 C20 20 21 19 21 18 L21 8 C21 7 20 6 19 6 L17 6 L16 4 L8 4 L7 6 L5 6 C4 6 3 7 3 8 Z" stroke="#0077be" strokeWidth="2"/>
                <circle cx="12" cy="13" r="3" stroke="#0077be" strokeWidth="2"/>
              </svg>
            </div>
            <h4 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.125rem',
              color: '#003d5c',
              textAlign: 'center',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {t('home.capture_label')}
            </h4>
            <p style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '0.8125rem',
              color: '#4a90a4',
              textAlign: 'center'
            }}>
              Photo analysis
            </p>
          </button>

          {/* Manual search */}
          <button
            onClick={() => setMode('manual')}
            className="group relative p-6 rounded-xl transition-all hover:shadow-2xl active:scale-95"
            style={{
              background: '#ffffff',
              boxShadow: '0 4px 20px rgba(0, 61, 92, 0.12)',
              border: '1px solid rgba(0, 61, 92, 0.1)'
            }}
          >
            <div className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3" style={{
              background: 'linear-gradient(135deg, rgba(255, 140, 66, 0.1) 0%, rgba(212, 175, 55, 0.1) 100%)'
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke="#ff8c42" strokeWidth="2"/>
                <path d="M16 16 L21 21" stroke="#ff8c42" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h4 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.125rem',
              color: '#003d5c',
              textAlign: 'center',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {t('home.manual_search')}
            </h4>
            <p style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '0.8125rem',
              color: '#4a90a4',
              textAlign: 'center'
            }}>
              Search by name
            </p>
          </button>
        </div>

        {/* Barcode scan — Tertiary option */}
        <button
          onClick={() => setMode('barcode')}
          className="group w-full p-5 rounded-xl transition-all hover:shadow-lg active:scale-95"
          style={{
            background: '#ffffff',
            boxShadow: '0 2px 12px rgba(0, 61, 92, 0.08)',
            border: '1px solid rgba(0, 61, 92, 0.08)'
          }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105" style={{
              background: 'rgba(0, 119, 190, 0.08)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0077be" strokeWidth="2"/>
                <circle cx="12" cy="12" r="3" stroke="#0077be" strokeWidth="2"/>
              </svg>
            </div>
            <div className="text-left flex-1">
              <h4 style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '1.0625rem',
                color: '#003d5c',
                fontWeight: '600',
                marginBottom: '2px'
              }}>
                {t('home.scan_barcode')}
              </h4>
              <p style={{
                fontFamily: 'Source Sans Pro, sans-serif',
                fontSize: '0.8125rem',
                color: '#4a90a4'
              }}>
                Quick barcode scan
              </p>
            </div>
          </div>
        </button>

        {/* Recent scans — Editorial card */}
        {profile.history.length > 0 && (
          <div className="relative p-6 rounded-2xl mt-8" style={{
            background: '#ffffff',
            boxShadow: '0 8px 32px rgba(0, 61, 92, 0.12)',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}>
            {/* Gold accent bar */}
            <div className="absolute top-0 left-6 right-6 h-1 rounded-full" style={{
              background: 'linear-gradient(90deg, transparent 0%, #d4af37 50%, transparent 100%)',
              transform: 'translateY(-50%)'
            }} />

            <h2 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              color: '#003d5c',
              fontWeight: '600',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid rgba(0, 61, 92, 0.08)'
            }}>
              Recent Scans
            </h2>

            <div className="space-y-4">
              {profile.history.slice(0, 3).map((entry, i) => {
                const scoreColor =
                  entry.score >= 76 ? '#003d5c' :
                  entry.score >= 51 ? '#4a90a4' :
                  entry.score >= 26 ? '#ff8c42' : '#e74c3c'

                return (
                  <div
                    key={i}
                    className="flex items-center gap-5 pb-4 border-b last:border-0"
                    style={{ borderColor: 'rgba(0, 61, 92, 0.06)' }}
                  >
                    {/* Score badge — Premium circular design */}
                    <div className="relative flex-shrink-0">
                      <div
                        className="w-18 h-18 rounded-full flex items-center justify-center relative"
                        style={{
                          background: `linear-gradient(135deg, ${scoreColor}15 0%, ${scoreColor}08 100%)`,
                          border: `2px solid ${scoreColor}`,
                          boxShadow: `0 4px 12px ${scoreColor}20`
                        }}
                      >
                        <span style={{
                          fontFamily: 'Playfair Display, serif',
                          fontSize: '1.75rem',
                          color: scoreColor,
                          fontWeight: '700'
                        }}>
                          {entry.score}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p style={{
                        fontFamily: 'Playfair Display, serif',
                        fontSize: '1.0625rem',
                        color: '#003d5c',
                        fontWeight: '600',
                        marginBottom: '4px',
                        lineHeight: '1.3'
                      }}>
                        {entry.displayName}
                      </p>
                      <p style={{
                        fontFamily: 'Source Sans Pro, sans-serif',
                        fontSize: '0.875rem',
                        color: '#4a90a4',
                        fontWeight: '400'
                      }}>
                        {new Date(entry.timestamp).toLocaleDateString(
                          language === 'en' ? 'en-GB' : 'es-ES',
                          {
                            day: 'numeric',
                            month: 'long'
                          }
                        )}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — Elegant minimal */}
        {profile.history.length === 0 && (
          <div className="text-center py-16 px-6 rounded-2xl mt-8" style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(0, 119, 190, 0.02) 100%)',
            border: '1px solid rgba(0, 61, 92, 0.08)'
          }}>
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{
              background: 'linear-gradient(135deg, rgba(0, 119, 190, 0.1) 0%, rgba(74, 144, 164, 0.1) 100%)',
              boxShadow: '0 4px 20px rgba(0, 119, 190, 0.15)'
            }}>
              <svg width="48" height="48" viewBox="0 0 40 40" fill="none">
                <path d="M6 20 Q12 16, 18 20 T30 20" stroke="#0077be" strokeWidth="3" strokeLinecap="round" fill="none"/>
                <path d="M6 26 Q12 22, 18 26 T30 26" stroke="#4a90a4" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6"/>
              </svg>
            </div>
            <p style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '1.5rem',
              color: '#003d5c',
              fontWeight: '600',
              marginBottom: '0.5rem'
            }}>
              {t('home.no_recent_scans')}
            </p>
            <p style={{
              fontFamily: 'Source Sans Pro, sans-serif',
              fontSize: '1rem',
              color: '#4a90a4',
              fontWeight: '400'
            }}>
              {t('home.start_scanning')}
            </p>
          </div>
        )}
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes wave-animation-1 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-20px); }
        }
        @keyframes wave-animation-2 {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(20px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}
