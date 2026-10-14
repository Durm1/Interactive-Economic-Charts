import { useEffect, useMemo, useState } from "react";
import { modelChecks } from "./models/checks";
import { labById, sections } from "./labs/registry";
import type { Field, Lab, LabValue, LabValues, Preset } from "./labs/types";
import { Home } from "./Home";
import { LimitsPanel } from "./LimitsPanel";
import bundledLimits from "./slider-limits.json";
import { withLimits, type SliderLimits } from "./sliderLimits";
import "./styles.css";

type State = { labId: string | null; values: LabValues; hide: boolean };

function readState(): State {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("lab");
  if (!requested) return { labId: null, values: {}, hide: false };
  const lab = labById(requested);
  const values: LabValues = { ...lab.initial };
  for (const [key, initial] of Object.entries(lab.initial)) {
    const raw = params.get(key);
    if (raw == null) continue;
    if (typeof initial === "number") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) values[key] = parsed;
    } else if (typeof initial === "boolean") {
      values[key] = raw === "1" || raw === "true";
    } else {
      values[key] = raw;
    }
  }
  return { labId: lab.id, values, hide: params.get("hide") === "1" };
}

function writeUrl(state: State, replace: boolean) {
  if (!state.labId) {
    const next = window.location.pathname;
    if (replace) window.history.replaceState(null, "", next);
    else window.history.pushState(null, "", next);
    return;
  }
  const lab = labById(state.labId);
  const params = new URLSearchParams();
  params.set("lab", lab.id);
  if (state.hide) params.set("hide", "1");
  for (const [key, initial] of Object.entries(lab.initial)) {
    const value = state.values[key];
    if (value === undefined || value === initial) continue;
    params.set(key, typeof value === "boolean" ? (value ? "1" : "0") : String(value));
  }
  const next = `${window.location.pathname}?${params.toString()}`;
  if (replace) window.history.replaceState(null, "", next);
  else window.history.pushState(null, "", next);
}

function decimalPlaces(step: number): number {
  const text = String(step);
  const dot = text.indexOf(".");
  return dot === -1 ? 0 : text.length - dot - 1;
}

/** Keep each number in a fixed-width slot so a longer digit does not reflow the sentence. */
function stableFigures(text: string) {
  const parts = text.split(/(-?\d+\.\d+)/g);
  return parts.map((part, index) => {
    if (!/^-?\d+\.\d+$/.test(part)) return part;
    return (
      <span key={index} className="stable-num">
        {Number(part).toFixed(2)}
      </span>
    );
  });
}

function matches(lab: Lab, values: LabValues, preset: Preset): boolean {
  const merged = { ...lab.initial, ...preset.values };
  return Object.keys(lab.initial).every((key) => values[key] === merged[key]);
}

