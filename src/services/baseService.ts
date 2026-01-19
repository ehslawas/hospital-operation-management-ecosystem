import type { FilterConfig, SortConfig } from '@/types'

export interface ListParams {
  page?: number
  pageSize?: number
  search?: string
  filters?: FilterConfig[]
  sort?: SortConfig
  [key: string]: any
}

/**
 * Execute a service operation with Supabase, with built-in timeout protection
 */
export async function withService<T>(
  supabaseOp: () => Promise<T>,
  _unusedMockOp?: () => Promise<T>,
  timeoutMs: number = 15000
): Promise<T> {
  try {
    const result = await Promise.race([
      supabaseOp(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Service operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ])
    return result
  } catch (error) {
    console.error('Supabase operation error:', error)
    throw error
  }
}

