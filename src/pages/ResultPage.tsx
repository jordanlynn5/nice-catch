import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { ProductCard } from '@/components/results/ProductCard'
import { GreenPTChat } from '@/components/chat/GreenPTChat'
import { useI18n } from '@/hooks/useI18n'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export function ResultPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const currentResult = useAppStore((s) => s.currentResult)
  const addToast = useAppStore((s) => s.addToast)

  // Navigate in an effect — never call navigate() during render
  useEffect(() => {
    if (!currentResult) {
      navigate('/', { replace: true })
    }
  }, [currentResult, navigate])

  const handleShare = async () => {
    if (!currentResult) return
    const score = currentResult.score.finalScore
    const text = t('result.share_text', { name: currentResult.displayName, score: String(score) })

    if (navigator.share) {
      try {
        await navigator.share({ text, url: window.location.origin })
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      addToast(t('common.copied'), 'success')
    }
  }

  if (!currentResult) return null

  return (
    <div className="flex-1 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button
          onClick={() => navigate('/')}
          className="text-primary text-sm font-medium"
        >
          ← {t('nav.scan')}
        </button>
        <button onClick={handleShare} className="text-primary text-sm font-medium">
          {t('result.share')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <ProductCard result={currentResult} />
      </div>

      {/* Floating chat */}
      <GreenPTChat speciesContext={currentResult.displayName} />
    </div>
  )
}
