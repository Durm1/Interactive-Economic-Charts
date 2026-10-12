import { accountsLab } from "./accountsLab";
import { adasLab, policyLab } from "./adasLab";
import { advantageLab } from "./advantageLab";
import { bufferLab } from "./bufferLab";
import { controlsLab } from "./controlsLab";
import { elasticityLab } from "./elasticityLab";
import { flowLab } from "./flowLab";
import { forexLab } from "./forexLab";
import { lorenzLab } from "./lorenzLab";
import { marketLab } from "./marketLab";
import { meritLab } from "./meritLab";
import { ppcLab } from "./ppcLab";
import { protectionLab } from "./protectionLab";
import { surplusLab } from "./surplusLab";
import { taxLab } from "./taxLab";
import type { Lab } from "./types";

export const labs: Lab[] = [
  ppcLab,
  marketLab,
  elasticityLab,
  surplusLab,
  taxLab,
  controlsLab,
  bufferLab,
  meritLab,
  lorenzLab,
  flowLab,
  adasLab,
  policyLab,
  advantageLab,
  protectionLab,
  accountsLab,
  forexLab,
];

export const sections: { title: string; chinese: string; ids: string[] }[] = [
  { title: "1 Basic economic ideas", chinese: "基本经济思想", ids: ["ppc"] },
  { title: "2 The price system", chinese: "价格机制", ids: ["market", "elasticity", "surplus"] },
  { title: "3 Micro intervention", chinese: "微观干预", ids: ["tax", "controls", "buffer", "merit", "lorenz"] },
  { title: "4 The macroeconomy", chinese: "宏观经济", ids: ["flow", "adas"] },
  { title: "5 Macro policy", chinese: "宏观政策", ids: ["policy"] },
  { title: "6 International", chinese: "国际经济", ids: ["advantage", "protection", "accounts", "forex"] },
];

export function labById(id: string): Lab {
  return labs.find((lab) => lab.id === id) ?? labs[0];
}
