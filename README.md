# After Six · MComp AI Planner

A planner/tracker for the NUS MComp in AI (part-time, evening classes only),
covering the Aug 2026 – Dec 2028 candidature. Runs locally, deploys to GitHub
Pages, and syncs across devices through a private GitHub Gist.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173, also reachable on your Wi-Fi (--host is on)
```

Requires Node 18+.

## Deploy to GitHub Pages (one-time, ~5 minutes)

1. Create a repo named **`mcomp-planner`** on GitHub (public — free GitHub Pages
   requires a public repo; your plans are NOT in the repo, only the app code).
   If you pick a different name, update `base` in `vite.config.js` to match.
2. Push this folder:
   ```bash
   git init && git add -A && git commit -m "After Six v1.1"
   git branch -M main
   git remote add origin https://github.com/<your-username>/mcomp-planner.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source: "GitHub Actions"**. The included
   workflow (`.github/workflows/deploy.yml`) builds and deploys automatically
   on every push.
4. Your app is live at `https://<your-username>.github.io/mcomp-planner/`.

### On your iPhone

Open that URL in Safari → **Share → Add to Home Screen**. The PWA manifest and
icons are included, so it installs with a proper name and icon and opens
full-screen without Safari chrome.

## Cross-device sync (GitHub Gist)

Data lives in localStorage per device; sync bridges them via a **private gist**
on your own GitHub account. Last write wins (timestamps), auto-push ~1.5s after
you stop editing, auto-pull on every launch.

Setup:
1. Create a token: GitHub → Settings → Developer settings → Tokens (classic) →
   **only the `gist` scope**. (Fine-grained token with Gists read/write also works.)
2. Laptop: **Data & sync** tab → paste token → **Connect · create new gist**.
   Note the Gist ID it shows.
3. iPhone: same tab → paste the same token **and** the Gist ID → **Connect to
   existing gist**.

Security notes: the token is stored only in each device's browser storage, is
excluded from JSON backups, and is only ever sent to `api.github.com`. It can
do nothing except read/write your gists — still, treat it like a password and
revoke it on GitHub if a device is lost.

## What's inside

- **Planner** — 5-semester board, seeded plans (dissertation easy-ramp active by
  default), coursework/dissertation toggle, CP5101 span selector, live degree
  audit (clashes, offering semesters, preclusions, 4–12 unit band, 4000-level
  cap, essentials/sub-area coverage, dissertation timing rules, 40-unit total).
- **Catalog** — every evening course from the AY2025/26 SoC schedule with
  sub-areas, load ratings, NUSMods links; course drawer live-fetches
  description, weekly structure, prerequisites and exam dates from the NUSMods
  API (assessment weightings aren't in the API — check the syllabus in Week 1).
- **Edit timings** — correct any slot when the AY2026/27 schedule publishes
  (before CourseReg Round 1 · 20 Jul 2026 09:00); edits persist and sync.
- **Data & sync** — gist sync, JSON export/import, reset.

## v2 roadmap (once the semester starts)

Assignment/deadline tracker · weekly evening timetable view · grades + GPA vs
the 3.0 floor · key-dates countdowns.

## Structure

```
src/
  data/courses.js        course DB, semesters, rules, seed plans
  lib/validate.js        degree-audit engine (pure, unit-testable)
  lib/sync.js            GitHub Gist sync (create/pull/push)
  components/            Planner, Catalog, CourseDrawer, DataTab
  App.jsx                state, persistence, sync orchestration
public/                  PWA manifest + icons
.github/workflows/       GitHub Pages deploy
```
