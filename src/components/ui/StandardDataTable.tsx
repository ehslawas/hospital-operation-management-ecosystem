import React from 'react'
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { ChevronLeft, ChevronRight, Inbox, AlertCircle } from 'lucide-react'

export interface Column<T> {
    header: string
    accessorKey?: keyof T
    cell?: (item: T) => React.ReactNode
    className?: string
}

interface PaginationProps {
    page: number
    pageSize: number
    totalItems: number
    onPageChange: (page: number) => void
}

interface StandardDataTableProps<T> {
    columns: Column<T>[]
    data: T[]
    isLoading?: boolean
    error?: string | null
    pagination?: PaginationProps
    keyExtractor: (item: T) => string | number
    onRowClick?: (item: T) => void
    emptyMessage?: string
    actionButton?: React.ReactNode // Button shown in empty state
}

export function StandardDataTable<T>({
    columns,
    data,
    isLoading = false,
    error = null,
    pagination,
    keyExtractor,
    onRowClick,
    emptyMessage = "No items found",
    actionButton
}: StandardDataTableProps<T>) {

    // Helper to render cell content
    const renderCell = (item: T, column: Column<T>) => {
        if (column.cell) return column.cell(item)
        if (column.accessorKey) return item[column.accessorKey] as React.ReactNode
        return null
    }

    const totalPages = pagination
        ? Math.max(1, Math.ceil(pagination.totalItems / pagination.pageSize))
        : 1

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            {/* Loading Overlay */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 min-h-[300px]">
                    <Spinner size="lg" className="text-teal-600 mb-4" />
                    <p className="text-gray-500 font-medium animate-pulse">Loading data...</p>
                </div>
            )}

            {/* Error State */}
            {!isLoading && error && (
                <div className="flex flex-col items-center justify-center flex-1 py-12 px-4 text-center">
                    <div className="bg-rose-50 p-4 rounded-full mb-4">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Something went wrong</h3>
                    <p className="text-gray-500 mt-1 max-w-md">{error}</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !error && data.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 py-20 px-4 text-center">
                    <div className="bg-gray-50 p-6 rounded-full mb-4 shadow-inner">
                        <Inbox className="w-10 h-10 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">No items found</h3>
                    <p className="text-gray-500 mt-1 max-w-md mb-6">{emptyMessage}</p>
                    {actionButton}
                </div>
            )}

            {/* Data Table */}
            {!isLoading && !error && data.length > 0 && (
                <>
                    <div className="flex-1 overflow-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-sm border-b border-gray-100">
                                <TableRow className="hover:bg-transparent border-none">
                                    {columns.map((col, idx) => (
                                        <TableCell
                                            key={idx}
                                            as="th"
                                            className={`
                                                py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider 
                                                ${col.className || ''}
                                            `}
                                        >
                                            {col.header}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow
                                        key={keyExtractor(item)}
                                        className={`
                                            group transition-colors border-b border-gray-50 hover:bg-gray-50/50
                                            ${onRowClick ? 'cursor-pointer' : ''}
                                        `}
                                        onClick={() => onRowClick && onRowClick(item)}
                                    >
                                        {columns.map((col, idx) => (
                                            <TableCell key={idx} className={`py-4 px-6 ${col.className || ''}`}>
                                                {renderCell(item, col)}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Footer */}
                    {pagination && (
                        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs text-gray-500 font-medium">
                                Showing <span className="font-bold text-gray-900">
                                    {((pagination.page - 1) * pagination.pageSize) + 1}
                                </span> to <span className="font-bold text-gray-900">
                                    {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)}
                                </span> of <span className="font-bold text-gray-900">
                                    {pagination.totalItems}
                                </span> items
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page === 1}
                                    onClick={() => pagination.onPageChange(Math.max(1, pagination.page - 1))}
                                    className="h-8 px-3 text-xs border-gray-200 bg-white hover:bg-gray-50 hover:text-teal-600 transition-colors"
                                >
                                    <ChevronLeft className="w-3 h-3 mr-1" />
                                    Previous
                                </Button>

                                <span className="text-xs font-semibold text-gray-700 px-2 min-w-[3rem] text-center">
                                    Page {pagination.page}
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pagination.page >= totalPages}
                                    onClick={() => pagination.onPageChange(Math.min(totalPages, pagination.page + 1))}
                                    className="h-8 px-3 text-xs border-gray-200 bg-white hover:bg-gray-50 hover:text-teal-600 transition-colors"
                                >
                                    Next
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
