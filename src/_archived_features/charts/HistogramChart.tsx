"use client";
import { Chart, HistogramSeries } from 'lightweight-charts-react-wrapper';
import type { HistogramData } from 'lightweight-charts';

type HistogramChartProps = { series: HistogramData[]; color?: string; height?: number };

export default function HistogramChart({ series, color = '#059669', height = 220 }: HistogramChartProps) {
  const chartProps: Record<string, unknown> = {
    height,
    layout: { textColor: '#334155', background: { type: 'solid', color: 'white' } },
    grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
    rightPriceScale: { borderColor: '#e2e8f0' },
    timeScale: { borderColor: '#e2e8f0' },
  };

  return (
    <Chart {...chartProps}>
      <HistogramSeries data={series} color={color} priceFormat={{ type: 'volume' }} />
    </Chart>
  );
}


