/** Split an algorithm into move tokens, ignoring grouping parentheses. */
export function tokens(alg: string): string[] {
  return alg.replace(/[()]/g, ' ').split(/\s+/).filter(Boolean);
}

export function invertMove(m: string): string {
  if (m.endsWith('2')) return m;
  if (m.endsWith("'")) return m.slice(0, -1);
  return m + "'";
}

/** The reverse of an algorithm (what undoes it). */
export function invertAlg(alg: string): string {
  return tokens(alg).reverse().map(invertMove).join(' ');
}

export const AUFS = ['U', "U'", 'U2'] as const;

export function randomAuf(rng: () => number = Math.random): string {
  return AUFS[Math.floor(rng() * AUFS.length)];
}

export function moveCount(alg: string): number {
  return tokens(alg).length;
}
