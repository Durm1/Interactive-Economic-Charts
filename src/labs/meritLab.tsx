import { visibleSegment } from "../models/curve";
import { ChartFrame, poly } from "../diagrams/frame";
import { num } from "../lib/format";
import { curveFromElasticity, intersect, priceAt, shiftVertical } from "../models/curve";
import { numOf, strOf, type Lab } from "./types";

export const meritLab: Lab = {
  id: "merit",
  code: "3.1.2 · 3.2.6",
  title: "Merit and demerit goods",
  chinese: "优值品与劣值品",
  pitfall: {
    en: "At AS, merit and demerit goods are about imperfect information. Label perceived demand and actual demand. MSC and MSB diagrams are A Level.",
    zh: "AS 阶段优值品和劣值品考的是信息不完全。标感知需求和真实需求。MSC 与 MSB 是 A Level 的图。",
  },
  initial: { kind: "merit", information: 0.15 },
  presets: [
    { id: "merit", label: "Merit good", detail: "Consumers underestimate the benefit and under-consume.", values: { kind: "merit", information: 0.1 } },
    { id: "info", label: "Information provision", detail: "Perceived demand moves towards actual demand.", values: { kind: "merit", information: 0.85 } },
    { id: "demerit", label: "Demerit good", detail: "Consumers underestimate the harm and over-consume.", values: { kind: "demerit", information: 0.1 } },
  ],
  fields: () => [
    { kind: "select", key: "kind", label: "Good", options: [{ value: "merit", label: "Merit good" }, { value: "demerit", label: "Demerit good" }] },
    { kind: "slider", key: "information", label: "Information (1 = full information)", min: 0, max: 1, step: 0.05 },
  ],
  build: (values, hide) => {
    const merit = strOf(values, "kind") === "merit";
    const gap = 5 * (1 - numOf(values, "information"));
    const actual = curveFromElasticity(10, 40, 1, "demand");
    const perceived = shiftVertical(actual, merit ? -gap : gap);
    const supply = curveFromElasticity(10, 40, 1, "supply");
    const market = intersect(perceived, supply);
    const full = intersect(actual, supply);
    const qMarket = market && market.q > 0 ? market.q : 0;
    const qFull = full && full.q > 0 ? full.q : 0;
    const gapQty = qFull - qMarket;
    const english = merit
      ? `With imperfect information, consumers perceive a smaller benefit, so perceived demand lies to the left of actual demand. The market quantity is ${num(qMarket)}, below the full-information quantity of ${num(qFull)}. The merit good is under-consumed by ${num(Math.max(0, gapQty))}. Better information shifts perceived demand towards actual demand.`
      : `Consumers underestimate the private harm, so perceived demand lies to the right of actual demand. The market quantity is ${num(qMarket)}, above the full-information quantity of ${num(qFull)}. The demerit good is over-consumed by ${num(Math.max(0, -gapQty))}.`;
    const chinese = merit
      ? `信息不完全时，消费者低估利益，感知需求在真实需求左侧。市场数量 ${num(qMarket)} 低于充分信息下的 ${num(qFull)}，优值品消费不足 ${num(Math.max(0, gapQty))}。提供信息会使感知需求向真实需求靠拢。`
      : `消费者低估自身受到的损害，感知需求在真实需求右侧。市场数量 ${num(qMarket)} 高于充分信息下的 ${num(qFull)}，劣值品过度消费 ${num(Math.max(0, -gapQty))}。`;
    const qMax = 90;
    const pMax = 24;
    return {
      diagram: (
        <ChartFrame qMax={qMax} pMax={pMax} xLabel="Quantity" yLabel="Price" aria={english}>
          {(scales, _marker, clipId) => {
            const perceivedSeg = visibleSegment(perceived, qMax, pMax);
            const actualSeg = visibleSegment(actual, qMax, pMax);
            const supplySeg = visibleSegment(supply, qMax, pMax);
            return (
              <g clipPath={`url(#${clipId})`}>
                {actualSeg ? <path d={poly(scales, actualSeg)} fill="none" stroke="#1c1915" strokeWidth="1.45" /> : null}
                {perceivedSeg ? <path d={poly(scales, perceivedSeg)} fill="none" stroke="#1c1915" strokeWidth="1.45" strokeDasharray="7 4" /> : null}
                {supplySeg ? <path d={poly(scales, supplySeg)} fill="none" stroke="#1c1915" strokeWidth="1.45" /> : null}
                {!hide && market ? <circle cx={scales.x(market.q)} cy={scales.y(market.p)} r="4.2" fill="#1c1915" /> : null}
                {!hide && full ? <circle cx={scales.x(full.q)} cy={scales.y(full.p)} r="4.2" fill="#fff" stroke="#1c1915" /> : null}
                <text x={scales.x(70)} y={scales.y(priceAt(actual, 70)) - 8} className="curve-label">D actual</text>
                <text x={scales.x(merit ? 28 : 62)} y={scales.y(priceAt(perceived, merit ? 28 : 62)) - 8} className="curve-label">D perceived</text>
                <text x={scales.x(72)} y={scales.y(priceAt(supply, 72)) - 8} className="curve-label">S</text>
              </g>
            );
          }}
        </ChartFrame>
      ),
      readouts: [
        { label: "Market quantity", value: num(qMarket) },
        { label: "Full-information quantity", value: num(qFull) },
        { label: merit ? "Under-consumption" : "Over-consumption", value: num(Math.abs(gapQty)) },
      ],
      english,
      chinese,
    };
  },
};
