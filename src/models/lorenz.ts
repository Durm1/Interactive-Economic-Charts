/** Lorenz curve L(p) = p^k. Gini = (k − 1) / (k + 1). Calculation is shown only as a reading. */
export function lorenzY(populationShare: number, k: number): number {
  return populationShare ** k;
}

export function giniFromK(k: number): number {
  return (k - 1) / (k + 1);
}

export function kFromInequality(inequality: number): number {
  const t = Math.min(0.92, Math.max(0.02, inequality));
  return (1 + t) / (1 - t);
}

export function lorenzSamples(k: number, steps = 40): { x: number; y: number }[] {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const x = i / steps;
    pts.push({ x, y: lorenzY(x, k) });
  }
  return pts;
}
