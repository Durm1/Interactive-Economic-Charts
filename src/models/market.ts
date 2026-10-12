import {
  areaBetween,
  curveFromElasticity,
  elasticityAt,
  intersect,
  priceAt,
  qtyAt,
  shiftVertical,
  type Curve,
} from "./curve";

export type MarketInput = {
  pRef: number;
  qRef: number;
  ped: number;
  pes: number;
  /** Positive: willingness to pay rises, demand shifts up. */
  demandShift: number;
  /** Positive: costs rise, supply shifts up. */
  supplyShift: number;
  tax: number;
  subsidy: number;
  /** Share of the consumer price taken as tax, from 0 to 1. Pivots supply instead of shifting it in parallel. */
  adValorem?: number;
  ceiling: number | null;
  floor: number | null;
  /** A disequilibrium price that is not a legal control. */
  observedPrice: number | null;
};

export type Point = { p: number; q: number };

export type MarketResult = {
  ok: boolean;
  demand: Curve;
  supply: Curve;
  supplyFaced: Curve;
  baseDemand: Curve;
  baseSupply: Curve;
  baseEq: Point;
  preTax: Point | null;
  unconstrained: Point | null;
  pc: number;
  pp: number;
  traded: number;
  qDemanded: number;
  qSupplied: number;
  excessDemand: number;
  binding: "none" | "ceiling" | "floor" | "observed";
  cs: number;
  ps: number;
  taxRevenue: number;
  subsidyCost: number;
  dwl: number;
  baseCs: number;
  basePs: number;
  consumerBurden: number;
  producerBurden: number;
  pedAtBase: number;
  pesAtBase: number;
};

const empty: MarketResult = {
  ok: false,
  demand: { kind: "linear", intercept: 0, slope: -1 },
  supply: { kind: "linear", intercept: 0, slope: 1 },
  supplyFaced: { kind: "linear", intercept: 0, slope: 1 },
  baseDemand: { kind: "linear", intercept: 0, slope: -1 },
  baseSupply: { kind: "linear", intercept: 0, slope: 1 },
  baseEq: { p: 0, q: 0 },
  preTax: null,
  unconstrained: null,
  pc: 0,
  pp: 0,
  traded: 0,
  qDemanded: 0,
  qSupplied: 0,
  excessDemand: 0,
  binding: "none",
  cs: 0,
  ps: 0,
  taxRevenue: 0,
  subsidyCost: 0,
  dwl: 0,
  baseCs: 0,
  basePs: 0,
  consumerBurden: 0,
  producerBurden: 0,
  pedAtBase: 0,
  pesAtBase: 0,
};

function welfare(demand: Curve, supply: Curve, q: number, pc: number, pp: number) {
  if (q <= 0) return { cs: 0, ps: 0 };
  return {
    cs: areaBetween(demand, 0, q, pc, true),
    ps: areaBetween(supply, 0, q, pp, false),
  };
}

