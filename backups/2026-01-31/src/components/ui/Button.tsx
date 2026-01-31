"use client";

import * as React from "react";

type ButtonVariant = 
  | "default" 
  | "primary"
  | "secondary"
  | "outline" 
  | "ghost" 
  | "destructive"
  | "success"
  | "warning";

type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  isLoading?: boolean; // Alias for loading, for backward compatibility
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-blue-500 disabled:bg-blue-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]",
  primary:
    "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl active:shadow-md focus-visible:ring-purple-500 disabled:from-blue-300 disabled:via-indigo-300 disabled:to-purple-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md active:shadow-sm disabled:bg-slate-50 disabled:text-slate-400 hover:scale-[1.02] active:scale-[0.98]",
  outline:
    "border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:bg-blue-100 hover:border-blue-700 shadow-sm hover:shadow-md active:shadow-sm disabled:border-blue-300 disabled:text-blue-300 hover:scale-[1.02] active:scale-[0.98]",
  ghost: 
    "text-slate-700 hover:bg-slate-100 active:bg-slate-200 hover:text-slate-900 disabled:text-slate-400 hover:scale-[1.02] active:scale-[0.98]",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-red-500 disabled:bg-red-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]",
  success:
    "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-green-500 disabled:bg-green-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]",
  warning:
    "bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-md hover:shadow-lg active:shadow-sm focus-visible:ring-amber-500 disabled:bg-amber-300 disabled:shadow-none hover:scale-[1.02] active:scale-[0.98]",
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: "h-11 min-h-[44px] min-w-[44px] px-3 text-xs gap-1",     // 44px minimum for touch
  sm: "h-11 min-h-[44px] min-w-[44px] px-4 text-xs gap-1.5",   // 44px minimum for touch
  md: "h-11 min-h-[44px] px-4 text-sm gap-2",                  // 44px minimum for touch
  lg: "h-12 min-h-[48px] px-6 text-base gap-2",                // 48px for better touch
  xl: "h-14 min-h-[56px] px-8 text-lg gap-2.5",                // 56px for better touch
};

const Spinner = ({ size = "sm" }: { size?: "xs" | "sm" | "md" | "lg" }) => {
  const sizeMap = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  
  return (
    <svg
      className={`animate-spin ${sizeMap[size]}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className = "", 
    variant = "default", 
    size = "md",
    loading = false,
    isLoading = false,
    leftIcon,
    rightIcon,
    children,
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    const spinnerSize = size === "xs" ? "xs" : size === "sm" ? "sm" : size === "lg" || size === "xl" ? "lg" : "md";
    
    const buttonClasses = `inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
    
    // Extract non-DOM props to prevent them from being passed to the button element
    const domProps = props;
    
    // If asChild is true, render children directly with the classes applied
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...children.props,
        className: `${buttonClasses} ${children.props.className || ''}`,
      } as any);
    }
    
    // Use loading prop, but also support isLoading for backward compatibility
    const isButtonLoading = loading || isLoading;
    
    return (
      <button
        ref={ref}
        disabled={disabled || isButtonLoading}
        className={buttonClasses}
        {...domProps}
      >
        {isButtonLoading && <Spinner size={spinnerSize} />}
        {!isButtonLoading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        {children}
        {!isButtonLoading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

// IconButton component for proper touch targets
export interface IconButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: ButtonVariant;
  loading?: boolean;
  'aria-label': string; // Required for accessibility
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ 
    className = "", 
    variant = "ghost",
    size = "md",
    loading = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const iconSizeMap = {
      sm: "w-4 h-4",
      md: "w-5 h-5",
      lg: "w-6 h-6",
    };
    
    const buttonSizeMap = {
      sm: "h-11 w-11 min-h-[44px] min-w-[44px] p-2",
      md: "h-11 w-11 min-h-[44px] min-w-[44px] p-2.5",
      lg: "h-12 w-12 min-h-[48px] min-w-[48px] p-3",
    };
    
    const buttonClasses = `inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:transform-none touch-target ${variantClasses[variant]} ${buttonSizeMap[size]} ${className}`;
    
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={buttonClasses}
        {...props}
      >
        {loading ? (
          <Spinner size={size === "sm" ? "xs" : size === "lg" ? "lg" : "md"} />
        ) : (
          <span className={iconSizeMap[size]}>{children}</span>
        )}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";

export default Button;



