import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket } from "../models/market";
import { burdenSentence } from "./marketCopy";
import { marketInput } from "./marketLab";
import { numOf, pedField, pesField, strOf, type Lab } from "./types";

export const taxLab: Lab = {
  id: "tax",
  code: "3.2.1 · 3.2.2",
  title: "Specific tax and subsidy",
  chinese: "从量税与补贴",
  pitfall: {
    en: "A specific tax shifts supply vertically upwards, parallel to the original supply. The vertical gap equals the tax per unit. Do not pivot the curve.",
    zh: "从量税使供给曲线垂直上移，并与原曲线平行。垂直距离等于每单位税额。不要画成旋转。",
  },
  initial: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7, instrument: "tax", amount: 4 },
  presets: [
    { id: "equal", label: "Tax, equal incidence", detail: "PED = PES, so the burden is shared equally.", values: { instrument: "tax", amount: 4, ped: 1, pes: 1 } },
    { id: "inelastic-d", label: "Tax, inelastic demand", detail: "Consumers bear more of the tax.", values: { instrument: "tax", amount: 4, ped: 0.4, pes: 1.6 } },
    { id: "elastic-d", label: "Tax, elastic demand", detail: "Producers bear more of the tax.", values: { instrument: "tax", amount: 4, ped: 2.2, pes: 0.5 } },
    { id: "subsidy", label: "Specific subsidy", detail: "Supply shifts vertically downwards.", values: { instrument: "subsidy", amount: 4, ped: 1, pes: 1 } },
  ],
  fields: () => [
    { kind: "select", key: "instrument", label: "Instrument", options: [{ value: "tax", label: "Specific indirect tax" }, { value: "subsidy", label: "Specific subsidy" }] },
    { kind: "slider", key: "amount", label: "Amount per unit", min: 0, max: 8, step: 0.5 },
    pedField,
    pesField,
  ],
  build: (values, hide) => {
    const tax = strOf(values, "instrument") === "tax" ? numOf(values, "amount") : 0;
    const subsidy = strOf(values, "instrument") === "subsidy" ? numOf(values, "amount") : 0;
    const input = marketInput(values, { tax, subsidy, observedPrice: null });
    const result = solveMarket(input);
    const burden = burdenSentence(result);
    const english = tax > 0
      ? `A specific tax of ${num(tax)} per unit shifts supply vertically upwards from S to S1. The vertical distance is the tax. Consumers pay ${num(result.pc)} and producers receive ${num(result.pp)}. Quantity falls from ${num(result.baseEq.q)} to ${num(result.traded)}. ${burden.en}`
      : `A specific subsidy of ${num(subsidy)} per unit shifts supply vertically downwards. Consumers pay ${num(result.pc)} and producers receive ${num(result.pp)}. Quantity rises from ${num(result.baseEq.q)} to ${num(result.traded)}. Government spending is ${num(result.subsidyCost)}. The triangle beyond the original equilibrium is the deadweight loss.`;
    const chinese = tax > 0
      ? `每单位从量税 ${num(tax)} 使供给曲线垂直上移，垂直距离就是税额。消费者支付 ${num(result.pc)}，生产者实收 ${num(result.pp)}，数量从 ${num(result.baseEq.q)} 降到 ${num(result.traded)}。${burden.zh}`
      : `每单位补贴 ${num(subsidy)} 使供给曲线垂直下移。消费者支付 ${num(result.pc)}，生产者实收 ${num(result.pp)}，数量从 ${num(result.baseEq.q)} 增至 ${num(result.traded)}。政府支出为 ${num(result.subsidyCost)}，原均衡右侧的三角形是无谓损失。`;
    const drawn = marketFigure(result, input, {
      xLabel: "Quantity",
      yLabel: "Price",
      aria: english,
      showSurplus: true,
      showFiscal: true,
      showDwl: true,
    });
    return {
      diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
      legend: drawn.legend,
      readouts: [
        { label: "Price consumers pay", value: num(result.pc) },
        { label: "Price producers receive", value: num(result.pp) },
        { label: "Quantity", value: num(result.traded) },
        { label: "Consumer burden / gain", value: num(result.consumerBurden) },
        { label: "Producer burden / gain", value: num(result.producerBurden) },
        { label: tax > 0 ? "Tax revenue" : "Subsidy cost", value: num(tax > 0 ? result.taxRevenue : result.subsidyCost) },
        { label: "Deadweight loss", value: num(result.dwl) },
      ],
      english,
      chinese,
    };
  },
};
