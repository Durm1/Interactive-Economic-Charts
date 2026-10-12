import type { ReactNode } from "react";
import { useId } from "react";
import { num } from "../lib/format";

export type Scales = {
  width: number;
  height: number;
  left: number;
  top: number;
  plotW: number;
  plotH: number;
  qMax: number;
  pMax: number;
  x: (q: number) => number;
  y: (p: number) => number;
};

export function makeScales(qMax: number, pMax: number, width = 700, height = 460): Scales {
  const left = 62;
  const right = 26;
  const top = 20;
  const bottom = 48;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const safeQ = Number.isFinite(qMax) && qMax > 0 ? qMax : 1;
  const safeP = Number.isFinite(pMax) && pMax > 0 ? pMax : 1;
  return {
    width,
    height,
    left,
    top,
    plotW,
    plotH,
    qMax: safeQ,
    pMax: safeP,
    x: (q) => left + (q / safeQ) * plotW,
    y: (p) => top + (1 - p / safeP) * plotH,
  };
}

/** Round a data maximum up to the next tick, so small slider moves do not rescale the chart. */
export function snapMax(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 10;
  const step = tickStep(value);
  if (!Number.isFinite(step) || step <= 0) return value;
  return Math.max(step, Math.ceil((value * 1.05) / step) * step);
}

function tickStep(max: number): number {
  const rough = max / 5;
  if (!Number.isFinite(rough) || !(rough > 0)) return 1;
  const pow = 10 ** Math.floor(Math.log10(rough));
  if (!Number.isFinite(pow) || pow <= 0) return 1;
  const err = rough / pow;
  const nice = err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
  return nice * pow;
}

export function ticks(max: number): number[] {
  if (!Number.isFinite(max) || max <= 0) return [0];
  let step = tickStep(max);
  if (!Number.isFinite(step) || step <= 0) step = max;
  const out: number[] = [];
  for (let v = 0; v <= max + step * 0.01 && out.length < 8; v += step) {
    out.push(Math.round(v * 1000) / 1000);
  }
  return out;
}

export function ChartFrame({
  qMax,
  pMax,
  xLabel,
  yLabel,
  aria,
  children,
  width,
  height,
}: {
  qMax: number;
  pMax: number;
  xLabel: string;
  yLabel: string;
  aria: string;
  children: (scales: Scales, markerId: string, clipId: string) => ReactNode;
  width?: number;
  height?: number;
}) {
  const scales = makeScales(qMax, pMax, width, height);
  const markerId = useId().replace(/:/g, "");
  const clipId = `${markerId}-clip`;
  const xTicks = ticks(scales.qMax);
  const yTicks = ticks(scales.pMax);
  const axisY = scales.y(0);
  const axisX = scales.x(0);

  return (
    <svg viewBox={`0 0 ${scales.width} ${scales.height}`} role="img" aria-label={aria} className="chart">
      <defs>
        <marker id={markerId} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#1c1915" />
        </marker>
        <clipPath id={clipId}>
          <rect x={scales.left} y={scales.top} width={scales.plotW} height={scales.plotH} />
        </clipPath>
      </defs>
      <rect x="0" y="0" width={scales.width} height={scales.height} fill="#fff" />
      {xTicks.map((tick) => (
        <g key={`x${tick}`}>
          <line x1={scales.x(tick)} x2={scales.x(tick)} y1={axisY} y2={axisY + 5} stroke="#1c1915" />
          <text x={scales.x(tick)} y={axisY + 18} textAnchor="middle" className="tick">
            {num(tick, tick >= 100 ? 0 : 1)}
          </text>
        </g>
      ))}
      {yTicks.map((tick) => (
        <g key={`y${tick}`}>
          <line x1={axisX - 5} x2={axisX} y1={scales.y(tick)} y2={scales.y(tick)} stroke="#1c1915" />
          <text x={axisX - 8} y={scales.y(tick) + 4} textAnchor="end" className="tick">
            {num(tick, tick >= 100 ? 0 : 1)}
          </text>
        </g>
      ))}
      <line
        x1={axisX}
        y1={scales.top + scales.plotH}
        x2={axisX}
        y2={scales.top - 2}
        stroke="#1c1915"
        strokeWidth="1.4"
        markerEnd={`url(#${markerId})`}
      />
      <line
        x1={axisX}
        y1={axisY}
        x2={scales.left + scales.plotW + 2}
        y2={axisY}
        stroke="#1c1915"
        strokeWidth="1.4"
        markerEnd={`url(#${markerId})`}
      />
      <text x={scales.left + scales.plotW - 2} y={axisY + 34} textAnchor="end" className="axis-label">
        {xLabel}
      </text>
      <text
        x={16}
        y={scales.top + scales.plotH / 2}
        textAnchor="middle"
        className="axis-label"
        transform={`rotate(-90 16 ${scales.top + scales.plotH / 2})`}
      >
        {yLabel}
      </text>
      {children(scales, markerId, clipId)}
    </svg>
  );
}

/** Put Q1, Q2… on the x-axis. A second label that would collide sits just above the axis. */
export function placeAxisTags(
  scales: Scales,
  tags: { q: number; label: string }[],
): { x: number; y: number; label: string }[] {
  const sorted = tags
    .filter((tag) => Number.isFinite(tag.q) && tag.q >= 0 && tag.q <= scales.qMax)
    .sort((a, b) => a.q - b.q);
  const placed: { x: number; y: number; label: string; row: number }[] = [];
  const axisY = scales.y(0);
  for (const tag of sorted) {
    const x = scales.x(tag.q);
    let row = 0;
    while (placed.some((item) => item.row === row && Math.abs(item.x - x) < 30)) row += 1;
    const y = row === 0 ? axisY + 16 : axisY - 14 - (row - 1) * 14;
    placed.push({ x, y, label: tag.label, row });
  }
  return placed;
}

export function poly(scales: Scales, points: { q: number; p: number }[]): string {
  return points.map((pt, i) => `${i === 0 ? "M" : "L"} ${scales.x(pt.q)} ${scales.y(pt.p)}`).join(" ");
}
