import type { IUCNStatus } from '@/types/species'

const IUCN_BASE_SCORES: Record<IUCNStatus, number> = {
  LC: 50,
  NT: 40,
  VU: 25,
  EN: 10,
  CR: 0,
  EX: 0,
  DD: 30,
  NE: 30,
}

export function getIUCNBase(status: IUCNStatus | undefined): number {
  if (!status) return 30
  return IUCN_BASE_SCORES[status] ?? 30
}
