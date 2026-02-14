import { useAppStore } from '@/store/appStore'

export function LanguageToggle() {
  const { language, setLanguage } = useAppStore((s) => ({
    language: s.language,
    setLanguage: s.setLanguage,
  }))

  return (
    <button
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className="text-xs font-semibold px-2 py-1 rounded-full border border-white/40 text-white/90 hover:bg-white/20 transition-colors"
      aria-label="Toggle language"
    >
      {language === 'es' ? 'EN' : 'ES'}
    </button>
  )
}
