import { FlowDiagram } from "../diagrams/FlowDiagram";
import { num } from "../lib/format";
import { boolOf, numOf, type Lab } from "./types";

export const flowLab: Lab = {
  id: "flow",
  code: "4.2",
  title: "Circular flow of income",
  chinese: "收入循环流量",
  pitfall: {
    en: "The multiplier is not required at AS. Equilibrium means injections equal leakages. Income here is a flow between households and firms.",
    zh: "AS 不要求乘数。均衡是注入等于漏出。这里的收入是家庭与企业之间的流量。",
  },
  initial: { open: false, investment: 30, government: 25, exports: 0, saving: 35, tax: 20, imports: 0 },
  presets: [
    { id: "closed", label: "Closed economy equilibrium", detail: "I + G = S + T.", values: { open: false, investment: 30, government: 25, exports: 0, saving: 35, tax: 20, imports: 0 } },
    { id: "rise", label: "Injections exceed leakages", detail: "Income will tend to rise. No multiplier calculation.", values: { open: false, investment: 40, government: 30, exports: 0, saving: 30, tax: 20, imports: 0 } },
    { id: "open", label: "Open economy", detail: "Exports are an injection and imports are a leakage.", values: { open: true, investment: 30, government: 25, exports: 20, saving: 30, tax: 20, imports: 25 } },
  ],
  fields: (values) => [
    { kind: "toggle", key: "open", label: "Open economy" },
    { kind: "slider", key: "investment", label: "Investment I", min: 0, max: 60, step: 1 },
    { kind: "slider", key: "government", label: "Government spending G", min: 0, max: 60, step: 1 },
    { kind: "slider", key: "saving", label: "Saving S", min: 0, max: 60, step: 1 },
    { kind: "slider", key: "tax", label: "Tax T", min: 0, max: 60, step: 1 },
    ...(boolOf(values, "open")
      ? [
          { kind: "slider" as const, key: "exports", label: "Exports X", min: 0, max: 40, step: 1 },
          { kind: "slider" as const, key: "imports", label: "Imports M", min: 0, max: 40, step: 1 },
        ]
      : []),
  ],
  build: (values) => {
    const open = boolOf(values, "open");
    const investment = numOf(values, "investment");
    const government = numOf(values, "government");
    const exports = open ? numOf(values, "exports") : 0;
    const saving = numOf(values, "saving");
    const tax = numOf(values, "tax");
    const imports = open ? numOf(values, "imports") : 0;
    const injections = investment + government + exports;
    const leakages = saving + tax + imports;
    const gap = injections - leakages;
    const english = gap === 0
      ? `Injections I + G${open ? " + X" : ""} equal leakages S + T${open ? " + M" : ""}, both ${num(injections)}. The circular flow is in equilibrium, so national income is not tending to rise or fall.`
      : `Injections are ${num(injections)} and leakages are ${num(leakages)}. They are not equal, so the flow is in disequilibrium and income will tend to ${gap > 0 ? "rise" : "fall"}. This diagram does not calculate a multiplier.`;
    const chinese = gap === 0
      ? `注入 I + G${open ? " + X" : ""} 等于漏出 S + T${open ? " + M" : ""}，都是 ${num(injections)}。循环流量处于均衡，国民收入没有上升或下降的趋势。`
      : `注入为 ${num(injections)}，漏出为 ${num(leakages)}。二者不相等，流量处于失衡，收入将趋于${gap > 0 ? "上升" : "下降"}。这里不计算乘数。`;
    return {
      diagram: <FlowDiagram open={open} investment={investment} government={government} exports={exports} saving={saving} tax={tax} imports={imports} />,
      readouts: [
        { label: "Injections", value: num(injections) },
        { label: "Leakages", value: num(leakages) },
        { label: "Injections − leakages", value: num(gap) },
        { label: "Equilibrium", value: gap === 0 ? "yes" : "no" },
      ],
      english,
      chinese,
    };
  },
};
