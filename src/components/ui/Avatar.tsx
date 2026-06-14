import React from 'react'
import { cn, getInitials } from '@/lib/utils'
import { User } from 'lucide-react'

export interface AvatarProps {
  src?: string | null
  name?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  className?: string
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
  '2xl': 'w-24 h-24 text-2xl',
}

const iconSizes = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-12 h-12',
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
}) => {
  const [imgError, setImgError] = React.useState(false)

  if (src && !imgError) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 rounded-full overflow-hidden bg-gray-100',
          sizes[size],
          className
        )}
      >
        <img
          src={src}
          alt={name || 'Avatar'}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      </div>
    )
  }

  if (name) {
    return (
      <div
        className={cn(
          'relative flex-shrink-0 rounded-full flex items-center justify-center',
          'bg-gradient-to-br from-primary-400 to-primary-600 text-white font-semibold',
          sizes[size],
          className
        )}
      >
        {getInitials(name)}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative flex-shrink-0 rounded-full flex items-center justify-center bg-gray-200 text-gray-500',
        sizes[size],
        className
      )}
    >
      <User className={iconSizes[size]} />
    </div>
  )
}

export default Avatar

