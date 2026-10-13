import { PolylineChart, type PlotPoint } from "../diagrams/PolylineChart";
import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket } from "../models/market";
import { marketInput } from "./marketLab";
import { numOf, strOf, type Lab, type LabValues } from "./types";

function straightPoints(): PlotPoint[] {
  return [
    { q: 0, p: 24 },
    { q: 60, p: 0 },
  ];
}

function pedView(shape: string, t: number) {
  const u = 0.08 + Math.min(1, Math.max(0, t)) * 0.84;
  if (shape === "horizontal") {
    const q = 8 + u * 44;
    return { p: 12, q, ped: Number.POSITIVE_INFINITY, points: [{ q: 0, p: 12 }, { q: 60, p: 12 }], qMax: 64, pMax: 24, te: 12 * q };
  }
  if (shape === "vertical") {
    const p = 3 + u * 18;
    return { p, q: 30, ped: 0, points: [{ q: 30, p: 0 }, { q: 30, p: 24 }], qMax: 64, pMax: 26, te: p * 30 };
  }
  if (shape === "hyperbola") {
    const q = 8 + u * 40;
    const p = 360 / q;
    const points: PlotPoint[] = [];
    for (let i = 8; i <= 56; i += 2) points.push({ q: i, p: 360 / i });
    return { p, q, ped: 1, points, qMax: 64, pMax: 50, te: 360 };
  }
  const q = u * 60;
  const p = 24 - 0.4 * q;
  return { p, q, ped: p / (0.4 * q), points: straightPoints(), qMax: 64, pMax: 28, te: p * q };
}

function pesView(shape: string, t: number) {
  const u = 0.12 + Math.min(1, Math.max(0, t)) * 0.76;
  if (shape === "horizontal") {
    const q = 10 + u * 40;
    return { p: 10, q, pes: Number.POSITIVE_INFINITY, points: [{ q: 0, p: 10 }, { q: 60, p: 10 }], qMax: 70, pMax: 24 };
  }
  if (shape === "vertical") {
    const p = 4 + u * 14;
    return { p, q: 28, pes: 0, points: [{ q: 28, p: 0 }, { q: 28, p: 22 }], qMax: 70, pMax: 24 };
  }
  if (shape === "origin") {
    const q = 8 + u * 42;
    const p = 0.4 * q;
    return { p, q, pes: 1, points: [{ q: 0, p: 0 }, { q: 60, p: 24 }], qMax: 70, pMax: 26 };
  }
  if (shape === "quantity") {
    const q = 24 + u * 30;
    const p = -8 + 0.45 * q;
    return { p, q, pes: p / (p + 8), points: [{ q: 80 / 4.5, p: 0 }, { q: 64, p: -8 + 0.45 * 64 }], qMax: 70, pMax: 24 };
  }
  const q = 6 + u * 36;
  const p = 8 + 0.35 * q;
  return { p, q, pes: p / (p - 8), points: [{ q: 0, p: 8 }, { q: 46, p: 8 + 0.35 * 46 }], qMax: 70, pMax: 28 };
}

function coefficient(p1: number, q1: number, p2: number, q2: number): number | null {
  if (p1 === 0 || q1 === 0 || p1 === p2) return null;
  return ((q2 - q1) / q1) / ((p2 - p1) / p1);
}

