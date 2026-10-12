import { PolylineChart } from "../diagrams/PolylineChart";
import { num } from "../lib/format";
import { giniFromK, kFromInequality, lorenzSamples } from "../models/lorenz";
import { numOf, type Lab } from "./types";

export const lorenzLab: Lab = {
  id: "lorenz",
  code: "3.3.2",
  title: "Lorenz curve",
  chinese: "洛伦兹曲线",
  pitfall: {
    en: "The Gini coefficient lies between 0 and 1. You do not need to calculate it. The further the Lorenz curve is from the line of equality, the greater the inequality.",
    zh: "基尼系数在 0 和 1 之间。考纲不要求计算。洛伦兹曲线离平等线越远，不平等程度越高。",
  },
  initial: { inequality: 0.45, redistribution: 0.35 },
  presets: [
    { id: "unequal", label: "High inequality", detail: "The curve bows well away from equality.", values: { inequality: 0.62, redistribution: 0 } },
    { id: "policy", label: "Redistribution", detail: "Transfers and progressive taxes pull the curve inward.", values: { inequality: 0.62, redistribution: 0.55 } },
    { id: "equal", label: "Closer to equality", detail: "A low Gini coefficient.", values: { inequality: 0.18, redistribution: 0 } },
  ],
  fields: () => [
    { kind: "slider", key: "inequality", label: "Inequality before policy", min: 0.05, max: 0.85, step: 0.01 },
    { kind: "slider", key: "redistribution", label: "Redistribution", min: 0, max: 1, step: 0.01 },
  ],
  build: (values) => {
    const before = kFromInequality(numOf(values, "inequality"));
    const afterK = before + (1.02 - before) * numOf(values, "redistribution");
    const giniBefore = giniFromK(before);
    const giniAfter = giniFromK(afterK);
    const english = `The straight line is perfect equality. The Lorenz curve shows the cumulative share of income against the cumulative share of population. Before redistribution the illustrated Gini coefficient is ${num(giniAfter === giniBefore ? giniBefore : giniBefore)}; after the policy it is ${num(giniAfter)}. A movement towards the line of equality is a fall in inequality. The syllabus does not require you to calculate the Gini coefficient.`;
    const chinese = `直线表示完全平等。洛伦兹曲线画出人口累计比例所对应的收入累计比例。再分配前图示基尼系数约为 ${num(giniBefore)}，政策后约为 ${num(giniAfter)}。曲线靠近平等线，就是不平等程度下降。考纲不要求计算基尼系数。`;
    return {
      diagram: (
        <PolylineChart
          qMax={100}
          pMax={100}
          xLabel="Cumulative % of population"
          yLabel="Cumulative % of income"
          aria={english}
          series={[
            { points: [{ q: 0, p: 0 }, { q: 100, p: 100 }], label: "equality", labelAt: 0.32, labelDy: -14 },
            { points: lorenzSamples(before).map((pt) => ({ q: pt.x * 100, p: pt.y * 100 })), dashed: true, label: "before", labelAt: 0.78, labelDy: 16 },
            { points: lorenzSamples(afterK).map((pt) => ({ q: pt.x * 100, p: pt.y * 100 })), label: "after", labelAt: 0.62, labelDy: -14 },
          ]}
        />
      ),
      readouts: [
        { label: "Gini before (illustrative)", value: num(giniBefore) },
        { label: "Gini after (illustrative)", value: num(giniAfter) },
      ],
      english,
      chinese,
    };
  },
};
