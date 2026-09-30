import { DNF, effectiveTime } from './stats';
import type { Solve } from './types';

/**
 * Format milliseconds as csTimer does: "9.87", "1:02.34", "DNF", "-".
 * Singles are truncated to hundredths (WCA); averages are rounded.
 */
export function fmt(ms: number | null | undefined, kind: 'single' | 'avg' = 'single'): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return '-';
  if (ms === DNF) return 'DNF';
  const cs = kind === 'avg' ? Math.round(ms / 10) : Math.floor(ms / 10);
  const minutes = Math.floor(cs / 6000);
  const rest = cs - minutes * 6000;
  const secs = Math.floor(rest / 100);
  const hund = String(rest % 100).padStart(2, '0');
  if (minutes > 0) return `${minutes}:${String(secs).padStart(2, '0')}.${hund}`;
  return `${secs}.${hund}`;
}

export const fmtAvg = (ms: number | null | undefined) => fmt(ms, 'avg');

/** A solve as shown in lists: "12.34", "14.34+", "DNF". */
export function fmtSolve(s: Solve): string {
  if (s.penalty === 'DNF') return 'DNF';
  return fmt(effectiveTime(s)) + (s.penalty === '+2' ? '+' : '');
}

/** Signed difference in seconds, e.g. "-12.26" / "+0.45". */
export function fmtDiff(ms: number): string {
  const sign = ms < 0 ? '-' : '+';
  return sign + fmt(Math.abs(ms), 'avg');
}

/** Local-time day key, YYYY-MM-DD. */
export function dayKey(ts: number | Date): string {
  const d = typeof ts === 'number' ? new Date(ts) : ts;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function fmtDate(ts: number, withYear = true): string {
  return new Date(ts).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
  });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtDayKey(key: string, withYear = true): string {
  return fmtDate(parseDayKey(key).getTime(), withYear);
}
