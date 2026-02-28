import type { CO2Data } from '@/types/scoring'

interface Props {
  co2: CO2Data
}

export function CO2Badge({ co2 }: Props) {
  const intensity = co2.value <= 1.5 ? 'low' : co2.value <= 3.5 ? 'medium' : 'high'
  const styles = {
    low: {
      background: 'rgba(128, 184, 162, 0.20)',
      border: '1px solid rgba(128, 184, 162, 0.4)',
      color: '#ffffff'
    },
    medium: {
      background: 'rgba(185, 127, 95, 0.20)',
      border: '1px solid rgba(185, 127, 95, 0.4)',
      color: '#ffffff'
    },
    high: {
      background: 'rgba(239, 68, 68, 0.20)',
      border: '1px solid rgba(239, 68, 68, 0.4)',
      color: '#ffffff'
    }
  }

  return (
    <div
      className="inline-flex flex-col items-center px-4 py-2 rounded-xl"
      style={{
        background: styles[intensity].background,
        backdropFilter: 'blur(10px)',
        border: styles[intensity].border,
        color: styles[intensity].color
      }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-lg">🌿</span>
        <span className="font-bold text-lg">{co2.value.toFixed(1)}</span>
        <span className="text-xs font-medium opacity-90">kg CO₂/kg</span>
      </div>
      {co2.comparison && (
        <p className="text-xs opacity-85 mt-0.5">{co2.comparison}</p>
      )}
      {co2.source === 'fallback' && (
        <span className="text-[10px] opacity-70 mt-0.5">estimado</span>
      )}
    </div>
  )
}
