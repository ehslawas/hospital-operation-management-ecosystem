import React from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  description,
  size = 'md',
  className,
}) => {
  const sizeClasses = {
    sm: 'w-8 h-4',
    md: 'w-11 h-6',
    lg: 'w-14 h-7',
  }

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    md: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-7' : 'translate-x-0.5',
  }

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          sizeClasses[size],
          checked ? 'bg-primary-600' : 'bg-slate-300',
          disabled && 'opacity-50 cursor-not-allowed',
          !disabled && 'cursor-pointer'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform',
            thumbSizeClasses[size],
            translateClasses[size]
          )}
        />
      </button>
      {(label || description) && (
        <div className="flex-1 min-w-0">
          {label && (
            <label
              className={cn(
                'block text-sm font-medium cursor-pointer',
                disabled ? 'text-slate-400' : 'text-slate-700'
              )}
              onClick={() => !disabled && onChange(!checked)}
            >
              {label}
            </label>
          )}
          {description && (
            <p className={cn('text-xs mt-0.5', disabled ? 'text-slate-400' : 'text-slate-500')}>
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default Switch

