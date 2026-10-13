import { ChartFrame, poly } from "./frame";

export type PlotPoint = { q: number; p: number };

export type PlotSeries = {
  points: PlotPoint[];
  label?: string;
  /** 0–1, where along the series the label sits. Defaults to the end. */
  labelAt?: number;
  labelDy?: number;
  dashed?: boolean;
  width?: number;
};

export function PolylineChart({
  qMax,
  pMax,
  xLabel,
  yLabel,
  aria,
  series,
  marker,
  rect,
  notes = [],
  guides = false,
}: {
  qMax: number;
  pMax: number;
  xLabel: string;
  yLabel: string;
  aria: string;
  series: PlotSeries[];
  marker?: PlotPoint & { label: string };
  rect?: PlotPoint;
  notes?: (PlotPoint & { text: string })[];
  guides?: boolean;
}) {
  return (
    <ChartFrame qMax={qMax} pMax={pMax} xLabel={xLabel} yLabel={yLabel} aria={aria}>
      {(scales, _markerId, clipId) => (
        <>
          <g clipPath={`url(#${clipId})`}>
            {rect ? (
              <rect
                x={scales.x(0)}
                y={scales.y(rect.p)}
                width={Math.max(0, scales.x(rect.q) - scales.x(0))}
                height={Math.max(0, scales.y(0) - scales.y(rect.p))}
                fill="rgba(30, 58, 95, 0.12)"
              />
            ) : null}
            {series.map((item, index) => (
              <path
                key={index}
                d={poly(scales, item.points)}
                fill="none"
                stroke={item.dashed ? "#b7b1a6" : "#1c1915"}
                strokeWidth={item.width ?? (item.dashed ? 1.1 : 1.45)}
                strokeDasharray={item.dashed ? "6 4" : undefined}
              />
            ))}
            {guides && marker ? (
              <>
                <line x1={scales.x(0)} y1={scales.y(marker.p)} x2={scales.x(marker.q)} y2={scales.y(marker.p)} stroke="#1c1915" strokeDasharray="4 4" />
                <line x1={scales.x(marker.q)} y1={scales.y(0)} x2={scales.x(marker.q)} y2={scales.y(marker.p)} stroke="#1c1915" strokeDasharray="4 4" />
              </>
            ) : null}
          </g>
          {series.map((item, index) => {
            if (!item.label || item.points.length === 0) return null;
            const t = Math.min(1, Math.max(0, item.labelAt ?? 1));
            const scaled = t * (item.points.length - 1);
            const left = Math.floor(scaled);
            const right = Math.min(item.points.length - 1, left + 1);
            const mix = scaled - left;
            const point = {
              q: item.points[left].q + (item.points[right].q - item.points[left].q) * mix,
              p: item.points[left].p + (item.points[right].p - item.points[left].p) * mix,
            };
            return (
              <text
                key={`s${index}`}
                x={scales.x(point.q) + 6}
                y={scales.y(point.p) + (item.labelDy ?? -8)}
                className={item.dashed ? "curve-label ghost" : "curve-label"}
              >
                {item.label}
              </text>
            );
          })}
          {notes.map((note, index) => (
            <text key={`n${index}`} x={scales.x(note.q)} y={scales.y(note.p)} className="note-label">
              {note.text}
            </text>
          ))}
          {marker ? (
            <g>
              <circle cx={scales.x(marker.q)} cy={scales.y(marker.p)} r="4.2" fill="#1c1915" />
              <text x={scales.x(marker.q) + 8} y={scales.y(marker.p) - 8} className="curve-label">
                {marker.label}
              </text>
            </g>
          ) : null}
        </>
      )}
    </ChartFrame>
  );
}
