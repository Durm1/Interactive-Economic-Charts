import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket, type MarketInput } from "../models/market";
import { movementSentence } from "./marketCopy";
import { boolOf, numOf, pedField, pesField, type Lab, type LabValues } from "./types";

const goods = { xLabel: "Quantity", yLabel: "Price" };

function inputOf(values: LabValues, extra: Partial<MarketInput> = {}): MarketInput {
  return {
    pRef: 10,
    qRef: 40,
    ped: numOf(values, "ped"),
    pes: numOf(values, "pes"),
    demandShift: numOf(values, "demandShift"),
    supplyShift: numOf(values, "supplyShift"),
    tax: 0,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: boolOf(values, "usePrice") ? numOf(values, "observedPrice") : null,
    ...extra,
  };
}

export const marketLab: Lab = {
  id: "market",
  code: "2.1 · 2.4",
  title: "Demand, supply and equilibrium",
  chinese: "需求、供给与均衡",
  pitfall: {
    en: "A change in the price of the good itself is a movement along the curve. A shift is caused by a non-price determinant. Label which curve moves.",
    zh: "商品自身价格变化是沿曲线的移动。曲线移动来自其他因素。要标明是哪一条曲线在移动。",
  },
  initial: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7 },
  presets: [
    { id: "eq", label: "Market equilibrium", detail: "Demand and supply clear the market.", values: { demandShift: 0, supplyShift: 0, usePrice: false } },
    { id: "d-up", label: "Increase in demand", detail: "A non-price determinant shifts D right.", values: { demandShift: 4, supplyShift: 0, usePrice: false } },
    { id: "d-down", label: "Decrease in demand", detail: "D shifts left.", values: { demandShift: -4, supplyShift: 0, usePrice: false } },
    { id: "s-up", label: "Increase in supply", detail: "Lower costs shift S right.", values: { demandShift: 0, supplyShift: -4, usePrice: false } },
    { id: "s-down", label: "Decrease in supply", detail: "Higher costs shift S left. Movement is along D.", values: { demandShift: 0, supplyShift: 4, usePrice: false } },
    { id: "excess-d", label: "Excess demand", detail: "Price is below equilibrium.", values: { demandShift: 0, supplyShift: 0, usePrice: true, observedPrice: 7 } },
    { id: "excess-s", label: "Excess supply", detail: "Price is above equilibrium.", values: { demandShift: 0, supplyShift: 0, usePrice: true, observedPrice: 13 } },
  ],
  fields: (values) => [
    pedField,
    pesField,
    { kind: "slider", key: "demandShift", label: "Demand shift (willingness to pay)", min: -8, max: 8, step: 0.5 },
    { kind: "slider", key: "supplyShift", label: "Supply shift (higher costs are +)", min: -8, max: 8, step: 0.5 },
    { kind: "toggle", key: "usePrice", label: "Set a disequilibrium price" },
    ...(boolOf(values, "usePrice")
      ? [{ kind: "slider" as const, key: "observedPrice", label: "Observed price", min: 2, max: 18, step: 0.5 }]
      : []),
  ],
  build: (values, hide) => {
    const input = inputOf(values);
    const result = solveMarket(input);
    const move = movementSentence(input, result);
    let english = `Equilibrium is where quantity demanded equals quantity supplied. Price is ${num(result.pc)} and quantity is ${num(result.traded)}.`;
    let chinese = `均衡时需求量等于供给量。价格是 ${num(result.pc)}，数量是 ${num(result.traded)}。`;
    if (move.en) {
      english = `${move.en} The new equilibrium price is ${num(result.pc)} and quantity is ${num(result.traded)}.`;
      chinese = `${move.zh}新的均衡价格是 ${num(result.pc)}，数量是 ${num(result.traded)}。`;
    }
    if (result.binding === "observed") {
      const excess = result.excessDemand;
      english = `At a price of ${num(result.pc)} there is ${excess > 0 ? "excess demand" : "excess supply"} of ${num(Math.abs(excess))}. The price will tend to ${excess > 0 ? "rise" : "fall"} until the market clears at ${num(result.unconstrained?.p ?? 0)}.`;
      chinese = `价格为 ${num(result.pc)} 时存在${excess > 0 ? "超额需求" : "超额供给"} ${num(Math.abs(excess))}。价格会趋于${excess > 0 ? "上升" : "下降"}，直到回到 ${num(result.unconstrained?.p ?? 0)} 出清。`;
    }
    const drawn = marketFigure(result, input, {
      ...goods,
      aria: english,
      showExcess: result.binding === "observed",
    });
    return {
      diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
      legend: drawn.legend,
      readouts: [
        { label: "Price", value: num(result.pc) },
        { label: "Quantity traded", value: num(result.traded) },
        { label: "Quantity demanded", value: num(result.qDemanded) },
        { label: "Quantity supplied", value: num(result.qSupplied) },
        { label: "Excess demand", value: num(result.excessDemand) },
        { label: "Total expenditure", value: num(result.pc * result.traded) },
      ],
      english,
      chinese,
    };
  },
};

export function marketInput(values: LabValues, extra?: Partial<MarketInput>): MarketInput {
  return inputOf(values, extra);
}
