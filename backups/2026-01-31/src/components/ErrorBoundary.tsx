import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from './ui'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/lib/constants'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // In production, you could log to an error reporting service
    // Example: logErrorToService(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return <ErrorFallback error={this.state.error} errorInfo={this.state.errorInfo} onReset={this.handleReset} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  onReset: () => void
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, errorInfo, onReset }) => {
  const navigate = useNavigate()
  const isDevelopment = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-8 h-8 text-error-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Something went wrong</h1>
            <p className="text-slate-600">
              We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
            </p>
          </div>
        </div>

        {isDevelopment && error && (
          <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-900 mb-2">Error Details (Development Only)</h3>
            <p className="text-sm font-mono text-error-600 mb-2">{error.message}</p>
            {errorInfo && (
              <details className="mt-2">
                <summary className="text-sm text-slate-600 cursor-pointer hover:text-slate-900">
                  Stack Trace
                </summary>
                <pre className="mt-2 text-xs text-slate-600 overflow-auto max-h-48 p-2 bg-slate-100 rounded">
                  {errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={onReset} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Try Again
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.DASHBOARD)} leftIcon={<Home className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            If this problem persists, please contact your system administrator or{' '}
            <a href="/inquiry" className="text-primary-600 hover:text-primary-700 underline">
              submit a support request
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  )
}

export default ErrorBoundary

