import { useEffect, useRef, useState, useCallback } from 'react'
import { useI18n } from '@/hooks/useI18n'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { analyzeLabel } from '@/services/api/greenPT'
import { lookupBarcode } from '@/services/api/openFoodFacts'
import { resolveSpeciesId, getSpeciesById } from '@/services/parsers/synonymResolver'
import type { ParsedLabel, Species } from '@/types/species'

interface Props {
  onBarcodeSuccess: (barcode: string, species?: Species, label?: ParsedLabel) => void
  onLabelSuccess: (label: ParsedLabel) => void
  onAIFallback: () => void
  onManualFallback: () => void
}

type ScanState = 'preview' | 'barcode_detected' | 'capturing' | 'analyzing'

export function UnifiedScanner({ onBarcodeSuccess, onLabelSuccess, onAIFallback, onManualFallback }: Props) {
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const barcodeReaderRef = useRef<{ reset: () => void } | null>(null)
  const scanningRef = useRef(false)

  const [state, setState] = useState<ScanState>('preview')
  const [error, setError] = useState<string | null>(null)
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // Handle barcode confirmation
  const handleBarcodeConfirm = useCallback(async (barcode: string) => {
    setState('analyzing')

    try {
      const label = await lookupBarcode(barcode)
      const speciesRaw = label?.speciesRaw ?? ''
      const speciesId = resolveSpeciesId(speciesRaw)
      const species = speciesId ? getSpeciesById(speciesId) : undefined

      onBarcodeSuccess(barcode, species, label ?? undefined)
    } catch {
      // Barcode lookup failed, fallback to AI
      onAIFallback()
    }
  }, [onBarcodeSuccess, onAIFallback])

  // Start camera with autofocus and barcode detection
  const startCamera = useCallback(async () => {
    if (!videoRef.current) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          // @ts-expect-error - focusMode is not in TypeScript's MediaTrackConstraints yet
          focusMode: { ideal: 'continuous' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })

      streamRef.current = stream
      videoRef.current.srcObject = stream
      await videoRef.current.play()

      // Start barcode detection after camera is ready
      if (!scanningRef.current) {
        scanningRef.current = true

        try {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const reader = new BrowserMultiFormatReader()
          barcodeReaderRef.current = reader as unknown as { reset: () => void }

          // Continuous scanning on the already-playing video
          reader.decodeFromVideoElement(
            videoRef.current,
            (result, _err) => {
              if (result) {
                const code = result.getText()
                setDetectedBarcode(code)
                setState('barcode_detected')

                // Auto-process barcode after 1 second if user doesn't cancel
                setTimeout(() => {
                  handleBarcodeConfirm(code)
                }, 1000)
              }
            }
          )
        } catch (err) {
          console.error('Barcode detection failed:', err)
          // Silently continue - photo capture still works
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : ''
      if (msg.includes('NotAllowed') || msg.includes('Permission')) {
        setError('camera_permission')
      } else {
        setError('camera_failed')
      }
    }
  }, [handleBarcodeConfirm])

  // Initialize camera
  useEffect(() => {
    startCamera()

    return () => {
      // Cleanup
      if (barcodeReaderRef.current) {
        barcodeReaderRef.current.reset()
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      scanningRef.current = false
    }
  }, [startCamera])

  // Handle photo capture
  const handleCapture = async () => {
    const video = videoRef.current
    if (!video) return

    setState('capturing')

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)
    setPreviewUrl(dataUrl)

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9)
    })

    if (!blob) return

    setState('analyzing')

    try {
      const result = await analyzeLabel(blob)

      if (result && result.speciesRaw) {
        onLabelSuccess(result)
      } else {
        // Vision failed, offer AI chat
        onAIFallback()
      }
    } catch {
      // Analysis failed, offer AI chat
      onAIFallback()
    }
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white/50">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <p className="text-white/90">{t('errors.camera_failed')}</p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={onAIFallback}
            className="w-full text-white py-3 rounded-xl font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {t('scanner.try_ai')}
          </button>
          <button
            onClick={onManualFallback}
            className="w-full text-white py-3 rounded-xl font-medium"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.25)'
            }}
          >
            {t('scanner.try_manual')}
          </button>
        </div>
      </div>
    )
  }

  // Analyzing state
  if (state === 'analyzing') {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        {previewUrl && (
          <img src={previewUrl} alt="Capture" className="w-64 rounded-xl shadow-lg" />
        )}
        <LoadingSpinner message={t('scanner.analyzing')} />
      </div>
    )
  }

  // Barcode detected overlay
  const showBarcodeDetected = state === 'barcode_detected' && detectedBarcode

  // Camera preview with smart overlays
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Barcode detected overlay */}
        {showBarcodeDetected && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 p-6 animate-fade-in">
            <div className="bg-white/10 backdrop-blur-xl border-2 border-white/30 rounded-2xl p-6 max-w-xs">
              <div className="flex items-center gap-3 mb-3">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <rect x="3" y="6" width="2" height="12" fill="currentColor"/>
                  <rect x="7" y="6" width="1" height="12" fill="currentColor"/>
                  <rect x="10" y="6" width="3" height="12" fill="currentColor"/>
                  <rect x="15" y="6" width="1" height="12" fill="currentColor"/>
                  <rect x="18" y="6" width="2" height="12" fill="currentColor"/>
                </svg>
                <span className="text-white font-semibold">Barcode detected!</span>
              </div>
              <p className="text-white/80 text-sm mb-4 font-mono">{detectedBarcode}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => detectedBarcode && handleBarcodeConfirm(detectedBarcode)}
                  className="flex-1 bg-primary text-white py-2 px-4 rounded-lg font-medium"
                >
                  Continue
                </button>
                <button
                  onClick={() => {
                    setDetectedBarcode(null)
                    setState('preview')
                  }}
                  className="px-4 py-2 text-white/80 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Scanning frame overlay (when no barcode detected yet) */}
        {!showBarcodeDetected && (
          <>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="border-2 border-white/50 rounded-xl relative"
                style={{ width: 'min(16rem, 75vw)', height: 'min(10rem, 47vw)' }}
              >
                {/* Corner marks */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />

                {/* Scanning line */}
                <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-primary/60 animate-pulse" />
              </div>
            </div>

            {/* Instruction label */}
            <div className="absolute top-4 left-0 right-0 flex justify-center pointer-events-none px-4">
              <span className="bg-black/70 text-white text-sm sm:text-base px-5 py-2.5 rounded-full backdrop-blur-md text-center max-w-md" style={{
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
              }}>
                {t('scanner.camera_instructions')}
              </span>
            </div>
          </>
        )}
      </div>

      {/* Capture button */}
      {!showBarcodeDetected && (
        <>
          <button
            onClick={handleCapture}
            disabled={state !== 'preview'}
            className="w-16 h-16 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50"
            aria-label={t('scanner.take_photo')}
          >
            <div className="w-10 h-10 bg-primary rounded-full" />
          </button>

          <p className="text-white/70 text-xs sm:text-sm text-center px-6">
            Barcode auto-detection active
          </p>
        </>
      )}

      {/* Fallback options */}
      <div className="flex gap-3 mt-2">
        <button
          onClick={onAIFallback}
          className="text-sm text-white/80 hover:text-white underline transition-colors"
        >
          Ask AI for help
        </button>
        <span className="text-white/40">|</span>
        <button
          onClick={onManualFallback}
          className="text-sm text-white/80 hover:text-white underline transition-colors"
        >
          {t('scanner.try_manual')}
        </button>
      </div>
    </div>
  )
}
