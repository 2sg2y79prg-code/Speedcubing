import { useEffect, useRef, useState } from 'react';

export function useWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(200, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w];
}

/** "Nice" tick values covering [lo, hi]. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!isFinite(lo) || !isFinite(hi)) return [];
  if (hi === lo) {
    hi = lo + 1;
    lo = Math.max(0, lo - 1);
  }
  const raw = (hi - lo) / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? raw;
  const start = Math.ceil(lo / step) * step;
  const out: number[] = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Number(v.toFixed(6)));
  return out;
}

export function fmtSecTick(sec: number): string {
  if (sec >= 60) {
    const m = Math.floor(sec / 60);
    const s = Math.round(sec - m * 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return Number.isInteger(sec) ? String(sec) : sec.toFixed(1);
}

export function quantile(sorted: number[], q: number): number {
  if (!sorted.length) return NaN;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** Pick ~n evenly spaced indices in [0, len). */
export function spacedIndices(len: number, n: number): number[] {
  if (len <= 0) return [];
  if (len <= n) return Array.from({ length: len }, (_, i) => i);
  const out: number[] = [];
  for (let k = 0; k < n; k++) out.push(Math.round((k * (len - 1)) / (n - 1)));
  return [...new Set(out)];
}
