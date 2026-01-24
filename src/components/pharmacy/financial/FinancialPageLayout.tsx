import React from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Info } from 'lucide-react'

interface FinancialPageLayoutProps {
    title: string
    description?: string
    icon?: React.ElementType
    breadcrumbs?: { label: string; href?: string; onClick?: () => void }[]
    actions?: React.ReactNode
    children: React.ReactNode
    notice?: {
        title: string
        message: string
        type?: 'info' | 'warning' | 'success'
        onDismiss?: () => void
    }
}

export const FinancialPageLayout: React.FC<FinancialPageLayoutProps> = ({
    title,
    description,
    icon: Icon,
    breadcrumbs = [],
    actions,
    children,
    notice,
}) => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 relative">
            {/* Ambient Background Shapes */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-100/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            <div className="p-6 space-y-6 max-w-[1600px] mx-auto relative z-10">
                {/* Breadcrumbs */}
                <nav className="flex items-center text-xs text-slate-500 mb-2 font-medium tracking-wide uppercase">
                    <span className="hover:text-royal-blue cursor-pointer transition-colors">Financial</span>
                    {breadcrumbs.map((crumb, index) => (
                        <React.Fragment key={index}>
                            <ChevronRight className="w-3 h-3 mx-2 text-slate-300" />
                            <span
                                className={crumb.href || crumb.onClick ? "hover:text-royal-blue cursor-pointer transition-colors" : "text-royal-blue font-bold"}
                                onClick={crumb.onClick}
                            >
                                {crumb.label}
                            </span>
                        </React.Fragment>
                    ))}
                </nav>

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-start gap-5"
                    >
                        {Icon && (
                            <div className="p-3.5 glass rounded-2xl shadow-lg shadow-blue-900/5 mt-1">
                                <Icon className="w-8 h-8 text-royal-blue" />
                            </div>
                        )}
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-none mb-2">
                                {title}
                            </h1>
                            {description && (
                                <p className="text-slate-500 max-w-2xl leading-relaxed">
                                    {description}
                                </p>
                            )}
                        </div>
                    </motion.div>

                    {actions && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-3 self-start lg:self-center"
                        >
                            {actions}
                        </motion.div>
                    )}
                </div>

                {/* Notice Box */}
                {notice && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="relative overflow-hidden"
                    >
                        <div className={`
              rounded-xl p-4 border border-l-4 shadow-sm
              ${notice.type === 'warning'
                                ? 'bg-amber-50/50 border-amber-200 border-l-amber-500'
                                : notice.type === 'success'
                                    ? 'bg-emerald-50/50 border-emerald-200 border-l-emerald-500'
                                    : 'bg-blue-50/50 border-blue-200 border-l-blue-500'
                            }
            `}>
                            <div className="flex items-start gap-3">
                                <div className={`
                  p-1.5 rounded-full
                  ${notice.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                                        notice.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-blue-100 text-blue-600'}
                `}>
                                    <Info className="w-4 h-4" />
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <h3 className={`text-sm font-semibold mb-0.5
                    ${notice.type === 'warning' ? 'text-amber-900' :
                                            notice.type === 'success' ? 'text-emerald-900' :
                                                'text-blue-900'}
                  `}>
                                        {notice.title}
                                    </h3>
                                    <p className={`text-sm
                    ${notice.type === 'warning' ? 'text-amber-700' :
                                            notice.type === 'success' ? 'text-emerald-700' :
                                                'text-blue-700'}
                  `}>
                                        {notice.message}
                                    </p>
                                </div>
                                {notice.onDismiss && (
                                    <button
                                        onClick={notice.onDismiss}
                                        className="p-1 hover:bg-black/5 rounded-lg transition-colors text-slate-400 hover:text-slate-600"
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-6"
                >
                    {children}
                </motion.div>
            </div>
        </div>
    )
}
