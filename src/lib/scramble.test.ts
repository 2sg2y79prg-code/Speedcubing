import { describe, expect, it } from 'vitest';
import { generateScramble } from './scramble';

const axis = (m: string) => ({ R: 0, L: 0, U: 1, D: 1, F: 2, B: 2 })[m[0] as 'R'];

describe('generateScramble', () => {
  it('produces 20 valid WCA moves without redundancies', () => {
    for (let n = 0; n < 2000; n++) {
      const moves = generateScramble().split(' ');
      expect(moves).toHaveLength(20);
      moves.forEach((m, i) => {
        expect(m).toMatch(/^[RLUDFB]['2]?$/);
        if (i > 0) expect(m[0]).not.toBe(moves[i - 1][0]);
        if (i > 1) expect(axis(m) === axis(moves[i - 1]) && axis(m) === axis(moves[i - 2])).toBe(false);
      });
    }
  });
});
