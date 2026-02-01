import React from 'react'
import { Search, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'

interface FilterOption {
    label: string
    value: string
}

interface FilterSelectProps {
    label: string
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
}

interface FilterToolbarProps {
    searchPlaceholder?: string
    searchTerm: string
    onSearchChange: (value: string) => void

    // Optional filters (array of selects)
    filters?: FilterSelectProps[]

    // Optional standard filters
    statusFilter?: {
        value: string
        onChange: (value: string) => void
        options?: FilterOption[] // Defaults to "All", "Active", "Inactive" if not provided
    }

    // View options
    pageSize?: {
        value: number
        onChange: (value: number) => void
        options?: number[]
    }

    // Actions
    onClearAll?: () => void
    className?: string
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
    searchPlaceholder = "Search...",
    searchTerm,
    onSearchChange,
    filters = [],
    statusFilter,
    pageSize,
    onClearAll,
    className = ""
}) => {

    const hasActiveFilters =
        searchTerm !== '' ||
        (statusFilter && statusFilter.value !== 'all') ||
        filters.some(f => f.value !== 'all' && f.value !== '')

    return (
        <div className={`p-1 bg-white rounded-2xl border border-gray-200 shadow-sm ${className}`}>
            <div className="flex flex-col md:flex-row gap-2 p-1">
                {/* Search Bar - Grows to fill space */}
                <div className="relative flex-1">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="text"
                        placeholder={searchPlaceholder}
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white text-sm text-gray-900 rounded-xl border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-teal-500 transition-all placeholder:text-gray-400"
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                    />
                </div>

                {/* Filters Section */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">

                    {/* Dynamic Filters */}
                    {filters.map((filter, idx) => (
                        <div key={idx} className="flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3 py-1 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-400 mr-2">{filter.label}:</span>
                            <select
                                value={filter.value}
                                onChange={(e) => filter.onChange(e.target.value)}
                                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 focus:outline-none cursor-pointer border-none min-w-[80px]"
                            >
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    {/* Standard Status Filter */}
                    {statusFilter && (
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3 py-1 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-400 mr-2">Status:</span>
                            <select
                                value={statusFilter.value}
                                onChange={(e) => statusFilter.onChange(e.target.value)}
                                className="bg-transparent text-sm font-medium text-gray-700 py-1.5 focus:outline-none cursor-pointer border-none min-w-[80px]"
                            >
                                {(statusFilter.options || [
                                    { label: 'All Statuses', value: 'all' },
                                    { label: 'Active', value: 'active' },
                                    { label: 'Inactive', value: 'inactive' }
                                ]).map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Page Size */}
                    {pageSize && (
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-100 px-3 py-1 flex-shrink-0">
                            <span className="text-xs font-medium text-gray-400 mr-2">Rows:</span>
                            <select
                                value={pageSize.value}
                                onChange={(e) => pageSize.onChange(parseInt(e.target.value))}
                                className="bg-transparent text-sm font-bold text-gray-700 py-1.5 pr-1 focus:outline-none cursor-pointer border-none"
                            >
                                {(pageSize.options || [10, 25, 50, 100]).map(size => (
                                    <option key={size} value={size}>{size}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Clear Button */}
                    {hasActiveFilters && onClearAll && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClearAll}
                            className="h-9 px-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex-shrink-0"
                            title="Clear all filters"
                        >
                            <X className="w-4 h-4" />
                            <span className="sr-only">Clear</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
