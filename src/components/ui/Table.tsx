import React from 'react'
import { cn } from '@/lib/utils'
import type { Column, SortConfig } from '@/types'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface TableProps {
  children?: React.ReactNode
  className?: string
  // Data-driven table props
  data?: any[]
  columns?: Column<any>[]
  sortConfig?: SortConfig
  onSort?: (key: string) => void
  isLoading?: boolean
  emptyMessage?: string
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  as?: 'th' | 'td'
  className?: string
  colSpan?: number
}

// Main Table component
function Table({ 
  children, 
  className,
  data,
  columns,
  sortConfig,
  onSort,
  isLoading,
  emptyMessage = 'No data available'
}: TableProps) {
  // If data and columns are provided, render data-driven table
  if (data !== undefined && columns) {
    return (
      <div className={cn('overflow-x-auto', className)}>
        <table className="w-full border-collapse">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => {
                const isSorted = sortConfig?.key === column.key
                const sortDirection = isSorted ? sortConfig.direction : undefined
                
                return (
                  <th
                    key={column.key as string}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider',
                      column.sortable && 'cursor-pointer select-none hover:bg-gray-100',
                      column.className
                    )}
                    onClick={() => column.sortable && onSort?.(column.key as string)}
                  >
                    <div className="flex items-center gap-2">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <span className="flex flex-col">
                          <ChevronUp
                            className={cn(
                              'w-3 h-3',
                              sortDirection === 'asc' ? 'text-teal-600' : 'text-gray-400'
                            )}
                          />
                          <ChevronDown
                            className={cn(
                              'w-3 h-3 -mt-1',
                              sortDirection === 'desc' ? 'text-teal-600' : 'text-gray-400'
                            )}
                          />
                        </span>
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr
                  key={row.id || index}
                  className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => {
                    const value = row[column.key as keyof typeof row]
                    return (
                      <td
                        key={column.key as string}
                        className={cn('px-6 py-4 text-sm text-gray-900', column.className)}
                      >
                        {column.render ? column.render(value, row) : (value ?? '-')}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    )
  }

  // Otherwise, render children-based table (backward compatibility)
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        {children}
      </table>
    </div>
  )
}

// Table Head component
function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead className={className}>
      {children}
    </thead>
  )
}

// Table Body component
function TableBody({ children, className }: TableBodyProps) {
  return (
    <tbody className={cn('bg-white divide-y divide-gray-200', className)}>
      {children}
    </tbody>
  )
}

// Table Row component
function TableRow({ children, className, onClick }: TableRowProps) {
  return (
    <tr
      className={cn(
        'border-b border-gray-200 hover:bg-gray-50 transition-colors',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

// Table Cell component
function TableCell({ children, as: Component = 'td', className, colSpan }: TableCellProps) {
  const isHeader = Component === 'th'
  return (
    <Component
      className={cn(
        isHeader
          ? 'px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50'
          : 'px-6 py-4 text-sm text-gray-900',
        className
      )}
      colSpan={colSpan}
    >
      {children}
    </Component>
  )
}

// Attach subcomponents to Table
Table.Head = TableHead
Table.Body = TableBody
Table.Row = TableRow
Table.Cell = TableCell

export { Table }
export default Table

