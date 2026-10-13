import { AdasDiagram } from "../diagrams/AdasDiagram";
import { MarketDiagram } from "../diagrams/MarketDiagram";
import { TradeDiagram } from "../diagrams/TradeDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveAdas } from "../models/adas";
import { solveMarket } from "../models/market";
import { solveTrade } from "../models/trade";
import { boolOf, numOf, pedField, pesField, strOf, type Lab } from "./types";

export const forexLab: Lab = {
  id: "forex",
  code: "6.4 · 6.5",
  title: "Floating exchange rates",
  chinese: "浮动汇率",
  pitfall: {
    en: "The axes are the price of the currency and the quantity of that currency. Depreciation is a fall in that price. A depreciation raises net exports and shifts AD right.",
    zh: "坐标轴是这种货币的价格和数量。贬值是这个价格下降。贬值会增加净出口，使 AD 右移。",
  },
  initial: { view: "market", ped: 1, pes: 1, demandShift: 0, supplyShift: 0, importCosts: false, policy: "fiscal" },
  presets: [
    { id: "exports", label: "Export demand rises", detail: "Demand for pounds shifts right and the pound appreciates.", values: { view: "market", demandShift: 3, supplyShift: 0, importCosts: false } },
    { id: "rates", label: "Higher interest rates", detail: "Hot money raises demand for pounds.", values: { view: "market", demandShift: 2.5, supplyShift: 0, importCosts: false } },
    { id: "imports", label: "Import spending rises", detail: "Supply of pounds shifts right and the pound depreciates.", values: { view: "market", demandShift: 0, supplyShift: -3, importCosts: false } },
    { id: "fiscal", label: "Contractionary fiscal", detail: "A way to improve the current account.", values: { view: "policy", policy: "fiscal" } },
    { id: "monetary", label: "Contractionary monetary", detail: "Income falls, but the currency may appreciate.", values: { view: "policy", policy: "monetary" } },
    { id: "supply", label: "Supply-side policy", detail: "Competitiveness improves over time.", values: { view: "policy", policy: "supply" } },
    { id: "tariff", label: "Protection", detail: "A tariff reduces imports.", values: { view: "policy", policy: "tariff" } },
  ],
  fields: (values) => {
    const market = strOf(values, "view") !== "policy";
    return [
      { kind: "select", key: "view", label: "Question", options: [{ value: "market", label: "What moves the exchange rate?" }, { value: "policy", label: "How can a deficit be reduced?" }] },
      ...(market
        ? [
            pedField,
            pesField,
            { kind: "slider" as const, key: "demandShift", label: "Demand for £ (export demand, interest rates)", min: -6, max: 6, step: 0.5 },
            { kind: "slider" as const, key: "supplyShift", label: "Supply of £ (+ is a decrease)", min: -6, max: 6, step: 0.5 },
            { kind: "toggle" as const, key: "importCosts", label: "Also shift SRAS for import costs" },
          ]
        : [{ kind: "select" as const, key: "policy", label: "Policy", options: [
            { value: "fiscal", label: "Contractionary fiscal policy" },
            { value: "monetary", label: "Contractionary monetary policy" },
            { value: "supply", label: "Supply-side policy" },
            { value: "tariff", label: "Tariff" },
          ] }]),
    ];
  },
  build: (values, hide) => {
    if (strOf(values, "view") === "policy") return policyView(values);
    const input = {
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
      observedPrice: null,
    };
    const market = solveMarket(input);
    const pct = (market.pc - 10) / 10;
    const appreciated = pct > 0.01;
    const depreciated = pct < -0.01;
    const adas = solveAdas({
      mode: "vertical",
      adShift: -pct * 28,
      srasShift: boolOf(values, "importCosts") ? -pct * 10 : 0,
      capacity: 0,
    });
    const move = appreciated ? "appreciates" : depreciated ? "depreciates" : "is unchanged";
    const moveZh = appreciated ? "升值" : depreciated ? "贬值" : "不变";
    const english = `The exchange rate is the price of pounds, drawn here as an index so the numbers stay easy to read. A rise is an appreciation. Demand for pounds has shifted by ${num(input.demandShift)} and the supply curve faced in the diagram reflects import spending. The pound ${move} to ${num(market.pc)}. ${appreciated ? "Appreciation makes exports dearer and imports cheaper, so net exports fall and AD shifts left." : depreciated ? "Depreciation makes exports cheaper and imports dearer, so net exports rise and AD shifts right." : "With no change in the exchange rate, AD stays put."} Real output is ${num(adas.y)} and the price level is ${num(adas.pl)}.${boolOf(values, "importCosts") && depreciated ? " Dearer imported inputs also shift SRAS left, which adds to the rise in the price level." : ""}`;
    const chinese = `汇率是英镑的价格，这里用指数表示，便于读数。上升就是升值。英镑${moveZh}到 ${num(market.pc)}。${appreciated ? "升值使出口更贵、进口更便宜，净出口下降，AD 左移。" : depreciated ? "贬值使出口更便宜、进口更贵，净出口上升，AD 右移。" : "汇率不变时，AD 不动。"}实际产出为 ${num(adas.y)}，物价水平为 ${num(adas.pl)}。${boolOf(values, "importCosts") && depreciated ? "进口投入更贵还会使 SRAS 左移，物价水平上升得更多。" : ""}`;
    const figure = marketFigure(market, input, {
      xLabel: "Quantity of £",
      yLabel: "Price of £ (index)",
      aria: english,
    });
    return {
      diagram: (
        <div className="diagram-stack">
          <MarketDiagram figure={figure.figure} hide={hide} />
          <AdasDiagram result={adas} aria="Effect on the domestic price level and real GDP" />
        </div>
      ),
      readouts: [
        { label: "Exchange rate index", value: num(market.pc) },
        { label: "Change", value: `${num(pct * 100)}%` },
        { label: "Real output", value: num(adas.y) },
        { label: "Price level", value: num(adas.pl) },
      ],
      english,
      chinese,
    };
  },
};

