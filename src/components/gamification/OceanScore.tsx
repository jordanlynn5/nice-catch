import { useState, useEffect } from 'react'

interface Props {
  score: number
}

export function OceanScore({ score }: Props) {
  const [displayed, setDisplayed] = useState(0)

  useEffect(() => {
    if (score === displayed) return
    const timer = setInterval(() => {
      setDisplayed((prev) => {
        const next = prev + Math.ceil((score - prev) / 5)
        return next >= score ? score : next
      })
    }, 30)
    return () => clearInterval(timer)
  }, [score])

  return (
    <div className="bg-gradient-to-br from-deep to-primary text-white rounded-2xl p-5 text-center space-y-1">
      <p className="text-xs font-medium uppercase tracking-wider opacity-75">Puntuación Océano</p>
      <p className="text-5xl font-bold">{displayed.toLocaleString()}</p>
      <p className="text-xs opacity-60">puntos acumulados</p>
    </div>
  )
}
