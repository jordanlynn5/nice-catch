import { openDB } from 'idb'
import type { SustainabilityResult } from '@/types/scoring'

const DB_NAME = 'nice-catch'
const DB_VERSION = 1

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'barcode' })
      }
    },
  })
}

export async function getProductCache(
  barcode: string
): Promise<SustainabilityResult | null> {
  try {
    const db = await getDB()
    const result = await db.get('products', barcode)
    if (!result) return null
    if (Date.now() - result.timestamp > 86400000) return null
    return result
  } catch {
    return null
  }
}

export async function setProductCache(
  barcode: string,
  result: SustainabilityResult
): Promise<void> {
  try {
    const db = await getDB()
    await db.put('products', { ...result, barcode })
  } catch {
    // Non-fatal
  }
}
