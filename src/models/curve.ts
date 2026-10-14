export type Curve =
  | { kind: "linear"; intercept: number; slope: number }
  | { kind: "vertical"; q: number }
  | { kind: "horizontal"; p: number };

export function linear(intercept: number, slope: number): { kind: "linear"; intercept: number; slope: number } {
  return { kind: "linear", intercept, slope };
}

export function priceAt(curve: Curve, q: number): number {
  if (curve.kind === "horizontal") return curve.p;
  if (curve.kind === "vertical") return Number.NaN;
  return curve.intercept + curve.slope * q;
}

export function qtyAt(curve: Curve, p: number): number {
  if (curve.kind === "vertical") return curve.q;
  if (curve.kind === "horizontal") return Number.POSITIVE_INFINITY;
  if (Math.abs(curve.slope) < 1e-12) return Number.POSITIVE_INFINITY;
  return (p - curve.intercept) / curve.slope;
}

export function shiftVertical(curve: Curve, dp: number): Curve {
  if (curve.kind !== "linear" || dp === 0) return curve;
  return { kind: "linear", intercept: curve.intercept + dp, slope: curve.slope };
}

/** Curve through (q, p) with the given point elasticity. Demand slope is negative. */
export function curveFromElasticity(
  p: number,
  q: number,
  elasticity: number,
  side: "demand" | "supply",
): Curve {
  const e = Math.max(0.05, Math.abs(elasticity));
  const slope = side === "demand" ? -p / (e * q) : p / (e * q);
  return { kind: "linear", intercept: p - slope * q, slope };
}

export function intersect(a: Curve, b: Curve): { p: number; q: number } | null {
  if (a.kind === "linear" && b.kind === "linear") {
    const denom = a.slope - b.slope;
    if (Math.abs(denom) < 1e-12) return null;
    const q = (b.intercept - a.intercept) / denom;
    const p = a.intercept + a.slope * q;
    return { p, q };
  }
  if (a.kind === "vertical" && b.kind === "linear") {
    return { q: a.q, p: priceAt(b, a.q) };
  }
  if (b.kind === "vertical" && a.kind === "linear") {
    return { q: b.q, p: priceAt(a, b.q) };
  }
  if (a.kind === "horizontal" && b.kind === "linear") {
    return { p: a.p, q: qtyAt(b, a.p) };
  }
  if (b.kind === "horizontal" && a.kind === "linear") {
    return { p: b.p, q: qtyAt(a, b.p) };
  }
  if (a.kind === "horizontal" && b.kind === "vertical") return { p: a.p, q: b.q };
  if (b.kind === "horizontal" && a.kind === "vertical") return { p: b.p, q: a.q };
  return null;
}

export function elasticityAt(curve: Curve, p: number, q: number): number {
  if (curve.kind === "horizontal") return Number.POSITIVE_INFINITY;
  if (curve.kind === "vertical") return 0;
  if (q <= 0 || p <= 0) return Number.NaN;
  return Math.abs((1 / curve.slope) * (p / q));
}

/** Where an upward supply curve meets the quantity axis. Zero when it meets the price axis instead. */
export function supplyAxisIntercept(supply: Curve): number {
  if (supply.kind !== "linear" || !(supply.slope > 0) || !(supply.intercept < 0)) return 0;
  return -supply.intercept / supply.slope;
}

/**
 * Producer surplus is the area below the price producers receive and above their
 * minimum acceptable price. Where the supply curve is below the quantity axis,
 * that minimum is zero, so the area includes the rectangle back to the origin.
 */
export function producerSurplus(supply: Curve, q: number, price: number): number {
  if (supply.kind !== "linear" || !(q > 0) || !(price > 0)) return 0;
  const q0 = Math.min(q, supplyAxisIntercept(supply));
  const above = areaBetween(supply, q0, q, price, false);
  return price * q0 + above;
}

