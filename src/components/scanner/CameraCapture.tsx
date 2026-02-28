import { useEffect, useRef, useState } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { analyzeLabel } from '@/services/api/greenPT'
import { useI18n } from '@/hooks/useI18n'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { ParsedLabel } from '@/types/species'

interface Props {
  onResult: (label: ParsedLabel) => void
  onFallback: () => void
}

export function CameraCapture({ onResult, onFallback }: Props) {
  const { startPreview, capture, stop, error, previewUrl } = useCamera()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [started, setStarted] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (videoRef.current && !started) {
      setStarted(true)
      startPreview(videoRef.current)
    }
    return () => { stop() }
  }, [startPreview, stop, started])

  const handleCapture = async () => {
    const blob = await capture()
    if (!blob) return

    setAnalyzing(true)
    try {
      const result = await analyzeLabel(blob)
      if (result && result.speciesRaw) {
        onResult(result)
      } else {
        onFallback()
      }
    } finally {
      setAnalyzing(false)
      stop()
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white/50">
          <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <p className="text-white/90">{t('errors.camera_failed')}</p>
        <button
          onClick={onFallback}
          className="text-white py-3 px-6 rounded-xl font-medium"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          {t('scanner.try_manual')}
        </button>
      </div>
    )
  }

  if (analyzing) {
    return (
      <div className="flex flex-col items-center gap-4 p-6">
        {previewUrl && (
          <img src={previewUrl} alt="Captura" className="w-64 rounded-xl" />
        )}
        <LoadingSpinner message={t('scanner.analyzing')} />
      </div>
    )
  }

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
        <div className="absolute inset-x-4 bottom-4 text-center">
          <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
            Encuadra la etiqueta del pescado
          </span>
        </div>
      </div>

      <button
        onClick={handleCapture}
        className="w-16 h-16 bg-white border-4 border-primary rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        aria-label={t('scanner.take_photo')}
      >
        <div className="w-10 h-10 bg-primary rounded-full" />
      </button>

      <button onClick={onFallback} className="text-sm text-white/80 hover:text-white underline transition-colors">
        {t('scanner.try_manual')}
      </button>
    </div>
  )
}
