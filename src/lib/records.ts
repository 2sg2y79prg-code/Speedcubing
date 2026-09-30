import { AVG_SIZES, averageOf, DNF, effectiveTime, meanOf, type AvgKind } from './stats';
import type { Solve } from './types';

export interface AvgRecord {
  value: number;
  /** The solves in the window, chronological. */
  solves: Solve[];
  endTs: number;
  sessionId: string;
}

/** Every valid (non-DNF) rolling average of size N, computed within each session. */
export function allAverages(solves: Solve[], kind: AvgKind): AvgRecord[] {
  const n = AVG_SIZES[kind];
  const bySession = new Map<string, Solve[]>();
  for (const s of solves) {
    const arr = bySession.get(s.sessionId);
    if (arr) arr.push(s);
    else bySession.set(s.sessionId, [s]);
  }
  const out: AvgRecord[] = [];
  for (const [sessionId, list] of bySession) {
    const times = list.map(effectiveTime);
    for (let i = n - 1; i < list.length; i++) {
      const w = times.slice(i + 1 - n, i + 1);
      const value = kind === 'mo3' ? meanOf(w) : averageOf(w);
      if (value === DNF) continue;
      out.push({ value, solves: list.slice(i + 1 - n, i + 1), endTs: list[i].timestamp, sessionId });
    }
  }
  return out;
}

export function topAverages(records: AvgRecord[], limit = 10): AvgRecord[] {
  return [...records].sort((a, b) => a.value - b.value || a.endTs - b.endTs).slice(0, limit);
}

export interface PbPoint {
  value: number;
  ts: number;
  /** Improvement over the previous PB (ms), null for the first. */
  delta: number | null;
  ref: string;
}

/** Chronological list of every time the record improved. */
export function pbHistory<T>(items: T[], value: (t: T) => number, ts: (t: T) => number, ref: (t: T) => string): PbPoint[] {
  const sorted = [...items].filter((i) => value(i) !== DNF).sort((a, b) => ts(a) - ts(b));
  const out: PbPoint[] = [];
  let best = DNF;
  for (const it of sorted) {
    const v = value(it);
    if (v < best) {
      out.push({ value: v, ts: ts(it), delta: best === DNF ? null : best - v, ref: ref(it) });
      best = v;
    }
  }
  return out;
}

export const avgRef = (r: AvgRecord) => r.solves[r.solves.length - 1].id;
