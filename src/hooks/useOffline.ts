import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function useOffline() {
  const { isOffline, setOffline } = useAppStore((s) => ({
    isOffline: s.isOffline,
    setOffline: s.setOffline,
  }))

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOffline])

  return { isOffline }
}
