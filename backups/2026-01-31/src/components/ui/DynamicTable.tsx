/**
 * DynamicTable Component
 * A reusable table component that renders headers and data dynamically
 * based on the provided configuration
 */

import React from 'react'
import { motion } from 'framer-motion'
import {
    FileText,
    Calendar,
    DollarSign,
    ExternalLink,
    RefreshCw,
    Hash,
    Type,
    Clock,
    Link as LinkIcon,
} from 'lucide-react'

// =====================================================
// TYPES
// =====================================================

export interface DynamicColumn {
    key: string           // Original header from sheet (lowercase)
    label: string         // Display label
    type?: 'text' | 'number' | 'date' | 'currency' | 'link' | 'badge' | 'period'
    width?: string        // CSS width (e.g., 'w-32', '150px')
    align?: 'left' | 'center' | 'right'
    render?: (value: any, row: any, index: number) => React.ReactNode
}

export interface DynamicTableProps {
    headers: string[]                    // Raw headers from Google Sheet
    data: any[]                          // Data rows
    onRowClick?: (row: any, index: number) => void
    loading?: boolean
    emptyMessage?: string
    className?: string
    stickyHeader?: boolean
    showRowNumber?: boolean
    statusKey?: string                   // Key for status column if exists
    getStatusColor?: (status: string) => string
}

// =====================================================
// HEADER TYPE DETECTION
// =====================================================

/**
 * Auto-detect column type based on header name
 */
