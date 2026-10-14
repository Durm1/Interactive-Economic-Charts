import type { Curve } from "../models/curve";
import { priceAt, producerSurplusOutline } from "../models/curve";
import { snapMax } from "../diagrams/frame";
import type { MarketInput, MarketResult } from "../models/market";

export const fills = {
  cs: "rgba(37, 99, 235, 0.22)",
  ps: "rgba(217, 119, 6, 0.3)",
  fiscal: "rgba(13, 148, 136, 0.28)",
  dwl: "rgba(190, 18, 60, 0.32)",
  excess: "rgba(28, 25, 21, 0.08)",
};

export type Pt = { q: number; p: number };

export type MarketFigure = {
  xLabel: string;
  yLabel: string;
  qMax: number;
  pMax: number;
  aria: string;
  curves: { curve: Curve; label: string; ghost?: boolean }[];
  areas: { points: Pt[]; fill: string; solution?: boolean; hatch?: boolean }[];
  lines: { a: Pt; b: Pt; label?: string; dashed?: boolean; ghost?: boolean; solution?: boolean }[];
  markers: { at: Pt; label: string; hollow?: boolean; solution?: boolean }[];
  arrows: { a: Pt; b: Pt; label: string; solution?: boolean; labelDy?: number }[];
  /** Distinct quantities, labelled Q1, Q2… on the x-axis. */
  axisQuantities: { q: number; label: string; fromP: number; solution?: boolean }[];
};

export type LegendItem = { name: string; color: string; dashed?: boolean };

type Options = {
  xLabel: string;
  yLabel: string;
  aria: string;
  showSurplus?: boolean;
  showFiscal?: boolean;
  showDwl?: boolean;
  showExcess?: boolean;
  excessLabel?: string;
};

function linearOnly(curve: Curve): curve is { kind: "linear"; intercept: number; slope: number } {
  return curve.kind === "linear";
}

