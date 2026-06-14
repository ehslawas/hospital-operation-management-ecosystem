import React from 'react'
import { cn } from '@/lib/utils'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className }) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-primary-200 border-t-primary-600',
        sizes[size],
        className
      )}
    />
  )
}

export interface LoadingOverlayProps {
  message?: string
  fullScreen?: boolean
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  fullScreen = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4',
        fullScreen
          ? 'fixed inset-0 bg-white/80 backdrop-blur-sm z-50'
          : 'absolute inset-0 bg-white/60 backdrop-blur-sm rounded-2xl'
      )}
    >
      <Spinner size="lg" />
      {message && <p className="text-sm text-gray-600 font-medium">{message}</p>}
    </div>
  )
}

export default Spinner

