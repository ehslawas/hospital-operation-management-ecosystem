import React from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  as?: React.ElementType
  to?: string
}

const variants = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

export const Button = React.forwardRef<HTMLElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      as,
      to,
      ...props
    },
    ref
  ) => {
    const baseClassName = cn('btn', variants[variant], sizes[size], className)
    const content = (
      <>
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </>
    )

    // If 'as' prop is provided, render as that component
    if (as) {
      const Component = as
      return (
        <Component
          ref={ref}
          className={baseClassName}
          to={to}
          {...(props as any)}
        >
          {content}
        </Component>
      )
    }

    // If 'to' prop is provided, render as Link
    if (to) {
      return (
        <Link
          ref={ref as React.Ref<HTMLAnchorElement>}
          to={to}
          className={baseClassName}
          {...(props as any)}
        >
          {content}
        </Link>
      )
    }

    // Default: render as button
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={baseClassName}
        disabled={disabled || isLoading}
        {...props}
      >
        {content}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button

