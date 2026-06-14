import React from 'react'
import { ChevronRight, Home } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useNavigate } from 'react-router-dom'

interface BreadcrumbItem {
    label: string
    href?: string
}

interface StandardPageLayoutProps {
    title: string
    description?: string
    breadcrumbs?: BreadcrumbItem[]
    actions?: React.ReactNode
    children: React.ReactNode
}

export const StandardPageLayout: React.FC<StandardPageLayoutProps> = ({
    title,
    description,
    breadcrumbs,
    actions,
    children
}) => {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-transparent p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto w-full">
            {/* Header Section */}
            <div className="flex flex-col gap-6 md:gap-0 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                    {/* Breadcrumbs */}
                    {breadcrumbs && breadcrumbs.length > 0 && (
                        <nav className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-900"
                                onClick={() => navigate('/dashboard')} // Default to dashboard or home
                            >
                                <Home className="w-3.5 h-3.5" />
                            </Button>
                            {breadcrumbs.map((item, index) => (
                                <React.Fragment key={index}>
                                    <ChevronRight className="w-3 h-3 text-gray-300" />
                                    {item.href ? (
                                        <button
                                            onClick={() => navigate(item.href!)}
                                            className="hover:text-teal-600 transition-colors"
                                        >
                                            {item.label}
                                        </button>
                                    ) : (
                                        <span className="font-medium text-gray-900 line-clamp-1 max-w-[200px]">
                                            {item.label}
                                        </span>
                                    )}
                                </React.Fragment>
                            ))}
                        </nav>
                    )}

                    {/* Title & Desc */}
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{title}</h1>
                        {description && (
                            <p className="text-lg text-gray-500 mt-2 max-w-4xl leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {actions && (
                    <div className="flex items-center gap-3 pt-2">
                        {actions}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="space-y-6">
                {children}
            </div>
        </div>
    )
}
