import { useEffect, useMemo } from 'react';
import { caseKey, type AlgSet } from '../../lib/algsets';
import { useStore } from '../../lib/store';
import { CaseCard } from './CaseCard';

export function PracticeHowTo() {
  return (
    <div className="callout" style={{ maxWidth: 860 }}>
      <h3 style={{ marginBottom: 6 }}>How to practice</h3>
      <div className="stack small" style={{ gap: 6, color: '#3d3c38' }}>
        <p>
          Every case has an <b>algorithm</b> (solves it) and a <b>setup</b> (the algorithm reversed; creates it from a solved cube).
        </p>
        <p>
          Loop: start solved (white bottom, green front) → do setup → cube matches diagram → do algorithm → solved again. 10 slow reps,
          10 fast.
        </p>
        <p>Then recognition: setup + random U/U'/U2, find the case, AUF, solve.</p>
        <p>Hold the cube white-cross-down, target slot front-right. Gray stickers = top-layer pieces that don't matter.</p>
      </div>
    </div>
  );
}

export function CasesPage({ set, focus }: { set: AlgSet; focus: string | null }) {
  const learned = useStore((s) => s.learned);
  const learnedCount = set.cases.filter((c) => learned[caseKey(set, c)]).length;
  const focusKey = focus ? caseKey(set, focus) : null;

  useEffect(() => {
    if (!focusKey) return;
    const el = document.getElementById(`case-${focusKey.replace(':', '-')}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  }, [focusKey]);

  const groups = useMemo(
    () =>
      set.groups
        .map((g) => ({ ...g, cases: set.cases.filter((c) => c.group === g.name) }))
        .filter((g) => g.cases.length),
    [set],
  );

  return (
    <>
      <div className="page-head">
        <div>
          <h1>{set.title}</h1>
          <p className="muted small">
            {set.cases.length} cases · {learnedCount} learned
            {set.slug === 'f2l' && ' · mirror pairs sit side by side (#1/#2, #3/#4, …); only #35, #36, #37 have no partner'}
          </p>
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="progress">
            <div style={{ width: `${(100 * learnedCount) / Math.max(1, set.cases.length)}%` }} />
          </div>
        </div>
      </div>
      {set.slug === 'f2l' && <PracticeHowTo />}
      {groups.map((g) => (
        <section key={g.name}>
          <div className="group-head">
            <h2>
              {g.name}
              {g.range && <span className="range">#{g.range}</span>}
            </h2>
            {g.intro && <p className="muted">{g.intro}</p>}
            <div className="row" style={{ marginTop: 4 }}>
              <a className="small" href={`#/learn/drill?pool=${encodeURIComponent(`group:${set.slug}:${g.name}`)}`}>
                Drill this group →
              </a>
            </div>
          </div>
          <div className="case-grid">
            {g.cases.map((c) => {
              const key = caseKey(set, c);
              return <CaseCard key={key} item={{ key, set, c, original: false }} flash={key === focusKey} />;
            })}
          </div>
        </section>
      ))}
    </>
  );
}
