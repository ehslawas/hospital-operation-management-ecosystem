import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui'

interface ComingSoonPlaceholderProps {
    title?: string
    message?: string
    type?: 'construction' | 'locked'
    backPath?: string
    backLabel?: string
    features?: string[]
}

/**
 * ComingSoonPlaceholder
 * 
 * A reusable component to display "Coming Soon" or "Access Restricted" messages.
 * Use this instead of hardcoded placeholders.
 */
const ComingSoonPlaceholder: React.FC<ComingSoonPlaceholderProps> = ({
    title = 'Coming Soon',
    message = 'This feature is currently under development.',
    type = 'construction',
    backPath = '/dashboard',
    backLabel = 'Return to Dashboard',
    features = []
}) => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="max-w-xl w-full text-center space-y-8">
                {/* Icon */}
                <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6 ${type === 'construction' ? 'bg-blue-50' : 'bg-red-50'
                    }`}>
                    {type === 'construction' ? (
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                    ) : (
                        <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    )}
                </div>

                {/* Text */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        {title}
                    </h1>
                    <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                        {message}
                    </p>

                    {features.length > 0 && (
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm max-w-sm mx-auto mb-8 text-left">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 ml-1">Planned Features:</h4>
                            <ul className="space-y-2">
                                {features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center text-sm text-gray-600">
                                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        {type === 'construction' ? 'Feature in Progress' : 'Access Restricted'}
                    </div>
                </div>

                {/* Back Button */}
                <div className="pt-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(backPath)}
                        className="mx-auto"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        {backLabel}
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default ComingSoonPlaceholder
