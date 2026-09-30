import { memo } from 'react';
import { assetUrl, caseLabel, type CaseRef } from '../../lib/algsets';
import { useStore } from '../../lib/store';
import { fmtAvg } from '../../lib/format';
import { navigate } from '../../lib/router';

interface Props {
  item: CaseRef;
  wide?: boolean;
  flash?: boolean;
  /** Extra line under the algorithm, e.g. the original-sheet explanation. */
  children?: React.ReactNode;
}

export const CaseCard = memo(function CaseCard({ item, wide, flash, children }: Props) {
  const learned = useStore((s) => !!s.learned[item.key]);
  const times = useStore((s) => s.drillTimes[item.key]);
  const setLearned = useStore((s) => s.setLearned);
  const avg = times?.length ? times.reduce((a, b) => a + b, 0) / times.length : null;
  const c = item.c;

  return (
    <article
      id={`case-${item.key.replace(':', '-')}`}
      className={'card case-card' + (wide ? ' wide' : '') + (flash ? ' flash' : '') + (learned ? ' learned' : '')}
    >
      <div className="case-top">
        <span className="case-num">{caseLabel(item)}</span>
        {learned && <span className="badge">Learned</span>}
      </div>
      <img className="case-img" src={assetUrl(c.image)} alt={`Case ${caseLabel(item)}`} loading="lazy" />
      <div className="alg">{c.alg}</div>
      <div className="kv">
        <span className="k">Setup</span>
        <span className="v mono">{c.setup}</span>
        {c.lookFor && (
          <>
            <span className="k">Look for</span>
            <span className="v">{c.lookFor}</span>
          </>
        )}
      </div>
      {children}
      <div className="case-foot">
        <label className="check">
          <input type="checkbox" checked={learned} onChange={(e) => setLearned(item.key, e.target.checked)} />
          Learned
        </label>
        <span className="muted tiny num" title="Case drill average and attempts">
          {times?.length ? `${fmtAvg(avg)}s · ${times.length}×` : ''}
        </span>
        <button className="btn sm" onClick={() => navigate(`learn/drill?pool=case:${encodeURIComponent(item.key)}`)}>
          Drill this
        </button>
      </div>
    </article>
  );
});
