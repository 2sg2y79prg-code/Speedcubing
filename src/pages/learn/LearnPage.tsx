import type { Route } from '../../lib/router';
import { ALG_SETS, F2L } from '../../lib/algsets';
import { NotationPage } from './NotationPage';
import { CasesPage } from './CasesPage';
import { OriginalSheetPage } from './OriginalSheetPage';
import { PracticePlanPage } from './PracticePlanPage';
import { CaseDrillPage } from './CaseDrillPage';

export function LearnPage({ route }: { route: Route }) {
  const sub = route.parts[1] ?? 'notation';
  const tabs = [
    { id: 'notation', label: 'Notation' },
    ...ALG_SETS.map((s) => ({ id: s.slug, label: s.title })),
    ...(F2L?.original.length ? [{ id: 'original', label: 'Original Sheet' }] : []),
    { id: 'plan', label: 'Practice Plan' },
    { id: 'drill', label: 'Case Drill' },
  ];
  const set = ALG_SETS.find((s) => s.slug === sub);

  return (
    <div className="page">
      <nav className="subnav">
        {tabs.map((t) => (
          <a key={t.id} href={`#/learn/${t.id}`} className={sub === t.id ? 'on' : ''}>
            {t.label}
          </a>
        ))}
      </nav>
      {set ? (
        <CasesPage key={set.slug} set={set} focus={route.query.get('case')} />
      ) : sub === 'original' ? (
        <OriginalSheetPage />
      ) : sub === 'plan' ? (
        <PracticePlanPage />
      ) : sub === 'drill' ? (
        <CaseDrillPage pool={route.query.get('pool')} />
      ) : (
        <NotationPage />
      )}
    </div>
  );
}
