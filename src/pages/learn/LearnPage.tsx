import { useEffect } from 'react';
import type { Route } from '../../lib/router';
import { ALG_SETS } from '../../lib/algsets';
import { LEARN_TABS } from '../../lib/learnTabs';
import { NotationPage } from './NotationPage';
import { CasesPage } from './CasesPage';
import { OriginalSheetPage } from './OriginalSheetPage';
import { PracticePlanPage } from './PracticePlanPage';
import { CaseDrillPage } from './CaseDrillPage';

export function LearnPage({ route }: { route: Route }) {
  const sub = route.parts[1] ?? 'notation';
  const tabs = LEARN_TABS;
  const focusing = route.query.has('case');
  // Jumping to another Learn section (e.g. from the header menu) starts at the top.
  useEffect(() => {
    if (!focusing) window.scrollTo(0, 0);
  }, [sub, focusing]);
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