export function solveMarket(input: MarketInput): MarketResult {
  const pRef = input.pRef;
  const qRef = input.qRef;
  if (!(pRef > 0) || !(qRef > 0)) return empty;

  const baseDemand = curveFromElasticity(pRef, qRef, input.ped, "demand");
  const baseSupply = curveFromElasticity(pRef, qRef, input.pes, "supply");
  const demand = shiftVertical(baseDemand, input.demandShift);
  const supply = shiftVertical(baseSupply, input.supplyShift);
  const rate = Math.min(0.85, Math.max(0, input.adValorem ?? 0));
  const wedge = input.tax - input.subsidy;
  const supplyFaced = facedByBuyers(supply, wedge, rate);

  const baseWelfare = welfare(baseDemand, baseSupply, qRef, pRef, pRef);
  const pre = intersect(demand, supply);
  const hit = intersect(demand, supplyFaced);

  const result: MarketResult = {
    ...empty,
    ok: true,
    demand,
    supply,
    supplyFaced,
    baseDemand,
    baseSupply,
    baseEq: { p: pRef, q: qRef },
    preTax: pre && pre.q > 0 && pre.p > 0 ? pre : null,
    unconstrained: hit && hit.q > 0 && hit.p > 0 ? hit : null,
    baseCs: baseWelfare.cs,
    basePs: baseWelfare.ps,
    pedAtBase: elasticityAt(baseDemand, pRef, qRef),
    pesAtBase: elasticityAt(baseSupply, pRef, qRef),
  };

  let pc = hit?.p ?? 0;
  let pp = priceReceived(pc, wedge, rate);
  let binding: MarketResult["binding"] = "none";

  if (!hit || hit.q <= 0 || hit.p <= 0) {
    const lost = baseWelfare.cs + baseWelfare.ps;
    return { ...result, ok: true, dwl: lost, consumerBurden: Number.NaN, producerBurden: Number.NaN };
  }

  const ceilingBinds = input.ceiling != null && hit.p > input.ceiling + 1e-9;
  const floorBinds = input.floor != null && hit.p < input.floor - 1e-9 && !ceilingBinds;

  if (ceilingBinds && input.ceiling != null) {
    binding = "ceiling";
    pc = input.ceiling;
    pp = priceReceived(pc, wedge, rate);
  } else if (floorBinds && input.floor != null) {
    binding = "floor";
    pc = input.floor;
    pp = priceReceived(pc, wedge, rate);
  } else if (input.observedPrice != null && input.ceiling == null && input.floor == null) {
    if (Math.abs(input.observedPrice - hit.p) > 0.05) {
      binding = "observed";
      pc = input.observedPrice;
      pp = priceReceived(pc, wedge, rate);
    }
  }

  const qDemanded = Math.max(0, qtyAt(demand, pc));
  const qSupplied = Math.max(0, qtyAt(supply, pp));
  const traded = Math.min(qDemanded, qSupplied);
  const { cs, ps } = welfare(demand, supply, traded, pc, pp);
  const taxRevenue = (rate > 0 ? rate * pc : Math.max(0, input.tax)) * traded;
  const subsidyCost = Math.max(0, input.subsidy) * traded;

  let efficient = 0;
  if (pre && pre.q > 0 && pre.p > 0) {
    const w = welfare(demand, supply, pre.q, pre.p, pre.p);
    efficient = w.cs + w.ps;
  }
  const dwl = Math.max(0, efficient - (cs + ps + taxRevenue - subsidyCost));

  const referenceP = pre && pre.p > 0 ? pre.p : pRef;
  return {
    ...result,
    pc,
    pp,
    traded,
    qDemanded,
    qSupplied,
    excessDemand: qDemanded - qSupplied,
    binding,
    cs,
    ps,
    taxRevenue,
    subsidyCost,
    dwl,
    consumerBurden: pc - referenceP,
    producerBurden: referenceP - pp,
  };
}

export function sameCurve(a: Curve, b: Curve): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "linear" && b.kind === "linear") {
    return Math.abs(a.intercept - b.intercept) < 1e-6 && Math.abs(a.slope - b.slope) < 1e-9;
  }
  return false;
}

export function demandPrice(result: MarketResult, q: number): number {
  return priceAt(result.demand, q);
}

/** Specific wedge is a parallel shift. An ad valorem rate pivots a linear supply around a steeper slope. */
function facedByBuyers(supply: Curve, wedge: number, rate: number): Curve {
  if (rate > 0 && supply.kind === "linear") {
    const factor = 1 / (1 - rate);
    return { kind: "linear", intercept: supply.intercept * factor, slope: supply.slope * factor };
  }
  return shiftVertical(supply, wedge);
}

function priceReceived(pc: number, wedge: number, rate: number): number {
  if (rate > 0) return pc * (1 - rate);
  return pc - wedge;
}
