import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ALG_SETS, CASE_BY_KEY, PRACTICE_BLOCKS, assetUrl, caseKey, caseLabel, isWideImage } from '../../lib/algsets';
import { invertMove, randomAuf } from '../../lib/alg';
import { useStore } from '../../lib/store';
import { fmt, fmtAvg } from '../../lib/format';
import { navigate } from '../../lib/router';
import { keyboardBusy } from '../../components/Modal';

interface Pool {
  id: string;
  label: string;
  section: string;
  keys: string[];
}

function buildPools(learned: Record<string, boolean>): Pool[] {
  const pools: Pool[] = [];
  for (const set of ALG_SETS) {
    const core = set.cases.map((c) => caseKey(set, c));
    const section = set.name;
    pools.push({ id: `set:${set.slug}`, label: `All ${set.name} cases (${core.length})`, section, keys: core });
    if (set.original.length) {
      const orig = set.original.map((c) => caseKey(set, c));
      pools.push({ id: `setall:${set.slug}`, label: `All ${set.name} + Original Sheet (${core.length + orig.length})`, section, keys: [...core, ...orig] });
      pools.push({ id: `original:${set.slug}`, label: `Original Sheet only (${orig.length})`, section, keys: orig });
    }
    const unlearned = core.filter((k) => !learned[k]);
    pools.push({ id: `unlearned:${set.slug}`, label: `Unlearned only (${unlearned.length})`, section, keys: unlearned });
    for (const g of set.groups) {
      const keys = set.cases.filter((c) => c.group === g.name).map((c) => caseKey(set, c));
      if (keys.length) pools.push({ id: `group:${set.slug}:${g.name}`, label: `${g.name}${g.range ? ` (#${g.range})` : ''}`, section: `${set.name} groups`, keys });
    }
  }
  for (const b of PRACTICE_BLOCKS) pools.push({ id: `plan:${b.id}`, label: b.title, section: 'Practice plan', keys: b.keys.filter((k) => CASE_BY_KEY.has(k)) });
  return pools;
}

interface Current {
  key: string;
  auf: string;
}

type TPhase = 'idle' | 'holding' | 'ready' | 'running' | 'done';
const HOLD_MS = 300;

function readTimedPref(): boolean {
  try {
    return localStorage.getItem('drill-timed') !== '0';
  } catch {
    return true;
  }
}

function Running({ start }: { start: number }) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      setMs(performance.now() - start);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  return <>{fmt(ms)}</>;
}

export function CaseDrillPage({ pool: poolParam }: { pool: string | null }) {
  const learned = useStore((s) => s.learned);
  const drillTimes = useStore((s) => s.drillTimes);
  const { addDrillTime, setLearned } = useStore.getState();

  const pools = useMemo(() => buildPools(learned), [learned]);
  const poolId = poolParam ?? 'set:f2l';
  const singleCase = poolId.startsWith('case:') ? CASE_BY_KEY.get(poolId.slice(5)) : undefined;
  const pool: Pool | undefined = singleCase
    ? { id: poolId, label: `Single case: ${singleCase.set.name} ${caseLabel(singleCase)}`, section: 'Case', keys: [singleCase.key] }
    : pools.find((p) => p.id === poolId) ?? pools[0];
  const keys = pool?.keys ?? [];
  const keysRef = useRef(keys);
  keysRef.current = keys;

  const [cur, setCur] = useState<Current | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [timed, setTimedState] = useState(readTimedPref);
  const [tPhase, setTPhaseState] = useState<TPhase>('idle');
  const tPhaseRef = useRef<TPhase>('idle');
  const holdTimer = useRef(0);
  const setTPhase = useCallback((p: TPhase) => {
    tPhaseRef.current = p;
    setTPhaseState(p);
  }, []);
  const [start, setStart] = useState(0);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const [log, setLog] = useState<{ key: string; ms: number | null; id: number }[]>([]);

  const setTimed = (v: boolean) => {
    setTimedState(v);
    try {
      localStorage.setItem('drill-timed', v ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  const next = useCallback(() => {
    setCur((prev) => {
      const ks = keysRef.current;
      if (!ks.length) return null;
      const choices = ks.length > 1 && prev ? ks.filter((k) => k !== prev.key) : ks;
      return { key: choices[Math.floor(Math.random() * choices.length)], auf: randomAuf() };
    });
    setRevealed(false);
    window.clearTimeout(holdTimer.current);
    setTPhase('idle');
    setLastMs(null);
  }, [setTPhase]);

  // New pool → new case.
  useEffect(() => {
    next();
  }, [poolId, next]);

  const ref = cur ? CASE_BY_KEY.get(cur.key) : undefined;

  // Same as the main timer: hold ~0.3s until green, release to start.
  const beginHold = useCallback(() => {
    if (tPhaseRef.current !== 'idle') return;
    setTPhase('holding');
    window.clearTimeout(holdTimer.current);
    holdTimer.current = window.setTimeout(() => {
      if (tPhaseRef.current === 'holding') setTPhase('ready');
    }, HOLD_MS);
  }, [setTPhase]);
  const endHold = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    if (tPhaseRef.current === 'ready') {
      setStart(performance.now());
      setTPhase('running');
    } else if (tPhaseRef.current === 'holding') {
      setTPhase('idle');
    }
  }, [setTPhase]);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);
  const stopTimer = useCallback(() => {
    if (!cur) return;
    const ms = Math.round(performance.now() - start);
    setTPhase('done');
    setLastMs(ms);
    setRevealed(true);
    addDrillTime(cur.key, ms);
    setLog((l) => [{ key: cur.key, ms, id: Date.now() }, ...l].slice(0, 50));
  }, [cur, start, addDrillTime, setTPhase]);
  const reveal = useCallback(() => {
    if (revealed || !cur) return;
    setRevealed(true);
    if (tPhase !== 'done') setLog((l) => [{ key: cur.key, ms: null, id: Date.now() }, ...l].slice(0, 50));
  }, [revealed, cur, tPhase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tPhase === 'running') {
        e.preventDefault();
        stopTimer();
        return;
      }
      if (keyboardBusy() || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === 'Space') {
        e.preventDefault();
        if (timed && !revealed) beginHold();
        else if (!revealed) reveal();
        else next();
      } else if (e.key === 'Enter' || e.key === 'ArrowRight' || e.key.toLowerCase() === 'n') {
        e.preventDefault();
        next();
      } else if (e.key === 'Escape') {
        window.clearTimeout(holdTimer.current);
        if (tPhaseRef.current === 'holding' || tPhaseRef.current === 'ready') setTPhase('idle');
      } else if (e.key.toLowerCase() === 'r') {
        reveal();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        endHold();
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [tPhase, timed, revealed, beginHold, endHold, stopTimer, reveal, next, setTPhase]);

  const stats = (k: string) => {
    const t = drillTimes[k];
    return t?.length ? { avg: t.reduce((a, b) => a + b, 0) / t.length, n: t.length } : null;
  };
  const slowest = keys
    .map((k) => ({ k, s: stats(k) }))
    .filter((x) => x.s)
    .sort((a, b) => b.s!.avg - a.s!.avg)
    .slice(0, 6);
  const poolAttempts = keys.reduce((a, k) => a + (drillTimes[k]?.length ?? 0), 0);
  const sections = [...new Set(pools.map((p) => p.section))];
  const curStats = cur ? stats(cur.key) : null;

  return (
    <>
      <div className="page-head">
        <div>
          <h1>Case Drill</h1>
          <p className="muted small">Apply the setup to a solved cube (white bottom, green front), recognize the case, then solve it.</p>
        </div>
        <div className="row wrap">
          <select className="select" value={pool?.id} onChange={(e) => navigate(`learn/drill?pool=${encodeURIComponent(e.target.value)}`)} aria-label="Case set">
            {singleCase && <option value={poolId}>{pool!.label}</option>}
            {sections.map((sec) => (
              <optgroup key={sec} label={sec}>
                {pools
                  .filter((p) => p.section === sec)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
          <label className="check small">
            <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
            Mini-timer
          </label>
        </div>
      </div>

      <div className="drill">
        <section className="card drill-stage">
          {!ref || !cur ? (
            <div className="empty" style={{ margin: 'auto' }}>
              {pool?.id.startsWith('unlearned') ? 'Everything in this set is marked learned. Nice work.' : 'No cases in this set.'}
            </div>
          ) : (
            <>
              <div className="setup-label">Apply this setup</div>
              <div className="alg lg">
                {ref.c.setup} <span className="auf">{cur.auf}</span>
              </div>
              <div className="small muted">
                The final <span className="mono accent">{cur.auf}</span> is a random top-layer turn so you practice recognition from any angle.
              </div>

              {timed && (
                <div
                  className={'drill-timer ' + tPhase}
                  style={{ touchAction: 'none', userSelect: 'none', cursor: 'default' }}
                  onPointerDown={(e) => {
                    if (tPhaseRef.current === 'running') return stopTimer();
                    if (!revealed && (e.pointerType !== 'mouse' || e.button === 0)) beginHold();
                  }}
                  onPointerUp={endHold}
                  onPointerLeave={endHold}
                >
                  {tPhase === 'running' ? <Running start={start} /> : tPhase === 'holding' || tPhase === 'ready' ? '0.00' : fmt(lastMs ?? 0)}
                </div>
              )}

              {revealed ? (
                <div className="stack" style={{ alignItems: 'center', gap: 12 }}>
                  <img className={'drill-img' + (isWideImage(ref.c) ? ' wide' : '')} src={assetUrl(ref.c.image)} alt={`Case ${caseLabel(ref)}`} />
                  <div className="row" style={{ gap: 10 }}>
                    <span className="case-num">
                      {ref.set.name} {caseLabel(ref)}
                    </span>
                    {ref.original && <span className="badge neutral">Original Sheet</span>}
                  </div>
                  <div className="alg lg">{ref.c.alg}</div>
                  <div className="small muted">
                    AUF first: <span className="mono">{invertMove(cur.auf)}</span> lines the case up with the diagram (or start the
                    algorithm from where it sits if you can).
                  </div>
                  {(ref.c.lookFor || ref.c.note) && <div className="small">{ref.c.lookFor ?? ref.c.note}</div>}
                  <label className="check small">
                    <input type="checkbox" checked={!!learned[ref.key]} onChange={(e) => setLearned(ref.key, e.target.checked)} />
                    Learned
                  </label>
                </div>
              ) : (
                <div className="drill-img" style={{ display: 'grid', placeItems: 'center', color: 'var(--faint)', fontSize: 13 }}>
                  Diagram hidden
                </div>
              )}

              {timed && !revealed && tPhase !== 'running' && (
                <div className="small muted">
                  Hold <span className="kbd">space</span> (or press and hold the timer) until it turns green, release to start, any key stops.
                </div>
              )}
              <div className="row wrap" style={{ justifyContent: 'center', marginTop: 'auto' }}>
                {tPhase === 'running' && (
                  <button className="btn primary" onClick={stopTimer}>
                    Stop
                  </button>
                )}
                {!revealed && tPhase !== 'running' && (
                  <button className={'btn' + (timed ? '' : ' primary')} onClick={reveal}>
                    Reveal <span className="kbd">{timed ? 'R' : 'space'}</span>
                  </button>
                )}
                <button className={'btn' + (revealed ? ' primary' : '')} onClick={next}>
                  Next case <span className="kbd" style={revealed ? { background: 'transparent', color: 'inherit', borderColor: 'rgba(255,255,255,.5)' } : undefined}>{revealed ? 'space' : 'enter'}</span>
                </button>
              </div>
              {curStats && (
                <div className="tiny muted num">
                  This case: {fmtAvg(curStats.avg)}s average over {curStats.n} attempt{curStats.n === 1 ? '' : 's'}
                </div>
              )}
            </>
          )}
        </section>

        <aside className="stack">
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ marginBottom: 4 }}>{pool?.label}</h3>
            <p className="small muted">
              {keys.length} case{keys.length === 1 ? '' : 's'} · {poolAttempts} timed attempt{poolAttempts === 1 ? '' : 's'}
            </p>
          </div>
          {slowest.length > 0 && (
            <div className="card" style={{ padding: 14 }}>
              <h3 style={{ marginBottom: 6 }}>Slowest cases</h3>
              <div className="mini-list">
                {slowest.map(({ k, s }) => {
                  const r = CASE_BY_KEY.get(k)!;
                  return (
                    <div key={k}>
                      <span>
                        {caseLabel(r)} <span className="muted mono tiny">{r.c.alg}</span>
                      </span>
                      <span className="num">
                        {fmtAvg(s!.avg)} <span className="faint">· {s!.n}×</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          <div className="card" style={{ padding: 14 }}>
            <h3 style={{ marginBottom: 6 }}>This sitting</h3>
            {log.length === 0 ? (
              <p className="small muted">Your drilled cases will show up here.</p>
            ) : (
              <div className="mini-list">
                {log.slice(0, 12).map((l) => {
                  const r = CASE_BY_KEY.get(l.key);
                  return (
                    <div key={l.id}>
                      <span>{r ? `${r.set.name} ${caseLabel(r)}` : l.key}</span>
                      <span className="num">{l.ms === null ? <span className="faint">untimed</span> : fmt(l.ms)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <p className="tiny faint">
            Keys: <span className="kbd">space</span> hold + release to start, any key stops (or reveal/next) · <span className="kbd">R</span> reveal ·{' '}
            <span className="kbd">enter</span> next
          </p>
        </aside>
      </div>
    </>
  );
}