function detectColumnType(header: string): DynamicColumn['type'] {
    const h = header.toLowerCase()

    // Date patterns
    if (/tarikh|date|mula|tamat|start|end|expir/i.test(h)) return 'date'

    // Currency/value patterns
    if (/harga|price|value|amount|nilai|rm|currency|cost/i.test(h)) return 'currency'

    // Period patterns (combined start/end)
    if (/period|tempoh kontrak|jangka/i.test(h)) return 'period'

    // Link patterns
    if (/sst|pdf|link|url|document|dokumen|file/i.test(h)) return 'link'

    // Status patterns
    if (/status|keadaan|state/i.test(h)) return 'badge'

    // Number patterns
    if (/no\.|no |number|nombor|#|qty|quantity|kuantiti/i.test(h)) return 'number'

    // Default to text
    return 'text'
}

/**
 * Get icon for column type
 */
function getColumnIcon(type: DynamicColumn['type']): React.ReactNode {
    switch (type) {
        case 'date':
            return <Calendar className="w-3 h-3" />
        case 'currency':
            return <DollarSign className="w-3 h-3" />
        case 'link':
            return <LinkIcon className="w-3 h-3" />
        case 'badge':
            return null
        case 'number':
            return <Hash className="w-3 h-3" />
        case 'period':
            return <Clock className="w-3 h-3" />
        default:
            return <Type className="w-3 h-3" />
    }
}

/**
 * Format the header label for display
 */
function formatHeaderLabel(header: string): string {
    // Capitalize first letter of each word
    return header
        .split(/[\s_-]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
}

// =====================================================
// DEFAULT RENDERERS
// =====================================================

/**
 * Default status colors
 */
const defaultStatusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    expired: 'bg-gray-100 text-gray-700 border-gray-200',
    terminated: 'bg-rose-100 text-rose-700 border-rose-200',
    pending: 'bg-amber-100 text-amber-700 border-amber-200',
}

/**
 * Render cell value based on type
 */
function renderCellValue(
    value: any,
    type: DynamicColumn['type'],
    getStatusColor?: (status: string) => string
): React.ReactNode {
    if (value === null || value === undefined || value === '') {
        return <span className="text-gray-400 italic text-xs">-</span>
    }

    switch (type) {
        case 'date':
            try {
                const date = new Date(value)
                if (!isNaN(date.getTime())) {
                    return (
                        <span className="text-gray-700 font-medium text-sm">
                            {date.toLocaleDateString('en-MY', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            })}
                        </span>
                    )
                }
            } catch {
                // Fall through to default
            }
            return <span className="text-gray-700">{String(value)}</span>

        case 'currency':
            const numValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]/g, ''))
            if (!isNaN(numValue)) {
                return (
                    <span className="font-mono text-gray-700">
                        RM {numValue.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
                    </span>
                )
            }
            return <span className="text-gray-700">{String(value)}</span>

        case 'link':
            if (String(value).startsWith('http') || String(value).includes('.pdf')) {
                return (
                    <a
                        href={String(value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-semibold hover:bg-teal-100 transition-colors text-xs"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )
            }
            return <span className="text-gray-700">{String(value)}</span>

        case 'badge':
            const statusStr = String(value).toLowerCase()
            const colorClass = getStatusColor
                ? getStatusColor(statusStr)
                : defaultStatusColors[statusStr] || defaultStatusColors.pending
            return (
                <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border-2 ${colorClass}`}
                >
                    {String(value).toUpperCase()}
                </span>
            )

        case 'number':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-[10px] bg-gray-50 text-gray-600 border border-gray-200">
                    {String(value)}
                </span>
            )

        default:
            // Truncate long text
            const strValue = String(value)
            if (strValue.length > 100) {
                return (
                    <div className="max-w-xs xl:max-w-md truncate" title={strValue}>
                        {strValue}
                    </div>
                )
            }
            return <span className="text-gray-700">{strValue}</span>
    }
}

// =====================================================
// MAIN COMPONENT
// =====================================================

// Comprehensive bidirectional mappings: header key -> database property names
const headerToDbMappings: Record<string, string[]> = {
    // Item / Contract Name
    'item': ['contract_name', 'name', 'item_name', 'description'],
    'nama item': ['contract_name', 'name', 'item_name'],
    'contract name': ['contract_name', 'name'],

    // Contract Number
    'no kontrak': ['contract_number', 'contract_no', 'kontrak_no'],
    'no. kontrak': ['contract_number', 'contract_no'],
    'nombor kontrak': ['contract_number'],
    'contract no': ['contract_number'],
    'contract number': ['contract_number'],

    // Supplier
    'pembekal': ['supplier_name', 'supplier', 'vendor'],
    'supplier': ['supplier_name'],
    'vendor': ['supplier_name'],
    'supplier name': ['supplier_name'],

    // Start Date
    'kontrak mula': ['start_date', 'contract_start', 'mula'],
    'tarikh mula': ['start_date'],
    'start date': ['start_date'],

    // End Date  
    'kontrak tamat': ['end_date', 'contract_end', 'tamat'],
    'tarikh tamat': ['end_date'],
    'end date': ['end_date'],

    // Value / Price
    'harga (rm)': ['value', 'total_value', 'price', 'amount', 'harga'],
    'harga': ['value', 'total_value', 'price'],
    'nilai': ['value', 'total_value'],
    'price': ['value', 'total_value', 'price'],
    'value': ['value', 'total_value'],

    // Unit
    'unit': ['unit', 'unit_type'],

    // Tempoh Serahan (Delivery Period)
    'tempoh serahan': ['tempoh_serahan', 'delivery_period', 'serahan'],
    'delivery period': ['tempoh_serahan', 'delivery_period'],

    // SST Document
    'sst': ['sst', 'sst_document', 'sst_url', 'sst_link'],
    'dokumen sst': ['sst', 'sst_document'],

    // Status
    'status': ['status', 'contract_status'],
    'keadaan': ['status'],

    // Currency
    'currency': ['currency', 'mata_wang'],
    'mata wang': ['currency'],
}

export const DynamicTable: React.FC<DynamicTableProps> = ({
    headers,
    data,
    onRowClick,
    loading = false,
    emptyMessage = 'No data available',
    className = '',
    stickyHeader = false,
    showRowNumber = true,
    getStatusColor,
}) => {
    // Generate columns from headers
    const columns: DynamicColumn[] = headers.map(header => ({
        key: header.toLowerCase(),
        label: formatHeaderLabel(header),
        type: detectColumnType(header),
    }))

    // Find the value for a cell based on header key
    const getCellValue = (row: any, column: DynamicColumn): any => {
        const colKey = column.key?.toLowerCase().trim()
        if (!colKey) return '-'

        // Check metadata for the header key (case insensitive) - Metadata has high priority for custom columns
        if (row.metadata && typeof row.metadata === 'object') {
            const metaKeys = Object.keys(row.metadata)
            for (const key of metaKeys) {
                if (key.toLowerCase().trim() === colKey) {
                    return row.metadata[key]
                }
            }
        }

        // Try mapping from header to database property
        const dbProperties = headerToDbMappings[colKey] || []
        for (const prop of dbProperties) {
            if (row[prop] !== undefined && row[prop] !== null && row[prop] !== '') {
                return row[prop]
            }
        }

        // Try direct match on row properties (case insensitive, handle underscores)
        const rowKeys = Object.keys(row)
        for (const key of rowKeys) {
            const normalizedKey = key.toLowerCase().replace(/_/g, ' ')
            if (normalizedKey === colKey || key.toLowerCase() === colKey) {
                return row[key]
            }
        }

        // Partial mapping match (if column header contains any of our known keywords)
        const partialMatches = Object.entries(headerToDbMappings).filter(([key]) =>
            colKey.includes(key) || key.includes(colKey)
        )

        for (const [_, props] of partialMatches) {
            const propArray = props as string[]
            for (const prop of propArray) {
                if (row[prop] !== undefined && row[prop] !== null && row[prop] !== '') {
                    return row[prop]
                }
            }
        }

        // Deep search in metadata if not found by exact match
        if (row.metadata && typeof row.metadata === 'object') {
            const metaKeys = Object.keys(row.metadata)
            for (const key of metaKeys) {
                const normalizedKey = key.toLowerCase().trim().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ')
                if (colKey.includes(normalizedKey) || normalizedKey.includes(colKey)) {
                    return row.metadata[key]
                }
            }
        }

        return '-'
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-2xl border-2 border-gray-200">
                <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
            </div>
        )
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border-2 border-gray-200">
                <FileText className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-gray-500 font-medium">{emptyMessage}</p>
            </div>
        )
    }

    return (
        <div className={`bg-white rounded-2xl border-2 border-gray-200 overflow-hidden shadow-sm ${className}`}>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className={stickyHeader ? 'sticky top-0 z-10' : ''}>
                        <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                            {showRowNumber && (
                                <th className="px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                                    No
                                </th>
                            )}
                            {columns.map((column, idx) => (
                                <th
                                    key={`header-${idx}-${column.key}`}
                                    className={`px-4 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider ${column.width || ''
                                        } ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'}`}
                                >
                                    <div className="flex items-center gap-1.5">
                                        {getColumnIcon(column.type)}
                                        <span>{column.label}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.map((row, rowIndex) => (
                            <motion.tr
                                key={`row-${rowIndex}-${row.id || rowIndex}`}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(rowIndex * 0.02, 0.5) }}
                                className={`hover:bg-teal-50/30 transition-colors group text-sm ${onRowClick ? 'cursor-pointer' : ''
                                    }`}
                                onClick={() => onRowClick?.(row, rowIndex)}
                            >
                                {showRowNumber && (
                                    <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                        {rowIndex + 1}
                                    </td>
                                )}
                                {columns.map((column, colIndex) => {
                                    const value = getCellValue(row, column)
                                    return (
                                        <td
                                            key={`cell-${rowIndex}-${colIndex}`}
                                            className={`px-4 py-3 ${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''
                                                }`}
                                        >
                                            {renderCellValue(value, column.type, getStatusColor)}
                                        </td>
                                    )
                                })}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer with row count */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                <span>Showing {data.length} row{data.length !== 1 ? 's' : ''}</span>
                <span>{columns.length} column{columns.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    )
}

export default DynamicTable
