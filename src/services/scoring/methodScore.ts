import fishingMethods from '@/data/fishing-methods.json'

type MethodKey = keyof typeof fishingMethods

const EU_GEAR_TO_METHOD: Record<string, MethodKey> = {
  OTB: 'bottom_trawl',
  PTB: 'bottom_trawl',
  TBB: 'beam_trawl',
  DRB: 'dredge',
  DRH: 'dredge',
  OTM: 'midwater_trawl',
  PTM: 'midwater_trawl',
  PS: 'purse_seine',
  GN: 'gillnet',
  GNS: 'gillnet',
  GND: 'gillnet',
  LHP: 'longline_pelagic',
  LL: 'longline_pelagic',
  LLD: 'longline_demersal',
  LHM: 'longline_demersal',
  FPO: 'trap_pot',
  FYK: 'trap_pot',
  LTL: 'pole_and_line',
  LLS: 'hook_and_line',
  LHT: 'hook_and_line',
}

export function getMethodModifier(method: string | undefined): number {
  if (!method) return 0
  const lower = method.toLowerCase().replace(/[-\s]/g, '_')

  if (lower in fishingMethods) {
    return (fishingMethods as Record<string, { modifier: number }>)[lower].modifier
  }

  const upperMethod = method.toUpperCase()
  if (upperMethod in EU_GEAR_TO_METHOD) {
    const key = EU_GEAR_TO_METHOD[upperMethod]
    return fishingMethods[key].modifier
  }

  // Partial text match
  for (const [key, val] of Object.entries(fishingMethods)) {
    const entry = val as { name: string; name_en: string; modifier: number }
    if (
      entry.name.toLowerCase().includes(lower) ||
      entry.name_en.toLowerCase().includes(lower) ||
      lower.includes(key)
    ) {
      return entry.modifier
    }
  }

  return 0
}

export function resolveMethodKey(method: string | undefined): MethodKey {
  if (!method) return 'unknown'
  const lower = method.toLowerCase().replace(/[-\s]/g, '_')
  if (lower in fishingMethods) return lower as MethodKey
  const upperMethod = method.toUpperCase()
  if (upperMethod in EU_GEAR_TO_METHOD) return EU_GEAR_TO_METHOD[upperMethod]
  return 'unknown'
}
