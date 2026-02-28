import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { ProductCard } from '@/components/results/ProductCard'
import { GreenPTChat } from '@/components/chat/GreenPTChat'
import { useI18n } from '@/hooks/useI18n'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSustainability } from '@/hooks/useSustainability'
import { useGameification } from '@/hooks/useGameification'
import { getSpeciesById } from '@/services/parsers/synonymResolver'

export function ResultPage() {
  const navigate = useNavigate()
  const { t } = useI18n()
  const currentResult = useAppStore((s) => s.currentResult)
  const setCurrentResult = useAppStore((s) => s.setCurrentResult)
  const addToast = useAppStore((s) => s.addToast)
  const { resolve, loading } = useSustainability()
  const { recordScan } = useGameification()
  const [resultHistory, setResultHistory] = useState<typeof currentResult[]>([])

  // Update history when result changes from outside
  useEffect(() => {
    if (currentResult && resultHistory.length === 0) {
      setResultHistory([currentResult])
    }
  }, [currentResult])

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

  const handleChooseAlternative = async (altSpeciesId: string) => {
    if (!currentResult) return

    // Find the alternative option to get production method suggestion
    const altOption = currentResult.alternatives.find((a) => a.speciesId === altSpeciesId)
    if (!altOption) {
      addToast(t('errors.not_found'), 'error')
      return
    }

    const altSpecies = getSpeciesById(altSpeciesId)
    if (!altSpecies) {
      addToast(t('errors.not_found'), 'error')
      return
    }

    addToast(t('result.loading_alternative'), 'info')

    // Re-run sustainability check with alternative species
    // If it's same species, use production method suggestion; otherwise use current label
    const newResult = await resolve({
      speciesName: altSpecies.names.scientific,
      label: {
        productionMethod: altOption.productionMethodSuggestion || currentResult.productionMethod,
        faoArea: currentResult.faoArea,
        fishingMethod: currentResult.fishingMethod,
      },
    })

    if (newResult) {
      // Save current result to history before switching
      setResultHistory((prev) => [...prev, currentResult])
      setCurrentResult(newResult)
      await recordScan(newResult, true)  // choseAlternative = true
      addToast(t('result.alternative_chosen'), 'success')
    }
  }

  const handleGoBack = () => {
    if (resultHistory.length > 1) {
      // Go back to previous result
      const previousResult = resultHistory[resultHistory.length - 2]
      setResultHistory((prev) => prev.slice(0, -1))
      setCurrentResult(previousResult)
    } else {
      // Go back in browser history
      navigate(-1)
    }
  }

  if (!currentResult) return null

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Underwater gradient background */}
      <div className="absolute inset-0" style={{
        background: 'var(--ocean-gradient)'
      }} />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(18)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-white opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${100 + Math.random() * 20}%`,
              animation: `float-up ${8 + Math.random() * 12}s linear infinite`,
              animationDelay: `${Math.random() * 8}s`
            }}
          />
        ))}
      </div>

      {/* Glassmorphism header bar */}
      <div
        className="relative z-20 flex items-center justify-between px-4 py-4 sm:px-6 sm:py-5"
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}
      >
        <button
          onClick={handleGoBack}
          className="text-base font-medium flex items-center gap-2 text-white hover:text-white/80 transition-colors"
        >
          ← {t('common.back')}
        </button>
        <button
          onClick={handleShare}
          className="text-base font-medium text-white hover:text-white/80 transition-colors"
        >
          {t('result.share')}
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6 md:px-8">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <LoadingSpinner />
          </div>
        ) : (
          <ProductCard result={currentResult} onChooseAlternative={handleChooseAlternative} />
        )}
      </div>

      {/* Floating chat */}
      <GreenPTChat speciesContext={currentResult.displayName} />

      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.2; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) translateX(${Math.random() * 30 - 15}px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
