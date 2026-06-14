"use client";
import dynamic from 'next/dynamic';
import type { LineData, HistogramData } from 'lightweight-charts';

const LineChart = dynamic(() => import('@/components/charts/SimpleLineChart'), {
  ssr: false,
  loading: () => <div className="h-[220px] flex items-center justify-center text-gray-500">Loading chart...</div>
});

const HistogramChart = dynamic(() => import('@/components/charts/SimpleHistogramChart'), {
  ssr: false,
  loading: () => <div className="h-[220px] flex items-center justify-center text-gray-500">Loading chart...</div>
});

type Props = { stockSeries: LineData[]; expirySeries: HistogramData[] };

export default function ChartsSection({ stockSeries, expirySeries }: Props) {
  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm" suppressHydrationWarning>
        <LineChart series={stockSeries} />
      </div>
      <div className="rounded-xl border border-gray-200/70 bg-white p-4 shadow-sm" suppressHydrationWarning>
        <HistogramChart color="#ef4444" series={expirySeries} />
      </div>
    </div>
  );
}


