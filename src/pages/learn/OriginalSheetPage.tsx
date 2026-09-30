import { caseKey, F2L, isWideImage } from '../../lib/algsets';
import { moveCount } from '../../lib/alg';
import { CaseCard } from './CaseCard';

export function OriginalSheetPage() {
  const set = F2L;
  if (!set) return null;
  return (
    <>
      <div className="prose" style={{ marginBottom: 20 }}>
        <h1>Original Sheet</h1>
        <p>
          10 algorithms from my original "F2L Cases - #cuber" sheet. Five solve cases already in the core set (S8 is a move faster than
          the core version, S9 is slower). One solves two slots at once. Four fix an edge stuck in the wrong slot.
        </p>
        <p>
          The sheet's bracketed reverses are correct: they are the setups. Diagrams show the cube held normally (white bottom, green
          front); images with two cubes show front and back views.
        </p>
        <p className="small">
          <a href={import.meta.env.BASE_URL + 'assets/f2l_algorithm_guide.pdf'} target="_blank" rel="noreferrer">
            Open the printable F2L Algorithm Guide (PDF) ↗
          </a>
        </p>
      </div>
      <div className="case-grid">
        {set.original.map((c) => {
          const key = caseKey(set, c);
          const core = c.coreMatch ? set.cases.find((x) => x.id === c.coreMatch) : undefined;
          const wide = isWideImage(c);
          return (
            <CaseCard key={key} item={{ key, set, c, original: true }} wide={wide}>
              <p className="small" style={{ color: '#3d3c38' }}>{c.note}</p>
              {core && (
                <p className="small">
                  <a href={`#/learn/f2l?case=${core.id}`}>
                    Core case #{core.id} → <span className="mono">{core.alg}</span>
                  </a>{' '}
                  <span className="muted">
                    ({moveCount(c.alg)} vs {moveCount(core.alg)} moves)
                  </span>
                </p>
              )}
            </CaseCard>
          );
        })}
      </div>
    </>
  );
}
