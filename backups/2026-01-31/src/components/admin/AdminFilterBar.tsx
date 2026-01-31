import React from 'react'
import { Search, RotateCcw, Filter } from 'lucide-react'
import { Button } from '@/components/ui'

export interface FilterOption {
    label: string
    value: string
}

interface AdminFilterBarProps {
    // Search
    onSearchChange: (value: string) => void
    searchValue: string
    searchPlaceholder?: string

    // Filters
    filters?: {
        key: string
        label: string
        value: string
        options: readonly FilterOption[] | FilterOption[]
        onChange: (value: string) => void
        disabled?: boolean
    }[]

    // Actions
    onReset?: () => void
    className?: string
}

export const AdminFilterBar: React.FC<AdminFilterBarProps> = ({
    onSearchChange,
    searchValue,
    searchPlaceholder = 'Search...',
    filters = [],
    onReset,
    className = '',
}) => {
    return (
        <div className={`glass-card rounded-2xl p-4 shadow-sm ${className}`}>
            <div className="flex flex-col lg:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    />
                </div>

                {/* Filters Group */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Dynamic Filters */}
                    {filters.map((filter) => (
                        <div key={filter.key} className="relative min-w-[200px] flex-1 lg:flex-none">
                            <select
                                value={filter.value}
                                onChange={(e) => filter.onChange(e.target.value)}
                                disabled={filter.disabled}
                                className="w-full appearance-none pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all cursor-pointer hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="all">All {filter.label}</option>
                                {filter.options.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                <Filter className="w-3.5 h-3.5 text-slate-400" />
                            </div>
                        </div>
                    ))}

                    {/* Reset Button */}
                    {onReset && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onReset}
                            className="px-3 h-[42px] text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                            title="Reset Filters"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
