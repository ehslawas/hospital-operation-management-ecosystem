import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

type KpiCardProps = {
  label: string;
  value: string | number;
  emphasisClassName?: string;
};

export function KpiCard({ label, value, emphasisClassName }: KpiCardProps) {
  return (
    <Card className="h-full flex flex-col min-h-[120px]">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-center text-xs font-medium leading-tight">{label}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex items-center justify-center pt-0">
        <div className={`text-3xl font-bold tracking-tight leading-none ${emphasisClassName ?? 'text-slate-800'}`}>{value}</div>
      </CardContent>
    </Card>
  );
}


