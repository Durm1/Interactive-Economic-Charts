import { num } from "../lib/format";
import type { MarketInput, MarketResult } from "../models/market";

export function burdenSentence(result: MarketResult): { en: string; zh: string } {
  const share = result.consumerBurden / (result.consumerBurden + result.producerBurden);
  if (!Number.isFinite(share)) {
    return {
      en: "There is no positive output left in the market.",
      zh: "市场上已经没有正的成交量。",
    };
  }
  if (share > 0.58) {
    return {
      en: `Demand is more inelastic than supply, so consumers bear more of the tax (${num(result.consumerBurden)} of ${num(result.consumerBurden + result.producerBurden)}).`,
      zh: `需求比供给更缺乏弹性，消费者承担更多税负（${num(result.consumerBurden)} / ${num(result.consumerBurden + result.producerBurden)}）。`,
    };
  }
  if (share < 0.42) {
    return {
      en: `Supply is more inelastic than demand, so producers bear more of the tax (${num(result.producerBurden)} of ${num(result.consumerBurden + result.producerBurden)}).`,
      zh: `供给比需求更缺乏弹性，生产者承担更多税负（${num(result.producerBurden)} / ${num(result.consumerBurden + result.producerBurden)}）。`,
    };
  }
  return {
    en: "PED and PES are similar, so the tax is shared roughly equally.",
    zh: "PED 与 PES 接近，税负大致由双方均摊。",
  };
}

export function movementSentence(input: MarketInput, result: MarketResult): { en: string; zh: string } {
  const demandMoved = Math.abs(input.demandShift) > 0.05;
  const supplyMoved = Math.abs(input.supplyShift) > 0.05;
  const wedge = input.tax > 0.05 || input.subsidy > 0.05;
  const partsEn: string[] = [];
  const partsZh: string[] = [];

  if (demandMoved) {
    partsEn.push(input.demandShift > 0 ? "Demand increases, so D shifts right to D1." : "Demand decreases, so D shifts left to D1.");
    partsZh.push(input.demandShift > 0 ? "需求增加，D 右移到 D1。" : "需求减少，D 左移到 D1。");
  }
  if (supplyMoved && input.tax <= 0.05 && input.subsidy <= 0.05) {
    partsEn.push(input.supplyShift > 0 ? "Higher costs decrease supply: S shifts up and left to S1." : "Lower costs increase supply: S shifts down and right to S1.");
    partsZh.push(input.supplyShift > 0 ? "成本上升使供给减少，S 向左上移到 S1。" : "成本下降使供给增加，S 向右下移到 S1。");
  }
  if (!demandMoved && (supplyMoved || wedge) && result.preTax) {
    const word = result.preTax.q < result.baseEq.q ? "contraction" : "extension";
    const article = word === "extension" ? "an" : "a";
    partsEn.push(`Price changes and quantity moves along the unchanged demand curve: this is ${article} ${word} of demand, not a shift.`);
    partsZh.push(word === "contraction" ? "价格变化使数量沿原来的需求曲线减少，这是需求的收缩，不是需求曲线移动。" : "价格变化使数量沿原来的需求曲线增加，这是需求的延伸，不是需求曲线移动。");
  }
  if (demandMoved && !supplyMoved && !wedge && result.preTax) {
    const word = result.preTax.q < result.baseEq.q ? "contraction" : "extension";
    const article = word === "extension" ? "an" : "a";
    partsEn.push(`Supply does not shift. Quantity moves along S: this is ${article} ${word} of supply.`);
    partsZh.push(word === "contraction" ? "供给曲线没有移动，数量沿 S 减少，这是供给的收缩。" : "供给曲线没有移动，数量沿 S 增加，这是供给的延伸。");
  }
  return { en: partsEn.join(" "), zh: partsZh.join("") };
}
