import { solveAdas } from "./adas";
import { solveMarket } from "./market";
import { solveTrade } from "./trade";

export function modelChecks(): string[] {
  const errors: string[] = [];
  const assert = (cond: boolean, message: string) => {
    if (!cond) errors.push(message);
  };
  const close = (actual: number, expected: number, label: string) => {
    assert(Math.abs(actual - expected) < 1e-6, `${label}: expected ${expected}, got ${actual}`);
  };

  const tax = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: 0,
    tax: 4,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  close(tax.pc, 12, "tax pc");
  close(tax.pp, 8, "tax pp");
  close(tax.traded, 32, "tax q");
  close(tax.cs, 128, "tax cs");
  close(tax.ps, 128, "tax ps");
  close(tax.taxRevenue, 128, "tax revenue");
  close(tax.dwl, 16, "tax dwl");
  close(tax.consumerBurden, 2, "tax consumer burden");
  close(tax.producerBurden, 2, "tax producer burden");

  const skewed = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 0.5,
    pes: 1.5,
    demandShift: 0,
    supplyShift: 0,
    tax: 4,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  close(skewed.consumerBurden, 3, "skewed consumer burden");
  close(skewed.producerBurden, 1, "skewed producer burden");

  const ceiling = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: 0,
    tax: 0,
    subsidy: 0,
    ceiling: 8,
    floor: null,
    observedPrice: null,
  });
  close(ceiling.traded, 32, "ceiling traded");
  close(ceiling.qDemanded, 48, "ceiling qd");
  close(ceiling.qSupplied, 32, "ceiling qs");
  close(ceiling.cs, 256, "ceiling cs");
  close(ceiling.ps, 128, "ceiling ps");
  close(ceiling.dwl, 16, "ceiling dwl");
  assert(ceiling.binding === "ceiling", "ceiling binding");

  const subsidy = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: 0,
    tax: 0,
    subsidy: 4,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  close(subsidy.pc, 8, "subsidy pc");
  close(subsidy.pp, 12, "subsidy pp");
  close(subsidy.traded, 48, "subsidy q");

  const adValorem = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: 0,
    tax: 0,
    subsidy: 0,
    adValorem: 0.2,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  close(adValorem.traded, 320 / 9, "ad valorem q");
  close(adValorem.pc, 100 / 9, "ad valorem pc");
  close(adValorem.pp, 80 / 9, "ad valorem pp");
  close(adValorem.taxRevenue, 6400 / 81, "ad valorem revenue");
  close(adValorem.dwl, 400 / 81, "ad valorem dwl");
  assert(Math.abs(adValorem.supplyFaced.kind === "linear" ? adValorem.supplyFaced.slope : 0) > 0.3, "ad valorem pivots");
  assert(
    adValorem.supply.kind === "linear" &&
      adValorem.supplyFaced.kind === "linear" &&
      Math.abs(adValorem.supplyFaced.slope - adValorem.supply.slope) > 0.05,
    "ad valorem slope differs from specific parallel shift",
  );

  const classical = solveAdas({ mode: "vertical", adShift: 0, srasShift: 0, capacity: 0 });
  close(classical.y, 100, "classical y");
  close(classical.pl, 90, "classical pl");
  const push = solveAdas({ mode: "vertical", adShift: 0, srasShift: 16, capacity: 0 });
  close(push.y, 80, "cost-push y");
  close(push.pl, 98, "cost-push pl");
  const keynes = solveAdas({ mode: "keynesian", adShift: 0, srasShift: 0, capacity: 0 });
  close(keynes.y, 40, "keynes y");
  close(keynes.pl, 70, "keynes pl");
  assert(keynes.region === "elastic", "keynes region");
  const full = solveAdas({ mode: "keynesian", adShift: 70, srasShift: 0, capacity: 0 });
  assert(full.region === "full", `keynes full region ${full.region} y=${full.y}`);

  const tariff = solveTrade({ instrument: "tariff", worldPrice: 6, tariff: 2, quota: 16, subsidy: 0, ped: 1, pes: 1 });
  close(tariff.domesticPrice, 8, "tariff price");
  close(tariff.qSupplied, 32, "tariff qs");
  close(tariff.qDemanded, 48, "tariff qd");
  close(tariff.imports, 16, "tariff imports");
  const quota = solveTrade({ instrument: "quota", worldPrice: 6, tariff: 0, quota: 16, subsidy: 0, ped: 1, pes: 1 });
  close(quota.domesticPrice, 8, "quota price");

  for (const ped of [0.05, 0.2, 0.3]) {
    for (const pes of [0.05, 0.2, 0.3]) {
      const low = solveMarket({
        pRef: 10,
        qRef: 40,
        ped,
        pes,
        demandShift: 0,
        supplyShift: 0,
        tax: 0,
        subsidy: 0,
        ceiling: null,
        floor: null,
        observedPrice: null,
      });
      assert(Number.isFinite(low.cs) && Number.isFinite(low.ps), `low elasticity ${ped}/${pes}`);
    }
  }

  return errors;
}
