import { snapMax } from "../diagrams/frame";
import { PolylineChart } from "../diagrams/PolylineChart";
import { num } from "../lib/format";
import { ppcOpportunityCost, ppcSamples, ppcY } from "../models/ppc";
import { boolOf, numOf, strOf, type Lab } from "./types";

export const ppcLab: Lab = {
  id: "ppc",
  code: "1.5",
  title: "Production possibility curve",
  chinese: "生产可能性曲线",
  pitfall: {
    en: "A point inside the PPC is attainable but inefficient. A point outside is unattainable with current resources. A movement along the PPC has an opportunity cost; growth shifts the curve.",
    zh: "PPC 以内的点可以达到，但资源未充分利用。曲线以外目前达不到。沿曲线移动有机会成本；增长才会使曲线外移。",
  },
  initial: { shape: "increasing", mix: 0.45, utilization: 1, growth: 1, showOutside: false },
  presets: [
    { id: "increasing", label: "Increasing opportunity cost", detail: "The curve bows out.", values: { shape: "increasing", mix: 0.45, utilization: 1, growth: 1, showOutside: false } },
    { id: "constant", label: "Constant opportunity cost", detail: "The PPC is a straight line.", values: { shape: "constant", mix: 0.4, utilization: 1, growth: 1, showOutside: false } },
    { id: "inside", label: "Inside the PPC", detail: "Unemployment or inefficiency.", values: { shape: "increasing", mix: 0.5, utilization: 0.62, growth: 1, showOutside: false } },
    { id: "growth", label: "Economic growth", detail: "The PPC shifts outward.", values: { shape: "increasing", mix: 0.55, utilization: 1, growth: 1.3, showOutside: false } },
    { id: "outside", label: "Unattainable point", detail: "Beyond the current PPC.", values: { shape: "increasing", mix: 0.7, utilization: 1, growth: 1, showOutside: true } },
  ],
  fields: () => [
    { kind: "select", key: "shape", label: "Shape", options: [{ value: "increasing", label: "Increasing opportunity cost" }, { value: "constant", label: "Constant opportunity cost" }] },
    { kind: "slider", key: "mix", label: "Mix towards consumer goods", min: 0, max: 1, step: 0.01 },
    { kind: "slider", key: "utilization", label: "Resource use (1 = on the PPC)", min: 0.2, max: 1, step: 0.01 },
    { kind: "slider", key: "growth", label: "Growth of resources", min: 0.5, max: 2.2, step: 0.05 },
    { kind: "toggle", key: "showOutside", label: "Show an unattainable point" },
  ],
  build: (values) => {
    const increasing = strOf(values, "shape") === "increasing";
    const growth = numOf(values, "growth");
    const xMax = 100 * growth;
    const yMax = 80 * growth;
    const mix = numOf(values, "mix");
    const utilization = numOf(values, "utilization");
    const xFrontier = mix * xMax;
    const yFrontier = ppcY(xFrontier, xMax, yMax, increasing);
    const x = xFrontier * utilization;
    const y = yFrontier * utilization;
    const oc = ppcOpportunityCost(xFrontier, xMax, yMax, increasing);
    const outside = boolOf(values, "showOutside");
    const series = [
      ...(growth !== 1 ? [{ points: ppcSamples(100, 80, increasing).map((pt) => ({ q: pt.x, p: pt.y })), dashed: true, label: "PPC" }] : []),
      { points: ppcSamples(xMax, yMax, increasing).map((pt) => ({ q: pt.x, p: pt.y })), label: growth === 1 ? "PPC" : "PPC1" },
    ];
    const english = outside
      ? "The hollow point lies outside the PPC, so it is unattainable with the current resources and technology. Only growth, which shifts the PPC outward, can make it attainable."
      : utilization < 0.98
        ? `The filled point is inside the PPC, so it is attainable, but some resources are unemployed or used inefficiently. Moving onto the curve has no opportunity cost in the sense that more of both goods can be produced.`
        : `Resources are fully employed on the PPC. ${increasing ? "The curve bows out, so opportunity cost rises as more consumer goods are produced." : "The curve is a straight line, so opportunity cost is constant."} At this mix, one more unit of consumer goods costs ${num(oc)} capital goods.`;
    const chinese = outside
      ? "空心点在 PPC 之外，以现有资源和技术达不到。只有增长使 PPC 外移，这个点才变得可以达到。"
      : utilization < 0.98
        ? "实心点在 PPC 以内，可以达到，但有资源失业或利用低效。移到曲线上可以同时增加两种产品，因此这一步本身没有机会成本。"
        : `资源已充分就业，生产点在 PPC 上。${increasing ? "曲线向外弯曲，多生产消费品的机会成本递增。" : "曲线是直线，机会成本不变。"}按当前组合，再多 1 单位消费品要放弃 ${num(oc)} 单位资本品。`;
    const growthNote = growth !== 1 ? (growth > 1 ? " Growth shifts the PPC outward, so some previously unattainable points become attainable." : " A fall in resources shifts the PPC inward.") : "";
    return {
      diagram: (
        <PolylineChart
          qMax={snapMax(Math.max(140, xMax))}
          pMax={snapMax(Math.max(120, yMax))}
          xLabel="Consumer goods"
          yLabel="Capital goods"
          aria={english}
          series={series}
          marker={{ q: outside ? xFrontier * 1.18 : x, p: outside ? yFrontier * 1.12 : y, label: outside ? "unattainable" : utilization < 0.98 ? "inside" : "on PPC" }}
        />
      ),
      readouts: [
        { label: "Consumer goods", value: num(outside ? xFrontier * 1.18 : x) },
        { label: "Capital goods", value: num(outside ? yFrontier * 1.12 : y) },
        { label: "Opportunity cost of 1 consumer good", value: num(oc) },
        { label: "On the PPC", value: outside ? "no" : utilization > 0.98 ? "yes" : "no, inside" },
      ],
      english: english + growthNote,
      chinese: chinese + (growth > 1 ? "增长使 PPC 外移，原先达不到的一些组合变得可以达到。" : growth < 1 ? "资源减少使 PPC 内移。" : ""),
    };
  },
};
