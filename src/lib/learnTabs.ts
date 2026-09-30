import { ALG_SETS, F2L } from './algsets';

/** Sub-pages of Learn, in order. Shared by the Learn sub-nav and the header dropdown. */
export const LEARN_TABS: { id: string; label: string }[] = [
  { id: 'notation', label: 'Notation' },
  ...ALG_SETS.map((s) => ({ id: s.slug, label: s.title })),
  ...(F2L?.original.length ? [{ id: 'original', label: 'Original Sheet' }] : []),
  { id: 'plan', label: 'Practice Plan' },
  { id: 'drill', label: 'Case Drill' },
];
