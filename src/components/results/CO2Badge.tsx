import type { CO2Data } from '@/types/scoring'

interface Props {
  co2: CO2Data
}

export function CO2Badge({ co2 }: Props) {
  const intensity = co2.value <= 1.5 ? 'low' : co2.value <= 3.5 ? 'medium' : 'high'
  const colors = {
    low: 'bg-secondary/20 text-deep border-secondary',
    medium: 'bg-earth/20 text-earth border-earth',
    high: 'bg-danger/10 text-danger border-danger',
  }

  return (
    <div className={`inline-flex flex-col items-center px-4 py-2 rounded-xl border ${colors[intensity]}`}>
      <div className="flex items-center gap-1.5">
        <span className="text-lg">🌿</span>
        <span className="font-bold text-lg">{co2.value.toFixed(1)}</span>
        <span className="text-xs font-medium opacity-80">kg CO₂/kg</span>
      </div>
      {co2.comparison && (
        <p className="text-xs opacity-75 mt-0.5">{co2.comparison}</p>
      )}
      {co2.source === 'fallback' && (
        <span className="text-[10px] opacity-50 mt-0.5">estimado</span>
      )}
    </div>
  )
}
