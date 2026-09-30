/**
 * Algorithm sets are loaded from every JSON file in /algsets. To add OLL or PLL,
 * drop in e.g. algsets/oll.json:
 *   { "slug": "oll", "name": "OLL", "title": "OLL Cases", "order": 2,
 *     "groups": [{ "name": "Dot", "intro": "..." }],
 *     "cases": [{ "id": 1, "group": "Dot", "alg": "...", "setup": "...", "image": "assets/oll/01.png" }] }
 * ("core" is accepted as an alias for "cases"; "groups" is optional.)
 */
export interface AlgCase {
  id: string | number;
  group: string;
  alg: string;
  setup: string;
  image: string;
  lookFor?: string;
  note?: string;
  coreMatch?: number | null;
  /** Set for landscape diagrams (e.g. front + back views). */
  wide?: boolean;
}

export interface AlgGroup {
  name: string;
  intro?: string;
  range?: string;
}

export interface AlgSet {
  slug: string;
  name: string;
  title: string;
  order: number;
  groups: AlgGroup[];
  cases: AlgCase[];
  /** F2L only: the recreated original sheet. */
  original: AlgCase[];
}

interface RawSet {
  slug?: string;
  name?: string;
  title?: string;
  order?: number;
  groups?: AlgGroup[];
  cases?: AlgCase[];
  core?: AlgCase[];
  original?: AlgCase[];
}

const files = import.meta.glob<RawSet>('../../algsets/*.json', { eager: true, import: 'default' });

function normalize(path: string, raw: RawSet): AlgSet {
  const fileSlug = path.split('/').pop()!.replace(/\.json$/, '').replace(/_cases$/, '');
  const slug = raw.slug ?? fileSlug;
  const name = raw.name ?? slug.toUpperCase();
  const cases = raw.cases ?? raw.core ?? [];
  const groups =
    raw.groups ?? [...new Set(cases.map((c) => c.group))].map((g) => ({ name: g }));
  return {
    slug,
    name,
    title: raw.title ?? `${name} Cases`,
    order: raw.order ?? (slug === 'f2l' ? 0 : 10),
    groups,
    cases,
    original: (raw.original ?? []).map((c) => ({ ...c, group: c.group ?? 'Original Sheet' })),
  };
}

export const ALG_SETS: AlgSet[] = Object.entries(files)
  .map(([path, raw]) => normalize(path, raw))
  .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));

export const caseKey = (set: AlgSet | string, c: AlgCase | string | number) =>
  `${typeof set === 'string' ? set : set.slug}:${typeof c === 'object' ? c.id : c}`;

export interface CaseRef {
  key: string;
  set: AlgSet;
  c: AlgCase;
  original: boolean;
}

export const ALL_CASES: CaseRef[] = ALG_SETS.flatMap((set) => [
  ...set.cases.map((c) => ({ key: caseKey(set, c), set, c, original: false })),
  ...set.original.map((c) => ({ key: caseKey(set, c), set, c, original: true })),
]);

export const CASE_BY_KEY = new Map(ALL_CASES.map((r) => [r.key, r]));

export function caseLabel(ref: CaseRef): string {
  return typeof ref.c.id === 'number' ? `#${ref.c.id}` : String(ref.c.id);
}

export function assetUrl(path: string): string {
  return import.meta.env.BASE_URL + path.replace(/^\//, '');
}

/** Two-cube diagrams (front and back view) are landscape. */
export function isWideImage(c: AlgCase): boolean {
  return c.wide ?? /src_(02|05|06|07|10)\.png$/.test(c.image);
}

export const F2L = ALG_SETS.find((s) => s.slug === 'f2l');

function range(a: number, b: number) {
  return Array.from({ length: b - a + 1 }, (_, i) => a + i);
}

export interface PlanBlock {
  id: string;
  title: string;
  keys: string[];
}

export const PRACTICE_BLOCKS: PlanBlock[] = [
  { id: 'block1', title: 'Block 1: #17-24, white facing up', keys: range(17, 24).map((i) => `f2l:${i}`) },
  { id: 'block2', title: 'Block 2: #31-36, edge stuck in slot', keys: range(31, 36).map((i) => `f2l:${i}`) },
  { id: 'block3', title: 'Block 3: #25-30, corner stuck in slot', keys: range(25, 30).map((i) => `f2l:${i}`) },
  {
    id: 'block4',
    title: 'Block 4: #5-16, white facing side (keep only faster ones)',
    keys: range(5, 16).map((i) => `f2l:${i}`),
  },
  {
    id: 'block5',
    title: 'Block 5: #37-41 plus S5, S6, S7, S10',
    keys: [...range(37, 41).map((i) => `f2l:${i}`), 'f2l:S5', 'f2l:S6', 'f2l:S7', 'f2l:S10'],
  },
];
