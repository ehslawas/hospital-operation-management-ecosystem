"use client";
import { Chart, LineSeries } from 'lightweight-charts-react-wrapper';
import type { LineData } from 'lightweight-charts';

type LineChartProps = { series: LineData[]; height?: number };

export default function LineChart({ series, height = 220 }: LineChartProps) {
  const chartProps: Record<string, unknown> = {
    height,
    layout: { textColor: '#334155', background: { type: 'solid', color: 'white' } },
    grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
    rightPriceScale: { borderColor: '#e2e8f0' },
    timeScale: { borderColor: '#e2e8f0' },
  };

  return (
    <Chart {...chartProps}>
      <LineSeries data={series} lineWidth={2} color="#4f46e5" />
    </Chart>
  );
}


