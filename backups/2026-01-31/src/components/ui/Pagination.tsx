import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className,
}: PaginationProps) {
  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, total)

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  return (
    <div className={cn('flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4 md:px-6 glass-card rounded-2xl mt-4', className)}>
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight bg-slate-50 border border-slate-100/80 px-2.5 py-1.5 rounded-lg">
            {start}-{end} <span className="text-slate-300 font-medium mx-0.5">OF</span> {total}
          </div>
          {onPageSizeChange && (
            <div className="flex items-center gap-2 bg-white px-2.5 py-1.5 rounded-lg border border-slate-100 shadow-sm">
              <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">ROWS:</span>
              <select
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className="bg-transparent text-[11px] font-black text-slate-700 focus:outline-none cursor-pointer pr-1"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full md:w-auto justify-center md:justify-end">
        <div className="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-1.5 text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors mr-1"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span key={`ellipsis-${index}`} className="w-8 text-center text-slate-300 text-[11px] font-medium">
                    ...
                  </span>
                )
              }

              const pageNum = page as number
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-9 h-9 flex items-center justify-center text-[12px] font-bold rounded-xl transition-all duration-200',
                    currentPage === pageNum
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-200 z-10'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-violet-600'
                  )}
                >
                  {pageNum}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors ml-1"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 text-slate-400 hover:text-violet-600 disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Pagination

