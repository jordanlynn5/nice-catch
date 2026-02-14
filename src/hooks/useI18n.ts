import { useAppStore } from '@/store/appStore'
import esStrings from '@/i18n/es.json'
import enStrings from '@/i18n/en.json'

type Strings = typeof esStrings

function get(obj: Record<string, unknown>, path: string): string {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (typeof current !== 'object' || current === null) return path
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : path
}

export function useI18n() {
  const language = useAppStore((s) => s.language)
  const strings = (language === 'en' ? enStrings : esStrings) as unknown as Record<string, unknown>

  function t(key: string, vars?: Record<string, string | number>): string {
    let str = get(strings, key)
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, String(v))
      }
    }
    return str
  }

  return { t, language }
}
