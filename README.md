# Archie's Speedcubing Progression

A personal speedcubing site: a csTimer-style timer, statistics, an all-time leaderboard, and an F2L learning section with a case drill.
Vite + React + TypeScript, no backend. All data stays in your browser.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (averages, scrambles, case data, csTimer import)
npm run build      # production build in dist/
npm run preview    # serve the build locally
```

Needs Node 20+.

## Deploy (free)

**Vercel:** push the folder to a GitHub repo, then "Add New Project" on vercel.com and import it. Vercel detects Vite
automatically (build `npm run build`, output `dist`). No config needed.

**GitHub Pages:** push to a repo whose default branch is `main`, then go to *Settings → Pages → Source: GitHub Actions*.
The included workflow (`.github/workflows/deploy.yml`) tests, builds and publishes on every push. The build uses
relative paths and hash routing, so it works from `username.github.io/repo-name/` with no extra setup.

Data is per browser and per domain: solves on `localhost` won't appear on the deployed site. Use **Data → Export JSON**
on one and **Import JSON** on the other to move them.

## Keyboard shortcuts (Timer page)

| Key | Action |
|---|---|
| Hold `Space` ~0.3 s, release | Start (digits turn red while holding, green when ready) |
| Any key | Stop |
| `Esc` while holding | Cancel |
| `Alt+2` | Toggle +2 on the last solve |
| `Alt+D` | Toggle DNF on the last solve |
| `Ctrl+Z` (or `Cmd+Z`) | Delete the last solve (asks first) |

On a phone: press and hold the timer until it turns green, release to start, tap anywhere to stop.

Case Drill: `Space` starts/stops the mini-timer (or reveals / goes to the next case when the timer is off), `R` reveals, `Enter` next case.

## Project layout

```
algsets/f2l_cases.json   case data (41 core + 10 original-sheet), group intros; the Learn page is built from this
public/assets/           case diagrams, notation diagrams, csTimer reference, printable F2L guide PDF
src/lib/stats.ts         WCA averaging (aoN, mo3, +2/DNF), tested in stats.test.ts
src/lib/store.ts         app state + persistence (IndexedDB), export/import
src/lib/importers.ts     backup and csTimer import parsers
src/lib/algsets.ts       algorithm-set loader, practice-plan blocks
src/pages/               Timer, Statistics, Leaderboard, Learn/*
src/charts/              small dependency-free SVG charts
```

### Adding OLL / PLL later

Drop a JSON file into `algsets/` (e.g. `algsets/oll.json`) and put its images under `public/assets/`:

```json
{
  "slug": "oll", "name": "OLL", "title": "OLL Cases", "order": 2,
  "groups": [{ "name": "Dot", "intro": "No edges oriented." }],
  "cases": [{ "id": 1, "group": "Dot", "alg": "R U2 R2 F R F' U2 R' F R F'", "setup": "F R' F' R U2 F R' F' R2 U2 R'", "image": "assets/oll/01.png" }]
}
```

It appears automatically as a new tab under Learn, in the Case Drill set picker (all / per group / unlearned), with Learned
checkboxes and drill stats. `groups` is optional (derived from the cases if missing); `lookFor` is optional.

## Choices I made

- **Storage:** IndexedDB (via `idb-keyval`) instead of localStorage, so years of solves won't hit the ~5 MB localStorage cap.
  Falls back to localStorage if IndexedDB is unavailable.
- **Routing:** hash routes (`#/timer`, `#/learn/f2l?case=12`) so deep links work on GitHub Pages without server rewrites.
- **Rounding:** singles are truncated to hundredths and averages rounded to hundredths (WCA convention). Raw times are stored in ms.
- **Trimming:** aoN drops `ceil(5%)` from each end (1 for ao5/ao12, 5 for ao100), same as csTimer. DNFs count as the worst;
  more DNFs than the trim count makes the average DNF. mo3 is DNF if any solve is. The sidebar/table "mean" excludes DNFs,
  and "solve: N/M" is completed/total, like csTimer.
- **Scrambles:** 20 random moves, never the same face twice in a row and never three moves on one axis (no `R L R`, `R L L`).
  Previous/next arrows walk a 50-scramble history.
- **By day vs By session:** every solve stores its session and timestamp. In "By day" mode the session dropdown still shows
  ("Saving to: …") because new solves need a session; the list shows all of that day's solves across sessions. After a solve
  the day view snaps back to today.
- **Averages never cross sessions** on the Leaderboard and in the Statistics "best" cards. The Statistics progression lines roll
  over the filtered solves in order, so with "All sessions" selected they blend sessions (they show a trend, not a record).
- **Leaderboard top-10 averages can overlap** (e.g. two ao5s sharing four solves), as in csTimer. The orange **PB** badge marks
  any entry that was a personal best at the moment it was set; the timeline shows every improvement.
- **Progression graph x-axis** is solve order (labelled with dates), so a 200-solve day isn't squashed into one point.
  Extreme outliers are clamped to the chart edge rather than flattening everything.
- **Histogram** caps at 120 one-second buckets; slower solves fold into the last bar.
- **Drill AUF:** the random `U`, `U'` or `U2` is always appended (never none), and the reveal tells you the undoing AUF.
- **Keyboard shortcuts** only act on the Timer page so `Ctrl+Z` still means undo in text fields elsewhere.
- **csTimer import:** each csTimer session becomes a new session named `csTimer <name>`; penalties and comments carry over.
- Added a "Details" button and OK/+2/DNF quick buttons under the timer, a "move to session" picker in solve details, and a
  link to your printable F2L Algorithm Guide PDF on the Original Sheet page.
