import { Fragment, useMemo, useState } from 'react';
import { sessionName, useStore } from '../lib/store';
import { DNF, effectiveTime, trimmedIndices, type AvgKind } from '../lib/stats';
import { allAverages, avgRef, pbHistory, topAverages, type AvgRecord, type PbPoint } from '../lib/records';
import { fmt, fmtAvg, fmtDate, fmtSolve } from '../lib/format';
import { SolveModal } from '../components/SolveModal';
import type { Solve } from '../lib/types';

export function LeaderboardPage() {
  const solves = useStore((s) => s.solves);
  const sessions = useStore((s) => s.sessions);
  const [openSolve, setOpenSolve] = useState<string | null>(null);

  const singles = useMemo(() => {
    const ok = solves.filter((s) => effectiveTime(s) !== DNF);
    const top = [...ok].sort((a, b) => effectiveTime(a) - effectiveTime(b) || a.timestamp - b.timestamp).slice(0, 10);
    const history = pbHistory(ok, effectiveTime, (s) => s.timestamp, (s) => s.id);
    return { top, history };
  }, [solves]);

  const avgs = useMemo(() => {
    const out = {} as Record<Exclude<AvgKind, 'mo3'>, { top: AvgRecord[]; history: PbPoint[] }>;
    for (const k of ['ao5', 'ao12', 'ao100'] as const) {
      const all = allAverages(solves, k);
      out[k] = { top: topAverages(all, 10), history: pbHistory(all, (r) => r.value, (r) => r.endTs, avgRef) };
    }
    return out;
  }, [solves]);

  const name = (id: string) => sessionName({ sessions }, id);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Leaderboard</h1>
          <p className="muted small">
            All-time top 10 across every session and day. Averages never span two sessions. <span className="badge">PB</span> marks a
            result that was a personal best when you set it.
          </p>
        </div>
      </div>
      {solves.length === 0 ? (
        <div className="card empty" style={{ padding: 48 }}>
          Nothing here yet. Your records will appear after your first solves on the <a href="#/timer">Timer</a>.
        </div>
      ) : (
        <div className="lb-grid">
          <section className="card lb-card">
            <h2>Best singles</h2>
            {singles.top.map((s, i) => (
              <div key={s.id} className={'lb-row click' + (i === 0 ? ' first' : '')} onClick={() => setOpenSolve(s.id)}>
                <span className="rank">{i + 1}</span>
                <span className="time">{fmtSolve(s)}</span>
                <span className="meta">
                  {fmtDate(s.timestamp)} <span className="session">· {name(s.sessionId)}</span>
                </span>
                <span>{singles.history.some((h) => h.ref === s.id) && <span className="badge">PB</span>}</span>
              </div>
            ))}
            <Timeline history={singles.history} kind="single" />
          </section>
          {(['ao5', 'ao12', 'ao100'] as const).map((k) => (
            <AvgBoard key={k} kind={k} data={avgs[k]} name={name} onOpenSolve={setOpenSolve} />
          ))}
        </div>
      )}
      {openSolve && <SolveModal solveId={openSolve} onClose={() => setOpenSolve(null)} />}
    </div>
  );
}

function AvgBoard({
  kind,
  data,
  name,
  onOpenSolve,
}: {
  kind: 'ao5' | 'ao12' | 'ao100';
  data: { top: AvgRecord[]; history: PbPoint[] };
  name: (id: string) => string;
  onOpenSolve: (id: string) => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const pbRefs = new Set(data.history.map((h) => h.ref));
  return (
    <section className="card lb-card">
      <h2>Best {kind}</h2>
      {data.top.length === 0 && <div className="empty">Needs {kind.slice(2)} solves in one session.</div>}
      {data.top.map((r, i) => {
        const id = avgRef(r);
        const isOpen = open === id;
        return (
          <Fragment key={id}>
            <div className={'lb-row click' + (i === 0 ? ' first' : '')} onClick={() => setOpen(isOpen ? null : id)} aria-expanded={isOpen}>
              <span className="rank">{i + 1}</span>
              <span className="time">{fmtAvg(r.value)}</span>
              <span className="meta">
                {fmtDate(r.endTs)} <span className="session">· {name(r.sessionId)}</span>
              </span>
              <span>{pbRefs.has(id) && <span className="badge">PB</span>}</span>
            </div>
            {isOpen && <AvgSolves solves={r.solves} kind={kind} onOpenSolve={onOpenSolve} />}
          </Fragment>
        );
      })}
      <Timeline history={data.history} kind="avg" />
    </section>
  );
}

function AvgSolves({ solves, kind, onOpenSolve }: { solves: Solve[]; kind: AvgKind; onOpenSolve: (id: string) => void }) {
  const dropped = trimmedIndices(solves.map(effectiveTime), kind);
  return (
    <div className="lb-expand">
      {solves.map((s, i) => (
        <Fragment key={s.id}>
          <span
            className={dropped.has(i) ? 'dropped' : ''}
            style={{ cursor: 'pointer' }}
            onClick={() => onOpenSolve(s.id)}
            title={s.scramble}
          >
            {dropped.has(i) ? `(${fmtSolve(s)})` : fmtSolve(s)}
          </span>{' '}
        </Fragment>
      ))}
    </div>
  );
}

function Timeline({ history, kind }: { history: PbPoint[]; kind: 'single' | 'avg' }) {
  if (!history.length) return null;
  const f = kind === 'single' ? fmt : fmtAvg;
  const t0 = history[0].ts;
  const t1 = history[history.length - 1].ts;
  const span = t1 - t0;
  const pos = (ts: number, i: number) =>
    span > 0 ? ((ts - t0) / span) * 100 : history.length === 1 ? 50 : (i / (history.length - 1)) * 100;
  const first = history[0];
  const last = history[history.length - 1];
  return (
    <div className="pb-timeline">
      <div className="row small" style={{ justifyContent: 'space-between' }}>
        <span className="muted">PB history</span>
        <span className="muted">
          {history.length} record{history.length === 1 ? '' : 's'}
          {history.length > 1 && (
            <>
              {' '}· <span className="num good">−{fmtAvg(first.value - last.value)}</span> total
            </>
          )}
        </span>
      </div>
      <div className="pb-track">
        {history.map((h, i) => (
          <span
            key={h.ref}
            className={'pb-dot' + (i === history.length - 1 ? ' last' : '')}
            style={{ left: `${pos(h.ts, i)}%` }}
            data-tip={`${f(h.value)} · ${fmtDate(h.ts)}${h.delta !== null ? ` (−${fmtAvg(h.delta)})` : ''}`}
          />
        ))}
      </div>
      <div className="pb-labels">
        <span>
          {fmtDate(first.ts)} · <span className="num">{f(first.value)}</span>
        </span>
        {history.length > 1 && (
          <span>
            {fmtDate(last.ts)} · <span className="num accent">{f(last.value)}</span>
          </span>
        )}
      </div>
    </div>
  );
}