function pedSentence(ped: number): { en: string; zh: string } {
  if (!Number.isFinite(ped)) {
    return {
      en: "Demand is perfectly elastic: any price above this line and quantity demanded falls to zero. Total expenditure changes in proportion to quantity.",
      zh: "需求完全有弹性。价格略高于这条线，需求量就降为零。总支出随数量同比例变化。",
    };
  }
  if (ped === 0) {
    return {
      en: "Demand is perfectly inelastic, so quantity does not respond to price. A higher price raises total expenditure in the same proportion.",
      zh: "需求完全无弹性，数量不随价格变化。价格上升时，总支出同比例上升。",
    };
  }
  if (Math.abs(ped - 1) < 0.05) {
    return {
      en: "PED is 1, so demand is unitary elastic here. A small price change leaves total expenditure unchanged. On a rectangular hyperbola this is true at every point; on a straight line it is true only at the midpoint.",
      zh: "这里 PED 等于 1，需求为单位弹性。价格小幅变化时总支出不变。直角双曲线上处处如此；直线需求只有中点如此。",
    };
  }
  if (ped > 1) {
    return {
      en: `PED is ${num(ped)} at this point, so demand is elastic. A fall in price raises total expenditure. On this straight line, PED is above 1 only on the upper half.`,
      zh: `这一点 PED 为 ${num(ped)}，需求富有弹性。降价会增加总支出。在这条直线上，只有上半段 PED 大于 1。`,
    };
  }
  return {
    en: `PED is ${num(ped)} at this point, so demand is inelastic. A fall in price lowers total expenditure. The sign of the raw coefficient is negative; elastic or inelastic refers to its absolute value.`,
    zh: `这一点 PED 为 ${num(ped)}，需求缺乏弹性。降价会减少总支出。原始系数的符号为负；富有弹性或缺乏弹性看的是绝对值。`,
  };
}

