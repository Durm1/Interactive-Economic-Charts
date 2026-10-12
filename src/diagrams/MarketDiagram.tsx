import { visibleSegment } from "../models/curve";
import type { MarketFigure } from "../figures/marketFigure";
import { ChartFrame, placeAxisTags, poly } from "./frame";

export function MarketDiagram({ figure, hide }: { figure: MarketFigure; hide: boolean }) {
  return (
    <ChartFrame qMax={figure.qMax} pMax={figure.pMax} xLabel={figure.xLabel} yLabel={figure.yLabel} aria={figure.aria}>
      {(scales, markerId, clipId) => {
        const labels: { x: number; y: number; text: string; ghost?: boolean; anchor?: "start" | "middle" }[] = [];
        return (
          <>
            <g clipPath={`url(#${clipId})`}>
              {figure.areas
                .filter((area) => !(hide && area.solution))
                .map((area, index) => (
                  <path key={`a${index}`} d={`${poly(scales, area.points)} Z`} fill={area.fill} stroke="none" />
                ))}
              {figure.curves.map((item, index) => {
                const segment = visibleSegment(item.curve, scales.qMax, scales.pMax);
                if (!segment) return null;
                const end = segment[segment.length - 1];
                labels.push({
                  x: scales.x(end.q) + (end.q > scales.qMax * 0.9 ? -16 : 8),
                  y: scales.y(end.p) + (item.label.startsWith("D") ? 16 : -8),
                  text: item.label,
                  ghost: item.ghost,
                });
                return (
                  <path
                    key={`c${index}`}
                    d={poly(scales, segment)}
                    fill="none"
                    stroke={item.ghost ? "#b7b1a6" : "#1c1915"}
                    strokeWidth={item.ghost ? 1.6 : 2.2}
                    strokeDasharray={item.ghost ? "6 4" : undefined}
                  />
                );
              })}
              {figure.axisQuantities
                .filter((item) => !(hide && item.solution))
                .map((item, index) => (
                  <line
                    key={`aq${index}`}
                    x1={scales.x(item.q)}
                    y1={scales.y(Math.max(0, item.fromP))}
                    x2={scales.x(item.q)}
                    y2={scales.y(0)}
                    stroke="#1c1915"
                    strokeDasharray="4 4"
                    strokeWidth="1.1"
                  />
                ))}
              {figure.lines
                .filter((line) => !(hide && line.solution))
                .map((line, index) => {
                  if (line.label) {
                    const horizontal = Math.abs(line.a.p - line.b.p) < 0.15;
                    const midX = (scales.x(line.a.q) + scales.x(line.b.q)) / 2;
                    const midY = (scales.y(line.a.p) + scales.y(line.b.p)) / 2;
                    labels.push(
                      horizontal && line.label.length > 4
                        ? { x: midX, y: scales.y(line.a.p) + 20, text: line.label, anchor: "middle" as const }
                        : horizontal
                          ? { x: scales.x(Math.min(line.a.q, line.b.q)) + 8, y: scales.y(line.a.p) - 8, text: line.label }
                          : { x: midX + 8, y: midY, text: line.label, anchor: "start" as const },
                    );
                  }
                  return (
                    <line
                      key={`l${index}`}
                      x1={scales.x(line.a.q)}
                      y1={scales.y(line.a.p)}
                      x2={scales.x(line.b.q)}
                      y2={scales.y(line.b.p)}
                      stroke={line.ghost ? "#b7b1a6" : "#1c1915"}
                      strokeDasharray={line.dashed ? "4 4" : undefined}
                      strokeWidth="1.2"
                    />
                  );
                })}
              {figure.arrows
                .filter((arrow) => !(hide && arrow.solution))
                .map((arrow, index) => {
                  labels.push({
                    x: (scales.x(arrow.a.q) + scales.x(arrow.b.q)) / 2 + 10,
                    y: (scales.y(arrow.a.p) + scales.y(arrow.b.p)) / 2 + (arrow.labelDy ?? -8),
                    text: arrow.label,
                  });
                  return (
                    <line
                      key={`r${index}`}
                      x1={scales.x(arrow.a.q)}
                      y1={scales.y(arrow.a.p)}
                      x2={scales.x(arrow.b.q)}
                      y2={scales.y(arrow.b.p)}
                      stroke="#1c1915"
                      strokeWidth="1.3"
                      markerEnd={`url(#${markerId})`}
                    />
                  );
                })}
            </g>
            {labels.map((label, index) => (
              <text
                key={`t${index}`}
                x={label.x}
                y={label.y}
                textAnchor={label.anchor ?? "start"}
                className={label.ghost ? "curve-label ghost" : label.text.length <= 3 ? "curve-label" : "note-label"}
              >
                {label.text}
              </text>
            ))}
            {figure.markers
              .filter((marker) => !(hide && marker.solution))
              .map((marker, index) => (
                <g key={`m${index}`}>
                  <circle
                    cx={scales.x(marker.at.q)}
                    cy={scales.y(marker.at.p)}
                    r="4.2"
                    fill={marker.hollow ? "#fff" : "#1c1915"}
                    stroke="#1c1915"
                    strokeWidth="1.4"
                  />
                  {marker.label ? (
                    <text x={scales.x(marker.at.q) + 8} y={scales.y(marker.at.p) - 8} className="curve-label">
                      {marker.label}
                    </text>
                  ) : null}
                </g>
              ))}
            {placeAxisTags(
              scales,
              figure.axisQuantities.filter((item) => !(hide && item.solution)),
            ).map((tag, index) => (
              <g key={`tag${index}`}>
                <rect x={tag.x - 14} y={tag.y - 11} width="28" height="14" fill="#fff" />
                <text x={tag.x} y={tag.y} textAnchor="middle" className="curve-label">
                  {tag.label}
                </text>
              </g>
            ))}
          </>
        );
      }}
    </ChartFrame>
  );
}
