import { useCallback, useRef, useState } from 'react'
import { useAppStore } from '@/store/appStore'

export function useBarcode() {
  const [detected, setDetected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const readerRef = useRef<{ reset: () => void } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const setScannerActive = useAppStore((s) => s.setScannerActive)

  const start = useCallback(async (videoEl: HTMLVideoElement) => {
    setError(null)
    setDetected(null)
    videoRef.current = videoEl

    try {
      // ZXing is dynamically imported to avoid ~400KB at startup
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      readerRef.current = reader as unknown as { reset: () => void }

      setScannerActive(true)

      const result = await reader.decodeFromVideoDevice(
        undefined,
        videoEl,
        (result, _err) => {
          if (result) {
            setDetected(result.getText())
          }
        }
      )

      setDetected((result as unknown as { getText: () => string })?.getText?.() ?? null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera error'
      if (msg.includes('permission') || msg.includes('NotAllowed')) {
        setError('camera_permission')
      } else {
        setError('camera_failed')
      }
      setScannerActive(false)
    }
  }, [setScannerActive])

  const stop = useCallback(() => {
    try {
      if (readerRef.current) {
        readerRef.current.reset()
        readerRef.current = null
      }
    } catch {
      // ignore
    }
    setScannerActive(false)
  }, [setScannerActive])

  return { start, stop, detected, error }
}
