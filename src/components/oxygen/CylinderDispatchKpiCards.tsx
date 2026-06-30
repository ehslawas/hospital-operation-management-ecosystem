// @ts-nocheck
import React from 'react';
import { ClipboardList, AlertCircle, PlayCircle, CheckCircle, XCircle } from 'lucide-react';
import type { CylinderDispatchKPI } from '@/types/pharmacy';

interface CylinderDispatchKpiCardsProps {
  kpi: CylinderDispatchKPI;
}

export const CylinderDispatchKpiCards: React.FC<CylinderDispatchKpiCardsProps> = ({ kpi }) => {
  const cards = [
    {
      title: 'Total Requests',
      value: kpi.total_requests,
      description: `${kpi.this_month_count} new this month`,
      icon: ClipboardList,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/30',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500',
      bgGlow: 'bg-blue-400/10',
    },
    {
      title: 'Pending Approval',
      value: kpi.pending_count,
      description: kpi.pending_count > 0 ? 'Action required by pharmacy' : 'All caught up',
      icon: AlertCircle,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      textColor: 'text-amber-600',
      iconColor: 'text-amber-500',
      bgGlow: 'bg-amber-400/10',
      isWarning: kpi.pending_count > 0,
    },
    {
      title: 'Approved (Ready)',
      value: kpi.approved_count,
      description: 'Ready for cylinder issue',
      icon: PlayCircle,
      gradient: 'from-purple-500/20 to-pink-500/20',
      border: 'border-purple-500/30',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500',
      bgGlow: 'bg-purple-400/10',
    },
    {
      title: 'Issued / Completed',
      value: kpi.issued_count + kpi.completed_count,
      description: `Avg fulfillment: ${kpi.avg_fulfillment_hours}h`,
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500',
      bgGlow: 'bg-emerald-400/10',
    },
    {
      title: 'Rejected / Cancelled',
      value: kpi.rejected_count + kpi.cancelled_count,
      description: 'Declined or aborted requests',
      icon: XCircle,
      gradient: 'from-rose-500/20 to-red-500/20',
      border: 'border-rose-500/30',
      textColor: 'text-rose-600',
      iconColor: 'text-rose-500',
      bgGlow: 'bg-rose-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-2xl p-5 border ${card.border} shadow-lg hover:shadow-xl hover:scale-[1.01] transition-all duration-300`}
          >
            {/* Soft decorative glow */}
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl ${card.bgGlow}`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider mb-1">
                  {card.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-extrabold text-slate-800 tracking-tight">
                    {card.value.toLocaleString()}
                  </span>
                  {card.isWarning && (
                    <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </div>
                <span className="text-slate-400 font-medium text-[11px] mt-1">
                  {card.description}
                </span>
              </div>
              <div className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} border ${card.border} shadow-inner`}>
                <Icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
