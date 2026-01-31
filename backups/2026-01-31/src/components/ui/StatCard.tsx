import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ElementType
  color: 'primary' | 'success' | 'warning' | 'error' | 'info'
  link?: string
  subtitle?: string
}

const colorClasses = {
  primary: {
    bg: 'from-blue-50 to-indigo-50 border-blue-100',
    icon: 'bg-blue-600/10 text-blue-600 shadow-sm shadow-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-500'
  },
  success: {
    bg: 'from-emerald-50 to-teal-50 border-emerald-100',
    icon: 'bg-emerald-600/10 text-emerald-600 shadow-sm shadow-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-500'
  },
  warning: {
    bg: 'from-amber-50 to-orange-50 border-amber-100',
    icon: 'bg-amber-600/10 text-amber-600 shadow-sm shadow-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-500'
  },
  error: {
    bg: 'from-rose-50 to-red-50 border-rose-100',
    icon: 'bg-rose-600/10 text-rose-600 shadow-sm shadow-rose-100',
    text: 'text-rose-700',
    dot: 'bg-rose-500'
  },
  info: {
    bg: 'from-sky-50 to-cyan-50 border-sky-100',
    icon: 'bg-sky-600/10 text-sky-600 shadow-sm shadow-sky-100',
    text: 'text-sky-700',
    dot: 'bg-sky-500'
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
  const colors = colorClasses[color]
  const isPositive = change !== undefined && change > 0

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        'relative overflow-hidden bg-gradient-to-br border rounded-2xl shadow-sm transition-all duration-300',
        colors.bg,
        link && 'hover:shadow-md cursor-pointer group'
      )}
    >
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110', colors.icon)}>
            <Icon className="w-5 h-5" />
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full',
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              )}
            >
              <TrendingUp className={cn('w-3 h-3', !isPositive && 'rotate-180')} />
              {Math.abs(change)}%
            </div>
          )}
          {!change && (
            <div className={cn('w-2 h-2 rounded-full animate-pulse', colors.dot)} />
          )}
        </div>

        <div>
          <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-none mb-1">
            {value}
          </h3>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-2 italic">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.03] text-black">
        <Icon className="w-24 h-24" />
      </div>
    </motion.div>
  )

  if (link) {
    return <Link to={link}>{content}</Link>
  }

  return content
}

