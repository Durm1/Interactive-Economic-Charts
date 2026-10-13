import { AdasDiagram } from "../diagrams/AdasDiagram";
import { num } from "../lib/format";
import { solveAdas, type LrasMode } from "../models/adas";
import { numOf, strOf, type Lab, type LabValues } from "./types";

function story(values: LabValues): { en: string; zh: string } {
  const mode = strOf(values, "mode") as LrasMode;
  const result = solveAdas({
    mode,
    adShift: numOf(values, "adShift"),
    srasShift: numOf(values, "srasShift"),
    capacity: numOf(values, "capacity"),
  });
  const instrument = strOf(values, "instrument");
  const gap = result.outputGap;
  const gapText = Math.abs(gap) < 0.6
    ? "Actual output is at full-employment output."
    : gap < 0
      ? `Actual output is ${num(-gap)} below full-employment output, so there is spare capacity.`
      : `Actual output is ${num(gap)} above full-employment output, so the economy is overheating.`;
  let cause = "AD and AS are at their initial positions.";
  let causeZh = "AD 与 AS 处于初始位置。";
  if (instrument === "fiscal" && result.mode === "vertical") {
    cause = numOf(values, "adShift") >= 0
      ? "Expansionary fiscal policy, higher government spending or lower taxes, shifts AD to the right."
      : "Contractionary fiscal policy shifts AD to the left.";
    causeZh = numOf(values, "adShift") >= 0 ? "扩张性财政政策（增加政府支出或减税）使 AD 右移。" : "紧缩性财政政策使 AD 左移。";
  } else if (instrument === "monetary") {
    cause = numOf(values, "adShift") >= 0
      ? "Expansionary monetary policy, lower interest rates or easier credit, shifts AD to the right."
      : "Contractionary monetary policy shifts AD to the left.";
    causeZh = numOf(values, "adShift") >= 0 ? "扩张性货币政策（降低利率或放宽信贷）使 AD 右移。" : "紧缩性货币政策使 AD 左移。";
  } else if (instrument === "supply") {
    cause = "Supply-side policy raises productive capacity, so LRAS shifts right. Lower costs also shift SRAS, and the price level tends to fall while real output rises.";
    causeZh = "供给政策提高生产能力，LRAS 右移。成本下降也会使 SRAS 移动，物价水平往往下降，实际产出上升。";
  } else if (numOf(values, "srasShift") > 0.4) {
    cause = "Higher costs shift SRAS left. The price level rises and real output falls. This is cost-push inflation.";
    causeZh = "成本上升使 SRAS 左移。物价水平上升，实际产出下降。这是成本推动型通货膨胀。";
  } else if (numOf(values, "adShift") > 0.4) {
    cause = "AD shifts right. This is demand-pull inflation when the price level rises with it.";
    causeZh = "AD 右移。若物价水平随之上升，就是需求拉动型通货膨胀。";
  } else if (numOf(values, "adShift") < -0.4) {
    cause = "AD shifts left, so real output and the price level both tend to fall.";
    causeZh = "AD 左移，实际产出和物价水平往往都下降。";
  }
  if (result.region === "elastic" && numOf(values, "adShift") > 0.4) {
    cause = "Equilibrium is on the elastic section of the Keynesian AS curve. Higher AD raises real output while the price level stays the same.";
    causeZh = "均衡位于凯恩斯 AS 曲线的水平段。AD 增加会提高实际产出，物价水平不变。";
  }
  if (result.region === "full" && numOf(values, "adShift") > 0.4) {
    cause = "Equilibrium is on the vertical section. Higher AD raises only the price level, because the economy is at full capacity.";
    causeZh = "均衡位于垂直段。经济已达充分产能，AD 增加只会提高物价水平。";
  }
  const shape = mode === "vertical"
    ? "LRAS is the vertical line at full-employment output. Short-run equilibrium is where AD meets SRAS."
    : "This is the Keynesian AS curve: elastic, then upward sloping, then vertical at full employment.";
  const shapeZh = mode === "vertical"
    ? "LRAS 是充分就业产出处的垂直线。短期均衡是 AD 与 SRAS 的交点。"
    : "这是凯恩斯 AS 曲线：先水平，再向上，在充分就业处垂直。";
  return {
    en: `The axes are the price level and real GDP, not price and quantity. ${shape} ${cause} Real output is ${num(result.y)} and the price level is ${num(result.pl)}. ${gapText}`,
    zh: `纵轴是物价水平，横轴是实际 GDP，不是价格和数量。${shapeZh}${causeZh}实际产出为 ${num(result.y)}，物价水平为 ${num(result.pl)}。${gap < -0.6 ? `实际产出比充分就业低 ${num(-gap)}，存在闲置产能。` : gap > 0.6 ? `实际产出比充分就业高 ${num(gap)}，经济过热。` : "实际产出处于充分就业水平。"}`,
  };
}

