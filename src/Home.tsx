import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { labById, sections } from "./labs/registry";
import type { Lab } from "./labs/types";

const PREVIEW_WIDTH = 760;

export function Home({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="home">
      <header className="home-head">
        <h1>Interactive diagrams</h1>
        <p>CIE 9708 AS, 2026–2028. Open a diagram, then move the parameters and watch the model change.</p>
        <p className="chinese">先选一张图，再调参数，看模型怎么变。</p>
      </header>
      {sections.map((section) => (
        <section key={section.title} className="home-section">
          <div className="home-section-head">
            <h2>{section.title}</h2>
            <p>{section.chinese}</p>
          </div>
          <div className="home-grid">
            {section.ids.map((id) => (
              <LabCard key={id} lab={labById(id)} onOpen={onOpen} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function LabCard({ lab, onOpen }: { lab: Lab; onOpen: (id: string) => void }) {
  const preview = useMemo(() => {
    try {
      return lab.build(lab.initial, false).diagram;
    } catch {
      return null;
    }
  }, [lab]);

  return (
    <button type="button" className="lab-card" aria-label={`${lab.title}. ${lab.chinese}. ${lab.code}`} onClick={() => onOpen(lab.id)}>
      <CardPreview>{preview}</CardPreview>
      <span className="card-copy">
        <strong>{lab.title}</strong>
        <span className="card-meta">
          <span>{lab.chinese}</span>
          <span>{lab.code}</span>
        </span>
      </span>
    </button>
  );
}

function CardPreview({ children }: { children: ReactNode }) {
  const frame = useRef<HTMLSpanElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = frame.current;
    if (!el) return;
    const fit = () => {
      const width = el.clientWidth;
      setScale(width > 0 ? width / PREVIEW_WIDTH : null);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <span className="card-preview" ref={frame} aria-hidden="true">
      <span
        className="card-scale"
        style={scale == null ? undefined : { transform: `scale(${scale})` }}
      >
        {children}
      </span>
    </span>
  );
}
