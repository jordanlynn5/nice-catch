import type { FishBaseEnrichment } from '@/types/scoring'
import { useI18n } from '@/hooks/useI18n'

interface Props {
  fishBaseData?: Partial<FishBaseEnrichment>
  scientificName: string
}

export function SpeciesDetail({ fishBaseData, scientificName }: Props) {
  const { t } = useI18n()

  if (!fishBaseData) return null

  const items = [
    fishBaseData.family && { label: 'Familia', value: fishBaseData.family },
    fishBaseData.habitat && { label: 'Hábitat', value: fishBaseData.habitat },
    fishBaseData.maxLength && { label: 'Longitud máx.', value: `${fishBaseData.maxLength} cm` },
    fishBaseData.trophicLevel && { label: 'Nivel trófico', value: fishBaseData.trophicLevel.toFixed(1) },
  ].filter((x): x is { label: string; value: string } => !!x)

  if (items.length === 0) return null

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
      <h3 className="font-semibold text-gray-800 text-sm">{t('result.species_info')}</h3>
      <p className="text-xs italic text-gray-400">{scientificName}</p>
      <div className="grid grid-cols-2 gap-2">
        {items.map(({ label, value }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-2">
            <p className="text-[10px] text-gray-400">{label}</p>
            <p className="text-xs font-medium text-gray-700">{value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
