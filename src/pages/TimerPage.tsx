import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { lastSolve, todayKey, useStore } from '../lib/store';
import { generateScramble } from '../lib/scramble';
import { DNF, effectiveTime, summarize, current } from '../lib/stats';
import { dayKey, fmt, fmtAvg, fmtDiff, fmtSolve } from '../lib/format';
import { keyboardBusy } from '../components/Modal';
import { useDialogs } from '../components/Dialogs';
import { SolveModal } from '../components/SolveModal';
import { Icon } from '../components/Icon';
import { TimerSidebar } from './TimerSidebar';
import type { Penalty } from '../lib/types';

type Phase = 'idle' | 'holding' | 'ready' | 'running';
const HOLD_MS = 300;

/** Owns its own animation loop so the rest of the page doesn't re-render every frame. */
function RunningDigits({ startRef }: { startRef: React.RefObject<number> }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setMs(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startRef]);
  return <>{fmt(ms)}</>;
}

const isCoarse = () => window.matchMedia?.('(pointer: coarse)').matches ?? false;

export function TimerPage() {
  const allSolves = useStore((s) => s.solves);
  const grouping = useStore((s) => s.grouping);
  const currentSessionId = useStore((s) => s.currentSessionId);
  const { confirm, toast } = useDialogs();

  const [viewDay, setViewDay] = useState(todayKey);
  const [openSolve, setOpenSolve] = useState<string | null>(null);

  // Scramble history: prev/next buttons walk through it; "next" at the end generates a new one.
  const [scr, setScr] = useState(() => ({ list: [generateScramble()], idx: 0 }));
  const scramble = scr.list[scr.idx];
  const nextScramble = useCallback(
    () =>
      setScr(({ list, idx }) => {
        if (idx < list.length - 1) return { list, idx: idx + 1 };
        const next = [...list, generateScramble()].slice(-50);
        return { list: next, idx: next.length - 1 };
      }),
    [],
  );
  const prevScramble = () => setScr(({ list, idx }) => ({ list, idx: Math.max(0, idx - 1) }));

  const viewSolves = useMemo(
    () =>
      grouping === 'day'
        ? allSolves.filter((s) => dayKey(s.timestamp) === viewDay)
        : allSolves.filter((s) => s.sessionId === currentSessionId),
    [allSolves, grouping, viewDay, currentSessionId],
  );
  const sum = useMemo(() => summarize(viewSolves), [viewSolves]);

  // ---- Timer state machine ----
  const [phase, setPhaseState] = useState<Phase>('idle');
  const phaseRef = useRef<Phase>('idle');
  const startRef = useRef(0);
  const holdTimer = useRef(0);
  const awaitRelease = useRef(false);
  const scrambleRef = useRef(scramble);
  scrambleRef.current = scramble;
  const sessionRef = useRef(currentSessionId);
  sessionRef.current = currentSessionId;

  const setPhase = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhaseState(p);
  }, []);

  const beginHold = useCallback(() => {
    if (phaseRef.current !== 'idle' || awaitRelease.current) return;
    setPhase('holding');
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      if (phaseRef.current === 'holding') setPhase('ready');
    }, HOLD_MS);
  }, [setPhase]);

  const endHold = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    if (phaseRef.current === 'ready') {
      startRef.current = performance.now();
      setPhase('running');
    } else if (phaseRef.current === 'holding') {
      setPhase('idle');
    }
  }, [setPhase]);

  const cancelHold = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    if (phaseRef.current === 'holding' || phaseRef.current === 'ready') setPhase('idle');
  }, [setPhase]);

  const stop = useCallback(() => {
    if (phaseRef.current !== 'running') return;
    const timeMs = Math.round(performance.now() - startRef.current);
    awaitRelease.current = true;
    setPhase('idle');
    useStore.getState().addSolve({
      timeMs,
      scramble: scrambleRef.current,
      timestamp: Date.now(),
      sessionId: sessionRef.current,
    });
    setViewDay(todayKey());
    nextScramble();
  }, [setPhase, nextScramble]);

  const applyPenalty = useCallback(
    (p: Penalty) => {
      const last = lastSolve(useStore.getState());
      if (!last) return;
      const next = last.penalty === p ? 'none' : p;
      useStore.getState().setPenalty(last.id, next);
      toast(next === 'none' ? 'Penalty removed from last solve' : `Last solve marked ${next}`);
    },
    [toast],
  );

  const deleteLast = useCallback(async () => {
    const last = lastSolve(useStore.getState());
    if (!last) return;
    const ok = await confirm({
      title: 'Delete last solve?',
      message: `${fmtSolve(last)} — ${last.scramble}`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (ok) {
      useStore.getState().deleteSolve(last.id);
      toast('Last solve deleted');
    }
  }, [confirm, toast]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (phaseRef.current === 'running') {
        e.preventDefault();
        stop();
        return;
      }
      if (keyboardBusy()) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) beginHold();
        return;
      }
      if (e.key === 'Escape') return cancelHold();
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.code === 'KeyZ') {
        e.preventDefault();
        deleteLast();
      } else if (e.altKey && e.code === 'Digit2') {
        e.preventDefault();
        applyPenalty('+2');
      } else if (e.altKey && e.code === 'KeyD') {
        e.preventDefault();
        applyPenalty('DNF');
      }
    };
    const up = (e: KeyboardEvent) => {
      awaitRelease.current = false;
      if (e.code === 'Space') {
        e.preventDefault();
        endHold();
      }
    };
    const pointerUp = () => {
      awaitRelease.current = false;
      if (phaseRef.current === 'holding' || phaseRef.current === 'ready') endHold();
    };
    const blur = () => cancelHold();
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('pointerup', pointerUp);
    window.addEventListener('blur', blur);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('pointerup', pointerUp);
      window.removeEventListener('blur', blur);
    };
  }, [beginHold, endHold, cancelHold, stop, deleteLast, applyPenalty]);

  useEffect(() => {
    document.body.classList.toggle('running', phase === 'running');
    return () => document.body.classList.remove('running');
  }, [phase]);

  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  // ---- Display ----
  const latest = viewSolves[viewSolves.length - 1];
  const prev = viewSolves[viewSolves.length - 2];
  let diff: number | null = null;
  if (latest && prev) {
    const a = effectiveTime(latest);
    const b = effectiveTime(prev);
    if (a !== DNF && b !== DNF) diff = a - b;
  }
  const idleText = latest ? fmtSolve(latest) : '0.00';

  const onStageDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button, a, input, select, textarea')) return;
    beginHold();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort; the window-level pointerup still ends the hold */
    }
  };

  return (
    <div className="timer-layout">
      <TimerSidebar solves={viewSolves} sum={sum} viewDay={viewDay} setViewDay={setViewDay} onOpenSolve={setOpenSolve} />

      <main className="timer-main">
        <div className="scramble-bar">
          <button className="btn ghost icon" onClick={prevScramble} disabled={scr.idx === 0} title="Previous scramble" aria-label="Previous scramble">
            <Icon name="left" />
          </button>
          <div className="scramble" aria-label="Scramble">
            {scramble}
          </div>
          <button className="btn ghost icon" onClick={nextScramble} title="Next scramble" aria-label="Next scramble">
            <Icon name="right" />
          </button>
        </div>

        <div
          className="timer-stage"
          onPointerDown={onStageDown}
          onPointerUp={endHold}
          onPointerCancel={cancelHold}
          onContextMenu={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none' } as React.CSSProperties}
        >
          <div className="timer-row">
            <div className={'timer-digits ' + (phase === 'holding' ? 'holding' : phase === 'ready' ? 'ready' : '')} aria-live="off">
              {phase === 'running' ? <RunningDigits startRef={startRef} /> : phase === 'idle' ? idleText : '0.00'}
            </div>
            {phase === 'idle' && diff !== null && (
              <div className={'timer-diff ' + (diff <= 0 ? 'good' : 'bad')}>({fmtDiff(diff)})</div>
            )}
          </div>
          <div className="timer-avgs">
            <div>
              <span className="k">ao5</span>
              <span className="num">{fmtAvg(current(sum.times, 'ao5'))}</span>
            </div>
            <div>
              <span className="k">ao12</span>
              <span className="num">{fmtAvg(current(sum.times, 'ao12'))}</span>
            </div>
          </div>
        </div>

        <div className="stack" style={{ alignItems: 'center', paddingBottom: 28, gap: 0, minHeight: 110 }}>
          {latest && phase === 'idle' && (
            <div className="penalty-quick">
              {(
                [
                  ['none', 'OK'],
                  ['+2', '+2'],
                  ['DNF', 'DNF'],
                ] as [Penalty, string][]
              ).map(([p, label]) => (
                <button
                  key={p}
                  className={'btn sm' + (latest.penalty === p ? ' active' : '')}
                  onClick={(e) => {
                    useStore.getState().setPenalty(latest.id, p);
                    (e.currentTarget as HTMLButtonElement).blur();
                  }}
                >
                  {label}
                </button>
              ))}
              <button className="btn sm" onClick={() => setOpenSolve(latest.id)}>
                Details
              </button>
            </div>
          )}
          <div className="timer-hint">
            {isCoarse() ? (
              'Press and hold the timer until it turns green, release to start, tap anywhere to stop.'
            ) : (
              <>
                Hold <span className="kbd">space</span> until green, release to start, any key stops ·{' '}
                <span className="kbd">Alt+2</span> +2 · <span className="kbd">Alt+D</span> DNF · <span className="kbd">Ctrl+Z</span> delete last
              </>
            )}
          </div>
        </div>
      </main>

      {phase === 'running' && (
        <div
          className="run-overlay"
          onPointerDown={(e) => {
            e.preventDefault();
            stop();
          }}
        />
      )}
      {openSolve && <SolveModal solveId={openSolve} onClose={() => setOpenSolve(null)} />}
    </div>
  );
}
