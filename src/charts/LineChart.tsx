import { useState, type ReactNode } from 'react';
import { fmtSecTick, niceTicks, quantile, spacedIndices, useWidth } from './util';

export interface Series {
  name: string;
  color: string;
  /** Values in ms, one per x index; null/Infinity leave a gap. */
  values: (number | null)[];
  width?: number;
  markers?: boolean;
}

interface Props {
  n: number;
  series: Series[];
  /** Optional faint scatter layer (e.g. every single solve), values in ms. */
  scatter?: (number | null)[];
  xLabel: (i: number) => string;
  tooltip: (i: number) => ReactNode;
  height?: number;
  /** Clip extreme outliers so they don't flatten the chart. */
  clipOutliers?: boolean;
}

const M = { top: 10, right: 12, bottom: 26, left: 44 };

export function LineChart({ n, series, scatter, xLabel, tooltip, height = 280, clipOutliers }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const iw = width - M.left - M.right;
  const ih = height - M.top - M.bottom;

  const all: number[] = [];
  for (const s of series) for (const v of s.values) if (v !== null && isFinite(v)) all.push(v / 1000);
  if (scatter) for (const v of scatter) if (v !== null && isFinite(v)) all.push(v / 1000);
  all.sort((a, b) => a - b);
  let lo = all.length ? all[0] : 0;
  let hi = all.length ? all[all.length - 1] : 1;
  if (clipOutliers && all.length > 20) {
    hi = Math.min(hi, quantile(all, 0.98) * 1.25);
    lo = Math.max(lo, quantile(all, 0.02) * 0.75);
  }
  const pad = (hi - lo) * 0.06 || 1;
  lo = Math.max(0, lo - pad);
  hi = hi + pad;
  const ticks = niceTicks(lo, hi, 5);

  const x = (i: number) => M.left + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (ms: number) => {
    const sec = Math.min(hi, Math.max(lo, ms / 1000));
    return M.top + ih - ((sec - lo) / (hi - lo)) * ih;
  };

  const linePath = (vals: (number | null)[]) => {
    let d = '';
    let pen = false;
    vals.forEach((v, i) => {
      if (v === null || !isFinite(v)) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };

  const r = n > 2000 ? 1.4 : n > 400 ? 1.9 : 2.6;
  let dots = '';
  if (scatter)
    scatter.forEach((v, i) => {
      if (v === null || !isFinite(v)) return;
      const cx = x(i);
      const cy = y(v);
      dots += `M${(cx - r).toFixed(1)},${cy.toFixed(1)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
    });

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
    const px = e.clientX - rect.left;
    const i = n <= 1 ? 0 : Math.round(((px - M.left) / iw) * (n - 1));
    setHover(Math.max(0, Math.min(n - 1, i)));
  };

  const xTicks = spacedIndices(n, Math.max(2, Math.floor(iw / 110)));
  const hx = hover !== null ? x(hover) : 0;

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img">
        <g className="grid">
          {ticks.map((t) => (
            <line key={t} x1={M.left} x2={width - M.right} y1={y(t * 1000)} y2={y(t * 1000)} />
          ))}
        </g>
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={M.left - 8} y={y(t * 1000)} dy="0.32em" textAnchor="end">
              {fmtSecTick(t)}
            </text>
          ))}
          {xTicks.map((i, k) => (
            <text key={i} x={x(i)} y={height - 6} textAnchor={k === 0 && xTicks.length > 1 ? 'start' : k === xTicks.length - 1 && xTicks.length > 1 ? 'end' : 'middle'}>
              {xLabel(i)}
            </text>
          ))}
        </g>
        {dots && <path d={dots} fill="var(--muted)" fillOpacity={n > 2000 ? 0.18 : 0.28} />}
        {series.map((s) => (
          <g key={s.name}>
            <path d={linePath(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeLinejoin="round" strokeLinecap="round" />
            {s.markers &&
              s.values.map((v, i) =>
                v === null || !isFinite(v) ? null : (
                  <circle key={i} cx={x(i)} cy={y(v)} r={4} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                ),
              )}
          </g>
        ))}
        {hover !== null && (
          <g pointerEvents="none">
            <line x1={hx} x2={hx} y1={M.top} y2={M.top + ih} stroke="var(--faint)" strokeDasharray="3 3" />
            {scatter && scatter[hover] !== null && isFinite(scatter[hover] as number) && (
              <circle cx={hx} cy={y(scatter[hover] as number)} r={5} fill="var(--text)" stroke="var(--surface)" strokeWidth={2} />
            )}
            {series.map((s) => {
              const v = s.values[hover];
              return v === null || !isFinite(v) ? null : (
                <circle key={s.name} cx={hx} cy={y(v)} r={4.5} fill={s.color} stroke="var(--surface)" strokeWidth={2} />
              );
            })}
          </g>
        )}
        <rect
          x={M.left}
          y={M.top}
          width={Math.max(0, iw)}
          height={ih}
          fill="transparent"
          onPointerMove={onMove}
          onPointerDown={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
      {hover !== null && (
        <div
          className="tip"
          style={{
            top: M.top,
            ...(hx > width * 0.6 ? { right: width - hx + 12 } : { left: hx + 12 }),
          }}
        >
          {tooltip(hover)}
        </div>
      )}
    </div>
  );
}
