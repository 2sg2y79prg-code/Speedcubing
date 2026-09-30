import { create } from 'zustand';
import { persist, type PersistStorage } from 'zustand/middleware';
import { get as idbGet, set as idbSet, del as idbDel } from 'idb-keyval';
import { uid } from './id';
import { dayKey } from './format';
import type { ExportFile, LearnProgress, Penalty, Session, Solve } from './types';

export type Grouping = 'day' | 'session';

interface Data extends LearnProgress {
  sessions: Session[];
  /** Always kept sorted by timestamp, oldest first. */
  solves: Solve[];
  currentSessionId: string;
  grouping: Grouping;
}

interface Actions {
  addSolve: (s: Omit<Solve, 'id' | 'comment' | 'penalty'> & Partial<Pick<Solve, 'penalty' | 'comment'>>) => Solve;
  updateSolve: (id: string, patch: Partial<Omit<Solve, 'id'>>) => void;
  setPenalty: (id: string, penalty: Penalty) => void;
  deleteSolve: (id: string) => void;
  createSession: (name: string) => Session;
  renameSession: (id: string, name: string) => void;
  /** Deletes the session and all its solves. */
  deleteSession: (id: string) => void;
  setCurrentSession: (id: string) => void;
  setGrouping: (g: Grouping) => void;
  setLearned: (key: string, value: boolean) => void;
  setChecklist: (key: string, value: boolean) => void;
  addDrillTime: (key: string, ms: number) => void;
  clearDrillTimes: (key: string) => void;
  exportData: () => ExportFile;
  importData: (file: ExportFile, mode: 'replace' | 'merge') => void;
  addImportedSessions: (items: { session: Session; solves: Solve[] }[]) => void;
}

export type AppState = Data & Actions;

function defaultSession(): Session {
  return { id: uid(), name: 'Session 1', createdAt: Date.now() };
}

function initialData(): Data {
  const s = defaultSession();
  return {
    sessions: [s],
    solves: [],
    currentSessionId: s.id,
    grouping: 'day',
    learned: {},
    checklist: {},
    drillTimes: {},
  };
}

const byTime = (a: Solve, b: Solve) => a.timestamp - b.timestamp;

type Stored = { state: Data; version?: number };
interface Wrapped {
  savedAt: number;
  value: Stored;
}
const unwrap = (v: unknown): Wrapped | null => {
  if (!v || typeof v !== 'object') return null;
  const o = v as Partial<Wrapped> & Partial<Stored>;
  if (o.value && typeof o.savedAt === 'number') return o as Wrapped;
  if (o.state) return { savedAt: 0, value: o as Stored }; // pre-mirror format
  return null;
};
const mirrorKey = (name: string) => `${name}:mirror`;

/**
 * Saves to IndexedDB (roomy) and mirrors to localStorage (synchronous, survives a reload
 * that interrupts an IndexedDB write). On load, whichever copy is newer wins.
 */
const storage: PersistStorage<Data> = {
  getItem: async (name) => {
    let idb: Wrapped | null = null;
    let ls: Wrapped | null = null;
    try {
      idb = unwrap(await idbGet(name));
    } catch {
      /* IndexedDB unavailable */
    }
    try {
      const raw = localStorage.getItem(mirrorKey(name)) ?? localStorage.getItem(name);
      ls = raw ? unwrap(JSON.parse(raw)) : null;
    } catch {
      /* localStorage unavailable or corrupt */
    }
    const best = !idb ? ls : !ls ? idb : ls.savedAt > idb.savedAt ? ls : idb;
    return (best?.value as never) ?? null;
  },
  setItem: async (name, value) => {
    const wrapped: Wrapped = { savedAt: Date.now(), value: value as Stored };
    try {
      localStorage.setItem(mirrorKey(name), JSON.stringify(wrapped));
    } catch {
      /* quota exceeded for very large histories; IndexedDB still has it */
    }
    try {
      await idbSet(name, wrapped);
    } catch (e) {
      console.error('Could not save to IndexedDB', e);
    }
  },
  removeItem: async (name) => {
    try {
      localStorage.removeItem(mirrorKey(name));
      await idbDel(name);
    } catch {
      /* ignore */
    }
  },
};

