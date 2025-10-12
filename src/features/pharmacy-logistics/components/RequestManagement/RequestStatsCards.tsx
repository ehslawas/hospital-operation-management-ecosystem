import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestStats } from '../../types/RequestWorkflow';

interface RequestStatsCardsProps {
  stats: RequestStats;
}

export function RequestStatsCards({ stats }: RequestStatsCardsProps) {
  const statCards = [
    {
      label: 'Total Requests',
      value: stats.totalRequests.toString(),
      className: 'text-slate-800',
      icon: '📋'
    },
    {
      label: 'Pending Review',
      value: stats.pendingReview.toString(),
      className: 'text-amber-600',
      icon: '⏳'
    },
    {
      label: 'Under Review',
      value: stats.underReview.toString(),
      className: 'text-blue-600',
      icon: '🔍'
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApproval.toString(),
      className: 'text-orange-600',
      icon: '⏰'
    },
    {
      label: 'Approved',
      value: stats.approved.toString(),
      className: 'text-green-600',
      icon: '✅'
    },
    {
      label: 'Issued',
      value: stats.issued.toString(),
      className: 'text-emerald-600',
      icon: '📦'
    },
    {
      label: 'Rejected',
      value: stats.rejected.toString(),
      className: 'text-red-600',
      icon: '❌'
    },
    {
      label: 'Avg. Processing Time',
      value: `${stats.averageProcessingTime}h`,
      className: 'text-purple-600',
      icon: '⏱️'
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="h-full flex flex-col min-h-[100px] hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex-shrink-0 pb-2">
            <CardTitle className="text-center text-xs font-medium leading-tight text-slate-600">
              {stat.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center pt-0">
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className={`text-2xl font-bold tracking-tight leading-none ${stat.className}`}>
              {stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}


