import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SlowMovingKpiCardProps = {
  label: string;
  value: string | number;
  subtitle?: string;
  emphasisClassName?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
};

export function SlowMovingKpiCard({ 
  label, 
  value, 
  subtitle, 
  emphasisClassName, 
  icon,
  trend 
}: SlowMovingKpiCardProps) {
  return (
    <Card className="h-full flex flex-col min-h-[140px] bg-gradient-to-br from-white via-blue-50/20 to-purple-50/30 border-blue-200/40 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <CardHeader className="flex-shrink-0 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium leading-tight text-slate-700">{label}</CardTitle>
          {icon && (
            <div className="text-blue-500 opacity-70">
              {icon}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center pt-0">
        <div className={`text-3xl font-bold tracking-tight leading-none ${emphasisClassName ?? 'text-slate-800'}`}>
          {value}
        </div>
        {subtitle && (
          <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        )}
        {trend && (
          <div className={`text-xs mt-2 flex items-center gap-1 ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className={trend.isPositive ? '↗' : '↘'}>
              {trend.isPositive ? '↗' : '↘'}
            </span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

