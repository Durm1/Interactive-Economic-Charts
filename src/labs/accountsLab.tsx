import { num } from "../lib/format";
import { numOf, type Lab } from "./types";

function bar(value: number, max: number) {
  const width = Math.max(4, (Math.min(Math.abs(value), max) / max) * 100);
  return (
    <div className="balance">
      <div className="balance-track">
        <div className={value < 0 ? "balance-fill deficit" : "balance-fill surplus"} style={{ width: `${width}%` }} />
      </div>
      <span>{value < 0 ? "deficit" : value > 0 ? "surplus" : "balance"}</span>
    </div>
  );
}

export const accountsLab: Lab = {
  id: "accounts",
  code: "6.1.3 · 6.3",
  title: "Current account and terms of trade",
  chinese: "经常账户与贸易条件",
  pitfall: {
    en: "The current account is not the whole balance of payments. Add trade in goods, trade in services, primary income and secondary income. A deficit is a negative balance.",
    zh: "经常账户不是整个国际收支。要把货物、服务、初次收入和二次收入加总。逆差是负的余额。",
  },
  initial: {
    goodsX: 80,
    goodsM: 95,
    servicesX: 40,
    servicesM: 28,
    primary: -6,
    secondary: 4,
    exportIndex: 110,
    importIndex: 100,
  },
  presets: [
    { id: "deficit", label: "Current account deficit", detail: "The goods deficit outweighs the services surplus.", values: { goodsX: 80, goodsM: 110, servicesX: 30, servicesM: 28, primary: -4, secondary: 2 } },
    { id: "surplus", label: "Current account surplus", detail: "Credits exceed debits.", values: { goodsX: 120, goodsM: 90, servicesX: 40, servicesM: 25, primary: 8, secondary: -3 } },
    { id: "tot-up", label: "Terms of trade improve", detail: "Export prices rise relative to import prices.", values: { exportIndex: 120, importIndex: 100 } },
    { id: "tot-down", label: "Terms of trade worsen", detail: "Import prices rise relative to export prices.", values: { exportIndex: 100, importIndex: 125 } },
  ],
  fields: () => [
    { kind: "number", key: "goodsX", label: "Exports of goods", min: 0, max: 500, step: 1 },
    { kind: "number", key: "goodsM", label: "Imports of goods", min: 0, max: 500, step: 1 },
    { kind: "number", key: "servicesX", label: "Exports of services", min: 0, max: 500, step: 1 },
    { kind: "number", key: "servicesM", label: "Imports of services", min: 0, max: 500, step: 1 },
    { kind: "number", key: "primary", label: "Primary income (credit − debit)", min: -200, max: 200, step: 1 },
    { kind: "number", key: "secondary", label: "Secondary income (credit − debit)", min: -200, max: 200, step: 1 },
    { kind: "number", key: "exportIndex", label: "Export price index", min: 40, max: 200, step: 1 },
    { kind: "number", key: "importIndex", label: "Import price index", min: 40, max: 200, step: 1 },
  ],
  build: (values) => {
    const goods = numOf(values, "goodsX") - numOf(values, "goodsM");
    const services = numOf(values, "servicesX") - numOf(values, "servicesM");
    const trade = goods + services;
    const current = trade + numOf(values, "primary") + numOf(values, "secondary");
    const tot = (numOf(values, "exportIndex") / Math.max(1, numOf(values, "importIndex"))) * 100;
    const english = `The balance of trade in goods is ${num(goods)} and in services is ${num(services)}. Adding primary income and secondary income gives a current account balance of ${num(current)}, a ${current < 0 ? "deficit" : current > 0 ? "surplus" : "balance"}. The terms of trade index is (export price index / import price index) × 100 = ${num(tot)}. ${tot > 100.5 ? "The index is above the base of 100, so the terms of trade have improved: a unit of exports buys more imports." : tot < 99.5 ? "The index is below 100, so the terms of trade have worsened." : "The index is at the base of 100."} An improvement is not automatically a rise in welfare if export volumes fall sharply.`;
    const chinese = `货物贸易余额为 ${num(goods)}，服务贸易余额为 ${num(services)}。加上初次收入和二次收入，经常账户余额为 ${num(current)}，这是${current < 0 ? "逆差" : current > 0 ? "顺差" : "平衡"}。贸易条件指数 =（出口价格指数 / 进口价格指数）× 100 = ${num(tot)}。${tot > 100.5 ? "指数高于基期的 100，贸易条件改善：一单位出口能换到更多进口。" : tot < 99.5 ? "指数低于 100，贸易条件恶化。" : "指数处于基期 100。"}若出口数量大幅下降，贸易条件改善不一定意味着福利上升。`;
    return {
      diagram: (
        <div className="accounts">
          <section>
            <h3>Current account</h3>
            {bar(current, 150)}
          </section>
          <section>
            <h3>Terms of trade index</h3>
            <p className="tot">{num(tot)}</p>
            <p className="note-label">Base year = 100</p>
          </section>
        </div>
      ),
      readouts: [
        { label: "Balance of trade in goods", value: num(goods) },
        { label: "Balance of trade in services", value: num(services) },
        { label: "Balance of trade in goods and services", value: num(trade) },
        { label: "Current account balance", value: num(current) },
        { label: "Terms of trade", value: num(tot) },
      ],
      english,
      chinese,
    };
  },
};
