import { qtyAt } from "../models/curve";
import type { TradeResult } from "../models/trade";
import { visibleSegment } from "../models/curve";
import { ChartFrame, placeAxisTags, poly } from "./frame";

function tradeQuantities(result: TradeResult, freeQs: number, freeQd: number): { q: number; label: string }[] {
  const marks: { q: number; label: string }[] = [];
  const add = (q: number, label: string) => {
    if (!(q > 0.4) || marks.some((item) => Math.abs(item.q - q) < 0.7)) return;
    marks.push({ q, label });
  };
  add(result.qDemanded, "Qd");
  add(result.qSupplied, "Qs");
  add(freeQd, "Qd1");
  add(freeQs, "Qs1");
  return marks.sort((a, b) => a.q - b.q);
}

export function TradeDiagram({ result, aria }: { result: TradeResult; aria: string }) {
  const qMax = 100;
  const pMax = 24;
  const demand = visibleSegment(result.demand, qMax, pMax);
  const supply = visibleSegment(result.supply, qMax, pMax);
  const freeQd = Math.max(0, qtyAt(result.demand, result.worldPrice));
  const freeQs = Math.max(0, qtyAt(result.supply, result.worldPrice));
  const showDomestic = Math.abs(result.domesticPrice - result.worldPrice) > 0.05;

  return (
    <ChartFrame qMax={qMax} pMax={pMax} xLabel="Quantity" yLabel="Price" aria={aria}>
      {(scales, _marker, clipId) => (
        <>
          <g clipPath={`url(#${clipId})`}>
            {result.note !== "wrong-instrument" && result.imports > 0 ? (
              <rect
                x={scales.x(result.qSupplied)}
                y={scales.y(result.domesticPrice)}
                width={Math.max(0, scales.x(result.qDemanded) - scales.x(result.qSupplied))}
                height={Math.max(0, scales.y(result.worldPrice) - scales.y(result.domesticPrice))}
                fill="rgba(28, 25, 21, 0.12)"
              />
            ) : null}
            {showDomestic && result.qSupplied > freeQs + 0.4 ? (
              <path
                d={`${poly(scales, [
                  { q: freeQs, p: result.worldPrice },
                  { q: result.qSupplied, p: result.domesticPrice },
                  { q: result.qSupplied, p: result.worldPrice },
                ])} Z`}
                fill="rgba(148, 52, 42, 0.35)"
              />
            ) : null}
            {showDomestic && freeQd > result.qDemanded + 0.4 ? (
              <path
                d={`${poly(scales, [
                  { q: result.qDemanded, p: result.domesticPrice },
                  { q: result.qDemanded, p: result.worldPrice },
                  { q: freeQd, p: result.worldPrice },
                ])} Z`}
                fill="rgba(148, 52, 42, 0.35)"
              />
            ) : null}
            {result.exports > 0 && showDomestic ? (
              <rect
                x={scales.x(result.qDemanded)}
                y={scales.y(result.domesticPrice)}
                width={Math.max(0, scales.x(result.qSupplied) - scales.x(result.qDemanded))}
                height={Math.max(0, scales.y(result.worldPrice) - scales.y(result.domesticPrice))}
                fill="rgba(28, 25, 21, 0.12)"
              />
            ) : null}
            {demand ? <path d={poly(scales, demand)} fill="none" stroke="#1c1915" strokeWidth="1.45" /> : null}
            {supply ? <path d={poly(scales, supply)} fill="none" stroke="#1c1915" strokeWidth="1.45" /> : null}
            <line x1={scales.x(0)} x2={scales.x(qMax)} y1={scales.y(result.worldPrice)} y2={scales.y(result.worldPrice)} stroke="#1c1915" strokeDasharray="5 4" />
            {showDomestic ? (
              <line x1={scales.x(0)} x2={scales.x(qMax)} y1={scales.y(result.domesticPrice)} y2={scales.y(result.domesticPrice)} stroke="#1c1915" strokeWidth="1.6" />
            ) : null}
            {[result.qSupplied, result.qDemanded, freeQs, freeQd]
              .filter((q, index, all) => q > 0.4 && all.findIndex((other) => Math.abs(other - q) < 0.7) === index)
              .map((q) => (
                <line
                  key={q}
                  x1={scales.x(q)}
                  x2={scales.x(q)}
                  y1={scales.y(0)}
                  y2={scales.y(result.domesticPrice)}
                  stroke="#1c1915"
                  strokeDasharray="3 3"
                />
              ))}
          </g>
          {placeAxisTags(scales, tradeQuantities(result, freeQs, freeQd)).map((tag) => (
            <g key={tag.label}>
              <rect x={tag.box.x - 2} y={tag.box.y - 1} width={tag.box.w + 4} height={tag.box.h + 2} fill="#fff" />
              <text x={tag.x} y={tag.y} textAnchor="middle" className="curve-label">
                {tag.label}
              </text>
            </g>
          ))}
          {demand ? <text x={scales.x(demand[1].q) - 14} y={scales.y(demand[1].p) + 16} className="curve-label">D</text> : null}
          {supply ? <text x={scales.x(supply[1].q) - 14} y={scales.y(supply[1].p) - 8} className="curve-label">S</text> : null}
          <text x={scales.x(qMax) - 36} y={scales.y(result.worldPrice) - 8} className="note-label">Pw</text>
          {showDomestic ? <text x={scales.x(6)} y={scales.y(result.domesticPrice) - 8} className="note-label">Pd</text> : null}
          <text x={scales.x(40) - 28} y={scales.y(10) - 10} className="note-label">autarky</text>
          <circle cx={scales.x(40)} cy={scales.y(10)} r="3.5" fill="#fff" stroke="#1c1915" />
        </>
      )}
    </ChartFrame>
  );
}