/** Polygon for the same area as producerSurplus, so the shading and the number match. */
export function producerSurplusOutline(supply: Curve, q: number, price: number): { q: number; p: number }[] {
  if (supply.kind !== "linear" || !(q > 0) || !(price > 0)) return [];
  const q0 = supplyAxisIntercept(supply);
  const meet = supply.slope > 1e-12 ? (price - supply.intercept) / supply.slope : q;
  const endQ = Math.min(q, Math.max(q0, meet));
  if (!(endQ > 1e-6)) return [];
  const endP = Math.min(price, Math.max(0, priceAt(supply, endQ)));
  if (q0 > 1e-6 && q0 < endQ) {
    return [
      { q: 0, p: 0 },
      { q: q0, p: 0 },
      { q: endQ, p: endP },
      { q: endQ, p: price },
      { q: 0, p: price },
    ];
  }
  const startP = Math.max(0, Math.min(price, supply.intercept));
  return [
    { q: 0, p: startP },
    { q: endQ, p: endP },
    { q: endQ, p: price },
    { q: 0, p: price },
  ];
}

/** ∫ max(priceOnCurve − level, 0) dq, or the area below the level. Closed form, no recursion. */
export function areaBetween(
  curve: Curve,
  q1: number,
  q2: number,
  level: number,
  aboveLevel: boolean,
): number {
  if (q2 < q1) return areaBetween(curve, q2, q1, level, aboveLevel);
  if (curve.kind !== "linear") return 0;
  if (![q1, q2, level, curve.intercept, curve.slope].every(Number.isFinite)) return 0;
  if (q2 - q1 < 1e-9) return 0;
  const height = (q: number) => {
    const gap = curve.intercept + curve.slope * q - level;
    return aboveLevel ? gap : -gap;
  };
  const h1 = height(q1);
  const h2 = height(q2);
  if (!Number.isFinite(h1) || !Number.isFinite(h2)) return 0;
  if (h1 >= 0 && h2 >= 0) return ((h1 + h2) / 2) * (q2 - q1);
  if (h1 <= 0 && h2 <= 0) return 0;
  const denom = h2 - h1;
  if (Math.abs(denom) < 1e-12) return Math.max(h1, 0) * (q2 - q1);
  const qCross = q1 + ((-h1) / denom) * (q2 - q1);
  if (!(qCross > q1 && qCross < q2)) {
    return (Math.max(h1, 0) + Math.max(h2, 0)) / 2 * (q2 - q1);
  }
  return (Math.max(h1, 0) / 2) * (qCross - q1) + (Math.max(h2, 0) / 2) * (q2 - qCross);
}

export function visibleSegment(
  curve: Curve,
  qMax: number,
  pMax: number,
): { q: number; p: number }[] | null {
  if (curve.kind === "vertical") {
    if (curve.q < 0 || curve.q > qMax) return null;
    return [
      { q: curve.q, p: 0 },
      { q: curve.q, p: pMax },
    ];
  }
  if (curve.kind === "horizontal") {
    if (curve.p < 0 || curve.p > pMax) return null;
    return [
      { q: 0, p: curve.p },
      { q: qMax, p: curve.p },
    ];
  }
  const pts: { q: number; p: number }[] = [];
  const consider = (q: number, p: number) => {
    if (q >= -1e-6 && q <= qMax + 1e-6 && p >= -1e-6 && p <= pMax + 1e-6) {
      pts.push({
        q: Math.min(qMax, Math.max(0, q)),
        p: Math.min(pMax, Math.max(0, p)),
      });
    }
  };
  consider(0, curve.intercept);
  consider(qMax, curve.intercept + curve.slope * qMax);
  if (Math.abs(curve.slope) > 1e-12) {
    consider(-curve.intercept / curve.slope, 0);
    consider((pMax - curve.intercept) / curve.slope, pMax);
  }
  const unique: { q: number; p: number }[] = [];
  for (const pt of pts) {
    if (!unique.some((u) => Math.abs(u.q - pt.q) < 1e-4 && Math.abs(u.p - pt.p) < 1e-4)) {
      unique.push(pt);
    }
  }
  if (unique.length < 2) return null;
  unique.sort((a, b) => a.q - b.q || a.p - b.p);
  return [unique[0], unique[unique.length - 1]];
}
