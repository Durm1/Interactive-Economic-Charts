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

  const yFlat = (plFlat - ad.intercept) / ad.slope;
  let y = 0;
  let pl = plFlat;
  let region: AdasRegion = "elastic";
  const adAtY1 = priceAt(ad, y1);

  if (adAtY1 <= plFlat + 1e-9) {
    y = Math.max(0, yFlat);
    pl = plFlat;
    region = "elastic";
  } else if (priceAt(ad, yf) >= plTop - 1e-9) {
    y = yf;
    pl = priceAt(ad, yf);
    region = "full";
  } else {
    let lo = y1;
    let hi = yf;
    for (let i = 0; i < 48; i++) {
      const mid = (lo + hi) / 2;
      const gap = priceAt(ad, mid) - keynesPrice(mid, y1, yf, plFlat, plTop);
      if (gap > 0) lo = mid;
      else hi = mid;
    }
    y = (lo + hi) / 2;
    pl = keynesPrice(y, y1, yf, plFlat, plTop);
    region = "intermediate";
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

/** Flat, then a tightening bend, then vertical. The bend starts level with the flat section. */
export function keynesPrice(y: number, y1: number, yf: number, plFlat: number, plTop: number): number {
  if (!(yf > y1) || y <= y1) return plFlat;
  if (y >= yf) return plTop;
  const t = (y - y1) / (yf - y1);
  return plFlat + (plTop - plFlat) * t * t * t;
}

export function keynesianShape(
  y1: number,
  yf: number,
  plFlat: number,
  plTop: number,
  pMax: number,
): { q: number; p: number }[] {
  const pts: { q: number; p: number }[] = [{ q: 0, p: plFlat }];
  const steps = 36;
  for (let i = 0; i <= steps; i++) {
    const q = y1 + ((yf - y1) * i) / steps;
    pts.push({ q, p: keynesPrice(q, y1, yf, plFlat, plTop) });
  }
  pts.push({ q: yf, p: Math.max(plTop, pMax) });
  return pts;
}

export function adasFrame(result: AdasResult): { qMax: number; pMax: number } {
  const qNeed = Math.max(result.yf, result.y, result.baseYf, 80) * 1.15;
  const prices = [result.pl, result.plFlat, result.plTop, 80];
  if (result.ad.kind === "linear") prices.push(Math.min(result.ad.intercept, 180));
  const pNeed = Math.max(...prices.filter((p) => p > 0), 80);
  return { qMax: snapMax(qNeed), pMax: snapMax(pNeed) };
}
