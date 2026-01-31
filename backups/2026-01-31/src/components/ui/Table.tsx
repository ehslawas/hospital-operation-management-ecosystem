import React from 'react';
import { FileX2 } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render?: (value: any, item: T) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = any> {
  data?: T[];
  columns?: Column<T>[];
  children?: React.ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
  isLoading?: boolean;
  emptyMessage?: React.ReactNode;
  sortConfig?: { key: string; direction: 'asc' | 'desc' } | null;
  onSort?: (key: string) => void;
  onRowClick?: (item: T) => void;
}

function TableImpl<T>({
  data,
  columns,
  children,
  className = '',
  striped = false,
  hoverable = true,
  isLoading = false,
  emptyMessage = 'No data available',
  sortConfig = null,
  onSort,
  onRowClick,
}: TableProps<T>) {
  // Data-driven rendering
  if (data && columns) {
    return (
      <div className={`w-full overflow-hidden rounded-2xl glass-card ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <TableHeader>
              <TableRow hoverable={false}>
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    sortable={column.sortable}
                    sortDirection={sortConfig && sortConfig.key && sortConfig.key === column.key ? sortConfig.direction : null}
                    onSort={() => onSort?.(column.key)}
                    align={column.align}
                    className={column.className}
                  >
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow hoverable={false}>
                  <TableCell colSpan={columns.length} className="py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableEmpty message={emptyMessage} colSpan={columns.length} />
              ) : (
                data.map((item: any, rowIndex) => (
                  <TableRow
                    key={item.id || rowIndex}
                    hoverable={hoverable}
                    striped={striped}
                    index={rowIndex}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align}
                        className={column.className}
                      >
                        {column.render
                          ? column.render(item[column.key], item)
                          : item[column.key]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </table>
        </div>
      </div>
    );
  }

  // Low-level composition rendering
  return (
    <div className={`w-full overflow-hidden rounded-2xl glass-card ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          {children}
        </table>
      </div>
    </div>
  );
}

interface TableHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function TableHeader({ children, className = '' }: TableHeaderProps) {
  return (
    <thead className={`bg-slate-50/80 border-b border-slate-200/60 ${className}`}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function TableBody({ children, className = '' }: TableBodyProps) {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  striped?: boolean;
  index?: number;
}

export function TableRow({ children, className = '', onClick, hoverable = true, striped = false, index = 0 }: TableRowProps) {
  const stripedClass = striped && index % 2 === 0 ? 'bg-slate-50/30' : 'bg-transparent';
  const hoverClass = hoverable ? 'hover:bg-blue-50/60 transition-colors duration-200' : '';
  const clickableClass = onClick ? 'cursor-pointer' : '';

  return (
    <tr
      className={`border-b border-gray-100 last:border-0 ${stripedClass} ${hoverClass} ${clickableClass} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

interface TableHeadProps {
  children: React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortDirection?: 'asc' | 'desc' | null;
  onSort?: (e: React.MouseEvent) => void;
  align?: 'left' | 'center' | 'right';
}

export function TableHead({
  children,
  className = '',
  sortable = false,
  sortDirection = null,
  onSort,
  align = 'left'
}: TableHeadProps) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const sortableClass = sortable ? 'cursor-pointer select-none hover:bg-blue-100/50 transition-colors' : '';

  return (
    <th
      className={`px-6 py-4 text-xs font-bold text-royal-blue tracking-wider uppercase ${alignClass} ${sortableClass} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className={`flex items-center gap-2 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : ''}`}>
        {children}
        {sortable && (
          <div className="inline-flex flex-col">
            <svg
              className={`w-3 h-3 ${sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 5l-5 5h10l-5-5z" />
            </svg>
            <svg
              className={`w-3 h-3 -mt-1 ${sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M10 15l5-5H5l5 5z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
  rowSpan?: number;
  as?: 'td' | 'th';
}

export function TableCell({ children, className = '', align = 'left', colSpan, rowSpan, as = 'td' }: TableCellProps) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  if (as === 'th') {
    return (
      <th
        className={`px-6 py-4 text-sm font-bold text-gray-700 tracking-wide uppercase ${alignClass} ${className}`}
        colSpan={colSpan}
        rowSpan={rowSpan}
      >
        {children}
      </th>
    );
  }

  return (
    <td
      className={`px-6 py-4 text-sm text-gray-700 ${alignClass} ${className}`}
      colSpan={colSpan}
      rowSpan={rowSpan}
    >
      {children}
    </td>
  );
}

interface TableFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function TableFooter({ children, className = '' }: TableFooterProps) {
  return (
    <tfoot className={`bg-gray-50 border-t-2 border-gray-200 ${className}`}>
      {children}
    </tfoot>
  );
}

interface TableCaptionProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCaption({ children, className = '' }: TableCaptionProps) {
  return (
    <caption className={`px-6 py-4 text-sm text-gray-600 text-left border-b border-gray-200 bg-gray-50/50 ${className}`}>
      {children}
    </caption>
  );
}

// Empty state for tables
interface TableEmptyProps {
  message?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  colSpan?: number;
}

// Import moved to top

export function TableEmpty({
  message = 'No data available',
  icon,
  action,
  colSpan = 100
}: TableEmptyProps) {
  return (
    <TableRow hoverable={false}>
      <TableCell colSpan={colSpan} className="py-16">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="mb-6 p-4 rounded-full bg-slate-50 border border-slate-100 shadow-sm">
            {icon || <FileX2 className="w-10 h-10 text-slate-300" />}
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No records found</h3>
          <p className="text-slate-500 max-w-sm mx-auto mb-6">{message}</p>
          {action && <div>{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Attach sub-components directly to Table function
Object.assign(TableImpl, {
  Head: TableHeader,
  Body: TableBody,
  Row: TableRow,
  Cell: TableCell,
  Header: TableHead,
  Footer: TableFooter,
  Caption: TableCaption,
  Empty: TableEmpty,
});

// Type assertion for TypeScript
type TableWithSubComponents = typeof TableImpl & {
  Head: typeof TableHeader;
  Body: typeof TableBody;
  Row: typeof TableRow;
  Cell: typeof TableCell;
  Header: typeof TableHead;
  Footer: typeof TableFooter;
  Caption: typeof TableCaption;
  Empty: typeof TableEmpty;
};

// Export Table with sub-components attached
export const Table = TableImpl as unknown as TableWithSubComponents;
export default Table;
