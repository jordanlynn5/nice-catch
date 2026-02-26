import { useEffect } from 'react'
import { useAppStore } from '@/store/appStore'

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)
  const removeToast = useAppStore((s) => s.removeToast)

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
  onDismiss: () => void
}

function ToastItem({ message, type, onDismiss }: ToastItemProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const colors = {
    success: 'bg-deep text-white',
    error: 'bg-danger text-white',
    info: 'bg-primary text-white',
  }

  return (
    <div
      className={`${colors[type]} px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up flex items-center justify-between gap-3`}
      role="alert"
    >
      <span className="flex-1">{message}</span>
      <button
        onClick={onDismiss}
        className="shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-white/20 transition-colors text-lg"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  )
}
