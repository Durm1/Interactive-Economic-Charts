type FlowProps = {
  open: boolean;
  investment: number;
  government: number;
  exports: number;
  saving: number;
  tax: number;
  imports: number;
};

export function FlowDiagram({ open, investment, government, exports, saving, tax, imports }: FlowProps) {
  const injections = investment + government + (open ? exports : 0);
  const leakages = saving + tax + (open ? imports : 0);
  const gap = injections - leakages;
  return (
    <svg viewBox="0 0 700 420" role="img" aria-label="Circular flow of income" className="chart">
      <rect width="700" height="420" fill="#fff" />
      <rect x="70" y="150" width="170" height="78" fill="#fff" stroke="#1c1915" strokeWidth="1.6" />
      <rect x="460" y="150" width="170" height="78" fill="#fff" stroke="#1c1915" strokeWidth="1.6" />
      <text x="155" y="184" textAnchor="middle" className="curve-label">Households</text>
      <text x="155" y="206" textAnchor="middle" className="note-label">S {saving} · T {tax}{open ? ` · M ${imports}` : ""}</text>
      <text x="545" y="184" textAnchor="middle" className="curve-label">Firms</text>
      <text x="545" y="206" textAnchor="middle" className="note-label">I {investment} · G {government}{open ? ` · X ${exports}` : ""}</text>
      <path d="M430 168 H240" fill="none" stroke="#1c1915" strokeWidth="1.5" markerEnd="url(#flow)" />
      <text x="335" y="158" textAnchor="middle" className="note-label">income</text>
      <path d="M240 210 H430" fill="none" stroke="#1c1915" strokeWidth="1.5" markerEnd="url(#flow)" />
      <text x="335" y="232" textAnchor="middle" className="note-label">expenditure</text>
      <rect x="280" y="28" width="140" height="52" fill="#fff" stroke="#1c1915" />
      <text x="350" y="58" textAnchor="middle" className="curve-label">Government</text>
      <path d="M330 150 V80" fill="none" stroke="#1c1915" markerEnd="url(#flow)" />
      <text x="338" y="118" className="note-label">T</text>
      <path d="M390 80 V150" fill="none" stroke="#1c1915" markerEnd="url(#flow)" />
      <text x="396" y="118" className="note-label">G</text>
      {open ? (
        <>
          <rect x="280" y="300" width="140" height="52" fill="#fff" stroke="#1c1915" />
          <text x="350" y="330" textAnchor="middle" className="curve-label">Overseas</text>
          <path d="M300 228 V300" fill="none" stroke="#1c1915" markerEnd="url(#flow)" />
          <text x="306" y="270" className="note-label">M</text>
          <path d="M400 300 V228" fill="none" stroke="#1c1915" markerEnd="url(#flow)" />
          <text x="406" y="270" className="note-label">X</text>
        </>
      ) : (
        <text x="350" y="330" textAnchor="middle" className="note-label">Closed economy: no X or M</text>
      )}
      <text x="350" y="390" textAnchor="middle" className="curve-label">
        Injections {injections} {gap === 0 ? "=" : gap > 0 ? ">" : "<"} leakages {leakages}
      </text>
      <defs>
        <marker id="flow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L7,3 L0,6 Z" fill="#1c1915" />
        </marker>
      </defs>
    </svg>
  );
}
