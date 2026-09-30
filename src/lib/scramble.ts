const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
const SUFFIXES = ['', "'", '2'] as const;
/** R/L share axis 0, U/D axis 1, F/B axis 2. */
const axisOf = (faceIdx: number) => faceIdx >> 1;

/**
 * Random-move 3x3 scramble in WCA notation.
 * Never turns the same face twice in a row, and never three moves on one axis
 * (so no "R L R" or "R L L" style redundancies).
 */
export function generateScramble(length = 20, rng: () => number = Math.random): string {
  const faces: number[] = [];
  const moves: string[] = [];
  while (moves.length < length) {
    const f = Math.floor(rng() * 6);
    const last = faces[faces.length - 1];
    const prev = faces[faces.length - 2];
    if (last !== undefined && f === last) continue;
    if (
      last !== undefined &&
      prev !== undefined &&
      axisOf(last) === axisOf(prev) &&
      axisOf(f) === axisOf(last)
    )
      continue;
    faces.push(f);
    moves.push(FACES[f] + SUFFIXES[Math.floor(rng() * 3)]);
  }
  return moves.join(' ');
}