export function App() {
  const [state, setState] = useState<State>(readState);
  const [limits, setLimits] = useState<SliderLimits>(bundledLimits as SliderLimits);
  const [editingLimits, setEditingLimits] = useState(false);
  const lab = state.labId ? labById(state.labId) : null;
  const checks = useMemo(() => modelChecks(), []);
  const fields = lab ? withLimits(lab.id, lab.fields(state.values), limits) : [];
  const view = useMemo(() => {
    if (!lab) return null;
    try {
      return lab.build(state.values, state.hide);
    } catch {
      return {
        diagram: null,
        readouts: [],
        english: "These parameter values cannot be drawn. Move PED and PES back toward 1.",
        chinese: "这组弹性画不出来。把 PED 和 PES 调回 1 附近。",
      };
    }
  }, [lab, state.values, state.hide]);

  useEffect(() => {
    const onPop = () => setState(readState());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    fetch("/api/slider-limits")
      .then((response) => (response.ok ? response.json() : null))
      .then((saved: unknown) => {
        if (saved && typeof saved === "object") setLimits(saved as SliderLimits);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const nextValues = { ...state.values };
    let changed = false;
    for (const field of fields) {
      if (field.kind !== "slider") continue;
      const value = Number(nextValues[field.key]);
      if (!Number.isFinite(value)) continue;
      const clamped = Math.min(field.max, Math.max(field.min, value));
      if (clamped !== value) {
        nextValues[field.key] = clamped;
        changed = true;
      }
    }
    if (changed) commit({ ...state, values: nextValues }, true);
  }, [fields, state]);

  function commit(next: State, replace: boolean) {
    setState(next);
    writeUrl(next, replace);
  }

  function selectLab(id: string) {
    const nextLab = labById(id);
    commit({ labId: nextLab.id, values: { ...nextLab.initial }, hide: false }, false);
  }

  function goHome() {
    commit({ labId: null, values: {}, hide: false }, false);
  }

  function setValue(key: string, value: LabValue) {
    if (!lab) return;
    const merged = { ...state.values, [key]: value };
    const values = lab.onChange ? lab.onChange(key, merged) : merged;
    commit({ ...state, values }, true);
  }

  function applyPreset(preset: Preset) {
    if (!lab) return;
    commit({ ...state, values: { ...lab.initial, ...preset.values }, hide: false }, true);
  }

  function resetValues() {
    if (!lab) return;
    commit({ ...state, values: { ...lab.initial }, hide: false }, true);
  }

  function renderFields(fields: Field[]) {
    return fields.map((field) => {
      if (field.kind === "slider") {
        const value = Number(state.values[field.key]);
        return (
          <label key={field.key} className="field">
            <span>
              {field.label}
              <b>{Number.isFinite(value) ? value.toFixed(decimalPlaces(field.step)) : ""}</b>
            </span>
            <span className="slider">
              <input
              type="range"
              key={`${field.key}:${field.min}:${field.max}:${field.step}`}
              min={field.min}
                max={field.max}
                step={field.step}
                value={Number.isFinite(value) ? value : field.min}
                onChange={(event) => setValue(field.key, Number(event.target.value))}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                  event.preventDefault();
                  const direction = event.key === "ArrowRight" ? 1 : -1;
                  const current = Number.isFinite(value) ? value : field.min;
                  const places = decimalPlaces(field.step);
                  const next = Math.min(field.max, Math.max(field.min, current + direction * field.step));
                  setValue(field.key, Number(next.toFixed(places)));
                }}
              />
            </span>
          </label>
        );
      }
      if (field.kind === "number") {
        return (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <input
              type="number"
              min={field.min}
              max={field.max}
              step={field.step}
              value={Number(state.values[field.key])}
              onChange={(event) => setValue(field.key, Number(event.target.value))}
            />
          </label>
        );
      }
      if (field.kind === "select") {
        return (
          <label key={field.key} className="field">
            <span>{field.label}</span>
            <select value={String(state.values[field.key])} onChange={(event) => setValue(field.key, event.target.value)}>
              {field.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        );
      }
      return (
        <label key={field.key} className="check">
          <input type="checkbox" checked={state.values[field.key] === true} onChange={(event) => setValue(field.key, event.target.checked)} />
          {field.label}
        </label>
      );
    });
  }

  if (!lab || !view) return <Home onOpen={selectLab} />;

  return (
    <div className="app">
      <aside className="sidebar">
        <header className="brand">
          <p className="eyebrow">CIE 9708 · AS Level</p>
          <button type="button" className="brand-home" onClick={goHome}>
            <h1>Interactive diagrams</h1>
          </button>
          <p className="brand-zh">按 2026–2028 考纲把标准图做成可调参数的实验。</p>
        </header>
        <nav>
          {sections.map((section) => (
            <div key={section.title} className="nav-section">
              <h2>{section.title}</h2>
              <p>{section.chinese}</p>
              {section.ids.map((id) => {
                const item = labById(id);
                return (
                  <button key={id} className={id === lab.id ? "nav-item active" : "nav-item"} onClick={() => selectLab(id)}>
                    <span>{item.title}</span>
                    <small>{item.code}</small>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </aside>
      <main className="stage">
        <header className="stage-head">
          <div>
            <p className="eyebrow">{lab.code}</p>
            <h2>{lab.title}</h2>
            <p className="chinese-title">{lab.chinese}</p>
          </div>
          <div className="stage-actions">
            <button className="reset" type="button" onClick={goHome}>
              All diagrams
            </button>
            {import.meta.env.DEV ? (
              <button className="reset" type="button" onClick={() => setEditingLimits((open) => !open)}>
                Limits
              </button>
            ) : null}
            <button className="reset" type="button" onClick={resetValues}>
              Reset to default
            </button>
            <button className="reveal" type="button" onClick={() => commit({ ...state, hide: !state.hide }, true)}>
              {state.hide ? "Reveal" : "Hide the result"}
            </button>
          </div>
        </header>
        {editingLimits ? (
          <LimitsPanel labId={lab.id} fields={lab.fields(state.values)} limits={limits} onSaved={setLimits} />
        ) : null}
        <div className="stage-body">
          {checks.length > 0 ? <p className="checks">Model check failed: {checks.join("; ")}</p> : null}
          <div className="canvas">{view.diagram}</div>
          {view.legend && view.legend.length > 0 && !state.hide ? (
            <ul className="legend">
              {view.legend.map((item) => (
                <li key={item.name}>
                  <i className={item.dashed ? "dashed" : undefined} style={item.dashed ? undefined : { background: item.color }} />
                  {item.name}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="parameter-bar">{renderFields(fields)}</div>
        <footer className="explain">
          {state.hide ? (
            <>
              <p className="english">The curves are drawn. Predict the new equilibrium, then reveal the labels, areas and numbers.</p>
              <p className="chinese">曲线已经画出。先判断新的均衡，再揭晓标签、面积和数字。</p>
            </>
          ) : (
            <>
              <p className="english">{stableFigures(view.english)}</p>
              <p className="chinese">{stableFigures(view.chinese)}</p>
            </>
          )}
        </footer>
      </main>
      <aside className="controls">
        <section>
          <h3>Presets</h3>
          <div className="presets">
            {lab.presets.map((preset) => (
              <button key={preset.id} className={matches(lab, state.values, preset) ? "preset active" : "preset"} onClick={() => applyPreset(preset)}>
                <strong>{preset.label}</strong>
                <span>{preset.detail}</span>
              </button>
            ))}
          </div>
        </section>
        <section>
          <h3>Readings</h3>
          <dl className="readouts">
            {view.readouts.map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{state.hide ? "—" : row.value}</dd>
              </div>
            ))}
          </dl>
        </section>
        <section className="pitfall">
          <h3>Examiner pitfall</h3>
          <p>{lab.pitfall.en}</p>
          <p className="chinese">{lab.pitfall.zh}</p>
        </section>
      </aside>
    </div>
  );
}
