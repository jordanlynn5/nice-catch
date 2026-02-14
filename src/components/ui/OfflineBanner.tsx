import { useOffline } from '@/hooks/useOffline'
import { useI18n } from '@/hooks/useI18n'

export function OfflineBanner() {
  const { isOffline } = useOffline()
  const { t } = useI18n()

  if (!isOffline) return null

  return (
    <div className="bg-earth/90 text-white text-xs font-medium text-center py-1.5 px-4 fixed top-0 left-0 right-0 z-50">
      📶 {t('offline.banner')}
    </div>
  )
}
