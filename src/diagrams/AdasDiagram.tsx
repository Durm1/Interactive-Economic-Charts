import { visibleSegment } from "../models/curve";
import { adasFrame, keynesianShape, type AdasResult } from "../models/adas";
import { ChartFrame, placeAxisTags, poly } from "./frame";

const curveStroke = 1.45;
const ghostStroke = 1.1;

export function AdasDiagram({ result, aria }: { result: AdasResult; aria: string }) {
  const frame = adasFrame(result);
  const adMoved = result.ad.kind === "linear" && result.baseAd.kind === "linear" && Math.abs(result.ad.intercept - result.baseAd.intercept) > 0.05;
  const srasMoved =
    result.sras?.kind === "linear" &&
    result.baseSras?.kind === "linear" &&
    Math.abs(result.sras.intercept - result.baseSras.intercept) > 0.05;

  return (
    <ChartFrame qMax={frame.qMax} pMax={frame.pMax} xLabel="Real GDP" yLabel="Price level" aria={aria}>
      {(scales, _marker, clipId) => {
        const ad = result.ad.kind === "linear" ? visibleSegment(result.ad, frame.qMax, frame.pMax) : null;
        const baseAd = adMoved && result.baseAd.kind === "linear" ? visibleSegment(result.baseAd, frame.qMax, frame.pMax) : null;
        const sras = result.sras?.kind === "linear" ? visibleSegment(result.sras, frame.qMax, frame.pMax) : null;
        const baseSras = srasMoved && result.baseSras?.kind === "linear" ? visibleSegment(result.baseSras, frame.qMax, frame.pMax) : null;
        const keynesian = result.mode === "keynesian"
          ? keynesianShape(result.y1, result.yf, result.plFlat, result.plTop, frame.pMax)
          : null;
        return (
          <>
            <g clipPath={`url(#${clipId})`}>
              {baseAd ? <path d={poly(scales, baseAd)} fill="none" stroke="#b7b1a6" strokeWidth={ghostStroke} strokeDasharray="6 4" /> : null}
              {baseSras ? <path d={poly(scales, baseSras)} fill="none" stroke="#b7b1a6" strokeWidth={ghostStroke} strokeDasharray="6 4" /> : null}
              {result.mode === "vertical" && result.yf !== result.baseYf ? (
                <line x1={scales.x(result.baseYf)} x2={scales.x(result.baseYf)} y1={scales.y(0)} y2={scales.y(frame.pMax)} stroke="#b7b1a6" strokeDasharray="6 4" />
              ) : null}
              {result.mode === "vertical" ? (
                <line x1={scales.x(result.yf)} x2={scales.x(result.yf)} y1={scales.y(0)} y2={scales.y(frame.pMax)} stroke="#1c1915" strokeWidth={curveStroke} />
              ) : null}
              {keynesian ? <path d={poly(scales, keynesian)} fill="none" stroke="#1c1915" strokeWidth={curveStroke} /> : null}
              {sras ? <path d={poly(scales, sras)} fill="none" stroke="#1c1915" strokeWidth={curveStroke} /> : null}
              {ad ? <path d={poly(scales, ad)} fill="none" stroke="#1c1915" strokeWidth={curveStroke} /> : null}
              <line x1={scales.x(0)} y1={scales.y(result.pl)} x2={scales.x(result.y)} y2={scales.y(result.pl)} stroke="#1c1915" strokeDasharray="4 4" />
              <line x1={scales.x(result.y)} y1={scales.y(0)} x2={scales.x(result.y)} y2={scales.y(result.pl)} stroke="#1c1915" strokeDasharray="4 4" />
            </g>
            {result.mode === "vertical" ? (
              <text x={scales.x(result.yf) + 8} y={scales.y(frame.pMax * 0.82)} className="curve-label">{result.yf === result.baseYf ? "LRAS" : "LRAS1"}</text>
            ) : (
              <text x={scales.x(result.y1 * 0.35)} y={scales.y(result.plFlat) - 8} className="curve-label">AS</text>
            )}
            {sras ? <text x={scales.x(sras[1].q) - 46} y={scales.y(sras[1].p) - 8} className="curve-label">{srasMoved ? "SRAS1" : "SRAS"}</text> : null}
            {ad ? <text x={scales.x(ad[0].q) + 78} y={scales.y(ad[0].p) + 16} className="curve-label">{adMoved ? "AD1" : "AD"}</text> : null}
            {baseAd ? <text x={scales.x(baseAd[0].q) + 12} y={scales.y(baseAd[0].p) - 6} className="curve-label ghost">AD</text> : null}
            <circle cx={scales.x(result.y)} cy={scales.y(result.pl)} r="4.2" fill="#1c1915" />
            <text x={scales.x(result.y) + 8} y={scales.y(result.pl) - 8} className="curve-label">E</text>
            {Math.abs(result.y - result.yf) > 1.5
              ? placeAxisTags(scales, [
                  { q: result.y, label: "Y" },
                  { q: result.yf, label: "Yf" },
                ]).map((tag) => (
                  <g key={tag.label}>
                    <rect x={tag.box.x - 2} y={tag.box.y - 1} width={tag.box.w + 4} height={tag.box.h + 2} fill="#fff" />
                    <text x={tag.x} y={tag.y} textAnchor="middle" className="curve-label">{tag.label}</text>
                  </g>
                ))
              : null}
          </>
        );
      }}
    </ChartFrame>
  );
}
