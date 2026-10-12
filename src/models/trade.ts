import { curveFromElasticity, priceAt, qtyAt, type Curve } from "./curve";

export type TradeInstrument = "tariff" | "quota" | "subsidy";

export type TradeInput = {
  instrument: TradeInstrument;
  worldPrice: number;
  tariff: number;
  quota: number;
  subsidy: number;
  ped: number;
  pes: number;
};

export type TradeResult = {
  ok: boolean;
  note: "importer" | "exporter" | "autarky" | "wrong-instrument";
  demand: Curve;
  supply: Curve;
  autarkyP: number;
  autarkyQ: number;
  worldPrice: number;
  domesticPrice: number;
  producerPrice: number;
  qDemanded: number;
  qSupplied: number;
  imports: number;
  exports: number;
  freeImports: number;
  freeExports: number;
  tariffRevenue: number;
  subsidyCost: number;
  quotaRent: number;
  cs: number;
  ps: number;
  freeCs: number;
  freePs: number;
  dwl: number;
};

const pRef = 10;
const qRef = 40;

function curves(ped: number, pes: number) {
  return {
    demand: curveFromElasticity(pRef, qRef, ped, "demand"),
    supply: curveFromElasticity(pRef, qRef, pes, "supply"),
  };
}

function triangleWelfare(demand: Curve, supply: Curve, price: number) {
  const qd = Math.max(0, qtyAt(demand, price));
  const qs = Math.max(0, qtyAt(supply, price));
  const cs = demand.kind === "linear" ? Math.max(0, ((demand.intercept - price) * qd) / 2) : 0;
  let ps = 0;
  if (supply.kind === "linear") {
    const c = supply.intercept;
    if (c >= 0) ps = Math.max(0, ((price - c) * qs) / 2);
    else {
      const q0 = -c / supply.slope;
      ps = Math.max(0, (price * (qs - q0)) / 2);
    }
  }
  return { qd, qs, cs, ps };
}

export function solveTrade(input: TradeInput): TradeResult {
  const { demand, supply } = curves(input.ped, input.pes);
  const free = triangleWelfare(demand, supply, input.worldPrice);
  const importing = input.worldPrice < pRef - 1e-6;
  const exporting = input.worldPrice > pRef + 1e-6;

  const blank: TradeResult = {
    ok: true,
    note: importing ? "importer" : exporting ? "exporter" : "autarky",
    demand,
    supply,
    autarkyP: pRef,
    autarkyQ: qRef,
    worldPrice: input.worldPrice,
    domesticPrice: input.worldPrice,
    producerPrice: input.worldPrice,
    qDemanded: free.qd,
    qSupplied: free.qs,
    imports: Math.max(0, free.qd - free.qs),
    exports: Math.max(0, free.qs - free.qd),
    freeImports: Math.max(0, free.qd - free.qs),
    freeExports: Math.max(0, free.qs - free.qd),
    tariffRevenue: 0,
    subsidyCost: 0,
    quotaRent: 0,
    cs: free.cs,
    ps: free.ps,
    freeCs: free.cs,
    freePs: free.ps,
    dwl: 0,
  };

  if (input.instrument === "subsidy") {
    if (!exporting) return { ...blank, note: "wrong-instrument" };
    const domestic = input.worldPrice + input.subsidy;
    const now = triangleWelfare(demand, supply, domestic);
    const exports = Math.max(0, now.qs - now.qd);
    const cost = input.subsidy * exports;
    const dwl = Math.max(0, -(now.cs - free.cs + (now.ps - free.ps) - cost));
    return {
      ...blank,
      note: "exporter",
      domesticPrice: domestic,
      producerPrice: domestic,
      qDemanded: now.qd,
      qSupplied: now.qs,
      imports: 0,
      exports,
      subsidyCost: cost,
      cs: now.cs,
      ps: now.ps,
      dwl,
    };
  }

  if (!importing) {
    return { ...blank, note: exporting ? "wrong-instrument" : "autarky" };
  }

  if (input.instrument === "tariff") {
    const domestic = Math.min(pRef, input.worldPrice + input.tariff);
    const now = triangleWelfare(demand, supply, domestic);
    const imports = Math.max(0, now.qd - now.qs);
    const revenue = (domestic - input.worldPrice) * imports;
    const dwl = Math.max(0, -(now.cs - free.cs + (now.ps - free.ps) + revenue));
    return {
      ...blank,
      domesticPrice: domestic,
      producerPrice: domestic,
      qDemanded: now.qd,
      qSupplied: now.qs,
      imports,
      exports: 0,
      tariffRevenue: revenue,
      cs: now.cs,
      ps: now.ps,
      dwl,
    };
  }

  const b = demand.kind === "linear" ? Math.abs(demand.slope) : 0.25;
  const d = supply.kind === "linear" ? supply.slope : 0.25;
  const a = demand.kind === "linear" ? demand.intercept : 20;
  const c = supply.kind === "linear" ? supply.intercept : 0;
  const quota = Math.max(0, input.quota);
  let domestic = (a * d + c * b - quota * b * d) / (b + d);
  if (domestic < input.worldPrice) domestic = input.worldPrice;
  if (domestic > pRef) domestic = pRef;
  const now = triangleWelfare(demand, supply, domestic);
  const imports = Math.max(0, now.qd - now.qs);
  const rent = Math.max(0, domestic - input.worldPrice) * imports;
  const dwl = Math.max(0, -(now.cs - free.cs + (now.ps - free.ps) + rent));
  return {
    ...blank,
    domesticPrice: domestic,
    producerPrice: domestic,
    qDemanded: now.qd,
    qSupplied: now.qs,
    imports,
    exports: 0,
    quotaRent: rent,
    cs: now.cs,
    ps: now.ps,
    dwl,
  };
}

export function autarkyPrice(): number {
  return pRef;
}

export function priceOn(curve: Curve, q: number): number {
  return priceAt(curve, q);
}
