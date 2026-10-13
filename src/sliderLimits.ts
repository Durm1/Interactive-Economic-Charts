import type { Field } from "./labs/types";

export type SliderBound = { min: number; max: number };
export type SliderLimits = Record<string, Record<string, SliderBound>>;

export function isSliderLimits(value: unknown): value is SliderLimits {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  for (const lab of Object.values(value)) {
    if (!lab || typeof lab !== "object" || Array.isArray(lab)) return false;
    for (const bound of Object.values(lab)) {
      if (!bound || typeof bound !== "object") return false;
      const { min, max } = bound as { min?: unknown; max?: unknown };
      if (typeof min !== "number" || typeof max !== "number") return false;
      if (!Number.isFinite(min) || !Number.isFinite(max) || !(min < max)) return false;
    }
  }
  return true;
}

export function withLimits(labId: string, fields: Field[], limits: SliderLimits): Field[] {
  const saved = limits[labId];
  if (!saved) return fields;
  return fields.map((field) => {
    if (field.kind !== "slider") return field;
    const bound = saved[field.key];
    if (!bound) return field;
    return { ...field, min: bound.min, max: bound.max };
  });
}