function makeLab(id: "adas" | "policy"): Lab {
  const policy = id === "policy";
  return {
    id,
    code: policy ? "5.2 · 5.3 · 5.4" : "4.3 · 4.6",
    title: policy ? "Fiscal, monetary and supply-side policy" : "Aggregate demand and aggregate supply",
    chinese: policy ? "财政、货币与供给政策" : "总需求与总供给",
    pitfall: policy
      ? { en: "Fiscal and monetary policy shift AD. Supply-side policy shifts LRAS. Name the instrument, and keep the axes as price level and real GDP.", zh: "财政政策与货币政策移动 AD。供给政策移动 LRAS。写明工具，坐标轴仍是物价水平和实际 GDP。" }
      : { en: "Label the axes Price level and Real GDP. Demand-pull inflation is an AD shift right. Cost-push inflation is an SRAS shift left.", zh: "坐标轴要写成物价水平和实际 GDP。需求拉动是 AD 右移。成本推动是 SRAS 左移。" },
    initial: policy
      ? { mode: "vertical", adShift: 12, srasShift: 0, capacity: 0, instrument: "fiscal" }
      : { mode: "vertical", adShift: 0, srasShift: 0, capacity: 0, instrument: "none" },
    presets: policy
      ? [
          { id: "fiscal-up", label: "Expansionary fiscal", detail: "G rises or taxes fall. AD shifts right.", values: { mode: "vertical", instrument: "fiscal", adShift: 14, srasShift: 0, capacity: 0 } },
          { id: "fiscal-down", label: "Contractionary fiscal", detail: "AD shifts left.", values: { mode: "vertical", instrument: "fiscal", adShift: -14, srasShift: 0, capacity: 0 } },
          { id: "money-up", label: "Expansionary monetary", detail: "Lower interest rates shift AD right.", values: { mode: "vertical", instrument: "monetary", adShift: 14, srasShift: 0, capacity: 0 } },
          { id: "money-down", label: "Contractionary monetary", detail: "Higher interest rates shift AD left.", values: { mode: "vertical", instrument: "monetary", adShift: -14, srasShift: 0, capacity: 0 } },
          { id: "supply", label: "Supply-side policy", detail: "Training, infrastructure or technology shifts LRAS right.", values: { mode: "vertical", instrument: "supply", adShift: 0, srasShift: 0, capacity: 14 } },
        ]
      : [
          { id: "classical", label: "Classical LRAS", detail: "Vertical at full employment.", values: { mode: "vertical", instrument: "none", adShift: 0, srasShift: 0, capacity: 0 } },
          { id: "keynes", label: "Keynesian AS", detail: "Elastic, then upward, then vertical.", values: { mode: "keynesian", instrument: "none", adShift: 0, srasShift: 0, capacity: 0 } },
          { id: "pull", label: "Demand-pull inflation", detail: "AD shifts right.", values: { mode: "vertical", instrument: "none", adShift: 16, srasShift: 0, capacity: 0 } },
          { id: "push", label: "Cost-push inflation", detail: "SRAS shifts left.", values: { mode: "vertical", instrument: "none", adShift: 0, srasShift: 16, capacity: 0 } },
          { id: "flat", label: "Keynesian spare capacity", detail: "AD rises and the price level does not.", values: { mode: "keynesian", instrument: "none", adShift: 12, srasShift: 0, capacity: 0 } },
          { id: "full", label: "Keynesian full capacity", detail: "AD meets the vertical section.", values: { mode: "keynesian", instrument: "none", adShift: 70, srasShift: 0, capacity: 0 } },
        ],
    onChange: (key, values) => {
      if (key !== "mode") return values;
      return {
        ...values,
        adShift: 0,
        srasShift: 0,
        capacity: 0,
        instrument: policy ? "fiscal" : "none",
      };
    },
    fields: (values) => {
      const keynes = strOf(values, "mode") === "keynesian";
      return [
        { kind: "select", key: "mode", label: "AS shape", options: [{ value: "vertical", label: "Classical: vertical LRAS" }, { value: "keynesian", label: "Keynesian: three sections" }] },
        ...(policy
          ? [{ kind: "select" as const, key: "instrument", label: "Policy", options: [{ value: "fiscal", label: "Fiscal policy" }, { value: "monetary", label: "Monetary policy" }, { value: "supply", label: "Supply-side policy" }] }]
          : [{ kind: "select" as const, key: "instrument", label: "If a policy is shifting AD", options: [{ value: "none", label: "Describe the shift only" }, { value: "fiscal", label: "Call it fiscal policy" }, { value: "monetary", label: "Call it monetary policy" }] }]),
        { kind: "slider", key: "adShift", label: "AD shift (+ is an increase)", min: keynes ? -30 : -20, max: keynes ? 90 : 24, step: 1 },
        ...(keynes ? [] : [{ kind: "slider" as const, key: "srasShift", label: "SRAS cost shock (+ is higher costs)", min: -12, max: 20, step: 1 }]),
        { kind: "slider", key: "capacity", label: "Supply-side capacity", min: 0, max: 20, step: 1 },
      ];
    },
    build: (values) => {
      const result = solveAdas({
        mode: strOf(values, "mode") as LrasMode,
        adShift: numOf(values, "adShift"),
        srasShift: numOf(values, "srasShift"),
        capacity: numOf(values, "capacity"),
      });
      const text = story(values);
      return {
        diagram: <AdasDiagram result={result} aria={text.en} />,
        readouts: [
          { label: "Real output", value: num(result.y) },
          { label: "Price level", value: num(result.pl) },
          { label: "Full-employment output", value: num(result.yf) },
          { label: "Output gap (actual − potential)", value: num(result.outputGap) },
          { label: "Section", value: result.region === "sras" ? "SRAS equilibrium" : result.region },
        ],
        english: text.en,
        chinese: text.zh,
      };
    },
  };
}

export const adasLab = makeLab("adas");
export const policyLab = makeLab("policy");
