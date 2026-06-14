import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Button } from './ui'

interface Props {
    children: ReactNode
    fallbackMessage?: string
}

interface State {
    hasError: boolean
    error: Error | null
}

/**
 * Page-level ErrorBoundary for isolating errors to individual routes.
 * This prevents a single page crash from taking down the entire app.
 */
export class PageErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props)
        this.state = {
            hasError: false,
            error: null,
        }
    }

    static getDerivedStateFromError(error: Error): State {
        return {
            hasError: true,
            error,
        }
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (import.meta.env.DEV) {
            console.error('[PageErrorBoundary] Error caught:', error, errorInfo)
        }
    }

    handleRetry = () => {
        this.setState({ hasError: false, error: null })
    }

    handleGoBack = () => {
        window.history.back()
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-[400px] flex items-center justify-center p-6">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center">
                        <div className="w-14 h-14 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-7 h-7 text-amber-600" />
                        </div>

                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            {this.props.fallbackMessage || 'This page encountered an error'}
                        </h2>

                        <p className="text-sm text-slate-600 mb-6">
                            The rest of the application is still working. You can try again or go back.
                        </p>

                        {import.meta.env.DEV && this.state.error && (
                            <div className="mb-4 p-3 bg-slate-50 rounded-lg text-left">
                                <p className="text-xs font-mono text-red-600 break-all">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={this.handleGoBack}
                                leftIcon={<ArrowLeft className="w-4 h-4" />}
                            >
                                Go Back
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={this.handleRetry}
                                leftIcon={<RefreshCw className="w-4 h-4" />}
                            >
                                Try Again
                            </Button>
                        </div>
                    </div>
                </div>
            )
        }

        return this.props.children
    }
}

export default PageErrorBoundary
