import { supabase, isSupabaseConfigured } from './supabase'
import type { PaginatedResponse, FilterConfig, SortConfig } from '@/types'
import { DEFAULT_PAGE_SIZE } from '@/lib/constants'

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  [key: string]: any
}

/**
 * Execute a service operation with either Supabase or Mock data
 */
export async function withService<T>(
  supabaseOp: () => Promise<T>,
  mockOp: () => Promise<T>
): Promise<T> {
  if (isSupabaseConfigured()) {
    try {
      return await supabaseOp()
    } catch (error) {
      console.error('Supabase operation error:', error)
      throw error
    }
  } else {
    try {
      return await mockOp()
    } catch (error) {
      console.error('Mock operation error:', error)
      throw error
    }
  }
}

/**
 * Helper for generic pagination and filtering for mock data
 */
export function paginateMockData<T>(
  data: T[],
  params: ListParams,
  searchFields: (keyof T)[] = [],
  sortDefaultField: keyof T = 'created_at' as any
): PaginatedResponse<T> {
  const {
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    search = '',
    sort,
  } = params

  let filtered = [...data]

  // Search
  if (search && searchFields.length > 0) {
    const searchLower = search.toLowerCase()
    filtered = filtered.filter((item) =>
      searchFields.some((field) => {
        const val = item[field]
        return val && String(val).toLowerCase().includes(searchLower)
      })
    )
  }

  // Sorting
  if (sort) {
    filtered.sort((a, b) => {
      const aVal = a[sort.key as keyof T]
      const bVal = b[sort.key as keyof T]
      if (aVal === bVal) return 0
      const comparison = (aVal as any) > (bVal as any) ? 1 : -1
      return sort.direction === 'asc' ? comparison : -comparison
    })
  } else if (sortDefaultField) {
    filtered.sort((a, b) => {
      const aVal = a[sortDefaultField]
      const bVal = b[sortDefaultField]
      if (aVal instanceof Date && bVal instanceof Date) {
        return bVal.getTime() - aVal.getTime()
      }
      return String(bVal).localeCompare(String(aVal))
    })
  }

  const total = filtered.length
  const from = (page - 1) * pageSize
  const to = from + pageSize
  const paginated = filtered.slice(from, to)

  return {
    data: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  }
}

