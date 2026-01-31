import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore } from '@/stores/toastStore'
import type { Toast as ToastType, ToastType as TType } from '@/types'

const icons: Record<TType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5" />,
  error: <XCircle className="w-5 h-5" />,
  warning: <AlertTriangle className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
}

const styles: Record<TType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  error: 'bg-error-50 border-error-200 text-error-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  info: 'bg-info-50 border-info-200 text-info-800',
}

const iconStyles: Record<TType, string> = {
  success: 'text-success-500',
  error: 'text-error-500',
  warning: 'text-warning-500',
  info: 'text-info-500',
}

interface ToastItemProps {
  toast: ToastType
  onRemove: () => void
}

const ToastItem = React.forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onRemove }, ref) => {
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'flex items-start gap-3 p-4 rounded-xl border shadow-lg',
          'min-w-[320px] max-w-md',
          styles[toast.type]
        )}
      >
        <span className={cn('flex-shrink-0 mt-0.5', iconStyles[toast.type])}>
          {icons[toast.type]}
        </span>
        
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-sm opacity-80">{toast.message}</p>
          )}
        </div>

        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 -m-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    )
  }
)

ToastItem.displayName = 'ToastItem'

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore()

  if (typeof window === 'undefined') return null

  return createPortal(
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

export default ToastContainer