function policyView(values: Parameters<Lab["build"]>[0]) {
  const policy = strOf(values, "policy");
  if (policy === "tariff") {
    const result = solveTrade({ instrument: "tariff", worldPrice: 6, tariff: 3, quota: 10, subsidy: 0, ped: 1, pes: 1 });
    return {
      diagram: <TradeDiagram result={result} aria="A tariff reduces imports" />,
      readouts: [
        { label: "Imports", value: num(result.imports) },
        { label: "Domestic price", value: num(result.domesticPrice) },
        { label: "Current account", value: "imports fall" },
      ],
      english: "A tariff raises the domestic price of imports and the volume of imports falls, so the current account improves, holding other things equal. Retaliation can remove that gain. This is a protectionist policy, not a shift of AD by itself.",
      chinese: "关税提高进口品的国内价格，进口量下降，在其他条件不变时经常账户改善。报复可能抵消这一好处。这是保护政策，本身不是 AD 的移动。",
    };
  }
  const adas = solveAdas({
    mode: "vertical",
    adShift: policy === "supply" ? 0 : -14,
    srasShift: 0,
    capacity: policy === "supply" ? 12 : 0,
  });
  const english = policy === "supply"
    ? "Supply-side policy raises productive capacity and competitiveness. LRAS shifts right. Export performance can improve and the current account can improve, but this takes time."
    : policy === "monetary"
      ? "Contractionary monetary policy shifts AD left, so income and import spending fall, which improves the current account. Higher interest rates can also appreciate the currency, and that works the other way. The net effect on the current account is ambiguous."
      : "Contractionary fiscal policy shifts AD left. Lower income reduces import spending, so the current account improves.";
  const chinese = policy === "supply"
    ? "供给政策提高生产能力和竞争力，LRAS 右移。出口表现和经常账户都可能改善，但需要时间。"
    : policy === "monetary"
      ? "紧缩性货币政策使 AD 左移，收入和进口支出下降，经常账户因此改善。更高的利率也可能使货币升值，这会反过来恶化经常账户。净效果不确定。"
      : "紧缩性财政政策使 AD 左移。收入下降会减少进口支出，经常账户改善。";
  return {
    diagram: <AdasDiagram result={adas} aria={english} />,
    readouts: [
      { label: "Real output", value: num(adas.y) },
      { label: "Price level", value: num(adas.pl) },
      { label: "Current account", value: policy === "monetary" ? "ambiguous" : "improves" },
    ],
    english,
    chinese,
  };
}
