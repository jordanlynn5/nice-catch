import { create } from 'zustand'
import type { SustainabilityResult } from '@/types/scoring'

type Language = 'es' | 'en'
type InputMode = 'barcode' | 'camera' | 'manual'
type AppPage = 'home' | 'result' | 'profile' | 'about'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppState {
  language: Language
  currentPage: AppPage
  inputMode: InputMode
  isLoading: boolean
  loadingMessage: string
  currentResult: SustainabilityResult | null
  isOffline: boolean
  toasts: Toast[]
  scannerActive: boolean

  setLanguage: (lang: Language) => void
  setCurrentPage: (page: AppPage) => void
  setInputMode: (mode: InputMode) => void
  setLoading: (loading: boolean, message?: string) => void
  setCurrentResult: (result: SustainabilityResult | null) => void
  setOffline: (offline: boolean) => void
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void
  setScannerActive: (active: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  language: (navigator.language?.startsWith('en') ? 'en' : 'es') as Language,
  currentPage: 'home',
  inputMode: 'barcode',
  isLoading: false,
  loadingMessage: '',
  currentResult: null,
  isOffline: !navigator.onLine,
  toasts: [],
  scannerActive: false,

  setLanguage: (language) => set({ language }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setInputMode: (inputMode) => set({ inputMode }),
  setLoading: (isLoading, loadingMessage = '') => set({ isLoading, loadingMessage }),
  setCurrentResult: (currentResult) => set({ currentResult }),
  setOffline: (isOffline) => set({ isOffline }),
  addToast: (message, type = 'info') =>
    set((state) => ({
      toasts: [...state.toasts, { id: Date.now().toString(), message, type }],
    })),
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  setScannerActive: (scannerActive) => set({ scannerActive }),
}))
