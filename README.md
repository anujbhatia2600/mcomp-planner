# After Six · MComp AI Planner

A local planner/tracker for the NUS MComp in AI (part-time, evening classes only),
covering the Aug 2026 – Dec 2028 candidature.

## Run it

```bash
npm install
npm run dev        # opens http://localhost:5173
```

Requires Node 18+. All data stays in your browser's localStorage — nothing leaves
your laptop except live course-info fetches from the public NUSMods API.

## What's inside

- **Planner** — 5-semester board, 3 seeded plans (dissertation easy-ramp is active
  by default), coursework/dissertation mode toggle, CP5101 span selector, live
  degree audit (clashes, offering semesters, preclusions, unit bands 4–12,
  4000-level cap, essential/sub-area coverage, dissertation timing rules,
  40-unit total) and progress meters.
- **Catalog** — every evening course we identified from the AY2025/26 SoC
  schedule, with sub-areas, load ratings, preclusions, NUSMods links, and
  add-to-semester. Click a course code for the detail drawer: it live-fetches
  description, weekly structure, prerequisites and exam dates from the NUSMods
  API (tries AY2026-2027, falls back to 2025-2026). Assessment weightings are
  not exposed by the API — use the linked NUSMods page / Canvas syllabus.
- **Edit timings** — when the AY2026/27 schedule is published (before CourseReg
  Round 1, 20 Jul 2026 09:00), correct any day/time in the course drawer.
  Edits persist as overrides and the audit re-runs automatically.
- **Data** — export/import JSON backups, reset to seed plans.

## Key programme rules encoded (from Annex A)

- Part-time: 4–12 units per semester; dissertation start Sem 2 at earliest,
  registered by Week 1 of Sem 3; ≥4 coursework units in the application semester.
- CP5101 = 16 units, 8 per semester over two consecutive semesters.
- Coursework option: 5 essentials + 5 electives; dissertation option:
  3 essentials + 3 electives + CP5101. Essentials must cover ≥3 of 4 sub-areas.
- Max two level-4000 courses (8 units) in the entire candidature.
- 40 units total; minimum final GPA 3.0 to graduate (GPA tracking is v2).

## v2 roadmap (once the semester starts)

- Per-course task/assignment tracker with deadlines
- Weekly Mon–Fri evening timetable view for the current semester
- Grades + live GPA against the 3.0 floor
- Key-dates panel with countdowns (already stubbed in `src/data/courses.js`)

## Structure

```
src/
  data/courses.js        course DB, semesters, rules, seed plans
  lib/validate.js        degree-audit engine (pure functions, easy to unit test)
  components/            Planner, Catalog, CourseDrawer, DataTab
  App.jsx                state + localStorage persistence
```
