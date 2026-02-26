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
    <div className="flex-1 flex flex-col bg-cream">
      {/* Clean header bar */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b" style={{ borderColor: '#f5e6d3' }}>
        <button
          onClick={() => navigate('/')}
          className="text-base font-medium flex items-center gap-2"
          style={{ color: '#0891b2' }}
        >
          ← {t('nav.scan')}
        </button>
        <button onClick={handleShare} className="text-base font-medium" style={{ color: '#0891b2' }}>
          {t('result.share')}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <ProductCard result={currentResult} />
      </div>

      {/* Floating chat */}
      <GreenPTChat speciesContext={currentResult.displayName} />
    </div>
  )
}
