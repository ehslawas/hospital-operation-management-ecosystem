import React from 'react';
import { Package, CheckCircle, Clock, Truck } from 'lucide-react';

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
      title: 'Total Cylinders',
      value: total,
      description: 'Total tracked in system',
      icon: Package,
      gradient: 'from-blue-500/20 to-indigo-500/20',
      border: 'border-blue-500/30',
      textColor: 'text-blue-600',
      iconColor: 'text-blue-500',
      bgGlow: 'bg-blue-400/10',
    },
    {
      title: 'In Store (Available)',
      value: available,
      description: 'Ready for department issues',
      icon: CheckCircle,
      gradient: 'from-emerald-500/20 to-teal-500/20',
      border: 'border-emerald-500/30',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500',
      bgGlow: 'bg-emerald-400/10',
    },
    {
      title: 'In Use (at Wards)',
      value: inUse,
      description: 'Distributed to active units',
      icon: Clock,
      gradient: 'from-amber-500/20 to-orange-500/20',
      border: 'border-amber-500/30',
      textColor: 'text-amber-600',
      iconColor: 'text-amber-500',
      bgGlow: 'bg-amber-400/10',
    },
    {
      title: 'Returned to Supplier',
      value: returned,
      description: 'Returned for refill',
      icon: Truck,
      gradient: 'from-slate-500/20 to-gray-500/20',
      border: 'border-slate-500/30',
      textColor: 'text-slate-600',
      iconColor: 'text-slate-500',
      bgGlow: 'bg-slate-400/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className={`relative overflow-hidden bg-white/40 backdrop-blur-xl rounded-3xl p-6 border ${card.border} shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
          >
            {/* Soft decorative glow */}
            <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-2xl ${card.bgGlow}`} />

            <div className="flex items-start justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-slate-500 font-semibold text-sm uppercase tracking-wider mb-2">
                  {card.title}
                </span>
                <span className="text-4xl font-extrabold text-slate-800 tracking-tight">
                  {card.value.toLocaleString()}
                </span>
                <span className="text-slate-500 font-medium text-xs mt-2">
                  {card.description}
                </span>
              </div>
              <div className={`p-4 rounded-2xl bg-gradient-to-br ${card.gradient} border ${card.border} shadow-inner`}>
                <Icon className={`w-6 h-6 ${card.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
