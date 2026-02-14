import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <p className="text-4xl mb-3">🐠</p>
            <p className="text-gray-700 font-medium">Algo salió mal</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="mt-4 text-primary text-sm underline"
            >
              Intentar de nuevo
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