export const elasticityLab: Lab = {
  id: "elasticity",
  code: "2.2 · 2.3",
  title: "Elasticity",
  chinese: "弹性",
  pitfall: {
    en: "Quote PED as a number, not a percentage. The sign is negative; elastic or inelastic uses the absolute value. On a straight demand curve, PED is not constant.",
    zh: "PED 写成数字，不要写成百分数。符号为负；富有弹性还是缺乏弹性看绝对值。直线需求上的 PED 不是常数。",
  },
  initial: {
    mode: "ped",
    shape: "straight",
    t: 0.5,
    yed: 1.2,
    income: 10,
    xed: 1.4,
    shock: 4,
    p1: 10,
    q1: 40,
    p2: 12,
    q2: 32,
  },
  presets: [
    { id: "upper", label: "Elastic portion", detail: "Upper half of a straight demand curve.", values: { mode: "ped", shape: "straight", t: 0.2 } },
    { id: "mid", label: "Unitary midpoint", detail: "PED = 1 only at the midpoint.", values: { mode: "ped", shape: "straight", t: 0.5 } },
    { id: "lower", label: "Inelastic portion", detail: "Lower half of the same straight line.", values: { mode: "ped", shape: "straight", t: 0.8 } },
    { id: "perfect-e", label: "Perfectly elastic demand", detail: "A horizontal demand curve.", values: { mode: "ped", shape: "horizontal", t: 0.4 } },
    { id: "perfect-i", label: "Perfectly inelastic demand", detail: "A vertical demand curve.", values: { mode: "ped", shape: "vertical", t: 0.5 } },
    { id: "hyperbola", label: "Unitary everywhere", detail: "A rectangular hyperbola. Total expenditure is constant.", values: { mode: "ped", shape: "hyperbola", t: 0.45 } },
    { id: "pes-e", label: "Elastic supply", detail: "The supply curve meets the price axis, so PES > 1.", values: { mode: "pes", shape: "price", t: 0.45 } },
    { id: "pes-u", label: "Unitary supply", detail: "Any straight supply curve through the origin has PES = 1.", values: { mode: "pes", shape: "origin", t: 0.5 } },
    { id: "pes-i", label: "Inelastic supply", detail: "The supply curve meets the quantity axis, so PES < 1.", values: { mode: "pes", shape: "quantity", t: 0.4 } },
    { id: "normal", label: "Normal good", detail: "YED is positive, so higher income shifts demand right.", values: { mode: "yed", yed: 1.4, income: 15 } },
    { id: "inferior", label: "Inferior good", detail: "YED is negative, so higher income shifts demand left.", values: { mode: "yed", yed: -0.8, income: 15 } },
    { id: "substitutes", label: "Substitutes", detail: "XED is positive. A higher price of A raises demand for B.", values: { mode: "xed", xed: 1.5, shock: 4 } },
    { id: "complements", label: "Complements", detail: "XED is negative. A higher price of A reduces demand for B.", values: { mode: "xed", xed: -1.2, shock: 4 } },
  ],
  onChange: (key, values) => {
    if (key !== "mode") return values;
    if (values.mode === "pes") return { ...values, shape: "price", t: 0.45 };
    if (values.mode === "ped") return { ...values, shape: "straight", t: 0.5 };
    return values;
  },
  fields: (values) => {
    const mode = strOf(values, "mode");
    const common = [
      {
        kind: "select" as const,
        key: "mode",
        label: "Elasticity",
        options: [
          { value: "ped", label: "Price elasticity of demand" },
          { value: "pes", label: "Price elasticity of supply" },
          { value: "yed", label: "Income elasticity of demand" },
          { value: "xed", label: "Cross elasticity of demand" },
        ],
      },
    ];
    if (mode === "ped") {
      return [
        ...common,
        {
          kind: "select",
          key: "shape",
          label: "Demand curve",
          options: [
            { value: "straight", label: "Straight line" },
            { value: "hyperbola", label: "Rectangular hyperbola" },
            { value: "horizontal", label: "Perfectly elastic" },
            { value: "vertical", label: "Perfectly inelastic" },
          ],
        },
        { kind: "slider", key: "t", label: "Point on the curve", min: 0, max: 1, step: 0.01 },
        { kind: "number", key: "p1", label: "P1", min: 0, max: 500, step: 0.1 },
        { kind: "number", key: "q1", label: "Q1", min: 0, max: 500, step: 0.1 },
        { kind: "number", key: "p2", label: "P2", min: 0, max: 500, step: 0.1 },
        { kind: "number", key: "q2", label: "Q2", min: 0, max: 500, step: 0.1 },
      ];
    }
    if (mode === "pes") {
      return [
        ...common,
        {
          kind: "select",
          key: "shape",
          label: "Supply curve",
          options: [
            { value: "price", label: "Meets the price axis" },
            { value: "origin", label: "Through the origin" },
            { value: "quantity", label: "Meets the quantity axis" },
            { value: "horizontal", label: "Perfectly elastic" },
            { value: "vertical", label: "Perfectly inelastic" },
          ],
        },
        { kind: "slider", key: "t", label: "Point on the curve", min: 0, max: 1, step: 0.01 },
      ];
    }
    if (mode === "yed") {
      return [
        ...common,
        { kind: "slider", key: "yed", label: "YED", min: -4, max: 5, step: 0.1 },
        { kind: "slider", key: "income", label: "Change in income (%)", min: -60, max: 80, step: 1 },
      ];
    }
    return [
      ...common,
      { kind: "slider", key: "xed", label: "XED", min: -4, max: 4, step: 0.1 },
      { kind: "slider", key: "shock", label: "Supply shock in market A (costs +)", min: -12, max: 12, step: 0.5 },
    ];
  },
  build: (values, hide) => buildElasticity(values, hide),
};

function buildElasticity(values: LabValues, hide: boolean) {
  const mode = strOf(values, "mode");
  if (mode === "pes") return buildPes(values, hide);
  if (mode === "yed") return buildYed(values, hide);
  if (mode === "xed") return buildXed(values, hide);
  return buildPed(values, hide);
}

