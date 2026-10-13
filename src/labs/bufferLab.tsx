import { MarketDiagram } from "../diagrams/MarketDiagram";
import { marketFigure } from "../figures/marketFigure";
import { num } from "../lib/format";
import { solveMarket } from "../models/market";
import { marketInput } from "./marketLab";
import { numOf, pedField, pesField, type Lab } from "./types";

export const bufferLab: Lab = {
  id: "buffer",
  code: "3.2.5",
  title: "Buffer stock scheme",
  chinese: "缓冲库存",
  pitfall: {
    en: "The agency buys when a good harvest would push the price below the floor, and it can sell only if it already holds stocks when the price would rise above the ceiling.",
    zh: "丰收把价格压到下限以下时，机构买入。只有手里已有库存，才能在价格冲向上限时卖出。",
  },
  initial: { ped: 0.5, pes: 0.6, demandShift: 0, supplyShift: 0, usePrice: false, observedPrice: 7, floor: 8, ceiling: 12, harvest: 5, stock: 20 },
  presets: [
    { id: "glut", label: "Good harvest", detail: "Supply shifts right and the agency buys at the floor.", values: { harvest: 6, floor: 8, ceiling: 12, stock: 10 } },
    { id: "shortage", label: "Bad harvest", detail: "Supply shifts left and the agency sells at the ceiling.", values: { harvest: -6, floor: 8, ceiling: 12, stock: 20 } },
    { id: "empty", label: "Bad harvest, empty stocks", detail: "The ceiling cannot be defended without stocks.", values: { harvest: -6, floor: 8, ceiling: 12, stock: 0 } },
    { id: "inside", label: "Price inside the band", detail: "No buying or selling is required.", values: { harvest: 0, floor: 6, ceiling: 14, stock: 15 } },
  ],
  fields: () => [
    { kind: "slider", key: "harvest", label: "Harvest shock (+ is a glut)", min: -14, max: 14, step: 0.5 },
    { kind: "slider", key: "floor", label: "Floor price", min: 1, max: 20, step: 0.5 },
    { kind: "slider", key: "ceiling", label: "Ceiling price", min: 2, max: 28, step: 0.5 },
    { kind: "slider", key: "stock", label: "Stocks available", min: 0, max: 70, step: 1 },
    pedField,
    pesField,
  ],
  build: (values, hide) => {
    const floor = Math.min(numOf(values, "floor"), numOf(values, "ceiling") - 0.5);
    const ceiling = Math.max(numOf(values, "ceiling"), floor + 0.5);
    const input = marketInput(values, {
      supplyShift: -numOf(values, "harvest"),
      floor,
      ceiling,
      observedPrice: null,
    });
    const result = solveMarket(input);
    const wantedSales = result.binding === "ceiling" ? Math.max(0, result.excessDemand) : 0;
    const sales = Math.min(numOf(values, "stock"), wantedSales);
    const purchases = result.binding === "floor" ? Math.max(0, -result.excessDemand) : 0;
    const unmet = wantedSales - sales;
    const stockAfter = numOf(values, "stock") + purchases - sales;
    const english = result.binding === "floor"
      ? `The free-market price would be ${num(result.unconstrained?.p ?? 0)}, below the floor of ${num(floor)}. The agency buys the excess supply of ${num(purchases)} and adds it to stocks, which become ${num(stockAfter)}.`
      : result.binding === "ceiling"
        ? unmet > 0.2
          ? `The free-market price would be ${num(result.unconstrained?.p ?? 0)}, above the ceiling. The agency can sell only ${num(sales)} from stocks, short of the ${num(wantedSales)} needed, so the ceiling cannot be fully defended.`
          : `The free-market price would be above the ceiling of ${num(ceiling)}. The agency sells ${num(sales)} from stocks and the price stays at the ceiling. Stocks fall to ${num(stockAfter)}.`
        : `The free-market price of ${num(result.pc)} lies inside the band ${num(floor)} to ${num(ceiling)}, so the agency does not buy or sell.`;
    const chinese = result.binding === "floor"
      ? `自由市场价格会降到 ${num(result.unconstrained?.p ?? 0)}，低于下限 ${num(floor)}。机构买入超额供给 ${num(purchases)}，库存增至 ${num(stockAfter)}。`
      : result.binding === "ceiling"
        ? unmet > 0.2
          ? `自由市场价格会高于上限。库存只够卖出 ${num(sales)}，低于所需的 ${num(wantedSales)}，上限无法完全守住。`
          : `自由市场价格会高于上限 ${num(ceiling)}。机构卖出库存 ${num(sales)}，价格维持在上限，库存降到 ${num(stockAfter)}。`
        : `自由市场价格 ${num(result.pc)} 落在 ${num(floor)} 到 ${num(ceiling)} 的区间内，机构不必买卖。`;
    const drawn = marketFigure(result, input, {
      xLabel: "Quantity",
      yLabel: "Price",
      aria: english,
      showExcess: result.binding === "floor" || result.binding === "ceiling",
      excessLabel: result.binding === "floor" ? "agency buys" : "agency sells",
    });
    return {
      diagram: <MarketDiagram figure={drawn.figure} hide={hide} />,
      legend: drawn.legend,
      readouts: [
        { label: "Free-market price", value: num(result.unconstrained?.p ?? result.pc) },
        { label: "Price in the scheme", value: num(result.pc) },
        { label: "Agency buys", value: num(purchases) },
        { label: "Agency sells", value: num(sales) },
        { label: "Stocks after", value: num(stockAfter) },
      ],
      english,
      chinese,
    };
  },
};
