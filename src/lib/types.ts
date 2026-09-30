export type Penalty = 'none' | '+2' | 'DNF';

export interface Solve {
  id: string;
  /** Raw measured time in milliseconds, penalty not included. */
  timeMs: number;
  penalty: Penalty;
  scramble: string;
  /** Unix epoch milliseconds when the solve finished. */
  timestamp: number;
  sessionId: string;
  comment: string;
}

export interface Session {
  id: string;
  name: string;
  createdAt: number;
}

export interface LearnProgress {
  /** Keys are `${setSlug}:${caseId}`. */
  learned: Record<string, boolean>;
  /** Practice-plan checklist, keyed by block id. */
  checklist: Record<string, boolean>;
  /** Drill times in ms, keyed by `${setSlug}:${caseId}`. */
  drillTimes: Record<string, number[]>;
}

export interface ExportFile {
  app: 'archies-speedcubing-progression';
  version: 1;
  exportedAt: string;
  sessions: Session[];
  solves: Solve[];
  learn: LearnProgress;
}