function buildPed(values: LabValues, hide: boolean) {
  const view = pedView(strOf(values, "shape"), numOf(values, "t"));
  const text = pedSentence(view.ped);
  const arc = coefficient(numOf(values, "p1"), numOf(values, "q1"), numOf(values, "p2"), numOf(values, "q2"));
  const notes = strOf(values, "shape") === "straight" && !hide
    ? [
        { q: 12, p: 20, text: "elastic" },
        { q: 30, p: 13.5, text: "PED = 1" },
        { q: 46, p: 7, text: "inelastic" },
      ]
    : [];
  return {
    diagram: (
      <PolylineChart
        qMax={view.qMax}
        pMax={view.pMax}
        xLabel="Quantity"
        yLabel="Price"
        aria={text.en}
        series={[{ points: view.points, label: "D" }]}
        marker={hide ? undefined : { q: view.q, p: view.p, label: Number.isFinite(view.ped) ? `PED ${num(view.ped)}` : "PED ∞" }}
        rect={hide ? undefined : { q: view.q, p: view.p }}
        guides={!hide}
        notes={notes}
      />
    ),
    legend: hide ? [] : [{ name: "Total expenditure P × Q", color: "rgba(30, 58, 95, 0.12)" }],
    readouts: [
      { label: "Price", value: num(view.p) },
      { label: "Quantity", value: num(view.q) },
      { label: "PED (absolute value)", value: Number.isFinite(view.ped) ? num(view.ped) : "∞" },
      { label: "Total expenditure", value: num(view.te) },
      { label: "Arc PED from the calculator", value: arc == null ? "—" : num(arc) },
    ],
    english: `${text.en} The calculator uses PED = (ΔQ / Q1) ÷ (ΔP / P1). From the numbers entered, arc PED is ${arc == null ? "undefined because price did not change" : num(arc)}.`,
    chinese: `${text.zh}计算器使用 PED = (ΔQ / Q1) ÷ (ΔP / P1)。按所填数字，弧弹性为 ${arc == null ? "无法计算，因为价格没有变化" : num(arc)}。`,
  };
}

function buildPes(values: LabValues, hide: boolean) {
  const view = pesView(strOf(values, "shape"), numOf(values, "t"));
  const finite = Number.isFinite(view.pes);
  const kind = !finite ? "perfectly elastic" : view.pes === 0 ? "perfectly inelastic" : Math.abs(view.pes - 1) < 0.05 ? "unitary" : view.pes > 1 ? "elastic" : "inelastic";
  const english = `PES at this point is ${finite ? num(view.pes) : "infinite"}, so supply is ${kind}. A straight supply curve through the origin has PES = 1 everywhere. If it meets the price axis, PES > 1 at every price; if it meets the quantity axis, PES < 1. Unlike demand, one straight supply curve does not switch from elastic to inelastic.`;
  const chinese = `这一点的 PES 为 ${finite ? num(view.pes) : "无穷大"}，供给${kind === "elastic" ? "富有弹性" : kind === "inelastic" ? "缺乏弹性" : kind === "unitary" ? "为单位弹性" : kind === "perfectly elastic" ? "完全有弹性" : "完全无弹性"}。过原点的直线供给 PES 处处为 1；与价格轴相交则处处大于 1；与数量轴相交则处处小于 1。同一条直线供给不会从上半段富有弹性变成下半段缺乏弹性。`;
  return {
    diagram: (
      <PolylineChart
        qMax={view.qMax}
        pMax={view.pMax}
        xLabel="Quantity"
        yLabel="Price"
        aria={english}
        series={[{ points: view.points, label: "S" }]}
        marker={hide ? undefined : { q: view.q, p: view.p, label: finite ? `PES ${num(view.pes)}` : "PES ∞" }}
        guides
      />
    ),
    readouts: [
      { label: "Price", value: num(view.p) },
      { label: "Quantity", value: num(view.q) },
      { label: "PES", value: finite ? num(view.pes) : "∞" },
    ],
    english,
    chinese,
  };
}

