export function num(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const factor = 10 ** digits;
  const rounded = Math.round(n * factor) / factor;
  if (Object.is(rounded, -0)) return "0";
  return String(rounded);
}

export function signed(n: number, digits = 2): string {
  const text = num(Math.abs(n), digits);
  if (!Number.isFinite(n) || Math.abs(n) < 10 ** -(digits + 1)) return "0";
  return n > 0 ? `+${text}` : `−${text}`;
}
