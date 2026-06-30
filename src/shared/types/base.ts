import React from 'react'

export interface BaseEntity {
  id: string
  created_at: string
  updated_at?: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  count?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

export interface ModalState {
  isOpen: boolean
  title?: string
  content?: React.ReactNode
}

export interface FormState<T> {
  data: T | null
  isLoading: boolean
  isSubmitting: boolean
  errors: Record<string, string>
}

export interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (value: unknown, row: T) => React.ReactNode
  className?: string
}

export interface SortConfig {
  key: string
  direction: 'asc' | 'desc'
}

export interface FilterConfig {
  key: string
  value: string | string[] | boolean | null
  operator?: 'eq' | 'neq' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte'
}

export type HealthStatus = 'healthy' | 'warning' | 'critical' | 'degraded'
