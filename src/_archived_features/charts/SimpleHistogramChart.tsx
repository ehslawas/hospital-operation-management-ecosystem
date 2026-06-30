"use client";
import { useEffect, useRef, useState } from 'react';
import type { HistogramData } from 'lightweight-charts';

type HistogramChartProps = { series: HistogramData[]; color?: string; height?: number };

export default function SimpleHistogramChart({ series, color = '#059669', height = 220 }: HistogramChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const histRef = useRef<any>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    let disposed = false;
    (async () => {
      try {
        const mod: any = await import('lightweight-charts');
        const createChart = mod.createChart || mod.default?.createChart;
        if (!createChart) {
          setUnavailable(true);
          return;
        }
        if (!containerRef.current || disposed) return;
        const chart = createChart(containerRef.current, {
          height,
          layout: { textColor: '#334155', background: { type: 'solid', color: 'white' } },
          grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
          rightPriceScale: { borderColor: '#e2e8f0' },
          timeScale: { borderColor: '#e2e8f0' },
        });
        chartRef.current = chart;

        const addHistogram = (chart as any).addHistogramSeries
          ? (chart as any).addHistogramSeries.bind(chart)
          : null;
        if (!addHistogram) {
          setUnavailable(true);
          return;
        }
        const hist = addHistogram({ color, priceFormat: { type: 'volume' } });
        histRef.current = hist;
        hist.setData(series);
      } catch {
        setUnavailable(true);
      }
    })();

    const resize = () => {
      if (!containerRef.current || !chartRef.current) return;
      const { width } = containerRef.current.getBoundingClientRect();
      chartRef.current.resize(Math.max(0, Math.floor(width)), height);
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      disposed = true;
      if (chartRef.current) {
        chartRef.current.remove();
      }
      chartRef.current = null;
      histRef.current = null;
    };
  }, [color, height, series]);

  useEffect(() => {
    if (histRef.current) {
      histRef.current.setData(series);
    }
  }, [series]);

  if (unavailable) {
    return (
      <div className="h-[220px] flex items-center justify-center text-gray-500">Chart unavailable</div>
    );
  }
  return <div ref={containerRef} />;
}


