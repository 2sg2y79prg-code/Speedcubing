# Build prompt: Archie's Speedcubing Progression

You are building a personal speedcubing website called **Archie's Speedcubing Progression**. Build it as a local project I can run on my laptop and later deploy for free (Vite + React + TypeScript, no backend). All data lives in the browser (localStorage, or IndexedDB if you prefer), with Export/Import JSON buttons for backup. Everything below is required unless marked optional. Ask me nothing; make sensible choices and list them in the README.

The project folder already contains:
- `assets/cases/core_01.png` ... `core_41.png` and `src_01.png` ... `src_10.png`: F2L case diagrams
- `assets/notation/faces.png` and `move_*.png`: notation diagrams (each shows a move and its prime)
- `assets/cstimer_reference.png`: screenshot of csTimer, the layout reference for the timer page
- `f2l_cases.json`: all case data below in machine-readable form. Load the learning page from this file.

## 1. Look and feel

- Light theme modeled on Claude Code's palette: warm off-white background (~#FAF9F5), cream cards (~#F0EEE6), near-black warm text (~#1F1E1D), muted gray secondary text (~#6B6A65), thin warm borders (~#E5E3DA).
- Orange (~#D97757) is the **accent only**: primary buttons, active nav tab, current-best highlights, focus rings, graph line. Never large orange backgrounds.
- Clean sans-serif UI font; tabular monospace digits for all times. Rounded corners (8-12px), soft shadows, smooth 150-200ms transitions. No clutter.
- Responsive: works on laptop and phone. Top nav with four pages: **Timer**, **Statistics**, **Leaderboard**, **Learn**.

## 2. Timer page (layout like csTimer, see the screenshot)

**Layout:** left sidebar panel + large central timer.

Center:
- Scramble at the top: a random-move 3x3 scramble, 20 moves, WCA notation (R U F L D B with ' and 2), no same face twice in a row and no redundant opposite-face sequences like R L R. New scramble after every solve; buttons to go to next/previous scramble.
- Giant timer display (very large, monospace digits, 2 decimals). Under it, the difference vs. the previous solve in green (faster) or red (slower), like csTimer's (-12.26).
- Below the timer: current ao5 and ao12 in large text.
- Controls: **hold spacebar ~0.3s** (timer digits turn green when ready), release to start, press any key to stop. On touch devices, same with press-and-hold on the timer. Hide all other UI while the timer runs.

Left sidebar (like csTimer):
- **Grouping toggle:** "By day" (default) or "By session". By day shows only today's solves (with a date picker to view past days). By session shows the selected session; a dropdown lets me create, rename, switch and delete sessions. Every solve stores both its date and session.
- Stats box with columns **current** and **best** and rows: time, mo3, ao5, ao12, ao100 (for the current day/session only).
- Line: "solve: N/N   mean: X".
- Scrolling solve table, newest first: #, time, ao5, ao12. Highlight the best single and best average in orange.
- Click a solve to open details: time, scramble, date/time, session, buttons **OK / +2 / DNF / Delete**, and an optional comment.

**Averaging rules (WCA / csTimer standard):**
- aoN (5, 12, 100): take the last N solves, drop the best and worst (for ao100 drop best 5% and worst 5%), mean the rest. One DNF counts as the worst; more DNFs than trimmed = DNF.
- mo3: plain mean of last 3; any DNF = DNF.
- +2 adds 2.00s. Show "-" until enough solves exist.

## 3. Statistics page

Filter bar: date range (7 days, 30 days, all time, custom) and session filter.
- Summary cards: total solves, solves today, overall mean, best single, best ao5, best ao12, best ao100, DNF rate.
- **Progression graph:** every solve as a faint dot over time, with a rolling ao12 line and ao100 line in orange/dark. Hover shows time, date, scramble.
- **Solves per day:** bar chart.
- **Daily average:** line chart of each day's mean (and best single as a second series).
- Time distribution histogram (1-second buckets).
- A table of days: date, solves, mean, best single, best ao5, best ao12.

## 4. Leaderboard page (all time)

Top 10 lists across all sessions and all days: **Best singles**, **Best ao5**, **Best ao12**, **Best ao100**. Each row: rank, time, date, session; clicking an average expands the solves in it (dropped times in parentheses, csTimer style). Mark personal-best records with a small orange badge and show a small "PB history" timeline of when each record improved.

## 5. Learn page

Sub-navigation: **Notation**, **F2L Cases**, **Original Sheet**, **Practice Plan**, **Case Drill**. Design the data model so OLL and PLL sets can be added later just by adding another JSON file (same fields: id, group, alg, setup, image).

### 5a. Notation (use the images in assets/notation)

A letter means: turn that face 90 degrees clockwise, as if looking straight at that face. An apostrophe (') reverses it. A 2 means a half turn (R2 = R twice; direction doesn't matter). Hold white on the bottom (D), yellow on top (U), green facing you (F). In the diagrams, colored stickers are the moving layer, gray stay put, the arrow shows where front stickers travel. Parentheses in an algorithm are only grouping.

Show `faces.png` first (front view: U, F, R; back view: U, B, L; D is the bottom). Then a card per move:

| Move | Image | Direction |
|---|---|---|
| R, R' | move_R.png | Right layer; front stickers go up. R': down. |
| L, L' | move_L.png | Left layer; front stickers go down (opposite of R, judged from the left). |
| U, U' | move_U.png | Top layer; front stickers go left. U': right. |
| D, D' | move_D.png | Bottom layer; front stickers go right (opposite of U). |
| F, F' | move_F.png | Front layer like a clock hand; top stickers go right. |
| B, B' | move_B.png | Back layer; top stickers go left (looks counterclockwise from front). |
| r, r' | move_r_w.png | Right two layers, same direction as R (also written Rw). |
| l, l' | move_l_w.png | Left two layers, same as L. |
| u, u' | move_u_w.png | Top two layers, same as U. |
| d, d' | move_d_w.png | Bottom two layers, same as D. |
| f, f' | move_f_w.png | Front two layers, same as F. |
| M, M' | move_M.png | Middle slice between L and R, turns like L. |
| E, E' | move_E.png | Middle slice between U and D, turns like D. |
| S, S' | move_S.png | Middle slice between F and B, turns like F. |
| x, x' | move_x.png | Whole cube turns like R. |
| y, y' | move_y.png | Whole cube turns like U (after y, the old right face is now F). |
| z, z' | move_z.png | Whole cube turns like F. |

Tip line: if a move feels backwards, it's almost always L, D, B, M or E; picture looking straight at that face.

### 5b. How to practice (show at top of F2L Cases)

Every case has an **algorithm** (solves it) and a **setup** (the algorithm reversed; creates it from a solved cube). Loop: start solved (white bottom, green front) -> do setup -> cube matches diagram -> do algorithm -> solved again. 10 slow reps, 10 fast. Then recognition: setup + random U/U'/U2, find the case, AUF, solve. Hold the cube white-cross-down, target slot front-right. Gray stickers = top-layer pieces that don't matter.

### 5c. F2L Cases (41) — card grid grouped by these six groups, with group intro text

Group intros:
- **Basic inserts (1-4):** Every other case ends in one of these. #1/#2: the edge waits on the far side and one trigger joins and inserts. #3/#4: pair already built; move it into place and insert.
- **Corner on top, white facing the side (5-16):** Move the edge so a pair can form, join it to the corner, finish with a basic insert. Recognize by edge position and top color.
- **Corner on top, white facing up (17-24):** Hardest to pair intuitively. Standard fix: R U2 R' or F' U2 F (#17-20) swings the corner so white faces the side.
- **Corner in the slot, edge on top (25-30):** Line the edge up as shown; the first moves lift the corner out already joined; none longer than 8 moves.
- **Edge in the slot, corner on top (31-36):** Pull the edge out paired with the corner. #36 is R U R' U' twice, then R U R'.
- **Both pieces in the slot, solved wrong (37-41):** Take the pair out as a unit and reinsert. Rare; learn last.

Mirror pairs sit next to each other (#1/#2, #3/#4, ...); only #35, #36, #37 have no partner. Each card: image, number, algorithm (large monospace), setup, "look for" cue, a **Learned** checkbox (saved), and a "Drill this" button.

| # | Group | Algorithm | Setup | Look for | Image |
|---|---|---|---|---|---|
| 1 | Basic inserts | `R U R'` | `R U' R'` | White right; edge back, green on top | assets/cases/core_01.png |
| 2 | Basic inserts | `F' U' F` | `F' U F` | White front; edge left, red on top | assets/cases/core_02.png |
| 3 | Basic inserts | `U R U' R'` | `R U R' U'` | White front; edge right, green on top | assets/cases/core_03.png |
| 4 | Basic inserts | `U' F' U F` | `F' U' F U` | White right; edge front, red on top | assets/cases/core_04.png |
| 5 | Corner on top, white facing the side | `U' R U R' U R U R'` | `R U' R' U' R U' R' U` | White right; edge left, green on top | assets/cases/core_05.png |
| 6 | Corner on top, white facing the side | `U F' U' F U' F' U' F` | `F' U F U F' U F U'` | White front; edge back, red on top | assets/cases/core_06.png |
| 7 | Corner on top, white facing the side | `U' R U' R' U R U R'` | `R U' R' U' R U R' U` | White right; edge right, green on top | assets/cases/core_07.png |
| 8 | Corner on top, white facing the side | `U F' U F U' F' U' F` | `F' U F U F' U' F U'` | White front; edge front, red on top | assets/cases/core_08.png |
| 9 | Corner on top, white facing the side | `U' R U2 R' U2 R U' R'` | `R U R' U2 R U2 R' U` | White front; edge left, green on top | assets/cases/core_09.png |
| 10 | Corner on top, white facing the side | `U F' U2 F U2 F' U F` | `F' U' F U2 F' U2 F U'` | White right; edge back, red on top | assets/cases/core_10.png |
| 11 | Corner on top, white facing the side | `U' R U R' U2 R U' R'` | `R U R' U2 R U' R' U` | White front; edge back, green on top | assets/cases/core_11.png |
| 12 | Corner on top, white facing the side | `U' r U' R' U R U r'` | `r U' R' U' R U r' U` | White right; edge left, red on top | assets/cases/core_12.png |
| 13 | Corner on top, white facing the side | `U' R U2 R' U F' U' F` | `F' U F U' R U2 R' U` | White front; edge right, red on top | assets/cases/core_13.png |
| 14 | Corner on top, white facing the side | `R' U2 R2 U R2 U R` | `R' U' R2 U' R2 U2 R` | White right; edge front, green on top | assets/cases/core_14.png |
| 15 | Corner on top, white facing the side | `R U' R' U2 F' U' F` | `F' U F U2 R U R'` | White right; edge right, red on top | assets/cases/core_15.png |
| 16 | Corner on top, white facing the side | `F' U F U2 R U R'` | `R U' R' U2 F' U' F` | White front; edge front, green on top | assets/cases/core_16.png |
| 17 | Corner on top, white facing up | `R U2 R' U' R U R'` | `R U' R' U R U2 R'` | White up; edge right, green on top | assets/cases/core_17.png |
| 18 | Corner on top, white facing up | `F' U2 F U F' U' F` | `F' U F U' F' U2 F` | White up; edge front, red on top | assets/cases/core_18.png |
| 19 | Corner on top, white facing up | `U R U2 R' U R U' R'` | `R U R' U' R U2 R' U'` | White up; edge back, green on top | assets/cases/core_19.png |
| 20 | Corner on top, white facing up | `U' F' U2 F U' F' U F` | `F' U' F U F' U2 F U` | White up; edge left, red on top | assets/cases/core_20.png |
| 21 | Corner on top, white facing up | `U2 R U R' U R U' R'` | `R U R' U' R U' R' U2` | White up; edge left, green on top | assets/cases/core_21.png |
| 22 | Corner on top, white facing up | `r U' r' U2 r U r'` | `r U' r' U2 r U r'` | White up; edge back, red on top | assets/cases/core_22.png |
| 23 | Corner on top, white facing up | `U2 R2 U2 R' U' R U' R2` | `R2 U R' U R U2 R2 U2` | White up; edge front, green on top | assets/cases/core_23.png |
| 24 | Corner on top, white facing up | `F U R U' R' F' R U' R'` | `R U R' F R U R' U' F'` | White up; edge right, red on top | assets/cases/core_24.png |
| 25 | Corner in the slot, edge on top | `U R U' R' U' F' U F` | `F' U' F U R U R' U'` | Corner solved in slot; edge front, red on top | assets/cases/core_25.png |
| 26 | Corner in the slot, edge on top | `U' F' U F U R U' R'` | `R U R' U' F' U' F U` | Corner solved in slot; edge right, green on top | assets/cases/core_26.png |
| 27 | Corner in the slot, edge on top | `F' U F U' F' U F` | `F' U' F U F' U' F` | Corner in slot, white right; edge front, red on top | assets/cases/core_27.png |
| 28 | Corner in the slot, edge on top | `R U' R' U R U' R'` | `R U R' U' R U R'` | Corner in slot, white front; edge right, green on top | assets/cases/core_28.png |
| 29 | Corner in the slot, edge on top | `R U R' U' R U R'` | `R U' R' U R U' R'` | Corner in slot, white right; edge right, green on top | assets/cases/core_29.png |
| 30 | Corner in the slot, edge on top | `F' U' F U F' U' F` | `F' U F U' F' U F` | Corner in slot, white front; edge front, red on top | assets/cases/core_30.png |
| 31 | Edge in the slot, corner on top | `U R U R' U2 R U R'` | `R U' R' U2 R U' R' U'` | White right; edge in slot, correct | assets/cases/core_31.png |
| 32 | Edge in the slot, corner on top | `U' R U' R' U2 R U' R'` | `R U R' U2 R U R' U` | White front; edge in slot, correct | assets/cases/core_32.png |
| 33 | Edge in the slot, corner on top | `U2 F' U F U R U R'` | `R U' R' U' F' U' F U2` | White right; edge in slot, flipped | assets/cases/core_33.png |
| 34 | Edge in the slot, corner on top | `U2 R U' R' U' F' U' F` | `F' U F U R U R' U2` | White front; edge in slot, flipped | assets/cases/core_34.png |
| 35 | Edge in the slot, corner on top | `U' R' F R F' R U' R'` | `R U R' F R' F' R U` | White up; edge in slot, flipped | assets/cases/core_35.png |
| 36 | Edge in the slot, corner on top | `R U R' U' R U R' U' R U R'` | `R U' R' U R U' R' U R U' R'` | White up; edge in slot, correct | assets/cases/core_36.png |
| 37 | Both pieces in the slot, solved wrong | `R2 U2 F R2 F' U2 R' U R'` | `R U' R U2 F R2 F' U2 R2` | Corner solved in slot; edge in slot, flipped | assets/cases/core_37.png |
| 38 | Both pieces in the slot, solved wrong | `R U' R' U' R U R' U2 R U' R'` | `R U R' U2 R U' R' U R U R'` | Corner in slot, white front; edge in slot, correct | assets/cases/core_38.png |
| 39 | Both pieces in the slot, solved wrong | `R U' R' U R U2 R' U R U' R'` | `R U R' U' R U2 R' U' R U R'` | Corner in slot, white right; edge in slot, correct | assets/cases/core_39.png |
| 40 | Both pieces in the slot, solved wrong | `R F U R U' R' F' U' R'` | `R U F R U R' U' F' R'` | Corner in slot, white front; edge in slot, flipped | assets/cases/core_40.png |
| 41 | Both pieces in the slot, solved wrong | `R U' R' r U' r' U2 r U r'` | `r U' r' U2 r U r' R U R'` | Corner in slot, white right; edge in slot, flipped | assets/cases/core_41.png |
### 5d. Original Sheet (my "F2L Cases - #cuber" PDF, recreated)

Intro: 10 algorithms from my original sheet. Five solve cases already in the core set (S8 is a move faster than the core version, S9 is slower). One solves two slots at once. Four fix an edge stuck in the wrong slot. The sheet's bracketed reverses are correct: they are the setups. Diagrams show the cube held normally (white bottom, green front); images with two cubes show front and back views. Link each to its matching core case where one exists.

| # | Algorithm | Setup | What it is | Image |
|---|---|---|---|---|
| S1 | `r U' R' U R U r'` | `r U' R' U' R U r'` | Same case as #12, one U' later. | assets/cases/src_01.png |
| S2 | `L F' L' F R U R'` | `R U' R' F' L F L'` | Two slots at once: with front-left open, L F' L' F solves front-left and sets up front-right, then R U R' inserts. Front-right pieces alone are #23. | assets/cases/src_02.png |
| S3 | `r U' r' U2 r U r'` | `r U' r' U2 r U r'` | Identical to #22. | assets/cases/src_03.png |
| S4 | `R2 U2 R' U' R U' R2` | `R2 U R' U R U2 R2` | Same case as #23 with the corner at back-left, so no opening U2. | assets/cases/src_04.png |
| S5 | `R2 u R2 u' R2` | `R2 u R2 u' R2` | Edge swap: white-up corner above the slot, its edge stuck in back-left, back-left edge in front-right. Fixes both. | assets/cases/src_05.png |
| S6 | `R2 u' R2 u R2` | `R2 u' R2 u R2` | Edge swap on other slots: back-right corner on top white up, back-right edge in front-left, front-left edge in back-right. Fixes both. | assets/cases/src_06.png |
| S7 | `L2 u L2 u' L2` | `L2 u L2 u' L2` | Front-right corner solved; its edge is in back-left and the back-left edge is in front-right. Back-left corner on top, white up. Fixes both. | assets/cases/src_07.png |
| S8 | `r' U2 R2 U R2 U r` | `r' U' R2 U' R2 U2 r` | Same case as #10, one move shorter, no F turns. | assets/cases/src_08.png |
| S9 | `r' D' r U' r' D r` | `r' D' r U r' D r` | Same case as #4; U2 F' U F is 4 moves, so skip this one. | assets/cases/src_09.png |
| S10 | `R u R' U R u' R'` | `R u R' U' R u' R'` | Front-right corner on top at back-left, white up; its edge stuck in back-left; back-left edge on top at left. Fixes both. | assets/cases/src_10.png |
### 5e. Practice Plan (checklist saved in storage)

Don't learn all 41 at once; start where intuition costs the most moves. Keep an algorithm only if it beats your intuitive solution.
- [ ] Block 1: #17-24, white facing up
- [ ] Block 2: #31-36, edge stuck in slot
- [ ] Block 3: #25-30, corner stuck in slot
- [ ] Block 4: #5-16, white facing side (keep only faster ones)
- [ ] Block 5: #37-41 plus S5, S6, S7, S10

Daily 15-minute drill: pick two mirror pairs; setup then algorithm 10x slow, 10x fast; recognition round (setup + random U turn) until 5 in a row; finish with 5 full solves using the new cases. A case is learned when you can spot it from any U angle and start within a second.

### 5f. Case Drill

Pick a set (all, a group, unlearned only, or a practice block). Shows a random case: the setup to apply (with a random U/U'/U2 appended for recognition), then a "Reveal" button shows the diagram and algorithm. Optional mini-timer per case; log drill times per case and show each case's average and attempt count on its card.

## 6. Data model

- Solve: id, timeMs, penalty ("none" | "+2" | "DNF"), scramble, timestamp, sessionId, comment.
- Session: id, name, createdAt.
- Learn progress: learned case ids, checklist state, drill times per case.
- Export/Import JSON, plus "Import from csTimer" (optional nice-to-have) since I have existing csTimer sessions.

## 7. Quality bar

Unit-test the average calculations (ao5/ao12/ao100 with +2 and DNF). Timer must be precise (performance.now). Keyboard shortcuts: space (timer), Ctrl+Z delete last solve with confirm, Alt+2 / Alt+D for +2 / DNF on last solve. Write a short README with run and deploy steps (Vercel or GitHub Pages).
