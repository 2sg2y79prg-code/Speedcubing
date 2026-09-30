import { useState, type ReactNode } from 'react';
import { niceTicks, spacedIndices, useWidth } from './util';

export interface Bar {
  key: string;
  label: string;
  value: number;
  tip: ReactNode;
  highlight?: boolean;
}

const M = { top: 10, right: 8, bottom: 26, left: 36 };

export function BarChart({ data, height = 220, color = 'var(--text)' }: { data: Bar[]; height?: number; color?: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const iw = width - M.left - M.right;
  const ih = height - M.top - M.bottom;
  const max = Math.max(1, ...data.map((d) => d.value));
  const ticks = niceTicks(0, max, 4).filter((t) => Number.isInteger(t));
  const top = Math.max(max, ticks[ticks.length - 1] ?? max);
  const band = data.length ? iw / data.length : iw;
  const gap = band > 6 ? 2 : band > 3 ? 1 : 0;
  const bw = Math.max(1, band - gap);
  const y = (v: number) => M.top + ih - (v / top) * ih;
  const xTicks = spacedIndices(data.length, Math.max(2, Math.floor(iw / 90)));
  const rr = Math.min(4, bw / 2);

  const barPath = (x0: number, v: number) => {
    const y0 = y(v);
    const h = M.top + ih - y0;
    if (h <= 0) return '';
    const r = Math.min(rr, h);
    return `M${x0},${M.top + ih}V${y0 + r}q0,${-r} ${r},${-r}h${bw - 2 * r}q${r},0 ${r},${r}V${M.top + ih}Z`;
  };

  return (
    <div className="chart" ref={ref}>
      <svg width={width} height={height} role="img">
        <g className="grid">
          {ticks.map((t) => (
            <line key={t} x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} />
          ))}
        </g>
        <g className="axis">
          {ticks.map((t) => (
            <text key={t} x={M.left - 8} y={y(t)} dy="0.32em" textAnchor="end">
              {t}
            </text>
          ))}
          {xTicks.map((i) => (
            <text key={i} x={M.left + i * band + bw / 2} y={height - 6} textAnchor="middle">
              {data[i].label}
            </text>
          ))}
        </g>
        {data.map((d, i) => (
          <path
            key={d.key}
            d={barPath(M.left + i * band + gap / 2, d.value)}
            fill={d.highlight ? 'var(--accent)' : color}
            fillOpacity={hover === null || hover === i ? (d.highlight ? 1 : 0.78) : 0.35}
            style={{ transition: 'fill-opacity 150ms' }}
          />
        ))}
        {data.map((d, i) => (
          <rect
            key={d.key}
            x={M.left + i * band}
            y={M.top}
            width={band}
            height={ih}
            fill="transparent"
            onPointerEnter={() => setHover(i)}
            onPointerDown={() => setHover(i)}
            onPointerLeave={() => setHover(null)}
          />
        ))}
      </svg>
      {hover !== null && data[hover] && (
        <div
          className="tip"
          style={{
            top: Math.max(0, y(data[hover].value) - 56),
            ...(M.left + hover * band > width * 0.6
              ? { right: width - (M.left + hover * band) + 6 }
              : { left: M.left + (hover + 1) * band + 6 }),
          }}
        >
          {data[hover].tip}
        </div>
      )}
    </div>
  );
}
