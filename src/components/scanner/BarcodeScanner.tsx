import { useEffect, useRef, useState } from 'react'
import { useBarcode } from '@/hooks/useBarcode'
import { useI18n } from '@/hooks/useI18n'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface Props {
  onDetected: (barcode: string) => void
  onFallbackCamera: () => void
  onFallbackManual: () => void
}

export function BarcodeScanner({ onDetected, onFallbackCamera, onFallbackManual }: Props) {
  const { start, stop, detected, error } = useBarcode()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    if (videoRef.current && !started) {
      setStarted(true)
      start(videoRef.current)
    }
    return () => { stop() }
  }, [start, stop, started])

  useEffect(() => {
    if (detected) {
      stop()
      onDetected(detected)
    }
  }, [detected, stop, onDetected])

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <span className="text-4xl">📷</span>
        <p className="text-gray-700">{t(`errors.${error === 'camera_permission' ? 'camera_failed' : 'barcode_failed'}`)}</p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <button
            onClick={onFallbackCamera}
            className="w-full bg-primary text-white py-3 rounded-xl font-medium"
          >
            {t('scanner.try_camera')}
          </button>
          <button
            onClick={onFallbackManual}
            className="w-full border border-primary text-primary py-3 rounded-xl font-medium"
          >
            {t('scanner.try_manual')}
          </button>
        </div>
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
        {/* Scan overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-56 h-36 border-2 border-white/80 rounded-xl relative">
            {/* Corner marks */}
            {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos) => (
              <div key={pos} className={`absolute w-4 h-4 ${pos}`} />
            ))}
            {/* Scan line */}
            <div className="absolute top-1/2 left-2 right-2 h-0.5 bg-primary/80 animate-pulse" />
          </div>
        </div>
        {/* Label */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <span className="bg-black/50 text-white text-xs px-3 py-1.5 rounded-full">
            {t('scanner.aim_at_barcode')}
          </span>
        </div>
      </div>

      {!started && <LoadingSpinner message={t('scanner.scanning')} />}

      <div className="flex gap-3">
        <button
          onClick={onFallbackCamera}
          className="text-sm text-primary underline"
        >
          {t('scanner.try_camera')}
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={onFallbackManual}
          className="text-sm text-primary underline"
        >
          {t('scanner.try_manual')}
        </button>
      </div>
    </div>
  )
}
