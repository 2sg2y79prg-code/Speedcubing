import { memo, useState } from 'react';
import { useStore, todayKey } from '../lib/store';
import { useDialogs } from '../components/Dialogs';
import { Icon } from '../components/Icon';
import { fmt, fmtAvg, fmtSolve } from '../lib/format';
import type { summarize } from '../lib/stats';
import type { Solve } from '../lib/types';

interface Props {
  solves: Solve[];
  sum: ReturnType<typeof summarize>;
  viewDay: string;
  setViewDay: (d: string) => void;
  onOpenSolve: (id: string) => void;
}

const PAGE = 200;

export const TimerSidebar = memo(function TimerSidebar({ solves, sum, viewDay, setViewDay, onOpenSolve }: Props) {
  const grouping = useStore((s) => s.grouping);
  const sessions = useStore((s) => s.sessions);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const allSolves = useStore((s) => s.solves);
  const { setGrouping, setCurrentSession, createSession, renameSession, deleteSession } = useStore.getState();
  const { prompt, confirm } = useDialogs();
  const [limit, setLimit] = useState(PAGE);
  const current = sessions.find((s) => s.id === currentSessionId);
  const isToday = viewDay === todayKey();

  const newSession = async () => {
    const name = await prompt({ title: 'New session', label: 'Name', initial: `Session ${sessions.length + 1}`, confirmLabel: 'Create' });
    if (name !== null) createSession(name);
  };
  const rename = async () => {
    if (!current) return;
    const name = await prompt({ title: 'Rename session', label: 'Name', initial: current.name, confirmLabel: 'Save' });
    if (name !== null) renameSession(current.id, name);
  };
  const remove = async () => {
    if (!current) return;
    const n = allSolves.filter((s) => s.sessionId === current.id).length;
    const ok = await confirm({
      title: `Delete "${current.name}"?`,
      message: `This permanently deletes the session and its ${n} solve${n === 1 ? '' : 's'}.`,
      confirmLabel: 'Delete session',
      danger: true,
    });
    if (ok) deleteSession(current.id);
  };

  const rows = [...solves].reverse().slice(0, limit);
  const kindLabel = { time: 'time', mo3: 'mo3', ao5: 'ao5', ao12: 'ao12', ao100: 'ao100' } as const;

  return (
    <aside className="sidebar">
      <div className="section">
        <div className="seg" style={{ alignSelf: 'stretch' }}>
          <button style={{ flex: 1 }} className={grouping === 'day' ? 'on' : ''} onClick={() => setGrouping('day')}>
            By day
          </button>
          <button style={{ flex: 1 }} className={grouping === 'session' ? 'on' : ''} onClick={() => setGrouping('session')}>
            By session
          </button>
        </div>
        {grouping === 'day' && (
          <div className="row">
            <input
              type="date"
              className="input sm"
              style={{ flex: 1 }}
              value={viewDay}
              max={todayKey()}
              onChange={(e) => e.target.value && setViewDay(e.target.value)}
              aria-label="Day"
            />
            <button className="btn sm" disabled={isToday} onClick={() => setViewDay(todayKey())}>
              Today
            </button>
          </div>
        )}
        <div className="row">
          <select
            className="select sm"
            style={{ flex: 1 }}
            value={currentSessionId}
            onChange={(e) => setCurrentSession(e.target.value)}
            aria-label="Session"
            title={grouping === 'day' ? 'New solves are saved to this session' : 'Session'}
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {grouping === 'day' ? `Saving to: ${s.name}` : s.name}
              </option>
            ))}
          </select>
          <button className="btn sm icon" onClick={newSession} title="New session" aria-label="New session">
            <Icon name="plus" />
          </button>
          <button className="btn sm icon" onClick={rename} title="Rename session" aria-label="Rename session">
            <Icon name="edit" />
          </button>
          <button className="btn sm icon danger" onClick={remove} title="Delete session" aria-label="Delete session">
            <Icon name="trash" />
          </button>
        </div>
      </div>

      <table className="stats-box">
        <thead>
          <tr>
            <th />
            <th>current</th>
            <th>best</th>
          </tr>
        </thead>
        <tbody>
          {sum.rows.map((r) => {
            const f = r.kind === 'time' ? fmt : fmtAvg;
            const isPb = r.current !== null && r.best !== null && r.current === r.best && sum.total > 1;
            return (
              <tr key={r.kind}>
                <td>{kindLabel[r.kind]}</td>
                <td className={isPb ? 'accent' : ''}>{f(r.current)}</td>
                <td>{f(r.best)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="solve-line">
        <span>
          solve: <b>{sum.okCount}/{sum.total}</b>
        </span>
        <span>
          mean: <b>{fmtAvg(sum.mean)}</b>
        </span>
      </div>

      <div className="solve-table-wrap">
        {solves.length === 0 ? (
          <div className="empty">
            {grouping === 'day' ? (isToday ? 'No solves yet today.' : 'No solves on this day.') : 'No solves in this session yet.'}
          </div>
        ) : (
          <table className="solve-table">
            <thead>
              <tr>
                <th>#</th>
                <th>time</th>
                <th>ao5</th>
                <th>ao12</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s, k) => {
                const i = solves.length - 1 - k;
                return (
                  <tr key={s.id} onClick={() => onOpenSolve(s.id)} title={s.comment || undefined}>
                    <td>{i + 1}</td>
                    <td className={(i === sum.bestSingleIdx ? 'best' : '') + (s.comment ? ' cmt' : '')}>{fmtSolve(s)}</td>
                    <td className={i === sum.bestAo5Idx ? 'best' : ''}>{fmtAvg(sum.roll.ao5[i])}</td>
                    <td className={i === sum.bestAo12Idx ? 'best' : ''}>{fmtAvg(sum.roll.ao12[i])}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {solves.length > limit && (
          <div style={{ padding: 8, textAlign: 'center' }}>
            <button className="btn sm" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({solves.length - limit} older)
            </button>
          </div>
        )}
      </div>
    </aside>
  );
});
