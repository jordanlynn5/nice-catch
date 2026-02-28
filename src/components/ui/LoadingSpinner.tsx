interface Props {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ message, size = 'md' }: Props) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full animate-spin`}
        style={{
          border: '4px solid rgba(255, 255, 255, 0.2)',
          borderTopColor: 'rgba(255, 255, 255, 0.9)'
        }}
        role="status"
        aria-label="Cargando"
      />
      {message && <p className="text-sm text-white/80 text-center">{message}</p>}
    </div>
  )
}
