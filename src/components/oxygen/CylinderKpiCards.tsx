// @ts-nocheck
import React from 'react';
import { Package, CheckCircle, Clock, Truck, Activity } from 'lucide-react';

interface CylinderKpiCardsProps {
  total: number;
  available: number;
  inUse: number;
  returned: number;
}

export const CylinderKpiCards: React.FC<CylinderKpiCardsProps> = ({
  total,
  available,
  inUse,
  returned,
}) => {
  const cards = [
    {
      title: 'Total Fleet Volume',
      value: total,
      description: 'Tracked medical gas cylinders',
      icon: Package,
      gradient: 'from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20',
      border: 'border-slate-200/80 dark:border-slate-800',
      accentColor: 'bg-blue-500',
      textColor: 'text-slate-900 dark:text-white',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgGlow: 'bg-blue-500/10',
      badge: 'Active Fleet',
      badgeStyle: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'In Store (Available)',
      value: available,
      description: 'Central store ready for issue',
      icon: CheckCircle,
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      border: 'border-emerald-200/60 dark:border-emerald-900/40',
      accentColor: 'bg-emerald-500',
      textColor: 'text-emerald-950 dark:text-emerald-200',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      bgGlow: 'bg-emerald-500/10',
      badge: `${total > 0 ? Math.round((available / total) * 100) : 0}% Ready`,
      badgeStyle: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'In Use (at Wards)',
      value: inUse,
      description: 'Deployed in hospital care units',
      icon: Clock,
      gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
      border: 'border-blue-200/60 dark:border-blue-900/40',
      accentColor: 'bg-blue-600',
      textColor: 'text-blue-950 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
      bgGlow: 'bg-blue-500/10',
      badge: 'Deployed',
      badgeStyle: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Returned to Supplier',
      value: returned,
      description: 'Supplier refill handover logs',
      icon: Truck,
      gradient: 'from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20',
      border: 'border-indigo-200/60 dark:border-indigo-900/40',
      accentColor: 'bg-indigo-500',
      textColor: 'text-slate-900 dark:text-white',
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      bgGlow: 'bg-indigo-500/10',
      badge: 'Supplier Log',
      badgeStyle: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`group relative overflow-hidden bg-white dark:bg-slate-900 rounded-3xl p-6 border ${card.border} shadow-sm hover:shadow-xl hover:scale-[1.015] transition-all duration-300 flex flex-col justify-between`}
          >
            {/* Top Accent line */}
            <div className={`absolute top-0 left-0 right-0 h-1 ${card.accentColor}`} />

            {/* Soft decorative glow */}
            <div className={`absolute -right-6 -bottom-6 w-28 h-28 rounded-full blur-2xl ${card.bgGlow} group-hover:scale-125 transition-transform duration-500 pointer-events-none`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-slate-500 dark:text-slate-400 font-bold text-[11px] uppercase tracking-wider mb-2">
                  {card.title}
                </span>
                <span className={`text-3xl font-black ${card.textColor} tracking-tight tabular-nums font-sans`}>
                  {card.value.toLocaleString()}
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-2">
                  {card.description}
                </span>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${card.gradient} border border-slate-200/50 dark:border-slate-800 shadow-inner group-hover:rotate-6 transition-transform duration-300`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${card.badgeStyle}`}>
                  {card.badge}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

