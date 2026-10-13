import { useEffect, useState } from "react";
import type { Field } from "./labs/types";
import type { SliderLimits } from "./sliderLimits";

type Draft = Record<string, { min: string; max: string }>;

export function LimitsPanel({
  labId,
  fields,
  limits,
  onSaved,
}: {
  labId: string;
  fields: Field[];
  limits: SliderLimits;
  onSaved: (next: SliderLimits) => void;
}) {
  const sliders = fields.filter((field) => field.kind === "slider");
  const signature = sliders.map((field) => (field.kind === "slider" ? `${field.key}:${field.min}:${field.max}` : "")).join("|");
  const [draft, setDraft] = useState<Draft>({});
  const [status, setStatus] = useState("");

  useEffect(() => {
    const next: Draft = {};
    for (const field of fields) {
      if (field.kind !== "slider") continue;
      const saved = limits[labId]?.[field.key];
      next[field.key] = { min: String(saved?.min ?? field.min), max: String(saved?.max ?? field.max) };
    }
    setDraft(next);
  }, [labId, signature, limits]);

  useEffect(() => {
    setStatus("");
  }, [labId]);

  async function save(nextLimits: SliderLimits) {
    setStatus("Saving…");
    try {
      const response = await fetch("/api/slider-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextLimits),
      });
      if (!response.ok) {
        setStatus(await response.text());
        return;
      }
      onSaved(nextLimits);
      setStatus("Saved");
    } catch {
      setStatus("Save failed. Restart the dev server and try again.");
    }
  }

  function buildNext(): SliderLimits | null {
    const lab = { ...(limits[labId] ?? {}) };
    for (const field of fields) {
      if (field.kind !== "slider") continue;
      const row = draft[field.key];
      if (!row) continue;
      const min = Number(row.min);
      const max = Number(row.max);
      if (!Number.isFinite(min) || !Number.isFinite(max) || !(min < max)) return null;
      if (min === field.min && max === field.max) delete lab[field.key];
      else lab[field.key] = { min, max };
    }
    const next = { ...limits };
    if (Object.keys(lab).length === 0) delete next[labId];
    else next[labId] = lab;
    return next;
  }

  const next = buildNext();

  return (
    <form
      className="limits"
      onSubmit={(event) => {
        event.preventDefault();
        if (next) void save(next);
      }}
    >
      <div className="limits-head">
        <h3>Slider limits</h3>
        <p>Saved in the project, so the next run keeps these ranges.</p>
      </div>
      {fields.map((field) => {
        if (field.kind !== "slider") return null;
        const row = draft[field.key] ?? { min: String(field.min), max: String(field.max) };
        return (
          <label key={field.key} className="limits-row">
            <span>{field.label}</span>
            <input
              type="number"
              aria-label={`${field.label} minimum`}
              value={row.min}
              step="any"
              onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: { ...row, min: event.target.value } }))}
            />
            <input
              type="number"
              aria-label={`${field.label} maximum`}
              value={row.max}
              step="any"
              onChange={(event) => setDraft((prev) => ({ ...prev, [field.key]: { ...row, max: event.target.value } }))}
            />
          </label>
        );
      })}
      <div className="limits-actions">
        <button className="reveal" type="submit" disabled={!next}>
          Save
        </button>
        <button
          className="reset"
          type="button"
          onClick={() => {
            const cleared = { ...limits };
            delete cleared[labId];
            const blank: Draft = {};
            for (const field of fields) {
              if (field.kind === "slider") blank[field.key] = { min: String(field.min), max: String(field.max) };
            }
            setDraft(blank);
            void save(cleared);
          }}
        >
          Use defaults
        </button>
        <span>{status}</span>
      </div>
    </form>
  );
}
