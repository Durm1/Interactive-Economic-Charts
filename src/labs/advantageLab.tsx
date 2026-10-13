import { snapMax } from "../diagrams/frame";
import { PolylineChart } from "../diagrams/PolylineChart";
import { num } from "../lib/format";
import { analyseTrade, ppcSamples, tradingPossibility, type CountryPpc } from "../models/ppc";
import { numOf, type Lab } from "./types";

function countryDiagram(country: CountryPpc, specialisesInFood: boolean, terms: number, beneficial: boolean) {
  const ppc = ppcSamples(country.food, country.cloth, false).map((pt) => ({ q: pt.x, p: pt.y }));
  const trade = tradingPossibility(country, specialisesInFood, terms).map((pt) => ({ q: pt.x, p: pt.y }));
  const xMax = Math.max(country.food, specialisesInFood ? country.food : country.cloth / terms) * 1.15;
  const yMax = Math.max(country.cloth, specialisesInFood ? country.food * terms : country.cloth) * 1.15;
  return (
    <PolylineChart
      qMax={snapMax(xMax)}
      pMax={snapMax(yMax)}
      xLabel="Food"
      yLabel="Cloth"
      aria={`${country.name} production possibility and trading possibility curves`}
      series={[
        { points: ppc, label: "PPC" },
        ...(beneficial ? [{ points: trade, label: "TPC", dashed: true }] : []),
      ]}
    />
  );
}

export const advantageLab: Lab = {
  id: "advantage",
  code: "6.1",
  title: "Comparative advantage",
  chinese: "比较优势",
  pitfall: {
    en: "Comparative advantage compares opportunity cost, not the absolute amount a country can produce. Both countries gain only when the terms of trade lie between their opportunity costs.",
    zh: "比较优势比较的是机会成本，不是谁的产量绝对更大。只有贸易条件落在两国机会成本之间，双方才能都获益。",
  },
  initial: { foodA: 100, clothA: 50, foodB: 60, clothB: 60, terms: 0.75 },
  presets: [
    { id: "classic", label: "Both can gain", detail: "Each country specialises where its opportunity cost is lower.", values: { foodA: 100, clothA: 50, foodB: 60, clothB: 60, terms: 0.75 } },
    { id: "absolute", label: "A is better at both", detail: "A has an absolute advantage in both goods, but B still has a comparative advantage in one.", values: { foodA: 120, clothA: 80, foodB: 50, clothB: 40, terms: 0.75 } },
    { id: "outside", label: "Terms of trade too low", detail: "Outside the two opportunity costs, one country will not trade.", values: { foodA: 100, clothA: 50, foodB: 60, clothB: 60, terms: 0.3 } },
  ],
  fields: () => [
    { kind: "slider", key: "foodA", label: "Country A maximum food", min: 10, max: 240, step: 5 },
    { kind: "slider", key: "clothA", label: "Country A maximum cloth", min: 10, max: 240, step: 5 },
    { kind: "slider", key: "foodB", label: "Country B maximum food", min: 10, max: 240, step: 5 },
    { kind: "slider", key: "clothB", label: "Country B maximum cloth", min: 10, max: 240, step: 5 },
    { kind: "slider", key: "terms", label: "Terms of trade (cloth per unit of food)", min: 0.1, max: 3.5, step: 0.05 },
  ],
  build: (values) => {
    const a: CountryPpc = { name: "A", food: numOf(values, "foodA"), cloth: numOf(values, "clothA") };
    const b: CountryPpc = { name: "B", food: numOf(values, "foodB"), cloth: numOf(values, "clothB") };
    const terms = numOf(values, "terms");
    const trade = analyseTrade(a, b, terms);
    const aFood = trade.comparativeFood === "A";
    const english = trade.comparativeFood === "neither"
      ? "The opportunity costs are the same, so neither country has a comparative advantage and there is no gain from specialising."
      : `${trade.comparativeFood} has a comparative advantage in food because its opportunity cost is ${num(Math.min(trade.foodOcA, trade.foodOcB))} cloth, lower than the other country's ${num(Math.max(trade.foodOcA, trade.foodOcB))}. ${trade.comparativeCloth} has a comparative advantage in cloth. Absolute advantage in food belongs to ${trade.absoluteFood}. ${trade.mutuallyBeneficial ? `The terms of trade, ${num(terms)} cloth per unit of food, lie between the two opportunity costs, so both can consume outside their PPCs by specialising and trading.` : `These terms of trade do not lie between the two opportunity costs, so trade on these terms does not benefit both countries.`}`;
    const chinese = trade.comparativeFood === "neither"
      ? "两国机会成本相同，谁也没有比较优势，专业化不会带来贸易利益。"
      : `${trade.comparativeFood} 生产食品的机会成本更低（${num(Math.min(trade.foodOcA, trade.foodOcB))} 单位布），所以在食品上有比较优势。${trade.comparativeCloth} 在布上有比较优势。食品的绝对优势属于 ${trade.absoluteFood}。${trade.mutuallyBeneficial ? `贸易条件是每单位食品换 ${num(terms)} 单位布，落在两国机会成本之间，双方专业化并贸易后都能消费到 PPC 之外。` : "这一贸易条件不在两国机会成本之间，不能让双方都获益。"}`;
    return {
      diagram: (
        <div className="diagram-grid">
          {countryDiagram(a, aFood, terms, trade.mutuallyBeneficial)}
          {countryDiagram(b, !aFood && trade.comparativeFood !== "neither", terms, trade.mutuallyBeneficial)}
        </div>
      ),
      readouts: [
        { label: "A: OC of 1 food", value: `${num(trade.foodOcA)} cloth` },
        { label: "B: OC of 1 food", value: `${num(trade.foodOcB)} cloth` },
        { label: "Comparative advantage in food", value: trade.comparativeFood },
        { label: "Comparative advantage in cloth", value: trade.comparativeCloth },
        { label: "Both gain", value: trade.mutuallyBeneficial ? "yes" : "no" },
      ],
      english,
      chinese,
    };
  },
};
