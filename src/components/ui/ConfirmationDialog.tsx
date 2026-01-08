import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, AlertCircle, Info, CheckCircle, X } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'
import { cn } from '@/lib/utils'

export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  variant?: ConfirmationVariant
  confirmText?: string
  cancelText?: string
  isLoading?: boolean
  requiresConfirmation?: boolean
  confirmationText?: string
  children?: React.ReactNode
}

const variantConfig: Record<ConfirmationVariant, { icon: React.ElementType; iconColor: string; bgColor: string }> = {
  danger: {
    icon: AlertTriangle,
    iconColor: 'text-error-600',
    bgColor: 'bg-error-50',
  },
  warning: {
    icon: AlertCircle,
    iconColor: 'text-warning-600',
    bgColor: 'bg-warning-50',
  },
  info: {
    icon: Info,
    iconColor: 'text-info-600',
    bgColor: 'bg-info-50',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-success-600',
    bgColor: 'bg-success-50',
  },
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'warning',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  requiresConfirmation = false,
  confirmationText,
  children,
}) => {
  const [confirmationInput, setConfirmationInput] = useState('')
  const config = variantConfig[variant]
  const Icon = config.icon
  const isConfirmDisabled = requiresConfirmation && confirmationInput !== (confirmationText || 'CONFIRM')

  const handleConfirm = async () => {
    if (isConfirmDisabled) return
    await onConfirm()
    if (requiresConfirmation) {
      setConfirmationInput('')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      size="md"
      closeOnOverlayClick={!isLoading}
      closeOnEscape={!isLoading}
      showCloseButton={!isLoading}
    >
      <div className="space-y-4">
        {/* Icon and Title */}
        <div className="flex items-start gap-4">
          <div className={cn('w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
            <Icon className={cn('w-6 h-6', config.iconColor)} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600">{message}</p>
          </div>
        </div>

        {/* Additional Content */}
        {children && <div className="mt-4">{children}</div>}

        {/* Confirmation Input (for critical actions) */}
        {requiresConfirmation && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-mono font-bold">{confirmationText || 'CONFIRM'}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmationInput}
              onChange={(e) => setConfirmationInput(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={confirmationText || 'CONFIRM'}
              disabled={isLoading}
              autoFocus
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'warning' : 'primary'}
            onClick={handleConfirm}
            disabled={isLoading || isConfirmDisabled}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmationDialog

