import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type KpiCardProps = {
  label: string;
  value: string | number;
  emphasisClassName?: string;
};

export function KpiCard({ label, value, emphasisClassName }: KpiCardProps) {
  return (
    <Card className="h-full flex flex-col min-h-[90px] xs:min-h-[100px] sm:min-h-[110px] md:min-h-[120px]">
      <CardHeader className="flex-shrink-0 pb-1.5 xs:pb-2">
        <CardTitle className="text-center text-[10px] xs:text-xs font-medium leading-tight truncate px-1">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pt-0">
        <div className={`text-xl xs:text-2xl sm:text-2xl md:text-3xl font-bold tracking-tight leading-none ${emphasisClassName ?? 'text-slate-800'}`}>{value}</div>
      </CardContent>
    </Card>
  );
}



