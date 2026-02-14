import ky from 'ky'
import type { IUCNStatus } from '@/types/species'

export async function fetchIUCNStatus(
  scientificName: string
): Promise<IUCNStatus | null> {
  try {
    const data = await ky
      .get('/api/iucn', {
        searchParams: { species: scientificName },
        timeout: 5000,
        retry: 1,
      })
      .json<{ status: IUCNStatus }>()

    return data.status ?? null
  } catch {
    return null
  }
}
