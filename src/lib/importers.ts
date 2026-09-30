import { uid } from './id';
import type { ExportFile, Penalty, Session, Solve } from './types';

export function parseExport(text: string): ExportFile {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.solves) || !Array.isArray(data.sessions)) {
    throw new Error("This doesn't look like an export from this site (missing sessions/solves).");
  }
  const solves: Solve[] = data.solves.map((s: Partial<Solve>) => {
    if (typeof s.timeMs !== 'number' || typeof s.timestamp !== 'number' || typeof s.sessionId !== 'string') {
      throw new Error('A solve in the file is missing timeMs, timestamp or sessionId.');
    }
    return {
      id: s.id ?? uid(),
      timeMs: s.timeMs,
      penalty: (['none', '+2', 'DNF'] as Penalty[]).includes(s.penalty as Penalty) ? (s.penalty as Penalty) : 'none',
      scramble: s.scramble ?? '',
      timestamp: s.timestamp,
      sessionId: s.sessionId,
      comment: s.comment ?? '',
    };
  });
  return {
    app: 'archies-speedcubing-progression',
    version: 1,
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    sessions: data.sessions,
    solves,
    learn: {
      learned: data.learn?.learned ?? {},
      checklist: data.learn?.checklist ?? {},
      drillTimes: data.learn?.drillTimes ?? {},
    },
  };
}

type CsSolve = [[number, number], string, string, number];

/**
 * Parse a csTimer export (Export -> "Export to file"). Each "sessionN" key holds
 * [[penalty, timeMs], scramble, comment, unixSeconds]; penalty 0 = OK, 2000 = +2, -1 = DNF.
 * Session names live in properties.sessionData (a JSON string).
 */
export function parseCsTimer(text: string): { session: Session; solves: Solve[] }[] {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object') throw new Error('Not a csTimer export.');
  let meta: Record<string, { name?: string | number }> = {};
  try {
    const raw = data.properties?.sessionData;
    meta = typeof raw === 'string' ? JSON.parse(raw) : (raw ?? {});
  } catch {
    meta = {};
  }
  const keys = Object.keys(data)
    .filter((k) => /^session\d+$/.test(k))
    .sort((a, b) => Number(a.slice(7)) - Number(b.slice(7)));
  if (!keys.length) throw new Error('No csTimer sessions found in this file.');

  const out: { session: Session; solves: Solve[] }[] = [];
  for (const key of keys) {
    const num = key.slice(7);
    let list = data[key];
    if (typeof list === 'string') list = JSON.parse(list);
    if (!Array.isArray(list) || !list.length) continue;
    const name = meta[num]?.name !== undefined ? String(meta[num].name) : num;
    const solves: Solve[] = [];
    const session: Session = { id: uid(), name: `csTimer ${name}`, createdAt: Date.now() };
    for (const item of list as CsSolve[]) {
      if (!Array.isArray(item) || !Array.isArray(item[0])) continue;
      const [pen, time] = item[0];
      if (typeof time !== 'number') continue;
      const penalty: Penalty = pen === -1 ? 'DNF' : pen > 0 ? '+2' : 'none';
      const ts = typeof item[3] === 'number' ? item[3] * 1000 : Date.now();
      solves.push({
        id: uid(),
        timeMs: time,
        penalty,
        scramble: typeof item[1] === 'string' ? item[1] : '',
        comment: typeof item[2] === 'string' ? item[2] : '',
        timestamp: ts,
        sessionId: session.id,
      });
    }
    if (solves.length) {
      session.createdAt = solves[0].timestamp;
      out.push({ session, solves });
    }
  }
  if (!out.length) throw new Error('The csTimer file has no solves.');
  return out;
}
