import { PRACTICE_BLOCKS } from '../../lib/algsets';
import { useStore } from '../../lib/store';

export function PracticePlanPage() {
  const checklist = useStore((s) => s.checklist);
  const learned = useStore((s) => s.learned);
  const setChecklist = useStore((s) => s.setChecklist);
  const done = PRACTICE_BLOCKS.filter((b) => checklist[b.id]).length;

  return (
    <>
      <div className="page-head">
        <div className="prose">
          <h1>Practice Plan</h1>
          <p>
            Don't learn all 41 at once; start where intuition costs the most moves. Keep an algorithm only if it beats your intuitive
            solution.
          </p>
        </div>
        <div style={{ minWidth: 200 }}>
          <div className="small muted" style={{ marginBottom: 6 }}>
            {done} of {PRACTICE_BLOCKS.length} blocks done
          </div>
          <div className="progress">
            <div style={{ width: `${(100 * done) / PRACTICE_BLOCKS.length}%` }} />
          </div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 860 }}>
        {PRACTICE_BLOCKS.map((b) => {
          const n = b.keys.filter((k) => learned[k]).length;
          return (
            <div key={b.id} className={'plan-item' + (checklist[b.id] ? ' done' : '')}>
              <label className="check" style={{ flex: 1 }}>
                <input type="checkbox" checked={!!checklist[b.id]} onChange={(e) => setChecklist(b.id, e.target.checked)} />
                <span className="plan-title">{b.title}</span>
              </label>
              <span className="tiny muted num" title="Cases in this block marked Learned">
                {n}/{b.keys.length} learned
              </span>
              <a className="btn sm" href={`#/learn/drill?pool=plan:${b.id}`}>
                Drill
              </a>
            </div>
          );
        })}
      </div>

      <h2 className="section-title">Daily 15-minute drill</h2>
      <div className="card" style={{ padding: 18, maxWidth: 860 }}>
        <ol className="stack" style={{ margin: 0, paddingLeft: 20, gap: 8, color: '#3d3c38' }}>
          <li>Pick two mirror pairs.</li>
          <li>Setup then algorithm: 10× slow, 10× fast.</li>
          <li>Recognition round (setup + random U turn) until you get 5 in a row.</li>
          <li>Finish with 5 full solves using the new cases.</li>
        </ol>
        <p className="callout small" style={{ marginTop: 14 }}>
          A case is <b>learned</b> when you can spot it from any U angle and start within a second.
        </p>
      </div>
    </>
  );
}
