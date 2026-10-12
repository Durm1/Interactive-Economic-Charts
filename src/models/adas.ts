import { snapMax } from "../diagrams/frame";
import { intersect, linear, priceAt, type Curve } from "./curve";

export type LrasMode = "vertical" | "keynesian";

export type AdasInput = {
  mode: LrasMode;
  /** Positive moves AD right, in units of real GDP. */
  adShift: number;
  /** Positive moves SRAS up. */
  srasShift: number;
  /** Positive raises full-employment output. */
  capacity: number;
};

export type AdasRegion = "elastic" | "intermediate" | "full" | "sras";

export type AdasResult = {
  mode: LrasMode;
  y: number;
  pl: number;
  yf: number;
  /** Actual real output minus full-employment output. */
  outputGap: number;
  region: AdasRegion;
  ad: Curve;
  baseAd: Curve;
  sras: Curve | null;
  baseSras: Curve | null;
  y1: number;
  plFlat: number;
  plTop: number;
  baseYf: number;
};

const classical = {
  yf: 100,
  adIntercept: 130,
  adSlope: -0.4,
  srasIntercept: 50,
  srasSlope: 0.4,
};

const keynesian = {
  yf: 80,
  y1: 55,
  plFlat: 70,
  plTop: 88,
  adIntercept: 102,
  adSlope: -0.8,
};

export function solveAdas(input: AdasInput): AdasResult {
  if (input.mode === "vertical") return solveClassical(input);
  return solveKeynesian(input);
}

function solveClassical(input: AdasInput): AdasResult {
  const yf = classical.yf + input.capacity;
  const baseAd = linear(classical.adIntercept, classical.adSlope);
  const ad = linear(classical.adIntercept - classical.adSlope * input.adShift, classical.adSlope);
  const srasEase = 0.4 * input.capacity;
  const baseSras = linear(classical.srasIntercept, classical.srasSlope);
  const sras = linear(classical.srasIntercept + input.srasShift - srasEase, classical.srasSlope);
  const hit = intersect(ad, sras);
  const y = hit && hit.q > 0 ? hit.q : 0;
  const pl = hit && hit.q > 0 ? hit.p : 0;
  return {
    mode: "vertical",
    y,
    pl,
    yf,
    outputGap: y - yf,
    region: "sras",
    ad,
    baseAd,
    sras,
    baseSras,
    y1: yf,
    plFlat: 0,
    plTop: 0,
    baseYf: classical.yf,
  };
}

function solveKeynesian(input: AdasInput): AdasResult {
  const yf = keynesian.yf + input.capacity;
  const y1 = keynesian.y1;
  const plFlat = keynesian.plFlat;
  const plTop = keynesian.plTop;
  const baseAd = linear(keynesian.adIntercept, keynesian.adSlope);
  const ad = linear(keynesian.adIntercept - keynesian.adSlope * input.adShift, keynesian.adSlope);
  const slopeK = (plTop - plFlat) / Math.max(1, yf - y1);

  const yFlat = (plFlat - ad.intercept) / ad.slope;
  let y = 0;
  let pl = plFlat;
  let region: AdasRegion = "elastic";

  if (yFlat >= 0 && yFlat <= y1 + 1e-6) {
    y = yFlat;
    pl = plFlat;
    region = "elastic";
  } else {
    const yMid = (plFlat - slopeK * y1 - ad.intercept) / (ad.slope - slopeK);
    const plMid = plFlat + slopeK * (yMid - y1);
    if (yMid >= y1 - 1e-6 && yMid <= yf + 1e-6) {
      y = Math.min(yf, Math.max(y1, yMid));
      pl = plMid;
      region = y >= yf - 0.5 ? "full" : "intermediate";
    } else {
      y = yf;
      pl = priceAt(ad, yf);
      region = "full";
    }
  }

  return {
    mode: "keynesian",
    y,
    pl,
    yf,
    outputGap: y - yf,
    region,
    ad,
    baseAd,
    sras: null,
    baseSras: null,
    y1,
    plFlat,
    plTop,
    baseYf: keynesian.yf,
  };
}

export function adasFrame(result: AdasResult): { qMax: number; pMax: number } {
  const qNeed = Math.max(result.yf, result.y, result.baseYf, 80) * 1.15;
  const prices = [result.pl, result.plFlat, result.plTop, 80];
  if (result.ad.kind === "linear") prices.push(Math.min(result.ad.intercept, 180));
  const pNeed = Math.max(...prices.filter((p) => p > 0), 80);
  return { qMax: snapMax(qNeed), pMax: snapMax(pNeed) };
}
