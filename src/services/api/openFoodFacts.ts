import ky from 'ky'
import type { ParsedLabel } from '@/types/species'
import { parseBarcodeProduct } from '@/services/parsers/labelParser'

const BASE_URL = 'https://world.openfoodfacts.org'

const REQUESTED_FIELDS = [
  'code', 'product_name', 'product_name_es', 'species', 'brands', 'quantity',
  'origins_tags', 'origins', 'origin',
  'categories_tags', 'labels_tags', 'food_groups_tags',
  'manufacturing_places', 'ingredients_text',
  'ecoscore_grade', 'ecoscore_score', 'ecoscore_data'
].join(',')

interface OFFProduct {
  code: string
  product: {
    product_name?: string
    product_name_es?: string
    species?: string
    categories_tags?: string[]
    origins?: string
    origin?: string
    origins_tags?: string[]
    manufacturing_places?: string
    labels_tags?: string[]
    food_groups_tags?: string[]
    ecoscore_data?: {
      adjustments?: {
        production_system?: {
          labels?: string[]
          value?: number
        }
        origins_of_ingredients?: {
          origins_from_origins_field?: string[]
        }
      }
    }
    [key: string]: unknown
  }
  status: number
  status_verbose: string
}

export async function lookupBarcode(barcode: string): Promise<ParsedLabel | null> {
  try {
    const data = await ky
      .get(`${BASE_URL}/api/v2/product/${barcode}.json?fields=${REQUESTED_FIELDS}`, {
        timeout: 8000,
        retry: 1,
      })
      .json<OFFProduct>()

    if (data.status !== 1) return null

    return parseBarcodeProduct(data.product as Record<string, unknown>)
  } catch {
    return null
  }
}

export async function searchByName(query: string): Promise<string[]> {
  try {
    const data = await ky
      .get(`${BASE_URL}/cgi/search.pl`, {
        searchParams: {
          search_terms: query,
          search_simple: 1,
          action: 'process',
          json: 1,
          page_size: 5,
          categories_tags: 'fish',
        },
        timeout: 5000,
      })
      .json<{ products: Array<{ product_name?: string }> }>()

    return (
      data.products
        ?.map((p) => p.product_name)
        .filter((n): n is string => !!n) ?? []
    )
  } catch {
    return []
  }
}
