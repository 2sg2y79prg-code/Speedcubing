import { useMemo, useState } from 'react';
import { sessionName, todayKey, useStore } from '../lib/store';
import { bestOf, DNF, effectiveTime, rolling, sessionMean, summarize } from '../lib/stats';
import { allAverages } from '../lib/records';
import { dayKey, fmt, fmtAvg, fmtDate, fmtDateTime, fmtDayKey, fmtSolve, parseDayKey } from '../lib/format';
import { LineChart } from '../charts/LineChart';
import { BarChart, type Bar } from '../charts/BarChart';
import type { Solve } from '../lib/types';

type Range = '7' | '30' | 'all' | 'custom';

function addDays(key: string, n: number): string {
  const d = parseDayKey(key);
  d.setDate(d.getDate() + n);
  return dayKey(d);
}

export function StatsPage() {
  const allSolves = useStore((s) => s.solves);
  const sessions = useStore((s) => s.sessions);
  const [range, setRange] = useState<Range>('30');
  const [from, setFrom] = useState(() => addDays(todayKey(), -29));
  const [to, setTo] = useState(todayKey);
  const [session, setSession] = useState<string>('all');

  const inSession = useMemo(
    () => (session === 'all' ? allSolves : allSolves.filter((s) => s.sessionId === session)),
    [allSolves, session],
  );

  const [lo, hi] = useMemo(() => {
    const today = todayKey();
    if (range === '7') return [addDays(today, -6), today];
    if (range === '30') return [addDays(today, -29), today];
    if (range === 'custom') return [from <= to ? from : to, from <= to ? to : from];
    return ['0000-00-00', '9999-99-99'];
  }, [range, from, to]);

  const solves = useMemo(
    () =>
      inSession.filter((s) => {
        const k = dayKey(s.timestamp);
        return k >= lo && k <= hi;
      }),
    [inSession, lo, hi],
  );

  const data = useMemo(() => buildStats(solves), [solves]);
  const todayCount = useMemo(() => inSession.filter((s) => dayKey(s.timestamp) === todayKey()).length, [inSession]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Statistics</h1>
          <p className="muted small">Averages are computed within each session; the progression lines roll over the filtered solves in order.</p>
        </div>
      </div>

      <div className="filterbar card">
        <div className="seg">
          {(
            [
              ['7', '7 days'],
              ['30', '30 days'],
              ['all', 'All time'],
              ['custom', 'Custom'],
            ] as [Range, string][]
          ).map(([r, label]) => (
            <button key={r} className={range === r ? 'on' : ''} onClick={() => setRange(r)}>
              {label}
            </button>
          ))}
        </div>
        {range === 'custom' && (
          <div className="row">
            <input type="date" className="input sm" value={from} onChange={(e) => e.target.value && setFrom(e.target.value)} aria-label="From" />
            <span className="muted small">to</span>
            <input type="date" className="input sm" value={to} onChange={(e) => e.target.value && setTo(e.target.value)} aria-label="To" />
          </div>
        )}
        <span className="spacer" />
        <select className="select sm" value={session} onChange={(e) => setSession(e.target.value)} aria-label="Session filter">
          <option value="all">All sessions</option>
          {sessions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="cards">
        <StatCard k="Total solves" v={String(solves.length)} s={`${data.okCount} completed`} />
        <StatCard k="Solves today" v={String(todayCount)} s={session === 'all' ? 'all sessions' : sessionName({ sessions }, session)} />
        <StatCard k="Overall mean" v={fmtAvg(data.mean)} s="excluding DNFs" />
        <StatCard k="Best single" v={fmt(data.bestSingle?.value ?? null)} s={data.bestSingle ? fmtDate(data.bestSingle.ts) : '—'} accent />
        {(['ao5', 'ao12', 'ao100'] as const).map((k) => (
          <StatCard key={k} k={`Best ${k}`} v={fmtAvg(data.bestAvg[k]?.value ?? null)} s={data.bestAvg[k] ? fmtDate(data.bestAvg[k]!.ts) : `needs ${k.slice(2)} solves`} />
        ))}
        <StatCard k="DNF rate" v={solves.length ? `${((100 * (solves.length - data.okCount)) / solves.length).toFixed(1)}%` : '-'} s={`${solves.length - data.okCount} DNF`} />
      </div>

      {solves.length === 0 ? (
        <div className="card empty" style={{ padding: 48 }}>
          No solves in this range yet. Head to the <a href="#/timer">Timer</a> and do a few.
        </div>
      ) : (
        <>
          <section className="chart-card card">
            <div className="chart-head">
              <h2>Progression</h2>
              <div className="legend">
                <span><i className="dot" style={{ background: 'var(--muted)', opacity: 0.5 }} />Single</span>
                <span><i style={{ background: 'var(--accent)' }} />ao12</span>
                <span><i style={{ background: 'var(--text)' }} />ao100</span>
              </div>
            </div>
            <LineChart
              n={solves.length}
              scatter={data.times}
              clipOutliers
              height={320}
              series={[
                { name: 'ao12', color: 'var(--accent)', values: data.ao12, width: 2 },
                { name: 'ao100', color: 'var(--text)', values: data.ao100, width: 2 },
              ]}
              xLabel={(i) => fmtDate(solves[i].timestamp, false)}
              tooltip={(i) => <SolveTip s={solves[i]} n={i + 1} ao12={data.ao12[i]} ao100={data.ao100[i]} />}
            />
          </section>

          <div className="chart-grid">
            <section className="chart-card card">
              <div className="chart-head">
                <h2>Solves per day</h2>
                <span className="muted small">{data.days.length} active day{data.days.length === 1 ? '' : 's'}</span>
              </div>
              <BarChart data={data.perDay} />
            </section>
            <section className="chart-card card">
              <div className="chart-head">
                <h2>Time distribution</h2>
                <span className="muted small">1-second buckets</span>
              </div>
              <BarChart data={data.histogram} color="var(--text)" />
            </section>
          </div>

          <section className="chart-card card" style={{ marginTop: 16 }}>
            <div className="chart-head">
              <h2>Daily average</h2>
              <div className="legend">
                <span><i style={{ background: 'var(--accent)' }} />Mean</span>
                <span><i style={{ background: 'var(--text)' }} />Best single</span>
              </div>
            </div>
            <LineChart
              n={data.days.length}
              height={240}
              series={[
                { name: 'Mean', color: 'var(--accent)', values: data.days.map((d) => d.mean), markers: data.days.length <= 60 },
                { name: 'Best single', color: 'var(--text)', values: data.days.map((d) => d.best), markers: data.days.length <= 60 },
              ]}
              xLabel={(i) => fmtDayKey(data.days[i].key, false)}
              tooltip={(i) => {
                const d = data.days[i];
                return (
                  <>
                    <div className="small muted">{fmtDayKey(d.key)}</div>
                    <div>Mean <b className="num">{fmtAvg(d.mean)}</b></div>
                    <div>Best <b className="num">{fmt(d.best)}</b></div>
                    <div className="tiny muted">{d.count} solves</div>
                  </>
                );
              }}
            />
          </section>

          <section className="card" style={{ padding: '14px 6px 6px' }}>
            <h2 style={{ padding: '0 12px 6px' }}>Days</h2>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Solves</th>
                    <th>Mean</th>
                    <th>Best single</th>
                    <th>Best ao5</th>
                    <th>Best ao12</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.days].reverse().map((d) => (
                    <tr key={d.key}>
                      <td className="sans">{fmtDayKey(d.key)}</td>
                      <td>{d.count}</td>
                      <td>{fmtAvg(d.mean)}</td>
                      <td className={d.best !== null && d.best === data.bestSingle?.value ? 'accent' : ''}>{fmt(d.best)}</td>
                      <td>{fmtAvg(d.ao5)}</td>
                      <td>{fmtAvg(d.ao12)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function StatCard({ k, v, s, accent }: { k: string; v: string; s?: string; accent?: boolean }) {
  return (
    <div className="card stat-card">
      <div className="k">{k}</div>
      <div className={'v' + (accent && v !== '-' ? ' accent' : '')}>{v}</div>
      {s && <div className="s">{s}</div>}
    </div>
  );
}

function SolveTip({ s, n, ao12, ao100 }: { s: Solve; n: number; ao12: number | null; ao100: number | null }) {
  return (
    <>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <span className="t">{fmtSolve(s)}</span>
        <span className="tiny faint">#{n}</span>
      </div>
      <div className="tiny muted">{fmtDateTime(s.timestamp)}</div>
      <div className="tiny">
        ao12 <b className="num">{fmtAvg(ao12)}</b> · ao100 <b className="num">{fmtAvg(ao100)}</b>
      </div>
      {s.scramble && <div className="sc">{s.scramble}</div>}
    </>
  );
}

interface DayRow {
  key: string;
  count: number;
  mean: number | null;
  best: number | null;
  ao5: number | null;
  ao12: number | null;
}

function buildStats(solves: Solve[]) {
  const times = solves.map(effectiveTime);
  const okCount = times.filter((t) => t !== DNF).length;

  let bestSingle: { value: number; ts: number } | null = null;
  solves.forEach((s, i) => {
    if (times[i] !== DNF && (!bestSingle || times[i] < bestSingle.value)) bestSingle = { value: times[i], ts: s.timestamp };
  });

  const bestAvg: Record<'ao5' | 'ao12' | 'ao100', { value: number; ts: number } | null> = { ao5: null, ao12: null, ao100: null };
  for (const k of ['ao5', 'ao12', 'ao100'] as const) {
    for (const r of allAverages(solves, k)) {
      if (!bestAvg[k] || r.value < bestAvg[k]!.value) bestAvg[k] = { value: r.value, ts: r.endTs };
    }
  }

  // Group by day (chronological, since solves are sorted).
  const byDay = new Map<string, Solve[]>();
  for (const s of solves) {
    const k = dayKey(s.timestamp);
    const arr = byDay.get(k);
    if (arr) arr.push(s);
    else byDay.set(k, [s]);
  }
  const days: DayRow[] = [...byDay.entries()].map(([key, list]) => {
    const sum = summarize(list);
    const best = bestOf(sum.times);
    return {
      key,
      count: list.length,
      mean: sessionMean(sum.times),
      best: best === DNF ? null : best,
      ao5: bestOf(sum.roll.ao5),
      ao12: bestOf(sum.roll.ao12),
    };
  });

  // Continuous day axis for the per-day bar chart.
  const perDay: Bar[] = [];
  if (days.length) {
    const counts = new Map(days.map((d) => [d.key, d.count]));
    const last = days[days.length - 1].key;
    for (let k = days[0].key, guard = 0; k <= last && guard < 5000; k = addDays(k, 1), guard++) {
      const c = counts.get(k) ?? 0;
      perDay.push({
        key: k,
        label: fmtDayKey(k, false),
        value: c,
        tip: (
          <>
            <div className="small muted">{fmtDayKey(k)}</div>
            <div><b className="num">{c}</b> solve{c === 1 ? '' : 's'}</div>
          </>
        ),
      });
    }
  }

  // 1-second histogram of completed solves.
  const histogram: Bar[] = [];
  const ok = times.filter((t) => t !== DNF);
  if (ok.length) {
    const minS = Math.floor(Math.min(...ok) / 1000);
    let maxS = Math.floor(Math.max(...ok) / 1000);
    if (maxS - minS > 120) maxS = minS + 120; // cap the axis; slower solves fold into the last bucket
    const buckets = new Array(maxS - minS + 1).fill(0);
    for (const t of ok) buckets[Math.min(maxS, Math.floor(t / 1000)) - minS]++;
    const peak = Math.max(...buckets);
    buckets.forEach((c, i) => {
      const sec = minS + i;
      const isLast = i === buckets.length - 1 && Math.floor(Math.max(...ok) / 1000) > maxS;
      histogram.push({
        key: String(sec),
        label: `${sec}`,
        value: c,
        highlight: c === peak && c > 0,
        tip: (
          <>
            <div className="small muted">{isLast ? `${sec}s and slower` : `${sec}.00 – ${sec}.99`}</div>
            <div><b className="num">{c}</b> solve{c === 1 ? '' : 's'} ({((100 * c) / ok.length).toFixed(1)}%)</div>
          </>
        ),
      });
    });
  }

  return {
    times,
    okCount,
    mean: sessionMean(times),
    bestSingle: bestSingle as { value: number; ts: number } | null,
    bestAvg,
    ao12: rolling(times, 'ao12'),
    ao100: rolling(times, 'ao100'),
    days,
    perDay,
    histogram,
  };
}
