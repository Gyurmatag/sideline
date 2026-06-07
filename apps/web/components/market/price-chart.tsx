"use client";

import { useEffect, useRef } from "react";
import {
  AreaSeries,
  ColorType,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";

export type PricePoint = { time: UTCTimestamp; value: number };

export function PriceChart({ points }: { points: PricePoint[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#71717a",
        fontFamily: "inherit",
        attributionLogo: false,
      },
      grid: {
        horzLines: { color: "rgba(0,0,0,0.05)" },
        vertLines: { visible: false },
      },
      rightPriceScale: { borderVisible: false },
      timeScale: { borderVisible: false, timeVisible: true, secondsVisible: false },
      handleScroll: false,
      handleScale: false,
      crosshair: {
        horzLine: { visible: false, labelVisible: false },
        vertLine: { labelVisible: false },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#16a34a",
      topColor: "rgba(22,163,74,0.22)",
      bottomColor: "rgba(22,163,74,0.0)",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        minMove: 0.001,
        formatter: (v: number) => `${Math.round(v * 100)}%`,
      },
    });
    series.priceScale().applyOptions({ scaleMargins: { top: 0.15, bottom: 0.1 } });

    chartRef.current = chart;
    seriesRef.current = series;

    return () => {
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current) return;
    seriesRef.current.setData(points);
    chartRef.current?.timeScale().fitContent();
  }, [points]);

  return <div ref={containerRef} className="h-[220px] w-full" />;
}
