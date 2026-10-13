import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket } from "../models/market";
import { burdenSentence } from "./marketCopy";
import { marketInput } from "./marketLab";
import { numOf, pedField, pesField, strOf, type Lab } from "./types";

function instrumentOf(values: Parameters<Lab["build"]>[0]): "specific" | "advalorem" | "subsidy" {
  const raw = strOf(values, "instrument");
  if (raw === "advalorem") return "advalorem";
  if (raw === "subsidy") return "subsidy";
  return "specific";
}

export const taxLab: Lab = {
  id: "tax",
  code: "3.2.1 · 3.2.2",
  title: "Indirect taxes and subsidy",
  chinese: "间接税与补贴",
  pitfall: {
    en: "A specific tax is a fixed amount per unit, so supply shifts up in parallel and the vertical gap stays constant. An ad valorem tax is a percentage of the price, so supply pivots and the gap widens as price rises.",
    zh: "从量税是每单位固定税额，供给曲线平行上移，垂直距离不变。从价税是价格的一定百分比，供给曲线旋转上移，价格越高，垂直距离越大。",
  },
  initial: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7, instrument: "specific", amount: 4, rate: 20 },
  presets: [
    { id: "equal", label: "Specific tax, equal incidence", detail: "PED = PES. Supply shifts up in parallel.", values: { instrument: "specific", amount: 4, ped: 1, pes: 1 } },
    { id: "advalorem", label: "Ad valorem tax, 20%", detail: "A percentage of the price. Supply pivots, and the gap widens.", values: { instrument: "advalorem", rate: 20, ped: 1, pes: 1 } },
    { id: "inelastic-d", label: "Specific tax, inelastic demand", detail: "Consumers bear more of a per-unit tax.", values: { instrument: "specific", amount: 4, ped: 0.4, pes: 1.6 } },
    { id: "subsidy", label: "Specific subsidy", detail: "Supply shifts vertically downwards.", values: { instrument: "subsidy", amount: 4, ped: 1, pes: 1 } },
  ],
  fields: (values) => {
    const instrument = instrumentOf(values);
    return [
      {
        kind: "select",
        key: "instrument",
        label: "Instrument",
        options: [
          { value: "specific", label: "Specific tax" },
          { value: "advalorem", label: "Ad valorem tax" },
          { value: "subsidy", label: "Specific subsidy" },
        ],
      },
      instrument === "advalorem"
        ? { kind: "slider", key: "rate", label: "Tax rate (%)", min: 0, max: 40, step: 1 }
        : { kind: "slider", key: "amount", label: "Amount per unit", min: 0, max: 8, step: 0.5 },
      pedField,
      pesField,
    ];
  },
  build: (values, hide) => {
    const instrument = instrumentOf(values);
    const tax = instrument === "specific" ? numOf(values, "amount") : 0;
    const subsidy = instrument === "subsidy" ? numOf(values, "amount") : 0;
    const rate = instrument === "advalorem" ? numOf(values, "rate") : 0;
    const input = marketInput(values, { tax, subsidy, adValorem: rate / 100, observedPrice: null });
    const result = solveMarket(input);
    const burden = burdenSentence(result);
    const unitGap = result.pc - result.pp;
    const english =
      instrument === "specific"
        ? `A specific tax of ${num(tax)} per unit shifts supply up in parallel from S to S1. The vertical gap is the same at every quantity. Consumers pay ${num(result.pc)} and producers receive ${num(result.pp)}. Quantity falls from ${num(result.baseEq.q)} to ${num(result.traded)}. ${burden.en}`
        : instrument === "advalorem"
          ? `An ad valorem tax of ${num(rate, 0)}% is a percentage of the price, so supply pivots from S to S1 and the vertical gap widens as price rises. At this equilibrium the tax per unit is ${num(unitGap)}. Consumers pay ${num(result.pc)} and producers receive ${num(result.pp)}. Quantity falls from ${num(result.baseEq.q)} to ${num(result.traded)}. ${burden.en}`
          : `A specific subsidy of ${num(subsidy)} per unit shifts supply vertically downwards. Consumers pay ${num(result.pc)} and producers receive ${num(result.pp)}. Quantity rises from ${num(result.baseEq.q)} to ${num(result.traded)}. Government spending is ${num(result.subsidyCost)}. The triangle beyond the original equilibrium is the deadweight loss.`;
    const chinese =
      instrument === "specific"
        ? `每单位从量税 ${num(tax)} 使供给曲线平行上移，任意数量上的垂直距离都等于税额。消费者支付 ${num(result.pc)}，生产者实收 ${num(result.pp)}，数量从 ${num(result.baseEq.q)} 降到 ${num(result.traded)}。${burden.zh}`
        : instrument === "advalorem"
          ? `从价税 ${num(rate, 0)}% 按价格计税，供给曲线旋转上移，价格越高垂直距离越大。本均衡的每单位税额是 ${num(unitGap)}。消费者支付 ${num(result.pc)}，生产者实收 ${num(result.pp)}，数量从 ${num(result.baseEq.q)} 降到 ${num(result.traded)}。${burden.zh}`
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
        ...(instrument === "advalorem" ? [{ label: "Tax per unit at equilibrium", value: num(unitGap) }] : []),
        { label: "Producer burden / gain", value: num(result.producerBurden) },
        { label: instrument === "subsidy" ? "Subsidy cost" : "Tax revenue", value: num(instrument === "subsidy" ? result.subsidyCost : result.taxRevenue) },
        { label: "Deadweight loss", value: num(result.dwl) },
      ],
      english,
      chinese,
    };
  },
};
