import { create } from 'zustand'
import type { Toast, ToastType } from '@/types'
import { generateId } from '@/lib/utils'
import { TOAST_DURATION } from '@/lib/constants'

interface ToastState {
  toasts: Toast[]
  
  // Actions
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // Convenience methods
  success: (title: string, message?: string) => string
  error: (title: string, message?: string) => string
  warning: (title: string, message?: string) => string
  info: (title: string, message?: string) => string
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? TOAST_DURATION.MEDIUM,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },

  success: (title, message) => {
    return get().addToast({
      type: 'success',
      title,
      message,
      duration: TOAST_DURATION.MEDIUM,
    })
  },

  error: (title, message) => {
    return get().addToast({
      type: 'error',
      title,
      message,
      duration: TOAST_DURATION.LONG,
    })
  },

  warning: (title, message) => {
    return get().addToast({
      type: 'warning',
      title,
      message,
      duration: TOAST_DURATION.LONG,
    })
  },

  info: (title, message) => {
    return get().addToast({
      type: 'info',
      title,
      message,
      duration: TOAST_DURATION.MEDIUM,
    })
  },
}))

// Helper hooks
export const useToasts = () => useToastStore((state) => state.toasts)
export const useToast = () => {
  const { success, error, warning, info, addToast, removeToast } = useToastStore()
  return { success, error, warning, info, addToast, removeToast }
}