function buildYed(values: LabValues, hide: boolean) {
  const yed = numOf(values, "yed");
  const income = numOf(values, "income");
  const g = yed * (income / 100);
  const input = marketInput(
    { ped: 1, pes: 1, demandShift: 10 * g, supplyShift: 0, usePrice: false, observedPrice: 7 },
    { observedPrice: null },
  );
  const result = solveMarket(input);
  const kind = yed > 1 ? "a luxury (and normal)" : yed > 0 ? "normal, and a necessity if YED is below 1" : yed < 0 ? "inferior" : "unrelated to income";
  const english = `Income changes by ${num(income)}% and YED is ${num(yed)}, so quantity demanded at the original price changes by ${num(g * 100)}%. The good is ${kind}. ${income === 0 ? "Income has not changed, so demand stays put." : yed > 0 ? "Demand shifts right when income rises." : yed < 0 ? "Demand shifts left when income rises." : "Demand does not shift."} The new equilibrium price is ${num(result.pc)} and quantity is ${num(result.traded)}.`;
  const chinese = `收入变化 ${num(income)}%，YED 为 ${num(yed)}，原价格下的需求量变化 ${num(g * 100)}%。该商品是${yed > 1 ? "奢侈品（也是正常品）" : yed > 0 ? "正常品，若 YED 小于 1 则为必需品" : yed < 0 ? "劣等品" : "与收入无关的商品"}。新的均衡价格是 ${num(result.pc)}，数量是 ${num(result.traded)}。`;
  const drawn = marketFigure(result, input, { xLabel: "Quantity", yLabel: "Price", aria: english });
  return {
    diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
    legend: drawn.legend,
    readouts: [
      { label: "YED", value: num(yed) },
      { label: "Change in quantity demanded", value: `${num(g * 100)}%` },
      { label: "New price", value: num(result.pc) },
      { label: "New quantity", value: num(result.traded) },
    ],
    english,
    chinese,
  };
}

function buildXed(values: LabValues, hide: boolean) {
  const xed = numOf(values, "xed");
  const shock = numOf(values, "shock");
  const marketA = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: shock,
    tax: 0,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  const pct = (marketA.pc - 10) / 10;
  const marketB = solveMarket({
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 10 * xed * pct,
    supplyShift: 0,
    tax: 0,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: null,
  });
  const link = xed > 0.05 ? "substitutes" : xed < -0.05 ? "complements" : "unrelated";
  const english = `A supply shock changes the price of good A by ${num(pct * 100)}%. With XED = ${num(xed)}, demand for good B changes by ${num(xed * pct * 100)}% at the original price. The goods are ${link}. Good B's new equilibrium price is ${num(marketB.pc)} and quantity is ${num(marketB.traded)}.`;
  const chinese = `供给冲击使商品 A 的价格变化 ${num(pct * 100)}%。XED 为 ${num(xed)} 时，商品 B 在原价下的需求量变化 ${num(xed * pct * 100)}%。两者是${link === "substitutes" ? "替代品" : link === "complements" ? "互补品" : "无关商品"}。B 的新均衡价格是 ${num(marketB.pc)}，数量是 ${num(marketB.traded)}。`;
  const figA = marketFigure(marketA, { ...blankInput(), supplyShift: shock }, { xLabel: "Quantity of A", yLabel: "Price of A", aria: "Market A" });
  const figB = marketFigure(marketB, { ...blankInput(), demandShift: 10 * xed * pct }, { xLabel: "Quantity of B", yLabel: "Price of B", aria: "Market B" });
  return {
    diagram: (
      <div className="diagram-grid">
        <MarketDiagram figure={figA.figure} hide={hide} />
        <MarketDiagram figure={figB.figure} hide={hide} />
      </div>
    ),
    readouts: [
      { label: "Price of A", value: num(marketA.pc) },
      { label: "Change in price of A", value: `${num(pct * 100)}%` },
      { label: "XED", value: num(xed) },
      { label: "Price of B", value: num(marketB.pc) },
      { label: "Quantity of B", value: num(marketB.traded) },
    ],
    english,
    chinese,
  };
}

function blankInput() {
  return {
    pRef: 10,
    qRef: 40,
    ped: 1,
    pes: 1,
    demandShift: 0,
    supplyShift: 0,
    tax: 0,
    subsidy: 0,
    ceiling: null,
    floor: null,
    observedPrice: null,
  };
}
