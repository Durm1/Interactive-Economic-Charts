import type { ReactNode } from "react";

export type LabValue = number | string | boolean;
export type LabValues = Record<string, LabValue>;

export type Field =
  | { kind: "slider"; key: string; label: string; min: number; max: number; step: number }
  | { kind: "select"; key: string; label: string; options: { value: string; label: string }[] }
  | { kind: "toggle"; key: string; label: string }
  | { kind: "number"; key: string; label: string; min: number; max: number; step: number };

export type Preset = {
  id: string;
  label: string;
  detail: string;
  values: LabValues;
};

export type LabView = {
  diagram: ReactNode;
  legend?: { name: string; color: string; dashed?: boolean }[];
  readouts: { label: string; value: string }[];
  english: string;
  chinese: string;
};

export type Lab = {
  id: string;
  code: string;
  title: string;
  chinese: string;
  pitfall: { en: string; zh: string };
  initial: LabValues;
  presets: Preset[];
  fields: (values: LabValues) => Field[];
  onChange?: (key: string, values: LabValues) => LabValues;
  build: (values: LabValues, hide: boolean) => LabView;
};

export function numOf(values: LabValues, key: string): number {
  const value = values[key];
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function strOf(values: LabValues, key: string): string {
  return String(values[key] ?? "");
}

export function boolOf(values: LabValues, key: string): boolean {
  return values[key] === true;
}

export const pedField: Field = {
  kind: "slider",
  key: "ped",
  label: "PED at the initial equilibrium",
  min: 0.1,
  max: 6,
  step: 0.1,
};

export const pesField: Field = {
  kind: "slider",
  key: "pes",
  label: "PES at the initial equilibrium",
  min: 0.1,
  max: 6,
  step: 0.1,
};
