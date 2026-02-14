export type BadgeId =
  | 'first_catch'
  | 'conscious_choice'
  | 'endangered_guardian'
  | 'ocean_champion'
  | 'share_the_wave'

export interface Badge {
  id: BadgeId
  name_es: string
  name_en: string
  description_es: string
  description_en: string
  icon: string
  condition: string
}

export interface EarnedBadge {
  id: BadgeId
  earnedAt: number
}

export interface ScanHistoryEntry {
  speciesId: string
  displayName: string
  score: number
  timestamp: number
  barcode?: string
  choseAlternative?: boolean
}

export interface UserProfile {
  oceanScore: number
  badges: EarnedBadge[]
  history: ScanHistoryEntry[]
  totalScans: number
  highScoreScans: number
  alternativesChosen: number
  shares: number
}

export const BADGES: Badge[] = [
  {
    id: 'first_catch',
    name_es: 'Primera Captura',
    name_en: 'First Catch',
    description_es: '¡Completaste tu primer escaneo!',
    description_en: 'You completed your first scan!',
    icon: '🐟',
    condition: 'first_scan',
  },
  {
    id: 'conscious_choice',
    name_es: 'Elección Consciente',
    name_en: 'Conscious Choice',
    description_es: 'Elegiste una alternativa más sostenible',
    description_en: 'You chose a more sustainable alternative',
    icon: '🌊',
    condition: 'first_alternative',
  },
  {
    id: 'endangered_guardian',
    name_es: 'Guardián del Océano',
    name_en: 'Endangered Guardian',
    description_es: 'Escaneaste y evitaste una especie amenazada',
    description_en: 'You scanned and avoided an endangered species',
    icon: '🛡️',
    condition: 'avoided_endangered',
  },
  {
    id: 'ocean_champion',
    name_es: 'Campeón del Mar',
    name_en: 'Ocean Champion',
    description_es: '10 escaneos con puntuación > 75',
    description_en: '10 scans with score > 75',
    icon: '🏆',
    condition: 'ten_high_scores',
  },
  {
    id: 'share_the_wave',
    name_es: 'Comparte la Ola',
    name_en: 'Share the Wave',
    description_es: 'Compartiste tu primer badge',
    description_en: 'You shared your first badge',
    icon: '📢',
    condition: 'first_share',
  },
]
