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
      className={`${colors[type]} px-4 py-3 rounded-xl shadow-lg text-sm font-medium animate-slide-up flex items-center justify-between`}
      role="alert"
    >
      <span>{message}</span>
      <button onClick={onDismiss} className="ml-3 opacity-70 hover:opacity-100">×</button>
    </div>
  )
}
