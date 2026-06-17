import React from 'react';
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from './table';
import { Spinner } from './Spinner';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  className?: string;
  headerClassName?: string;
  rowClassName?: string;
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  onRowClick,
  className = '',
  headerClassName = '',
  rowClassName = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed border-slate-200">
        <Spinner size="lg" className="text-teal-600 mb-4" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading records...</p>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      <Table className="border-none shadow-none bg-transparent">
        <TableHeader className={headerClassName}>
          <TableRow hoverable={false} className="border-b border-slate-100">
            {columns.map((col) => (
              <TableHead key={col.key} className="py-4 text-[10px] font-bold tracking-widest uppercase text-slate-400">
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((item, i) => (
              <TableRow
                key={i}
                onClick={() => onRowClick?.(item)}
                hoverable={!!onRowClick}
                className={rowClassName}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} className="py-4">
                    {col.render ? col.render(item) : (item as any)[col.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow hoverable={false}>
              <TableCell colSpan={columns.length} className="py-20 text-center">
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="font-bold text-sm uppercase tracking-widest">No Records Found</p>
                  <p className="text-xs mt-1">Try adjusting your filters or search query</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
