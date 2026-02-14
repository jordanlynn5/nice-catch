import { openDB } from 'idb'
import type { SustainabilityResult } from '@/types/scoring'

const DB_NAME = 'nice-catch'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('species')) {
        db.createObjectStore('species', { keyPath: 'speciesId' })
      }
      if (!db.objectStoreNames.contains('co2')) {
        db.createObjectStore('co2', { keyPath: 'scientificName' })
      }
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'barcode' })
      }
    },
  })
}

export async function getSpeciesCache(
  speciesId: string
): Promise<SustainabilityResult | null> {
  try {
    const db = await getDB()
    const result = await db.get('species', speciesId)
    if (!result) return null
    // Expire after 24 hours
    if (Date.now() - result.timestamp > 86400000) return null
    return result
  } catch {
    return null
  }
}

export async function setSpeciesCache(result: SustainabilityResult): Promise<void> {
  try {
    const db = await getDB()
    await db.put('species', result)
  } catch {
    // Non-fatal
  }
}

export async function getCO2Cache(scientificName: string): Promise<number | null> {
  try {
    const db = await getDB()
    const record = await db.get('co2', scientificName)
    return record?.value ?? null
  } catch {
    return null
  }
}

export async function setCO2Cache(
  scientificName: string,
  value: number
): Promise<void> {
  try {
    const db = await getDB()
    await db.put('co2', { scientificName, value, timestamp: Date.now() })
  } catch {
    // Non-fatal
  }
}
