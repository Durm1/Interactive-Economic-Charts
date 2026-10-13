import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket } from "../models/market";
import { marketInput } from "./marketLab";
import { numOf, pedField, pesField, strOf, type Lab } from "./types";

export const controlsLab: Lab = {
  id: "controls",
  code: "3.2.4 · 3.3.4",
  title: "Maximum and minimum prices",
  chinese: "最高限价与最低限价",
  pitfall: {
    en: "A maximum price changes the market only when it is set below equilibrium. A minimum price binds only when it is set above equilibrium. Label the excess demand or excess supply.",
    zh: "最高限价只有低于均衡价格时才起作用。最低限价只有高于均衡价格时才起作用。要标出超额需求或超额供给。",
  },
  initial: { ped: 1, pes: 1, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7, control: "maximum", level: 8 },
  presets: [
    { id: "max", label: "Maximum price", detail: "Set below equilibrium, so there is a shortage.", values: { control: "maximum", level: 8, ped: 1, pes: 1 } },
    { id: "max-loose", label: "Non-binding maximum", detail: "A ceiling above equilibrium does nothing.", values: { control: "maximum", level: 14, ped: 1, pes: 1 } },
    { id: "min", label: "Minimum price", detail: "Set above equilibrium, so there is a surplus.", values: { control: "minimum", level: 13, ped: 1, pes: 1 } },
    { id: "wage", label: "Minimum wage", detail: "A minimum price in the labour market. Excess supply is unemployment.", values: { control: "wage", level: 13, ped: 0.6, pes: 0.8 } },
  ],
  fields: () => [
    {
      kind: "select",
      key: "control",
      label: "Control",
      options: [
        { value: "maximum", label: "Maximum price" },
        { value: "minimum", label: "Minimum price" },
        { value: "wage", label: "Minimum wage" },
      ],
    },
    { kind: "slider", key: "level", label: "Price or wage", min: 3, max: 18, step: 0.5 },
    pedField,
    pesField,
  ],
  build: (values, hide) => {
    const control = strOf(values, "control");
    const level = numOf(values, "level");
    const wage = control === "wage";
    const input = marketInput(values, {
      ceiling: control === "maximum" ? level : null,
      floor: control === "maximum" ? null : level,
      observedPrice: null,
    });
    const result = solveMarket(input);
    const binds = result.binding === "ceiling" || result.binding === "floor";
    const english = !binds
      ? `The control is set at ${num(level)}, which is on the side of equilibrium (${num(result.unconstrained?.p ?? result.pc)}) that does not bind. Price and quantity stay at the market equilibrium.`
      : wage
        ? `A minimum wage of ${num(level)} is above the equilibrium wage. Firms demand ${num(result.qDemanded)} units of labour and households supply ${num(result.qSupplied)}. Unemployment, the excess supply, is ${num(-result.excessDemand)}.`
        : result.binding === "ceiling"
          ? `A maximum price of ${num(level)} is below equilibrium. Quantity demanded is ${num(result.qDemanded)} and quantity supplied is ${num(result.qSupplied)}, so there is excess demand of ${num(result.excessDemand)}. The goods are assumed to go to the consumers who value them most.`
          : `A minimum price of ${num(level)} is above equilibrium. Quantity supplied is ${num(result.qSupplied)} and quantity demanded is ${num(result.qDemanded)}, so there is excess supply of ${num(-result.excessDemand)}.`;
    const chinese = !binds
      ? `控制价格设在 ${num(level)}，相对均衡价格 ${num(result.unconstrained?.p ?? result.pc)} 并不起约束作用，价格和数量仍停在市场均衡。`
      : wage
        ? `最低工资 ${num(level)} 高于均衡工资。企业需求 ${num(result.qDemanded)}，劳动力供给 ${num(result.qSupplied)}，超额供给 ${num(-result.excessDemand)} 就是失业。`
        : result.binding === "ceiling"
          ? `最高限价 ${num(level)} 低于均衡。需求量 ${num(result.qDemanded)}，供给量 ${num(result.qSupplied)}，超额需求为 ${num(result.excessDemand)}。这里假设商品卖给评价最高的消费者。`
          : `最低限价 ${num(level)} 高于均衡。供给量 ${num(result.qSupplied)}，需求量 ${num(result.qDemanded)}，超额供给为 ${num(-result.excessDemand)}。`;
    const drawn = marketFigure(result, input, {
      xLabel: wage ? "Quantity of labour" : "Quantity",
      yLabel: wage ? "Wage" : "Price",
      aria: english,
      showSurplus: true,
      showDwl: binds,
      showExcess: binds,
      excessLabel: wage ? "unemployment" : undefined,
    });
    return {
      diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
      legend: drawn.legend,
      readouts: [
        { label: wage ? "Wage" : "Price", value: num(result.pc) },
        { label: "Quantity traded", value: num(result.traded) },
        { label: wage ? "Labour demanded" : "Quantity demanded", value: num(result.qDemanded) },
        { label: wage ? "Labour supplied" : "Quantity supplied", value: num(result.qSupplied) },
        { label: wage ? "Unemployment" : "Excess demand", value: num(wage ? -Math.min(0, result.excessDemand) : result.excessDemand) },
        { label: "Deadweight loss", value: num(result.dwl) },
      ],
      english,
      chinese,
    };
  },
};
