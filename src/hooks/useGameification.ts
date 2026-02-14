import { useCallback } from 'react'
import type { UserProfile, BadgeId, ScanHistoryEntry } from '@/types/gamification'
import { BADGES } from '@/types/gamification'
import type { SustainabilityResult } from '@/types/scoring'
import { useAppStore } from '@/store/appStore'

const STORAGE_KEY = 'nicecatch_profile'

const DEFAULT_PROFILE: UserProfile = {
  oceanScore: 0,
  badges: [],
  history: [],
  totalScans: 0,
  highScoreScans: 0,
  alternativesChosen: 0,
  shares: 0,
}

function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PROFILE }
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_PROFILE }
  }
}

function saveProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  } catch {
    // Non-fatal
  }
}

function checkNewBadges(profile: UserProfile): BadgeId[] {
  const earned = new Set(profile.badges.map((b) => b.id))
  const newBadges: BadgeId[] = []

  if (!earned.has('first_catch') && profile.totalScans >= 1) newBadges.push('first_catch')
  if (!earned.has('conscious_choice') && profile.alternativesChosen >= 1) newBadges.push('conscious_choice')
  if (!earned.has('ocean_champion') && profile.highScoreScans >= 10) newBadges.push('ocean_champion')
  if (!earned.has('share_the_wave') && profile.shares >= 1) newBadges.push('share_the_wave')

  return newBadges
}

export function useGameification() {
  const addToast = useAppStore((s) => s.addToast)

  const recordScan = useCallback(
    async (result: SustainabilityResult, choseAlternative = false) => {
      const profile = loadProfile()

      let points = 10
      if (result.score.finalScore > 75) {
        points = 15
        profile.highScoreScans += 1
      }
      if (choseAlternative) {
        points += 25
        profile.alternativesChosen += 1
      }

      // Check for endangered guardian badge
      const isEndangered =
        result.iucnStatus === 'EN' || result.iucnStatus === 'CR'
      if (isEndangered) {
        const alreadyEarned = profile.badges.some((b) => b.id === 'endangered_guardian')
        if (!alreadyEarned) {
          profile.badges.push({ id: 'endangered_guardian', earnedAt: Date.now() })
          addToast('🛡️ Badge: Guardián del Océano', 'success')
        }
      }

      profile.oceanScore += points
      profile.totalScans += 1

      const entry: ScanHistoryEntry = {
        speciesId: result.speciesId,
        displayName: result.displayName,
        score: result.score.finalScore,
        timestamp: Date.now(),
        barcode: result.barcode,
        choseAlternative,
      }
      profile.history = [entry, ...profile.history].slice(0, 50)

      const newBadges = checkNewBadges(profile)
      for (const badgeId of newBadges) {
        profile.badges.push({ id: badgeId, earnedAt: Date.now() })
        const badge = BADGES.find((b) => b.id === badgeId)
        if (badge) addToast(`${badge.icon} Badge: ${badge.name_es}`, 'success')
      }

      saveProfile(profile)

      if (points > 10) {
        addToast(`+${points} pts al Océano`, 'info')
      }

      return { points, newBadges }
    },
    [addToast]
  )

  const recordShare = useCallback(() => {
    const profile = loadProfile()
    profile.shares += 1
    const newBadges = checkNewBadges(profile)
    for (const badgeId of newBadges) {
      profile.badges.push({ id: badgeId, earnedAt: Date.now() })
    }
    saveProfile(profile)
  }, [])

  const getProfile = useCallback((): UserProfile => loadProfile(), [])

  return { recordScan, recordShare, getProfile }
}
