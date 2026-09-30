import { Modal } from './Modal';
import { useDialogs } from './Dialogs';
import { sessionName, useStore } from '../lib/store';
import { fmt, fmtDateTime, fmtSolve } from '../lib/format';
import type { Penalty } from '../lib/types';

export function SolveModal({ solveId, onClose }: { solveId: string; onClose: () => void }) {
  const solve = useStore((s) => s.solves.find((x) => x.id === solveId));
  const sessions = useStore((s) => s.sessions);
  const { setPenalty, updateSolve, deleteSolve } = useStore.getState();
  const { confirm } = useDialogs();
  if (!solve) return null;

  const pen = (p: Penalty) => setPenalty(solve.id, p);
  const del = async () => {
    if (await confirm({ title: 'Delete this solve?', message: `${fmtSolve(solve)} will be removed permanently.`, confirmLabel: 'Delete', danger: true })) {
      deleteSolve(solve.id);
      onClose();
    }
  };

  return (
    <Modal
      title="Solve details"
      onClose={onClose}
      footer={
        <>
          <button className="btn danger" onClick={del}>
            Delete
          </button>
          <span className="spacer" />
          <button className="btn primary" onClick={onClose}>
            Done
          </button>
        </>
      }
    >
      <div className="row" style={{ alignItems: 'baseline', gap: 12 }}>
        <span className="num" style={{ fontSize: 44, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
          {fmtSolve(solve)}
        </span>
        {solve.penalty !== 'none' && <span className="muted small num">raw {fmt(solve.timeMs)}</span>}
      </div>
      <div className="seg" role="group" aria-label="Penalty">
        {(
          [
            ['none', 'OK'],
            ['+2', '+2'],
            ['DNF', 'DNF'],
          ] as [Penalty, string][]
        ).map(([p, label]) => (
          <button key={p} className={solve.penalty === p ? 'on' : ''} onClick={() => pen(p)}>
            {label}
          </button>
        ))}
      </div>
      <div className="kv" style={{ gridTemplateColumns: '80px 1fr', fontSize: 14 }}>
        <span className="k">Scramble</span>
        <span className="v mono" style={{ fontSize: 14, wordSpacing: '0.2em' }}>{solve.scramble || '—'}</span>
        <span className="k">Date</span>
        <span className="v">{fmtDateTime(solve.timestamp)}</span>
        <span className="k">Session</span>
        <span className="v">
          <select
            className="select sm"
            value={solve.sessionId}
            onChange={(e) => updateSolve(solve.id, { sessionId: e.target.value })}
          >
            {!sessions.some((s) => s.id === solve.sessionId) && (
              <option value={solve.sessionId}>{sessionName({ sessions }, solve.sessionId)}</option>
            )}
            {sessions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </span>
      </div>
      <label className="stack" style={{ gap: 6 }}>
        <span className="small muted">Comment (optional)</span>
        <textarea
          className="textarea"
          value={solve.comment}
          placeholder="e.g. lockup on the last slot"
          onChange={(e) => updateSolve(solve.id, { comment: e.target.value })}
        />
      </label>
    </Modal>
  );
}
