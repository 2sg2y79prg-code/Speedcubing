import { describe, expect, it } from 'vitest';
import { averageOf, current, DNF, effectiveTime, meanOf, rolling, sessionMean, summarize, trimCount, trimmedIndices } from './stats';
import { fmt, fmtAvg } from './format';
import type { Penalty, Solve } from './types';

const s = (sec: number, penalty: Penalty = 'none', i = 0): Solve => ({
  id: String(i),
  timeMs: Math.round(sec * 1000),
  penalty,
  scramble: '',
  timestamp: i,
  sessionId: 'a',
  comment: '',
});

describe('effectiveTime', () => {
  it('adds 2 seconds for +2 and returns DNF for DNF', () => {
    expect(effectiveTime(s(10))).toBe(10000);
    expect(effectiveTime(s(10, '+2'))).toBe(12000);
    expect(effectiveTime(s(10, 'DNF'))).toBe(DNF);
  });
});

describe('trimCount', () => {
  it('trims 1 for ao5/ao12 and 5 for ao100', () => {
    expect(trimCount(5)).toBe(1);
    expect(trimCount(12)).toBe(1);
    expect(trimCount(100)).toBe(5);
  });
});

describe('ao5', () => {
  it('drops best and worst and means the middle three', () => {
    expect(averageOf([10000, 12000, 11000, 15000, 9000])).toBe(11000);
  });
  it('treats a single DNF as the worst result', () => {
    expect(averageOf([10000, 12000, 11000, DNF, 9000])).toBe(11000);
  });
  it('is DNF with two DNFs', () => {
    expect(averageOf([10000, DNF, 11000, DNF, 9000])).toBe(DNF);
  });
  it('counts +2 in the average', () => {
    const times = [s(10), s(10, '+2'), s(11), s(15), s(9)].map(effectiveTime);
    // 9 dropped, 15 dropped, mean of 10, 12, 11
    expect(averageOf(times)).toBe(11000);
  });
  it('+2 can move a solve into the trimmed worst slot', () => {
    const times = [s(10), s(14, '+2'), s(11), s(15), s(9)].map(effectiveTime);
    // 16 is now worst, 15 counts: mean(10, 11, 15)
    expect(averageOf(times)).toBe(12000);
  });
  it('matches the csTimer reference screenshot style rounding', () => {
    expect(fmtAvg(averageOf([33570, 32090, 28710, 38520, 32480]))).toBe('32.71');
  });
});

describe('ao12', () => {
  const base = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((x) => x * 1000);
  it('drops one best and one worst', () => {
    // mean of 11..20 = 15.5
    expect(averageOf(base)).toBe(15500);
  });
  it('allows exactly one DNF', () => {
    const t = [...base];
    t[3] = DNF; // 13 becomes worst; drop 10 and DNF, mean of 11,12,14..21
    expect(averageOf(t)).toBeCloseTo((11 + 12 + 14 + 15 + 16 + 17 + 18 + 19 + 20 + 21) * 100, 6);
  });
  it('is DNF with two DNFs', () => {
    const t = [...base];
    t[0] = DNF;
    t[5] = DNF;
    expect(averageOf(t)).toBe(DNF);
  });
  it('handles +2 penalties', () => {
    const solves = base.map((ms, i) => s(ms / 1000, i === 0 ? '+2' : 'none', i));
    // 10 -> 12: sorted 11,12,12,...,21 ; drop 11 and 21
    const times = solves.map(effectiveTime);
    expect(averageOf(times)).toBe((12 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20) * 100);
  });
});

describe('ao100', () => {
  const base = Array.from({ length: 100 }, (_, i) => (i + 1) * 1000); // 1..100 s
  it('drops the best 5 and worst 5', () => {
    // mean of 6..95 = 50.5
    expect(averageOf(base)).toBe(50500);
  });
  it('tolerates up to 5 DNFs', () => {
    const t = [...base];
    for (let i = 0; i < 5; i++) t[i * 10] = DNF; // replace 1, 11, 21, 31, 41
    const kept = base.filter((_, i) => i % 10 !== 0 || i >= 50).sort((a, b) => a - b).slice(5);
    expect(averageOf(t)).toBeCloseTo(kept.reduce((a, b) => a + b, 0) / kept.length, 6);
  });
  it('is DNF with 6 DNFs', () => {
    const t = [...base];
    for (let i = 0; i < 6; i++) t[i] = DNF;
    expect(averageOf(t)).toBe(DNF);
  });
  it('+2 shifts values before trimming', () => {
    const solves = base.map((ms, i) => s(ms / 1000, i < 10 ? '+2' : 'none', i));
    const times = solves.map(effectiveTime);
    const sorted = [...times].sort((a, b) => a - b).slice(5, 95);
    expect(averageOf(times)).toBeCloseTo(sorted.reduce((a, b) => a + b, 0) / 90, 6);
  });
});

describe('mo3', () => {
  it('is a plain mean', () => {
    expect(meanOf([10000, 11000, 15000])).toBe(12000);
  });
  it('is DNF if any solve is DNF', () => {
    expect(meanOf([10000, DNF, 15000])).toBe(DNF);
  });
});

describe('rolling / current', () => {
  it('returns null until enough solves exist', () => {
    const t = [10000, 11000, 12000, 13000];
    expect(current(t, 'ao5')).toBeNull();
    expect(rolling(t, 'mo3')).toEqual([null, null, 11000, 12000]);
    expect(fmt(current(t, 'ao5'))).toBe('-');
  });
});

describe('session summary', () => {
  it('counts non-DNF solves and excludes DNFs from the mean', () => {
    const sum = summarize([s(10, 'none', 1), s(20, 'DNF', 2), s(12, '+2', 3)]);
    expect(sum.okCount).toBe(2);
    expect(sum.total).toBe(3);
    expect(sum.mean).toBe(12000);
    expect(sessionMean([DNF])).toBeNull();
  });
});

describe('trimmedIndices', () => {
  it('marks the best and worst for parentheses', () => {
    expect([...trimmedIndices([12, 9, 15, 11, 10])].sort()).toEqual([1, 2]);
    expect([...trimmedIndices([12, DNF, 15, 11, 10])].sort()).toEqual([1, 4]);
  });
});

describe('fmt', () => {
  it('truncates singles, rounds averages, handles minutes and DNF', () => {
    expect(fmt(12349)).toBe('12.34');
    expect(fmtAvg(12345)).toBe('12.35');
    expect(fmt(62340)).toBe('1:02.34');
    expect(fmt(DNF)).toBe('DNF');
    expect(fmt(null)).toBe('-');
  });
});
