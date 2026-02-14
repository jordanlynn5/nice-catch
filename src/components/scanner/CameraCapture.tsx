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
        <span className="text-4xl">📷</span>
        <p className="text-gray-700">{t('errors.camera_failed')}</p>
        <button
          onClick={onFallback}
          className="bg-primary text-white py-3 px-6 rounded-xl font-medium"
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
      <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-2xl overflow-hidden">
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

      <button onClick={onFallback} className="text-sm text-primary underline">
        {t('scanner.try_manual')}
      </button>
    </div>
  )
}
