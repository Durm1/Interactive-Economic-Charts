import { useLayoutEffect, useRef, useState } from "react";
import { visibleSegment } from "../models/curve";
import type { MarketFigure } from "../figures/marketFigure";
import {
  axisTitleBoxes,
  chooseCandidate,
  isCallout,
  placeCallouts,
  strokeBoxes,
  tickBoxes,
  yTickBoxes,
  type Box,
  type Candidate,
} from "./labels";
import { ChartFrame, placeAxisTags, poly, ticks, type Scales } from "./frame";

type ShortLabel = { text: string; candidates: Candidate[]; ghost?: boolean; note?: boolean; font: number };
type Note = { text: string; x: number; y: number };

export function MarketDiagram({ figure, hide }: { figure: MarketFigure; hide: boolean }) {
  return (
    <ChartFrame qMax={figure.qMax} pMax={figure.pMax} xLabel={figure.xLabel} yLabel={figure.yLabel} aria={figure.aria}>
      {(scales, markerId, clipId) => (
        <>
          <Geometry figure={figure} hide={hide} scales={scales} markerId={markerId} clipId={clipId} />
          <PlacedLabels figure={figure} hide={hide} scales={scales} markerId={markerId} />
        </>
      )}
    </ChartFrame>
  );
}

function Geometry({
  figure,
  hide,
  scales,
  markerId,
  clipId,
}: {
  figure: MarketFigure;
  hide: boolean;
  scales: Scales;
  markerId: string;
  clipId: string;
}) {
  return (
    <g clipPath={`url(#${clipId})`}>
      {figure.areas
        .filter((area) => !(hide && area.solution))
        .map((area, index) => {
          const d = `${poly(scales, area.points)} Z`;
          if (!area.hatch) return <path key={`a${index}`} d={d} fill={area.fill} stroke="none" />;
          const xs = area.points.map((pt) => scales.x(pt.q));
          const ys = area.points.map((pt) => scales.y(pt.p));
          const left = Math.min(...xs);
          const right = Math.max(...xs);
          const top = Math.min(...ys);
          const bottom = Math.max(...ys);
          const hatchId = `${markerId}-hatch-${index}`;
          const lines = [];
          for (let y = top + 4; y < bottom - 1; y += 7) {
            lines.push(
              <line key={y} x1={left} x2={right} y1={y} y2={y} stroke="#1c1915" strokeWidth="1" strokeDasharray="3 3" />,
            );
          }
          return (
            <g key={`a${index}`}>
              <clipPath id={hatchId}>
                <path d={d} />
              </clipPath>
              <g clipPath={`url(#${hatchId})`}>{lines}</g>
            </g>
          );
        })}
      {figure.curves.map((item, index) => {
        const segment = visibleSegment(item.curve, scales.qMax, scales.pMax);
        if (!segment) return null;
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
        .map((line, index) => (
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
        ))}
      {figure.arrows
        .filter((arrow) => !(hide && arrow.solution))
        .map((arrow, index) => (
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
        ))}
    </g>
  );
}

function PlacedLabels({ figure, hide, scales, markerId }: { figure: MarketFigure; hide: boolean; scales: Scales; markerId: string }) {
  const ref = useRef<SVGGElement>(null);
  const [unit, setUnit] = useState(1);
  useLayoutEffect(() => {
    const svg = ref.current?.ownerSVGElement;
    if (!svg) return;
    const read = () => {
      const width = svg.getBoundingClientRect().width;
      const next = width > 0 ? scales.width / width : 1;
      setUnit((prev) => (Math.abs(prev - next) < 0.02 ? prev : next));
    };
    read();
    const observer = new ResizeObserver(read);
    observer.observe(svg);
    return () => observer.disconnect();
  }, [scales.width]);

  const layout = layoutFigure(figure, hide, scales, unit);
  return (
    <g ref={ref}>
      {figure.markers
        .filter((marker) => !(hide && marker.solution))
        .map((marker, index) => (
          <circle
            key={`m${index}`}
            cx={scales.x(marker.at.q)}
            cy={scales.y(marker.at.p)}
            r="4.2"
            fill={marker.hollow ? "#fff" : "#1c1915"}
            stroke="#1c1915"
            strokeWidth="1.4"
          />
        ))}
      {layout.leaders.map((leader, index) => (
        <line
          key={`lead${index}`}
          x1={leader.x1}
          y1={leader.y1}
          x2={leader.x2}
          y2={leader.y2}
          stroke="#5c5c5c"
          strokeWidth="1.1"
          markerEnd={`url(#${markerId})`}
        />
      ))}
      {layout.shorts.map((label, index) => (
        <text
          key={`s${index}`}
          x={label.at.x}
          y={label.at.y}
          textAnchor={label.at.anchor}
          className={label.ghost ? "curve-label ghost" : label.note ? "note-label" : "curve-label"}
        >
          {label.text}
        </text>
      ))}
      {layout.tags.map((tag) => (
        <g key={tag.label}>
          <rect x={tag.box.x - 2} y={tag.box.y - 1} width={tag.box.w + 4} height={tag.box.h + 2} fill="#fff" />
          <text x={tag.x} y={tag.y} textAnchor="middle" className="curve-label">
            {tag.label}
          </text>
        </g>
      ))}
      {layout.notes.map((note) => (
        <g key={note.text}>
          <rect x={note.box.x - 4} y={note.box.y - 2} width={note.box.w + 8} height={note.box.h + 4} fill="#fff" />
          <text x={note.x} y={note.y} textAnchor="middle" className="callout">
            {note.text}
          </text>
        </g>
      ))}
    </g>
  );
}

function layoutFigure(figure: MarketFigure, hide: boolean, scales: Scales, unit: number) {
  const curveFont = 15 * unit;
  const noteFont = 12 * unit;
  const edge = 10 + 16 * unit;
  const bounds: Box = { x: 4, y: edge, w: scales.width - 8, h: scales.height - edge - 6 };
  const axisY = scales.y(0);
  const furniture: Box[] = [...axisTitleBoxes(scales, figure.xLabel, figure.yLabel, unit), ...yTickBoxes(scales, ticks(scales.pMax), unit)];
  const strokes: Box[] = [];

  for (const item of figure.curves) {
    const segment = visibleSegment(item.curve, scales.qMax, scales.pMax);
    if (!segment) continue;
    strokes.push(...strokeBoxes(segment.map((pt) => ({ x: scales.x(pt.q), y: scales.y(pt.p) }))));
  }
  for (const line of figure.lines) {
    if (hide && line.solution) continue;
    strokes.push(
      ...strokeBoxes([
        { x: scales.x(line.a.q), y: scales.y(line.a.p) },
        { x: scales.x(line.b.q), y: scales.y(line.b.p) },
      ]),
    );
  }
  for (const arrow of figure.arrows) {
    if (hide && arrow.solution) continue;
    strokes.push(
      ...strokeBoxes([
        { x: scales.x(arrow.a.q), y: scales.y(arrow.a.p) },
        { x: scales.x(arrow.b.q), y: scales.y(arrow.b.p) },
      ]),
    );
  }
  for (const marker of figure.markers) {
    if (hide && marker.solution) continue;
    const x = scales.x(marker.at.q);
    const y = scales.y(marker.at.p);
    strokes.push({ x: x - 8, y: y - 8, w: 16, h: 16 });
  }
  for (const drop of figure.axisQuantities) {
    if (hide && drop.solution) continue;
    strokes.push(
      ...strokeBoxes([
        { x: scales.x(drop.q), y: scales.y(Math.max(0, drop.fromP)) },
        { x: scales.x(drop.q), y: axisY },
      ]),
    );
  }

  const lane: Box = { x: scales.left, y: axisY - 34 * unit, w: scales.plotW, h: 34 * unit };
  const tags = placeAxisTags(
    scales,
    figure.axisQuantities.filter((item) => !(hide && item.solution)),
    { blocked: furniture, unit },
  );
  const occupied: Box[] = [
    ...furniture,
    ...tickBoxes(scales, ticks(scales.qMax), axisY + 18, unit),
    ...strokes,
    lane,
    ...tags.map((tag) => tag.box),
  ];
  const noteBlocked: Box[] = tags.map((tag) => tag.box);

  const shorts: { text: string; at: Candidate; ghost?: boolean; note?: boolean }[] = [];
  const place = (label: ShortLabel) => {
    const { at, box } = chooseCandidate(label.text, label.candidates, occupied, label.font, bounds);
    noteBlocked.push(box);
    shorts.push({ text: label.text, at, ghost: label.ghost, note: label.note });
  };

  for (const marker of figure.markers) {
    if (!marker.label || (hide && marker.solution)) continue;
    const x = scales.x(marker.at.q);
    const y = scales.y(marker.at.p);
    place({
      text: marker.label,
      font: curveFont,
      candidates: [
        { x: x + 8, y: y - 8, anchor: "start" },
        { x: x + 8, y: y + 14, anchor: "start" },
        { x: x - 8, y: y - 8, anchor: "end" },
        { x: x - 8, y: y + 14, anchor: "end" },
      ],
    });
  }

  for (const line of figure.lines) {
    if (!line.label || (hide && line.solution) || isCallout(line.label)) continue;
    const horizontal = Math.abs(line.a.p - line.b.p) < 0.15;
    const midX = (scales.x(line.a.q) + scales.x(line.b.q)) / 2;
    const midY = (scales.y(line.a.p) + scales.y(line.b.p)) / 2;
    if (horizontal) {
      const x0 = scales.x(Math.min(line.a.q, line.b.q)) + 10;
      const y0 = scales.y(line.a.p);
      place({
        text: line.label,
        font: curveFont,
        candidates: [
          { x: x0, y: y0 - 8, anchor: "start" },
          { x: x0, y: y0 + 14, anchor: "start" },
          { x: x0 + 28, y: y0 - 8, anchor: "start" },
          { x: x0 + 28, y: y0 + 14, anchor: "start" },
        ],
      });
    } else {
      place({
        text: line.label,
        font: curveFont,
        candidates: [
          { x: midX + 16, y: midY, anchor: "start" },
          { x: midX - 16, y: midY, anchor: "end" },
          { x: midX + 16, y: midY + 18, anchor: "start" },
          { x: midX - 16, y: midY + 18, anchor: "end" },
        ],
      });
    }
  }

  for (const item of figure.curves) {
    const segment = visibleSegment(item.curve, scales.qMax, scales.pMax);
    if (!segment) continue;
    const demand = item.label.startsWith("D");
    const spot = curveNameSpot(segment, demand, scales.pMax);
    const x = scales.x(spot.q);
    const y = scales.y(spot.p);
    const nearRight = spot.q > scales.qMax * 0.9;
    const habitDx = nearRight ? -18 : 12;
    const habitDy = -14;
    const side = (dx: number): Candidate["anchor"] => (dx < 0 ? "end" : "start");
    place({
      text: item.label,
      ghost: item.ghost,
      font: item.ghost ? noteFont : curveFont,
      candidates: [
        { x: x + habitDx, y: y + habitDy, anchor: side(habitDx) },
        { x: x + habitDx, y: y - habitDy, anchor: side(habitDx) },
        { x: x - habitDx, y: y + habitDy, anchor: side(-habitDx) },
        { x: x - habitDx, y: y - habitDy, anchor: side(-habitDx) },
      ],
    });
  }

  const seen = new Set<string>();
  const notes: Note[] = [];
  const addNote = (text: string, x: number, y: number) => {
    if (seen.has(text)) return;
    seen.add(text);
    notes.push({ text, x, y });
  };
  for (const arrow of figure.arrows) {
    if (hide && arrow.solution) continue;
    seen.add(arrow.label);
    const x = (scales.x(arrow.a.q) + scales.x(arrow.b.q)) / 2;
    const y = (scales.y(arrow.a.p) + scales.y(arrow.b.p)) / 2;
    const dy = arrow.labelDy ?? -8;
    place({
      text: arrow.label,
      note: true,
      font: noteFont,
      candidates: [
        { x: x + 12, y: y + dy, anchor: "start" },
        { x: x - 12, y: y + dy, anchor: "end" },
        { x: x + 12, y: y - dy, anchor: "start" },
        { x: x - 12, y: y - dy, anchor: "end" },
      ],
    });
  }
  for (const line of figure.lines) {
    if (!line.label || !isCallout(line.label) || seen.has(line.label) || (hide && line.solution)) continue;
    addNote(line.label, (scales.x(line.a.q) + scales.x(line.b.q)) / 2, (scales.y(line.a.p) + scales.y(line.b.p)) / 2);
  }

  const laneY = axisY - 12 * unit;
  const placedNotes = placeCallouts(notes, noteBlocked, noteFont, {
    y: laneY,
    left: scales.left + 8,
    right: scales.left + scales.plotW - 8,
  });
  const leaders = placedNotes.map((note) => {
    const fromX = note.x;
    const fromY = note.box.y - 2;
    const dx = note.targetX - fromX;
    const dy = note.targetY - fromY;
    const dist = Math.hypot(dx, dy) || 1;
    const length = Math.min(22, dist);
    return { x1: fromX, y1: fromY, x2: fromX + (dx / dist) * length, y2: fromY + (dy / dist) * length };
  });

  return { shorts, tags, notes: placedNotes, leaders };
}

/** Keep D and S on the sloping part of the curve, not on the x-axis. */
function curveNameSpot(
  segment: { q: number; p: number }[],
  demand: boolean,
  pMax: number,
): { q: number; p: number } {
  const start = segment[0];
  const end = segment[segment.length - 1];
  const low = (point: { p: number }) => point.p < pMax * 0.18;
  if (demand && low(end)) {
    const t = 0.62;
    return { q: start.q + (end.q - start.q) * t, p: start.p + (end.p - start.p) * t };
  }
  if (!demand && low(end) && !low(start)) return start;
  return end;
}
