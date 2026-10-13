import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num, signed } from "../lib/format";
import { solveMarket } from "../models/market";
import { movementSentence } from "./marketCopy";
import { marketInput } from "./marketLab";
import { numOf, pedField, pesField, type Lab } from "./types";

export const surplusLab: Lab = {
  id: "surplus",
  code: "2.5",
  title: "Consumer and producer surplus",
  chinese: "消费者剩余与生产者剩余",
  pitfall: {
    en: "Consumer surplus is the area under demand and above the price consumers pay. Producer surplus is the area above supply and below the price producers receive. Do not swap them.",
    zh: "消费者剩余在需求曲线以下、消费者支付的价格以上。生产者剩余在供给曲线以上、生产者实收价格以下。不要画反。",
  },
  initial: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7 },
  presets: [
    { id: "base", label: "Initial surplus", detail: "Both areas are triangles when PED = PES = 1.", values: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0 } },
    { id: "inelastic-d", label: "Inelastic demand", detail: "A steeper demand curve changes consumer surplus.", values: { ped: 0.4, pes: 1, demandShift: 0, supplyShift: 0 } },
    { id: "d-up", label: "Demand increases", detail: "A rightward shift changes both areas.", values: { ped: 1, pes: 1, demandShift: 4, supplyShift: 0 } },
    { id: "s-down", label: "Supply decreases", detail: "A higher price transfers surplus from consumers to producers.", values: { ped: 1, pes: 1, demandShift: 0, supplyShift: 4 } },
  ],
  fields: () => [
    pedField,
    pesField,
    { kind: "slider", key: "demandShift", label: "Demand shift (willingness to pay)", min: -8, max: 8, step: 0.5 },
    { kind: "slider", key: "supplyShift", label: "Supply shift (higher costs are +)", min: -8, max: 8, step: 0.5 },
  ],
  build: (values, hide) => {
    const input = marketInput(values);
    const result = solveMarket(input);
    const move = movementSentence(input, result);
    const dCs = result.cs - result.baseCs;
    const dPs = result.ps - result.basePs;
    const english = `${move.en ? `${move.en} ` : ""}Consumer surplus is ${num(result.cs)} (${signed(dCs)} from the initial equilibrium). Producer surplus is ${num(result.ps)} (${signed(dPs)}). A higher price reduces consumer surplus and raises producer surplus, if the curves themselves do not change.`;
    const chinese = `${move.zh}消费者剩余为 ${num(result.cs)}（相对最初均衡 ${signed(dCs)}），生产者剩余为 ${num(result.ps)}（${signed(dPs)}）。若曲线不变，价格上升会减少消费者剩余、增加生产者剩余。`;
    const drawn = marketFigure(result, input, {
      xLabel: "Quantity",
      yLabel: "Price",
      aria: english,
      showSurplus: true,
    });
    return {
      diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
      legend: drawn.legend,
      readouts: [
        { label: "Price", value: num(result.pc) },
        { label: "Quantity", value: num(result.traded) },
        { label: "Consumer surplus", value: num(result.cs) },
        { label: "Producer surplus", value: num(result.ps) },
        { label: "PED now", value: num(numOf(values, "ped")) },
        { label: "PES now", value: num(numOf(values, "pes")) },
      ],
      english,
      chinese,
    };
  },
};
