import { Routes, Route, useNavigate, useLocation } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { ResultPage } from '@/pages/ResultPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { AboutPage } from '@/pages/AboutPage'
import { ToastContainer } from '@/components/ui/Toast'
import { OfflineBanner } from '@/components/ui/OfflineBanner'
import { LanguageToggle } from '@/components/ui/LanguageToggle'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useI18n } from '@/hooks/useI18n'

const NAV_ITEMS = [
  { path: '/', label_key: 'nav.scan', icon: '' },
  { path: '/profile', label_key: 'nav.profile', icon: '' },
  { path: '/about', label_key: 'nav.about', icon: '' },
] as const

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useI18n()

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/result'
    return location.pathname === path
  }

  return (
    <nav className="bg-white border-t safe-area-inset-bottom px-4 py-3" style={{ borderColor: '#f5e6d3' }}>
      <div className="flex items-center justify-center gap-3">
        {NAV_ITEMS.map(({ path, label_key }) => {
          const active = isActive(path)
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all active:scale-95 shadow-sm"
              style={{
                backgroundColor: active ? '#0891b2' : 'white',
                color: active ? 'white' : '#1e3a5f',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: active ? '#0891b2' : '#f5e6d3'
              }}
            >
              {t(label_key)}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function TopBar() {
  const { t } = useI18n()

  return (
    <header className="bg-gradient-to-r from-deep to-primary text-white px-4 py-3 flex items-center justify-between safe-area-inset-top">
      <div className="flex items-center gap-2">
        <span className="font-bold text-base">{t('app_name')}</span>
      </div>
      <LanguageToggle />
    </header>
  )
}

export function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 flex flex-col max-w-lg mx-auto">
        <OfflineBanner />
        <TopBar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/result" element={<ResultPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/about" element={<AboutPage />} />
            </Routes>
          </ErrorBoundary>
        </main>
        <BottomNav />
        <ToastContainer />
      </div>
    </ErrorBoundary>
  )
}
