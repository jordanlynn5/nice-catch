import ky from 'ky'
import type { ParsedLabel } from '@/types/species'
import { parseBarcodeProduct } from '@/services/parsers/labelParser'

const BASE_URL = 'https://world.openfoodfacts.org'

interface OFFProduct {
  code: string
  product: {
    product_name?: string
    product_name_es?: string
    species?: string
    categories_tags?: string[]
    origins?: string
    origin?: string
    manufacturing_places?: string
    labels_tags?: string[]
    [key: string]: unknown
  }
  status: number
  status_verbose: string
}

export async function lookupBarcode(barcode: string): Promise<ParsedLabel | null> {
  try {
    const data = await ky
      .get(`${BASE_URL}/api/v2/product/${barcode}.json`, {
        timeout: 8000,
        retry: 1,
      })
      .json<OFFProduct>()

    if (data.status !== 1) return null

    const product = data.product
    const parsed = parseBarcodeProduct(product as Record<string, unknown>)

    // Also look for certifications in labels_tags
    const labelTags = product.labels_tags ?? []
    const certs: string[] = []
    if (labelTags.some((t: string) => t.includes('msc'))) certs.push('MSC')
    if (labelTags.some((t: string) => t.includes('asc'))) certs.push('ASC')
    if (certs.length > 0) parsed.certifications = certs

    return parsed
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
