import type { ReactNode } from 'react';

type BadgeProps = {
  color?: 'gray' | 'green' | 'amber' | 'red' | 'blue';
  children: ReactNode;
};

export function Badge({ color = 'gray', children }: BadgeProps) {
  const colorMap: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-rose-100 text-rose-700',
    blue: 'bg-indigo-100 text-indigo-700',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMap[color]}`}>{children}</span>
  );
}


