import type { Penalty, Solve } from './types';

/** A DNF is represented as +Infinity so it always sorts as the worst time. */
export const DNF = Number.POSITIVE_INFINITY;

export function effectiveTime(s: { timeMs: number; penalty: Penalty }): number {
  if (s.penalty === 'DNF') return DNF;
  return s.penalty === '+2' ? s.timeMs + 2000 : s.timeMs;
}

/** Number of results trimmed from EACH end of an aoN: 1 for ao5/ao12, 5% for larger (ao100 -> 5). */
export function trimCount(n: number): number {
  if (n < 3) return 0;
  return Math.ceil(n * 0.05);
}

/**
 * WCA / csTimer trimmed average of exactly the times given.
 * Drops the best and worst `trimCount` results and means the rest.
 * DNFs count as the worst; more DNFs than trimmed makes the average a DNF.
 */
export function averageOf(times: number[]): number {
  const n = times.length;
  const trim = trimCount(n);
  const dnfs = times.filter((t) => t === DNF).length;
  if (dnfs > trim) return DNF;
  const sorted = [...times].sort((a, b) => a - b);
  const kept = sorted.slice(trim, n - trim);
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}

/** Plain mean; any DNF makes it a DNF (used for mo3). */
export function meanOf(times: number[]): number {
  if (times.some((t) => t === DNF)) return DNF;
  return times.reduce((a, b) => a + b, 0) / times.length;
}

export type AvgKind = 'mo3' | 'ao5' | 'ao12' | 'ao100';
export const AVG_SIZES: Record<AvgKind, number> = { mo3: 3, ao5: 5, ao12: 12, ao100: 100 };

function compute(kind: AvgKind, window: number[]): number {
  return kind === 'mo3' ? meanOf(window) : averageOf(window);
}

/**
 * For each index i, the average of the N solves ending at i (null until N solves exist).
 * `times` are effective times in chronological order.
 */
export function rolling(times: number[], kind: AvgKind): (number | null)[] {
  const n = AVG_SIZES[kind];
  return times.map((_, i) => (i + 1 < n ? null : compute(kind, times.slice(i + 1 - n, i + 1))));
}

/** Average of the last N times, or null if fewer than N exist. */
export function current(times: number[], kind: AvgKind): number | null {
  const n = AVG_SIZES[kind];
  if (times.length < n) return null;
  return compute(kind, times.slice(times.length - n));
}

/** Smallest value, ignoring nulls. Returns DNF if every value is a DNF, null if there are none. */
export function bestOf(values: (number | null)[]): number | null {
  let best: number | null = null;
  for (const v of values) {
    if (v === null) continue;
    if (best === null || v < best) best = v;
  }
  return best;
}

export function bestIndex(values: (number | null)[]): number {
  let idx = -1;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (v === null || v === DNF) continue;
    if (idx === -1 || v < (values[idx] as number)) idx = i;
  }
  return idx;
}

/** csTimer-style session mean: mean of all non-DNF solves. */
export function sessionMean(times: number[]): number | null {
  const ok = times.filter((t) => t !== DNF);
  if (!ok.length) return null;
  return ok.reduce((a, b) => a + b, 0) / ok.length;
}

/** Indices (within the window) that a trimmed average drops, for "(12.34)" display. */
export function trimmedIndices(times: number[], kind: AvgKind = 'ao5'): Set<number> {
  if (kind === 'mo3') return new Set();
  const trim = trimCount(times.length);
  const order = times.map((t, i) => ({ t, i })).sort((a, b) => a.t - b.t || a.i - b.i);
  const out = new Set<number>();
  order.slice(0, trim).forEach((o) => out.add(o.i));
  order.slice(order.length - trim).forEach((o) => out.add(o.i));
  return out;
}

export interface StatRow {
  kind: 'time' | AvgKind;
  current: number | null;
  best: number | null;
}

/** Everything the timer sidebar needs for a list of solves (chronological). */
export function summarize(solves: Solve[]) {
  const times = solves.map(effectiveTime);
  const roll = {
    mo3: rolling(times, 'mo3'),
    ao5: rolling(times, 'ao5'),
    ao12: rolling(times, 'ao12'),
    ao100: rolling(times, 'ao100'),
  };
  const rows: StatRow[] = [
    { kind: 'time', current: times.length ? times[times.length - 1] : null, best: bestOf(times) },
    ...(['mo3', 'ao5', 'ao12', 'ao100'] as AvgKind[]).map((k) => ({
      kind: k,
      current: roll[k].length ? roll[k][roll[k].length - 1] : null,
      best: bestOf(roll[k]),
    })),
  ];
  return {
    times,
    roll,
    rows,
    okCount: times.filter((t) => t !== DNF).length,
    total: times.length,
    mean: sessionMean(times),
    bestSingleIdx: bestIndex(times),
    bestAo5Idx: bestIndex(roll.ao5),
    bestAo12Idx: bestIndex(roll.ao12),
  };
}
