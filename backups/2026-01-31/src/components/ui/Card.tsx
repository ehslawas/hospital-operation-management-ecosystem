import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type CardProps = {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
};

export function Card({ children, className, hover = false, onClick }: CardProps) {
  const hoverClasses = hover
    ? 'hover:shadow-lg hover:scale-[1.01] hover:border-blue-300/70 cursor-pointer transition-all duration-300 ease-out'
    : '';

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200/70 bg-white shadow-md backdrop-blur-sm",
        hoverClasses,
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className, actions }: { children: ReactNode; className?: string; actions?: ReactNode }) {
  return (
    <div className={cn("px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between", className)}>
      <div className="flex-1">{children}</div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function CardTitle({ children, className, subtitle }: { children: ReactNode; className?: string; subtitle?: string }) {
  return (
    <div>
      <h3 className={cn("text-lg font-bold tracking-tight text-gray-900", className)}>{children}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-gray-600 mt-1.5", className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("px-6 pb-6 pt-4 border-t border-gray-100", className)}>{children}</div>;
}
