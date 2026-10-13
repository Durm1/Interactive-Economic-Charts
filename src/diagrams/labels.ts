import type { Scales } from "./frame";
import { num } from "../lib/format";

export type Box = { x: number; y: number; w: number; h: number };
export type Anchor = "start" | "middle" | "end";
export type Candidate = { x: number; y: number; anchor: Anchor };

export function intersects(a: Box, b: Box, pad = 3): boolean {
  return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}

/** Baseline y. Boxes run wider than the glyphs so a near miss still counts. */
export function textBox(x: number, y: number, text: string, anchor: Anchor, font: number): Box {
  const w = Math.max(font, text.length * font * 1.05);
  const left = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  return { x: left, y: y - font * 1.05, w, h: font * 1.45 };
}

export function strokeBoxes(points: { x: number; y: number }[], thickness = 4): Box[] {
  const boxes: Box[] = [];
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i];
    const b = points[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(1, Math.ceil(len / 8));
    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps;
      const x = a.x + (b.x - a.x) * t;
      const y = a.y + (b.y - a.y) * t;
      boxes.push({ x: x - thickness / 2, y: y - thickness / 2, w: thickness, h: thickness });
    }
  }
  return boxes;
}

/** First clear candidate wins, so the habitual side stays until it actually collides. */
export function chooseCandidate(
  text: string,
  candidates: Candidate[],
  occupied: Box[],
  font: number,
  bounds: Box,
): { at: Candidate; box: Box } {
  const options = candidates.slice(0, 4);
  let best = options[0];
  let bestBox = textBox(best.x, best.y, text, best.anchor, font);
  let bestScore = Number.POSITIVE_INFINITY;
  for (const at of options) {
    const box = textBox(at.x, at.y, text, at.anchor, font);
    const overflow =
      Math.max(0, bounds.x - box.x) +
      Math.max(0, bounds.y - box.y) +
      Math.max(0, box.x + box.w - bounds.x - bounds.w) +
      Math.max(0, box.y + box.h - bounds.y - bounds.h);
    const hits = occupied.reduce((count, item) => count + (intersects(box, item) ? 1 : 0), 0);
    const score = overflow * 20 + hits;
    if (score < bestScore) {
      best = at;
      bestBox = box;
      bestScore = score;
    }
    if (score === 0) break;
  }
  occupied.push(bestBox);
  return { at: best, box: bestBox };
}

export function tickBoxes(scales: Scales, values: number[], y: number, unit: number): Box[] {
  const font = 12 * unit;
  return values.map((tick) => textBox(scales.x(tick), y, num(tick, tick >= 100 ? 0 : 1), "middle", font));
}

export function yTickBoxes(scales: Scales, values: number[], unit: number): Box[] {
  const font = 12 * unit;
  const x = scales.x(0) - 8;
  return values.map((tick) => textBox(x, scales.y(tick) + 4, num(tick, tick >= 100 ? 0 : 1), "end", font));
}

export function axisTitleBoxes(scales: Scales, xLabel: string, yLabel: string, unit: number): Box[] {
  const axisY = scales.y(0);
  const xFont = 14 * unit;
  const xBox = textBox(scales.left + scales.plotW - 2, axisY + 34, xLabel, "end", xFont);
  const yFont = 14 * unit;
  const yWidth = Math.max(yFont, yLabel.length * yFont * 0.55);
  const mid = scales.top + scales.plotH / 2;
  return [xBox, { x: 4, y: mid - yWidth / 2, w: yFont * 1.6, h: yWidth }];
}

/** Below the axis first, then above, then a step to either side. At most four. */
export function layoutAxisTags(
  scales: Scales,
  tags: { q: number; label: string }[],
  xTicks: number[],
  options?: { blocked?: Box[]; unit?: number },
): { x: number; y: number; label: string; box: Box }[] {
  const unit = options?.unit ?? 1;
  const font = 15 * unit;
  const axisY = scales.y(0);
  const occupied = [...tickBoxes(scales, xTicks, axisY + 18, unit), ...(options?.blocked ?? [])];
  const bounds = { x: 0, y: 0, w: scales.width, h: scales.height };
  const sorted = tags
    .filter((tag) => Number.isFinite(tag.q) && tag.q >= 0 && tag.q <= scales.qMax)
    .sort((a, b) => a.q - b.q);
  return sorted.map((tag) => {
    const x = scales.x(tag.q);
    const { at, box } = chooseCandidate(
      tag.label,
      [
        { x, y: axisY + 16, anchor: "middle" },
        { x, y: axisY - 8, anchor: "middle" },
        { x: x + 24, y: axisY + 16, anchor: "middle" },
        { x: x - 24, y: axisY + 16, anchor: "middle" },
      ],
      occupied,
      font,
      bounds,
    );
    return { x: at.x, y: at.y, label: tag.label, box };
  });
}

export function placeCallouts(
  notes: { text: string; x: number; y: number }[],
  occupied: Box[],
  font: number,
  lane: { y: number; left: number; right: number },
): { text: string; x: number; y: number; box: Box; targetX: number; targetY: number }[] {
  const placed: { text: string; x: number; y: number; box: Box; targetX: number; targetY: number }[] = [];
  for (const note of notes) {
    const sample = textBox(0, lane.y, note.text, "middle", font);
    const shifts = [0, 1, -1, 2, -2, 3, -3];
    let chosenX = note.x;
    let chosen = textBox(note.x, lane.y, note.text, "middle", font);
    for (const shift of shifts) {
      const trial = Math.min(lane.right - sample.w / 2 - 4, Math.max(lane.left + sample.w / 2 + 4, note.x + shift * (sample.w + 12)));
      const box = textBox(trial, lane.y, note.text, "middle", font);
      if (!occupied.some((item) => intersects(box, item))) {
        chosenX = trial;
        chosen = box;
        break;
      }
    }
    occupied.push(chosen);
    placed.push({ text: note.text, x: chosenX, y: lane.y, box: chosen, targetX: note.x, targetY: note.y });
  }
  return placed;
}

export function isCallout(text: string): boolean {
  return text.includes(" ") || text.length > 4;
}
