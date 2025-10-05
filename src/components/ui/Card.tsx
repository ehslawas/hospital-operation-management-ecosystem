import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className }: CardProps) {
  return (
    <div className={`rounded-xl border border-gray-200/70 bg-white shadow-sm ${className ?? ''}`}>{children}</div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 pt-5 pb-3 ${className ?? ''}`}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={`text-sm font-semibold tracking-wide text-gray-800 ${className ?? ''}`}>{children}</h3>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 pb-5 ${className ?? ''}`}>{children}</div>;
}


