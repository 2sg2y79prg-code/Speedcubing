import { useEffect, useState } from 'react';
import { useRoute } from './lib/router';
import { useStore } from './lib/store';
import { TimerPage } from './pages/TimerPage';
import { StatsPage } from './pages/StatsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { LearnPage } from './pages/learn/LearnPage';
import { DataModal } from './components/DataModal';

const TABS = [
  { id: 'timer', label: 'Timer' },
  { id: 'stats', label: 'Statistics' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'learn', label: 'Learn' },
];

function useHydrated() {
  const [ok, setOk] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setOk(true));
    setOk(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return ok;
}

export function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden>
      <rect x="2" y="2" width="28" height="28" rx="6" fill="#F0EEE6" stroke="#1F1E1D" strokeWidth="2" />
      <path d="M11 2v28M21 2v28M2 11h28M2 21h28" stroke="#1F1E1D" strokeWidth="2" />
      <rect x="21" y="21" width="9" height="9" rx="2" fill="#D97757" />
    </svg>
  );
}

export function App() {
  const route = useRoute();
  const hydrated = useHydrated();
  const [dataOpen, setDataOpen] = useState(false);
  const page = TABS.some((t) => t.id === route.parts[0]) ? route.parts[0] : 'timer';

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  return (
    <div className="app">
      <header className="topnav">
        <a className="brand" href="#/timer">
          <Logo />
          <span className="brand-text">Archie's Speedcubing Progression</span>
        </a>
        <nav className="tabs">
          {TABS.map((t) => (
            <a key={t.id} href={`#/${t.id}`} className={page === t.id ? 'on' : ''}>
              {t.label}
            </a>
          ))}
        </nav>
        <div className="nav-right">
          <button className="btn ghost sm" onClick={() => setDataOpen(true)} title="Export / import data">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <ellipse cx="8" cy="3.5" rx="5.5" ry="2" />
              <path d="M2.5 3.5v9c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2v-9M2.5 8c0 1.1 2.5 2 5.5 2s5.5-.9 5.5-2" />
            </svg>
            <span className="btn-label">Data</span>
          </button>
        </div>
      </header>
      {!hydrated ? (
        <div className="empty" style={{ marginTop: 80 }}>Loading your solves…</div>
      ) : page === 'timer' ? (
        <TimerPage />
      ) : page === 'stats' ? (
        <StatsPage />
      ) : page === 'leaderboard' ? (
        <LeaderboardPage />
      ) : (
        <LearnPage route={route} />
      )}
      {dataOpen && <DataModal onClose={() => setDataOpen(false)} />}
    </div>
  );
}
