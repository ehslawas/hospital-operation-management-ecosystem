import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'teal' | 'emerald' | 'sky' | 'amber' | 'rose' | 'indigo' | 'purple'
  link?: string
  subtitle?: string
}

const colorClasses: Record<string, { icon: string; border: string }> = {
  primary: {
    icon: 'bg-primary-50 text-primary-600',
    border: 'border-primary-100',
  },
  success: {
    icon: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  warning: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
  error: {
    icon: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
  },
  info: {
    icon: 'bg-blue-50 text-blue-600',
    border: 'border-blue-100',
  },
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    border: 'border-teal-100',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-600',
    border: 'border-emerald-100',
  },
  sky: {
    icon: 'bg-sky-50 text-sky-600',
    border: 'border-sky-100',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'border-amber-100',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-600',
    border: 'border-rose-100',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-600',
    border: 'border-indigo-100',
  },
  purple: {
    icon: 'bg-purple-50 text-purple-600',
    border: 'border-purple-100',
  },
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color,
  link,
  subtitle,
}) => {
  const colors = colorClasses[color] || colorClasses.primary
  const isPositive = change !== undefined && change > 0

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        'group relative bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:border-gray-200',
        link && 'cursor-pointer'
      )}
    >
      {/* Background Icon Pattern */}
      <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <Icon size={80} strokeWidth={1} />
      </div>

      <div className="relative flex flex-col h-full">
        <div className="flex items-start justify-between mb-4">
          <div className={cn(
            'w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300',
            colors.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold',
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}
            >
              <TrendingUp className={cn('w-3 h-3', !isPositive && 'rotate-180')} />
              {Math.abs(change)}%
            </div>
          )}
        </div>

        <div className="mt-auto">
          <h3 className="text-2xl font-bold text-gray-900 leading-none mb-1 tracking-tight">
            {value}
          </h3>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">
            {title}
          </p>
          
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-400 font-medium">
              {subtitle || 'Click to view details'}
            </span>
            {link && (
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }

  return content
}
