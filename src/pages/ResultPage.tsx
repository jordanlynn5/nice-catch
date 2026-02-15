import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { ProductCard } from '@/components/results/ProductCard'
import { GreenPTChat } from '@/components/chat/GreenPTChat'
import { useI18n } from '@/hooks/useI18n'
import { useGameification } from '@/hooks/useGameification'
import { useSustainability } from '@/hooks/useSustainability'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import confetti from 'canvas-confetti'

export function ResultPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const currentResult = useAppStore((s) => s.currentResult)
  const setCurrentResult = useAppStore((s) => s.setCurrentResult)
  const addToast = useAppStore((s) => s.addToast)
  const { recordScan } = useGameification()
  const { resolve, loading } = useSustainability()

  // Navigate in an effect — never call navigate() during render
  useEffect(() => {
    if (!currentResult) {
      navigate('/', { replace: true })
    }
  }, [currentResult, navigate])

  const handleChooseAlternative = async (altSpeciesId: string) => {
    const result = await resolve({ speciesName: altSpeciesId })
    if (result) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ['#309f9b', '#80b8a2', '#106c72'] })
      setCurrentResult(result)
      await recordScan(result, true)
      addToast('¡Buena elección! +25 pts', 'success')
    }
  }

  const handleShare = async () => {
    if (!currentResult) return
    const score = currentResult.score.finalScore
    const text = `Acabo de consultar la sostenibilidad de ${currentResult.displayName}: ${score}/100 🌊 #NiceCatch`

    if (navigator.share) {
      try {
        await navigator.share({ text, url: window.location.origin })
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(text)
      addToast('Copiado al portapapeles', 'success')
    }
  }

  if (!currentResult) return null

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner message="Cargando alternativa..." size="lg" />
      </div>
    )
  }

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
          Compartir ↗
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <ProductCard
          result={currentResult}
          onChooseAlternative={handleChooseAlternative}
        />
      </div>

      {/* Floating chat */}
      <GreenPTChat speciesContext={currentResult.displayName} />
    </div>
  )
}
