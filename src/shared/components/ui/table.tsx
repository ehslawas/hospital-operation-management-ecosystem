import React from 'react';

interface TableProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function Table({ children, className = '', striped = false, hoverable = true }: TableProps) {
  return (
    <div className={`w-full overflow-hidden rounded-xl border border-gray-200/70 bg-white shadow-md ${className}`}>
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
    <thead className={`bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/30 border-b-2 border-gray-200 ${className}`}>
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: React.ReactNode;
  className?: string;
  striped?: boolean;
  hoverable?: boolean;
}

export function TableBody({ children, className = '', striped = false, hoverable = true }: TableBodyProps) {
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
  const stripedClass = striped && index % 2 === 0 ? 'bg-gray-50/50' : 'bg-white';
  const hoverClass = hoverable ? 'hover:bg-blue-50/50 transition-colors duration-150' : '';
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
  onSort?: () => void;
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
      className={`px-6 py-4 text-sm font-bold text-gray-700 tracking-wide uppercase ${alignClass} ${sortableClass} ${className}`}
      onClick={sortable ? onSort : undefined}
    >
      <div className="flex items-center gap-2">
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
  as?: 'td' | 'th';
}

export function TableCell({ children, className = '', align = 'left', colSpan, as: Component = 'td' }: TableCellProps) {
  const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  const baseClass = Component === 'th' 
    ? 'px-6 py-4 text-sm font-bold text-gray-700 tracking-wide uppercase'
    : 'px-6 py-4 text-sm text-gray-700';

  return (
    <Component 
      className={`${baseClass} ${alignClass} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </Component>
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
  message?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function TableEmpty({ 
  message = 'No data available', 
  icon,
  action 
}: TableEmptyProps) {
  return (
    <TableRow hoverable={false}>
      <TableCell colSpan={100} className="py-12">
        <div className="flex flex-col items-center justify-center text-center">
          {icon && <div className="mb-4 text-gray-400">{icon}</div>}
          <p className="text-gray-500 font-medium mb-2">{message}</p>
          {action && <div className="mt-4">{action}</div>}
        </div>
      </TableCell>
    </TableRow>
  );
}

// Attach components for compound component pattern
Table.Header = TableHeader;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Head = TableHeader; // Mapping Table.Head to TableHeader for consistency with some usage patterns
Table.Cell = TableCell;
Table.TH = TableHead;
Table.Footer = TableFooter;
Table.Caption = TableCaption;
Table.Empty = TableEmpty;

export default Table;

