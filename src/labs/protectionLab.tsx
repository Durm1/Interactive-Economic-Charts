import { TradeDiagram } from "../diagrams/TradeDiagram";
import { num } from "../lib/format";
import { solveTrade, type TradeInstrument } from "../models/trade";
import { numOf, pedField, pesField, strOf, type Lab } from "./types";

export const protectionLab: Lab = {
  id: "protection",
  code: "6.2",
  title: "Tariffs, quotas and export subsidies",
  chinese: "关税、配额与出口补贴",
  pitfall: {
    en: "For a small economy the world price is a horizontal line. A tariff is a wedge between the world price and the domestic price. Keep tariff revenue separate from the deadweight-loss triangles.",
    zh: "小国的世界价格是一条水平线。关税是世界价格和国内价格之间的楔子。关税收入要和无谓损失的两个三角形分开。",
  },
  initial: { instrument: "tariff", worldPrice: 6, tariff: 2, quota: 16, subsidy: 2, ped: 1, pes: 1 },
  presets: [
    { id: "tariff", label: "Tariff", detail: "The country imports. The tariff raises the domestic price.", values: { instrument: "tariff", worldPrice: 6, tariff: 2, ped: 1, pes: 1 } },
    { id: "quota", label: "Import quota", detail: "The same import volume as the tariff, but the rectangle is quota rent.", values: { instrument: "quota", worldPrice: 6, quota: 16, ped: 1, pes: 1 } },
    { id: "subsidy", label: "Export subsidy", detail: "The country exports. The subsidy raises the domestic price.", values: { instrument: "subsidy", worldPrice: 12, subsidy: 2, ped: 1, pes: 1 } },
  ],
  fields: (values) => {
    const instrument = strOf(values, "instrument");
    return [
      {
        kind: "select",
        key: "instrument",
        label: "Measure",
        options: [
          { value: "tariff", label: "Tariff" },
          { value: "quota", label: "Import quota" },
          { value: "subsidy", label: "Export subsidy" },
        ],
      },
      { kind: "slider", key: "worldPrice", label: "World price", min: 4, max: 16, step: 0.5 },
      ...(instrument === "tariff" ? [{ kind: "slider" as const, key: "tariff", label: "Tariff per unit", min: 0, max: 6, step: 0.5 }] : []),
      ...(instrument === "quota" ? [{ kind: "slider" as const, key: "quota", label: "Quota (maximum imports)", min: 0, max: 40, step: 1 }] : []),
      ...(instrument === "subsidy" ? [{ kind: "slider" as const, key: "subsidy", label: "Subsidy per unit exported", min: 0, max: 6, step: 0.5 }] : []),
      pedField,
      pesField,
    ];
  },
  build: (values) => {
    const result = solveTrade({
      instrument: strOf(values, "instrument") as TradeInstrument,
      worldPrice: numOf(values, "worldPrice"),
      tariff: numOf(values, "tariff"),
      quota: numOf(values, "quota"),
      subsidy: numOf(values, "subsidy"),
      ped: numOf(values, "ped"),
      pes: numOf(values, "pes"),
    });
    const wrong = result.note === "wrong-instrument";
    const english = wrong
      ? result.note === "wrong-instrument" && strOf(values, "instrument") === "subsidy"
        ? "An export subsidy is drawn when the world price is above the autarky price of 10, so the country exports. Lower the world price only if you switch to a tariff or a quota."
        : "A tariff or quota is drawn when the world price is below the autarky price of 10, so the country imports. Raise the world price if you switch to an export subsidy."
      : strOf(values, "instrument") === "tariff"
        ? `The world price is ${num(result.worldPrice)}, below autarky, so the country imports. A specific tariff raises the domestic price to ${num(result.domesticPrice)}. Imports fall to ${num(result.imports)}. Consumer surplus falls, producer surplus rises, the government gains tariff revenue of ${num(result.tariffRevenue)}, and the deadweight loss is ${num(result.dwl)}.`
        : strOf(values, "instrument") === "quota"
          ? `The quota limits imports to ${num(result.imports)} and lifts the domestic price to ${num(result.domesticPrice)}. The rectangle between the world price and the domestic price is quota rent, ${num(result.quotaRent)}. If residents of this country receive the rent, the net welfare loss is the deadweight loss of ${num(result.dwl)}. If foreign exporters keep the rent, the loss is larger.`
          : `The world price is above autarky, so the country exports. An export subsidy raises the domestic price to ${num(result.domesticPrice)}. Exports rise to ${num(result.exports)} and government spending is ${num(result.subsidyCost)}. The deadweight loss is ${num(result.dwl)}.`;
    const chinese = wrong
      ? strOf(values, "instrument") === "subsidy"
        ? "出口补贴要画在世界价格高于自给自足价格 10、本国出口的时候。若改画关税或配额，再把世界价格降到 10 以下。"
        : "关税和配额要画在世界价格低于自给自足价格 10、本国进口的时候。若改画出出口补贴，把世界价格升到 10 以上。"
      : strOf(values, "instrument") === "tariff"
        ? `世界价格 ${num(result.worldPrice)} 低于自给自足价格，本国进口。从量关税把国内价格提高到 ${num(result.domesticPrice)}，进口降到 ${num(result.imports)}。消费者剩余下降，生产者剩余上升，政府获得关税收入 ${num(result.tariffRevenue)}，无谓损失为 ${num(result.dwl)}。`
        : strOf(values, "instrument") === "quota"
          ? `配额把进口限制为 ${num(result.imports)}，国内价格升至 ${num(result.domesticPrice)}。世界价格与国内价格之间的矩形是配额租金 ${num(result.quotaRent)}。若租金留在国内，净福利损失是无谓损失 ${num(result.dwl)}；若由外国出口商获得，损失更大。`
          : `世界价格高于自给自足价格，本国出口。出口补贴把国内价格提高到 ${num(result.domesticPrice)}，出口增至 ${num(result.exports)}，政府支出 ${num(result.subsidyCost)}，无谓损失为 ${num(result.dwl)}。`;
    return {
      diagram: <TradeDiagram result={result} aria={english} />,
      legend: [
        { name: strOf(values, "instrument") === "quota" ? "Quota rent" : strOf(values, "instrument") === "subsidy" ? "Subsidy spending" : "Tariff revenue", color: "rgba(28, 25, 21, 0.12)" },
      ],
      readouts: [
        { label: "World price", value: num(result.worldPrice) },
        { label: "Domestic price", value: num(result.domesticPrice) },
        { label: "Imports", value: num(result.imports) },
        { label: "Exports", value: num(result.exports) },
        { label: strOf(values, "instrument") === "quota" ? "Quota rent" : strOf(values, "instrument") === "subsidy" ? "Subsidy cost" : "Tariff revenue", value: num(strOf(values, "instrument") === "quota" ? result.quotaRent : strOf(values, "instrument") === "subsidy" ? result.subsidyCost : result.tariffRevenue) },
        { label: "Deadweight loss", value: num(result.dwl) },
      ],
      english,
      chinese,
    };
  },
};