export function marketFigure(result: MarketResult, input: MarketInput, opts: Options): {
  figure: MarketFigure;
  legend: LegendItem[];
} {
  const adValorem = (input.adValorem ?? 0) > 0.001;
  const changed =
    Math.abs(input.demandShift) > 0.05 ||
    Math.abs(input.supplyShift) > 0.05 ||
    input.tax > 0.05 ||
    input.subsidy > 0.05 ||
    adValorem ||
    result.binding !== "none";
  const demandMoved = Math.abs(input.demandShift) > 0.05;
  const supplyMoved = Math.abs(input.supplyShift) > 0.05;
  const wedge = input.tax > 0.05 || input.subsidy > 0.05 || adValorem;

  const qs = [result.baseEq.q * 1.8, result.traded, result.qDemanded, result.qSupplied].filter((q) => q > 0 && q < 8000);
  const prices = [result.baseEq.p * 2, result.pc, result.pp].filter((p) => p > 0 && p < 8000);
  if (linearOnly(result.baseDemand) && result.baseDemand.intercept > 0) {
    prices.push(Math.min(result.baseDemand.intercept, result.baseEq.p * 2.6));
  }
  const qMax = snapMax(Math.max(...qs, 10));
  const pMax = snapMax(Math.max(...prices, 10));

  const curves: MarketFigure["curves"] = [];
  if (demandMoved) curves.push({ curve: result.baseDemand, label: "D", ghost: true });
  curves.push({ curve: result.demand, label: demandMoved ? "D1" : "D" });
  if (supplyMoved || wedge) curves.push({ curve: result.baseSupply, label: "S", ghost: true });
  if (supplyMoved && wedge) curves.push({ curve: result.supply, label: "S′", ghost: true });
  curves.push({
    curve: wedge || supplyMoved ? result.supplyFaced : result.supply,
    label: wedge || supplyMoved ? "S1" : "S",
  });

  const areas: MarketFigure["areas"] = [];
  const lines: MarketFigure["lines"] = [];
  const markers: MarketFigure["markers"] = [];
  const arrows: MarketFigure["arrows"] = [];
  const legend: LegendItem[] = [];
  const axisQuantities: MarketFigure["axisQuantities"] = [];
  const markQuantity = (q: number, fromP: number, label: string, solution?: boolean) => {
    if (!(q > 0.4) || !Number.isFinite(q) || !Number.isFinite(fromP)) return;
    if (axisQuantities.some((item) => Math.abs(item.q - q) < 0.7)) return;
    axisQuantities.push({ q, fromP, label, solution });
  };

  const pre = result.preTax;
  if (changed && pre) {
    markers.push({ at: { q: result.baseEq.q, p: result.baseEq.p }, label: "E", hollow: true });
  }

  const plain = result.binding === "none";
  if (plain && result.baseEq.p > 0 && result.baseEq.q > 0) {
    lines.push({
      a: { q: 0, p: result.baseEq.p },
      b: { q: result.baseEq.q, p: result.baseEq.p },
      dashed: true,
      label: "P",
    });
    markQuantity(result.baseEq.q, result.baseEq.p, "Q");
  }

  if (result.traded > 0 && result.pc > 0) {
    const movedOffBase =
      Math.abs(result.traded - result.baseEq.q) > 0.7 || Math.abs(result.pc - result.baseEq.p) > 0.4;
    markers.push({
      at: { q: result.traded, p: result.pc },
      label: changed && movedOffBase ? "E1" : "E",
      solution: changed && movedOffBase,
    });
    if (!plain || movedOffBase) {
      lines.push({
        a: { q: 0, p: result.pc },
        b: { q: result.traded, p: result.pc },
        dashed: true,
        solution: changed,
        label: wedge || result.binding !== "none" ? "Pc" : movedOffBase ? "P1" : undefined,
      });
      if (!plain || movedOffBase) {
        lines.push({
          a: { q: result.traded, p: 0 },
          b: { q: result.traded, p: result.pc },
          dashed: true,
          solution: changed,
        });
      }
    }
  }

  if (wedge && result.traded > 0) {
    lines.push({
      a: { q: 0, p: result.pp },
      b: { q: result.traded, p: result.pp },
      dashed: true,
      solution: true,
      label: "Pp",
    });
    lines.push({
      a: { q: result.traded, p: result.pp },
      b: { q: result.traded, p: result.pc },
      solution: true,
      label: adValorem ? `${Math.round((input.adValorem ?? 0) * 100)}%` : input.tax > 0 ? "tax" : "subsidy",
    });
  }

  if (opts.showSurplus && result.traded > 0 && linearOnly(result.demand) && linearOnly(result.supply)) {
    const dEnd = priceAt(result.demand, result.traded);
    if (result.demand.intercept > result.pc) {
      areas.push({
        points: [
          { q: 0, p: result.demand.intercept },
          { q: result.traded, p: dEnd },
          { q: result.traded, p: result.pc },
          { q: 0, p: result.pc },
        ],
        fill: fills.cs,
        solution: true,
      });
      legend.push({ name: "Consumer surplus", color: fills.cs });
    }
    const psPoints = producerSurplusOutline(result.supply, result.traded, result.pp);
    if (psPoints.length >= 3) areas.push({ points: psPoints, fill: fills.ps, solution: true });
    legend.push({ name: "Producer surplus", color: fills.ps });
  }

  if (opts.showFiscal && wedge && result.traded > 0) {
    const subsidyArea = input.subsidy > 0.05 && !adValorem && input.tax <= 0.05;
    areas.push({
      points: [
        { q: 0, p: Math.min(result.pc, result.pp) },
        { q: result.traded, p: Math.min(result.pc, result.pp) },
        { q: result.traded, p: Math.max(result.pc, result.pp) },
        { q: 0, p: Math.max(result.pc, result.pp) },
      ],
      fill: subsidyArea ? "none" : fills.fiscal,
      hatch: subsidyArea,
      solution: true,
    });
    legend.push({
      name: subsidyArea ? "Subsidy expenditure" : "Tax revenue",
      color: subsidyArea ? "#1c1915" : fills.fiscal,
      dashed: subsidyArea,
    });
  }

  if (
    opts.showDwl &&
    pre &&
    result.traded > 0 &&
    Math.abs(result.traded - pre.q) > 0.4 &&
    result.dwl > 0.2 &&
    linearOnly(result.demand) &&
    linearOnly(result.supply)
  ) {
    areas.push({
      points: [
        { q: result.traded, p: priceAt(result.demand, result.traded) },
        { q: result.traded, p: priceAt(result.supply, result.traded) },
        { q: pre.q, p: pre.p },
      ],
      fill: fills.dwl,
      solution: true,
    });
    legend.push({ name: "Deadweight loss", color: fills.dwl });
  }

  if (opts.showExcess && result.binding !== "none" && Math.abs(result.excessDemand) > 0.4) {
    const q1 = Math.min(result.qSupplied, result.qDemanded);
    const q2 = Math.max(result.qSupplied, result.qDemanded);
    lines.push({
      a: { q: q1, p: result.pc },
      b: { q: q2, p: result.pc },
      solution: true,
      label: result.excessDemand > 0 ? "excess demand" : (opts.excessLabel ?? "excess supply"),
    });
    if (result.binding !== "observed") {
      markers.push({ at: { q: result.qDemanded, p: result.pc }, label: "", solution: true, hollow: true });
      markers.push({ at: { q: result.qSupplied, p: result.pc }, label: "", solution: true, hollow: true });
    }
  }

  if (result.binding === "ceiling" || result.binding === "floor") {
    markQuantity(result.qDemanded, result.pc, "Qd", true);
    markQuantity(result.qSupplied, result.pc, "Qs", true);
    if (pre) markQuantity(pre.q, pre.p, "Qe");
  } else if (changed && result.traded > 0 && Math.abs(result.traded - result.baseEq.q) > 0.7) {
    markQuantity(result.traded, result.pc, "Q1", true);
  }
  axisQuantities.sort((a, b) => a.q - b.q);

  const demandArrowQ = Math.min(qMax * 0.16, result.baseEq.q * 0.28);
  if (demandMoved && linearOnly(result.baseDemand) && linearOnly(result.demand)) {
    const from = priceAt(result.baseDemand, demandArrowQ);
    const to = priceAt(result.demand, demandArrowQ);
    if (Math.abs(to - from) > 0.4 && from > 0 && to > 0 && from < pMax && to < pMax) {
      arrows.push({
        a: { q: demandArrowQ, p: from },
        b: { q: demandArrowQ, p: to },
        label: input.demandShift > 0 ? "increase in D" : "decrease in D",
        labelDy: -14,
      });
    }
  }
  if ((supplyMoved || wedge) && linearOnly(result.baseSupply) && linearOnly(result.supplyFaced)) {
    const supplyArrowQ = Math.min(qMax * 0.3, result.baseEq.q * 0.5);
    const from = priceAt(result.baseSupply, supplyArrowQ);
    const to = priceAt(result.supplyFaced, supplyArrowQ);
    if (Math.abs(to - from) > 0.4 && from < pMax && to < pMax && to > -2) {
      arrows.push({
        a: { q: supplyArrowQ, p: Math.max(0, from) },
        b: { q: supplyArrowQ, p: Math.max(0, to) },
        label: adValorem ? "ad valorem tax" : input.tax > 0 ? "specific tax" : input.subsidy > 0 ? "subsidy" : input.supplyShift > 0 ? "decrease in S" : "increase in S",
        labelDy: -14,
      });
    }
  }

  if (pre && result.binding === "none" && !(demandMoved && (supplyMoved || wedge))) {
    const alongDemand = !demandMoved && (supplyMoved || wedge);
    const alongSupply = demandMoved && !supplyMoved && !wedge;
    if (alongDemand || alongSupply) {
      const extension = pre.q > result.baseEq.q + 0.2;
      const contraction = pre.q < result.baseEq.q - 0.2;
      if (extension || contraction) {
        arrows.push({
          a: { q: result.baseEq.q, p: result.baseEq.p },
          b: { q: pre.q, p: pre.p },
          solution: true,
          labelDy: 22,
          label: alongDemand
            ? extension
              ? "extension of D"
              : "contraction of D"
            : extension
              ? "extension of S"
              : "contraction of S",
        });
      }
    }
  }

  if (result.binding === "observed" && Math.abs(result.excessDemand) > 0.4) {
    arrows.push({
      a: { q: result.baseEq.q * 0.15, p: result.pc },
      b: { q: result.baseEq.q * 0.15, p: result.pc + (result.excessDemand > 0 ? pMax * 0.12 : -pMax * 0.12) },
      solution: true,
      label: result.excessDemand > 0 ? "price rises" : "price falls",
    });
  }

  return {
    figure: {
      xLabel: opts.xLabel,
      yLabel: opts.yLabel,
      qMax,
      pMax,
      aria: opts.aria,
      curves,
      areas,
      lines,
      markers,
      arrows,
      axisQuantities,
    },
    legend,
  };
}
