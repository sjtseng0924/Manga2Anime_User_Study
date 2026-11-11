## Manga2Animate User Study (pairwise video comparison)

Each participant answers 20 trials (`?n=` overrides). A trial shows a manga excerpt and two videos
generated from it by two different methods, as Video A / Video B in random order. For each of five
criteria the participant picks the better one (forced choice, no tie):

| key | criterion |
|---|---|
| `fidelity` | visual fidelity to the manga (characters and backgrounds) |
| `story` | story faithfulness (actions and emotions follow the manga) |
| `coherence` | video coherence (transitions, consistency, smooth motion) |
| `aesthetics` | visual aesthetics |
| `overall` | overall preference |

Methods (codes stored in the sheet): `ours` (FLUX.2 storyboard + MiniMax), `animaker` (AniMaker + MiniMax),
`vimax` (ViMax + MiniMax), `storymem` (StoryMem), `mangadirect` (manga direct + MiniMax, best of 3).
20 cases x 10 method pairs = 200 cells.

UI language: Traditional Chinese or English, switchable at any time with the button at the top right
(`?lang=en` / `?lang=zh` sets the default; otherwise the browser language decides).
Progress is kept in localStorage, so a participant who reloads continues where they left off.

### Adaptive sampling

When a participant leaves the instructions page, the page asks the Apps Script backend for an assignment.
The backend counts answered trials per (case, method pair) cell, plus trials handed out in the last
60 minutes that are not answered yet, and builds the assignment greedily: least-filled cell first, each
of the 10 method pairs exactly twice, all 20 cases once. With a steady stream of participants every cell
fills evenly (10 participants = 1 answer per cell). Without a backend URL the same sampler runs in the
browser with zero counts (a yellow "dry run" banner is shown and nothing is saved).

Each trial is uploaded as soon as the participant moves on (upsert on participant + trial index), so
partial sessions still count, and the final SUBMIT resends everything.

### Deploy the backend

1. Create a Google Sheet, open Extensions > Apps Script, paste `google_apps_script.gs`, save.
2. Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone. Copy the URL.
3. Put it in `GAS_API_URL` in `index.html`.

The script creates two tabs: `responses` (one row per answered trial; each criterion column holds the
winning method code) and `assignments`. `<web app URL>?action=stats` returns per-cell, per-case and
per-pair counts for monitoring.

Keep `METHODS` / `CASES` / the sampler identical in `index.js` and `google_apps_script.gs`.

### Data

See `data/README.md`. Videos are stored with Git LFS.
