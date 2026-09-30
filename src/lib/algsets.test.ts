import { describe, expect, it } from 'vitest';
import { ALG_SETS, F2L } from './algsets';
import { invertAlg } from './alg';
import { parseCsTimer } from './importers';

describe('F2L data', () => {
  it('loads 41 core cases and 10 original-sheet algorithms', () => {
    expect(F2L?.cases).toHaveLength(41);
    expect(F2L?.original).toHaveLength(10);
    expect(ALG_SETS[0].slug).toBe('f2l');
  });
  it('every setup is the exact reverse of its algorithm', () => {
    for (const c of [...F2L!.cases, ...F2L!.original]) {
      expect(invertAlg(c.alg), `case ${c.id}`).toBe(c.setup);
    }
  });
  it('every case belongs to a declared group', () => {
    const groups = new Set(F2L!.groups.map((g) => g.name));
    for (const c of F2L!.cases) expect(groups.has(c.group)).toBe(true);
  });
});

describe('csTimer import', () => {
  it('parses sessions, penalties and names', () => {
    const file = JSON.stringify({
      session1: [
        [[0, 12345], "R U R'", '', 1700000000],
        [[2000, 10000], 'F2', 'nice', 1700000100],
        [[-1, 9000], 'B', '', 1700000200],
      ],
      session2: [],
      properties: { sessionData: JSON.stringify({ 1: { name: 'main' }, 2: { name: 2 } }) },
    });
    const out = parseCsTimer(file);
    expect(out).toHaveLength(1);
    expect(out[0].session.name).toBe('csTimer main');
    expect(out[0].solves.map((s) => s.penalty)).toEqual(['none', '+2', 'DNF']);
    expect(out[0].solves[0].timestamp).toBe(1700000000000);
    expect(out[0].solves[1].comment).toBe('nice');
  });
});