// Ask the browser not to evict our data under storage pressure.
if (typeof navigator !== 'undefined') navigator.storage?.persist?.().catch(() => {});

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialData(),

      addSolve: (input) => {
        const solve: Solve = { id: uid(), penalty: 'none', comment: '', ...input };
        set((st) => {
          const solves = [...st.solves, solve];
          // Solves normally arrive in order; only sort when they don't.
          if (solves.length > 1 && solves[solves.length - 2].timestamp > solve.timestamp) solves.sort(byTime);
          return { solves };
        });
        return solve;
      },
      updateSolve: (id, patch) =>
        set((st) => ({ solves: st.solves.map((s) => (s.id === id ? { ...s, ...patch } : s)) })),
      setPenalty: (id, penalty) => get().updateSolve(id, { penalty }),
      deleteSolve: (id) => set((st) => ({ solves: st.solves.filter((s) => s.id !== id) })),

      createSession: (name) => {
        const session: Session = { id: uid(), name: name.trim() || 'New session', createdAt: Date.now() };
        set((st) => ({ sessions: [...st.sessions, session], currentSessionId: session.id }));
        return session;
      },
      renameSession: (id, name) =>
        set((st) => ({ sessions: st.sessions.map((s) => (s.id === id ? { ...s, name: name.trim() || s.name } : s)) })),
      deleteSession: (id) =>
        set((st) => {
          let sessions = st.sessions.filter((s) => s.id !== id);
          if (!sessions.length) sessions = [defaultSession()];
          const currentSessionId = st.currentSessionId === id ? sessions[sessions.length - 1].id : st.currentSessionId;
          return { sessions, currentSessionId, solves: st.solves.filter((s) => s.sessionId !== id) };
        }),
      setCurrentSession: (id) => set({ currentSessionId: id }),
      setGrouping: (grouping) => set({ grouping }),

      setLearned: (key, value) => set((st) => ({ learned: { ...st.learned, [key]: value } })),
      setChecklist: (key, value) => set((st) => ({ checklist: { ...st.checklist, [key]: value } })),
      addDrillTime: (key, ms) =>
        set((st) => ({ drillTimes: { ...st.drillTimes, [key]: [...(st.drillTimes[key] ?? []), ms] } })),
      clearDrillTimes: (key) =>
        set((st) => {
          const drillTimes = { ...st.drillTimes };
          delete drillTimes[key];
          return { drillTimes };
        }),

      exportData: () => {
        const st = get();
        return {
          app: 'archies-speedcubing-progression',
          version: 1,
          exportedAt: new Date().toISOString(),
          sessions: st.sessions,
          solves: st.solves,
          learn: { learned: st.learned, checklist: st.checklist, drillTimes: st.drillTimes },
        };
      },
      importData: (file, mode) =>
        set((st) => {
          if (mode === 'replace') {
            const sessions = file.sessions.length ? file.sessions : [defaultSession()];
            return {
              sessions,
              solves: [...file.solves].sort(byTime),
              currentSessionId: sessions[sessions.length - 1].id,
              learned: file.learn?.learned ?? {},
              checklist: file.learn?.checklist ?? {},
              drillTimes: file.learn?.drillTimes ?? {},
            };
          }
          const sessionIds = new Set(st.sessions.map((s) => s.id));
          const solveIds = new Set(st.solves.map((s) => s.id));
          const drillTimes = { ...st.drillTimes };
          for (const [k, v] of Object.entries(file.learn?.drillTimes ?? {})) drillTimes[k] = [...(drillTimes[k] ?? []), ...v];
          return {
            sessions: [...st.sessions, ...file.sessions.filter((s) => !sessionIds.has(s.id))],
            solves: [...st.solves, ...file.solves.filter((s) => !solveIds.has(s.id))].sort(byTime),
            learned: { ...st.learned, ...(file.learn?.learned ?? {}) },
            checklist: { ...st.checklist, ...(file.learn?.checklist ?? {}) },
            drillTimes,
          };
        }),
      addImportedSessions: (items) =>
        set((st) => ({
          sessions: [...st.sessions, ...items.map((i) => i.session)],
          solves: [...st.solves, ...items.flatMap((i) => i.solves)].sort(byTime),
        })),
    }),
    {
      name: 'archies-speedcubing-v1',
      version: 1,
      storage,
      partialize: (st): Data => ({
        sessions: st.sessions,
        solves: st.solves,
        currentSessionId: st.currentSessionId,
        grouping: st.grouping,
        learned: st.learned,
        checklist: st.checklist,
        drillTimes: st.drillTimes,
      }),
    },
  ),
);

/** Latest solve overall (used by the Alt+2 / Alt+D / Ctrl+Z shortcuts). */
export function lastSolve(st: AppState): Solve | undefined {
  return st.solves[st.solves.length - 1];
}

export function sessionName(st: Pick<AppState, 'sessions'>, id: string): string {
  return st.sessions.find((s) => s.id === id)?.name ?? 'Deleted session';
}

export function todayKey(): string {
  return dayKey(Date.now());
}
